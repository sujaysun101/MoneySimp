import {
  ACCOUNTS_STORAGE_KEY,
  BUDGETS_STORAGE_KEY,
  EXPENSES_STORAGE_KEY,
  GOALS_STORAGE_KEY,
  SUBSCRIPTIONS_STORAGE_KEY,
} from '@/lib/constants';
import { DEMO_HOUSEHOLD, demoStorageEntries } from '@/lib/demo-data';

export const DEMO_MODE_KEY = 'moneySimpDemoMode';

export function isDemoMode(): boolean {
  return typeof window !== 'undefined' && localStorage.getItem(DEMO_MODE_KEY) === 'true';
}

export function readStoredGoals<T = unknown>(): T[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(GOALS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeStoredGoals(goals: unknown[]): void {
  localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
}

export function seedDemoData(): void {
  for (const [key, value] of demoStorageEntries()) {
    localStorage.setItem(key, value);
  }
  localStorage.removeItem('smartMoneyTip');
}

export function clearDemoClientState(): void {
  localStorage.removeItem(DEMO_MODE_KEY);
  localStorage.removeItem('moneySimpLoggedIn');
  localStorage.removeItem('moneySimpUserEmail');
  localStorage.removeItem('moneySimpUserId');
  localStorage.removeItem('moneySimpUserName');
  localStorage.removeItem(EXPENSES_STORAGE_KEY);
  localStorage.removeItem(BUDGETS_STORAGE_KEY);
  localStorage.removeItem(SUBSCRIPTIONS_STORAGE_KEY);
  localStorage.removeItem(ACCOUNTS_STORAGE_KEY);
  localStorage.removeItem(GOALS_STORAGE_KEY);
  localStorage.removeItem('smartMoneyTip');
}

export async function startDemoSession(): Promise<void> {
  const res = await fetch('/api/demo/start', { method: 'POST' });
  if (!res.ok) {
    throw new Error('Demo session was not created.');
  }
  seedDemoData();
  localStorage.setItem('moneySimpLoggedIn', 'true');
  localStorage.setItem(DEMO_MODE_KEY, 'true');
  localStorage.setItem('moneySimpUserEmail', DEMO_HOUSEHOLD.email);
  localStorage.setItem('moneySimpUserId', DEMO_HOUSEHOLD.id);
  localStorage.setItem('moneySimpUserName', DEMO_HOUSEHOLD.name);
}
