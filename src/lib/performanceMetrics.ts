// Utility for logging Next.js Web Vitals and custom performance metrics
// Lightweight (no external deps). Can be expanded to batch & send to analytics.

interface WebVitalMetric {
  id: string;
  name: string; // e.g., 'FCP', 'LCP', 'CLS', 'FID', 'INP', 'TTFB'
  label: 'web-vital' | string;
  value: number;
  startTime?: number;
  delta?: number;
}

const QUEUE: WebVitalMetric[] = [];
// Track seen metric ids to avoid duplicate console noise (FCP/TTFB sometimes fire twice in dev or when reported via multiple observers)
const seenMetricIds = new Set<string>();
const REMOTE_ENDPOINT = process.env.NEXT_PUBLIC_METRICS_ENDPOINT;
const BATCH_SIZE = 20;
let flushTimeout: any = null;

function scheduleFlush() {
  if (flushTimeout) return;
  flushTimeout = setTimeout(flush, 5000);
}

function flush() {
  if (!QUEUE.length) return;
  const payload = [...QUEUE];
  QUEUE.length = 0;
  flushTimeout = null;

  if (REMOTE_ENDPOINT) {
    // Forward to external analytics collector
    fetch(REMOTE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({ metrics: payload, ts: Date.now() })
    }).catch(() => {});
  }

  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    try {
      navigator.sendBeacon('/api/metrics', JSON.stringify({ metrics: payload }));
    } catch (e) {
      // ignore
    }
  } else if (typeof fetch !== 'undefined') {
    const headers: Record<string,string> = { 'Content-Type': 'application/json' };
    const apiKey = (globalThis as any)?.__METRICS_API_KEY__ || process.env.NEXT_PUBLIC_METRICS_API_KEY;
    if (apiKey) headers['x-metrics-api-key'] = apiKey;
    fetch('/api/metrics', {
      method: 'POST',
      headers,
      body: JSON.stringify({ metrics: payload })
    }).catch(() => {});
  }
}

export function logWebVital(metric: WebVitalMetric) {
  const duplicate = seenMetricIds.has(metric.id);
  if (!duplicate) {
    seenMetricIds.add(metric.id);
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[WebVital]', metric.name, Math.round(metric.value * 100) / 100, metric);
    }
    QUEUE.push(metric);
    if (QUEUE.length >= BATCH_SIZE) flush(); else scheduleFlush();
  }
}

export function flushPerformanceMetrics() {
  flush();
}

// Custom metric logging
export function logCustomMetric(name: string, value: number) {
  logWebVital({ id: name + '-' + Date.now(), name, label: 'custom', value });
}

// Expose for ad-hoc runtime instrumentation (guard once)
if (typeof window !== 'undefined' && !(window as any).logCustomMetric) {
  (window as any).logCustomMetric = logCustomMetric;
}
