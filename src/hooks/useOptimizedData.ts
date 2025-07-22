// src/hooks/useOptimizedData.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { memoryCache, CACHE_KEYS, withCache } from '@/lib/cache';
import type { Expense, Subscription, Budget, Goal, BankAccount } from '@/lib/types';
import { EXPENSES_STORAGE_KEY, SUBSCRIPTIONS_STORAGE_KEY, BUDGETS_STORAGE_KEY } from '@/lib/constants';

interface UseOptimizedDataResult<T> {
  data: T[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addItem: (item: T) => void;
  updateItem: (id: string, updates: Partial<T>) => void;
  removeItem: (id: string) => void;
}

export function useOptimizedExpenses(userId?: string): UseOptimizedDataResult<Expense> {
  const [data, setData] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const loadExpenses = useCallback(async () => {
    if (!userId) return;

    try {
      setError(null);
      
      const expenses = await withCache(
        CACHE_KEYS.EXPENSES(userId),
        async () => {
          const storedExpenses = localStorage.getItem(EXPENSES_STORAGE_KEY);
          if (storedExpenses) {
            const parsed = JSON.parse(storedExpenses);
            return parsed.map((exp: any) => ({
              ...exp,
              date: new Date(exp.date),
            }));
          }
          return [];
        },
        60000 // 1 minute cache
      );

      setData(expenses);
    } catch (err) {
      console.error('Error loading expenses:', err);
      setError('Failed to load expenses');
      setData([]);
    } finally {
      setIsLoading(false);
      loadedRef.current = true;
    }
  }, [userId]);

  const refresh = useCallback(async () => {
    if (userId) {
      memoryCache.delete(CACHE_KEYS.EXPENSES(userId));
      await loadExpenses();
    }
  }, [userId, loadExpenses]);

  const addItem = useCallback((item: Expense) => {
    setData(prev => {
      const newData = [item, ...prev].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      // Update localStorage and cache
      localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(newData));
      if (userId) {
        memoryCache.set(CACHE_KEYS.EXPENSES(userId), newData, 60000);
      }
      
      return newData;
    });
  }, [userId]);

  const updateItem = useCallback((id: string, updates: Partial<Expense>) => {
    setData(prev => {
      const newData = prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      );
      
      localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(newData));
      if (userId) {
        memoryCache.set(CACHE_KEYS.EXPENSES(userId), newData, 60000);
      }
      
      return newData;
    });
  }, [userId]);

  const removeItem = useCallback((id: string) => {
    setData(prev => {
      const newData = prev.filter(item => item.id !== id);
      
      localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(newData));
      if (userId) {
        memoryCache.set(CACHE_KEYS.EXPENSES(userId), newData, 60000);
      }
      
      return newData;
    });
  }, [userId]);

  useEffect(() => {
    if (!loadedRef.current) {
      loadExpenses();
    }
  }, [loadExpenses]);

  return {
    data,
    isLoading,
    error,
    refresh,
    addItem,
    updateItem,
    removeItem,
  };
}

export function useOptimizedSubscriptions(userId?: string): UseOptimizedDataResult<Subscription> {
  const [data, setData] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const loadSubscriptions = useCallback(async () => {
    if (!userId) return;

    try {
      setError(null);
      
      const subscriptions = await withCache(
        CACHE_KEYS.SUBSCRIPTIONS(userId),
        async () => {
          const stored = localStorage.getItem(SUBSCRIPTIONS_STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            return parsed.map((sub: any) => ({
              ...sub,
              nextPaymentDate: new Date(sub.nextPaymentDate),
              lastPaymentDate: sub.lastPaymentDate ? new Date(sub.lastPaymentDate) : undefined,
            }));
          }
          return [];
        },
        120000 // 2 minutes cache
      );

      setData(subscriptions);
    } catch (err) {
      console.error('Error loading subscriptions:', err);
      setError('Failed to load subscriptions');
      setData([]);
    } finally {
      setIsLoading(false);
      loadedRef.current = true;
    }
  }, [userId]);

  const refresh = useCallback(async () => {
    if (userId) {
      memoryCache.delete(CACHE_KEYS.SUBSCRIPTIONS(userId));
      await loadSubscriptions();
    }
  }, [userId, loadSubscriptions]);

  const addItem = useCallback((item: Subscription) => {
    setData(prev => {
      const newData = [...prev, item];
      
      localStorage.setItem(SUBSCRIPTIONS_STORAGE_KEY, JSON.stringify(newData));
      if (userId) {
        memoryCache.set(CACHE_KEYS.SUBSCRIPTIONS(userId), newData, 120000);
      }
      
      return newData;
    });
  }, [userId]);

  const updateItem = useCallback((id: string, updates: Partial<Subscription>) => {
    setData(prev => {
      const newData = prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      );
      
      localStorage.setItem(SUBSCRIPTIONS_STORAGE_KEY, JSON.stringify(newData));
      if (userId) {
        memoryCache.set(CACHE_KEYS.SUBSCRIPTIONS(userId), newData, 120000);
      }
      
      return newData;
    });
  }, [userId]);

  const removeItem = useCallback((id: string) => {
    setData(prev => {
      const newData = prev.filter(item => item.id !== id);
      
      localStorage.setItem(SUBSCRIPTIONS_STORAGE_KEY, JSON.stringify(newData));
      if (userId) {
        memoryCache.set(CACHE_KEYS.SUBSCRIPTIONS(userId), newData, 120000);
      }
      
      return newData;
    });
  }, [userId]);

  useEffect(() => {
    if (!loadedRef.current) {
      loadSubscriptions();
    }
  }, [loadSubscriptions]);

  return {
    data,
    isLoading,
    error,
    refresh,
    addItem,
    updateItem,
    removeItem,
  };
}

export function useOptimizedBudgets(userId?: string): UseOptimizedDataResult<Budget> {
  const [data, setData] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const loadBudgets = useCallback(async () => {
    if (!userId) return;

    try {
      setError(null);
      
      const budgets = await withCache(
        CACHE_KEYS.BUDGETS(userId),
        async () => {
          const stored = localStorage.getItem(BUDGETS_STORAGE_KEY);
          if (stored) {
            return JSON.parse(stored);
          }
          return [];
        },
        180000 // 3 minutes cache
      );

      setData(budgets);
    } catch (err) {
      console.error('Error loading budgets:', err);
      setError('Failed to load budgets');
      setData([]);
    } finally {
      setIsLoading(false);
      loadedRef.current = true;
    }
  }, [userId]);

  const refresh = useCallback(async () => {
    if (userId) {
      memoryCache.delete(CACHE_KEYS.BUDGETS(userId));
      await loadBudgets();
    }
  }, [userId, loadBudgets]);

  const addItem = useCallback((item: Budget) => {
    setData(prev => {
      const newData = [...prev, item];
      
      localStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(newData));
      if (userId) {
        memoryCache.set(CACHE_KEYS.BUDGETS(userId), newData, 180000);
      }
      
      return newData;
    });
  }, [userId]);

  const updateItem = useCallback((id: string, updates: Partial<Budget>) => {
    setData(prev => {
      const newData = prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      );
      
      localStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(newData));
      if (userId) {
        memoryCache.set(CACHE_KEYS.BUDGETS(userId), newData, 180000);
      }
      
      return newData;
    });
  }, [userId]);

  const removeItem = useCallback((id: string) => {
    setData(prev => {
      const newData = prev.filter(item => item.id !== id);
      
      localStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(newData));
      if (userId) {
        memoryCache.set(CACHE_KEYS.BUDGETS(userId), newData, 180000);
      }
      
      return newData;
    });
  }, [userId]);

  useEffect(() => {
    if (!loadedRef.current) {
      loadBudgets();
    }
  }, [loadBudgets]);

  return {
    data,
    isLoading,
    error,
    refresh,
    addItem,
    updateItem,
    removeItem,
  };
}
