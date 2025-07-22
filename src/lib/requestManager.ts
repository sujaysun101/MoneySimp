// src/lib/requestManager.ts

// Simple debounce implementation
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

interface RequestOptions {
  timeout?: number;
  retries?: number;
  cache?: boolean;
  batchKey?: string;
}

interface BatchedRequest {
  id: string;
  url: string;
  options: RequestInit;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
}

class RequestManager {
  private requestQueue: Map<string, BatchedRequest[]> = new Map();
  private processingBatches: Set<string> = new Set();
  private requestCache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  // Debounced batch processor
  private processBatch = debounce(this.flushBatch.bind(this), 100);

  // Add request to batch queue
  public batchRequest<T>(
    url: string, 
    options: RequestInit = {}, 
    batchKey: string = 'default'
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const requestId = `${url}_${Date.now()}_${Math.random()}`;
      const request: BatchedRequest = {
        id: requestId,
        url,
        options,
        resolve,
        reject,
        timestamp: Date.now(),
      };

      if (!this.requestQueue.has(batchKey)) {
        this.requestQueue.set(batchKey, []);
      }

      this.requestQueue.get(batchKey)!.push(request);
      this.processBatch(batchKey);
    });
  }

  // Process batched requests
  private async flushBatch(batchKey: string) {
    if (this.processingBatches.has(batchKey)) {
      return; // Already processing this batch
    }

    const requests = this.requestQueue.get(batchKey);
    if (!requests || requests.length === 0) {
      return;
    }

    this.processingBatches.add(batchKey);
    this.requestQueue.set(batchKey, []); // Clear queue

    try {
      // Group requests by URL for potential optimization
      const groupedRequests = this.groupRequestsByUrl(requests);
      
      await Promise.all(
        Object.entries(groupedRequests).map(([url, urlRequests]) =>
          this.processUrlGroup(url, urlRequests)
        )
      );
    } catch (error) {
      console.error('Batch processing error:', error);
    } finally {
      this.processingBatches.delete(batchKey);
    }
  }

  private groupRequestsByUrl(requests: BatchedRequest[]): Record<string, BatchedRequest[]> {
    return requests.reduce((groups, request) => {
      if (!groups[request.url]) {
        groups[request.url] = [];
      }
      groups[request.url].push(request);
      return groups;
    }, {} as Record<string, BatchedRequest[]>);
  }

  private async processUrlGroup(url: string, requests: BatchedRequest[]) {
    try {
      // For identical URLs, we can potentially use the same response
      const firstRequest = requests[0];
      const response = await fetch(url, firstRequest.options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Resolve all requests with the same data
      requests.forEach(request => {
        request.resolve(data);
      });

    } catch (error) {
      // Reject all requests in this group
      requests.forEach(request => {
        request.reject(error);
      });
    }
  }

  // Cached request with TTL
  public async cachedRequest<T>(
    url: string,
    options: RequestInit = {},
    ttl: number = 60000 // 1 minute default
  ): Promise<T> {
    const cacheKey = `${url}_${JSON.stringify(options)}`;
    const cached = this.requestCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache the response
      this.requestCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl
      });

      return data;
    } catch (error) {
      // Don't cache errors, but clean up stale cache entries
      this.cleanStaleCache();
      throw error;
    }
  }

  // Clean up expired cache entries
  private cleanStaleCache() {
    const now = Date.now();
    for (const [key, entry] of this.requestCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.requestCache.delete(key);
      }
    }
  }

  // Clear all caches
  public clearCache() {
    this.requestCache.clear();
  }

  // Get cache stats
  public getCacheStats() {
    return {
      size: this.requestCache.size,
      entries: Array.from(this.requestCache.keys()),
    };
  }
}

// Singleton instance
export const requestManager = new RequestManager();

// Utility functions for common use cases
export const batchedFetch = <T>(
  url: string, 
  options?: RequestInit, 
  batchKey?: string
): Promise<T> => {
  return requestManager.batchRequest<T>(url, options, batchKey);
};

export const cachedFetch = <T>(
  url: string, 
  options?: RequestInit, 
  ttl?: number
): Promise<T> => {
  return requestManager.cachedRequest<T>(url, options, ttl);
};

// Debounced search function
export const debouncedSearch = debounce(
  async (query: string, callback: (results: any[]) => void) => {
    if (!query.trim()) {
      callback([]);
      return;
    }

    try {
      const results = await cachedFetch<any[]>(
        `/api/search?q=${encodeURIComponent(query)}`,
        {},
        30000 // 30 seconds cache for search results
      );
      callback(results);
    } catch (error) {
      console.error('Search error:', error);
      callback([]);
    }
  },
  300 // 300ms delay
);

// Debounced form validation
export const debouncedValidation = debounce(
  async (field: string, value: any, callback: (isValid: boolean, error?: string) => void) => {
    try {
      const result = await cachedFetch<{ valid: boolean; error?: string }>(
        '/api/validate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ field, value }),
        },
        10000 // 10 seconds cache for validation
      );
      callback(result.valid, result.error);
    } catch (error) {
      console.error('Validation error:', error);
      callback(false, 'Validation failed');
    }
  },
  500 // 500ms delay
);

// Smart request retry with exponential backoff
export async function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
