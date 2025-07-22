import { BankAccount, Transaction, Expense, Subscription } from './types';
import { OfflineStorage } from './offlineStorage';

/**
 * StorageWrapper provides a resilient storage solution with graceful degradation
 * Falls back from IndexedDB -> localStorage -> in-memory storage
 */
export class StorageWrapper {
  private offlineStorage: OfflineStorage | null = null;
  private memoryStorage: Map<string, any> = new Map();
  private isOfflineStorageReady = false;

  constructor(private userId: string, private encryptionKey: string) {}

  async initialize(): Promise<void> {
    try {
      this.offlineStorage = new OfflineStorage(this.userId, this.encryptionKey);
      await this.offlineStorage.init();
      this.isOfflineStorageReady = true;
      console.log('IndexedDB storage initialized successfully');
    } catch (error) {
      console.warn('IndexedDB not available, falling back to localStorage:', error);
      this.isOfflineStorageReady = false;
    }
  }

  private getStorageKey(type: string, id?: string): string {
    return `moneysimp_${this.userId}_${type}${id ? `_${id}` : ''}`;
  }

  private saveToLocalStorage(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('localStorage not available, using memory storage:', error);
      this.memoryStorage.set(key, data);
    }
  }

  private getFromLocalStorage(key: string): any | null {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('localStorage read failed, using memory storage:', error);
      return this.memoryStorage.get(key) || null;
    }
  }

  private removeFromLocalStorage(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('localStorage remove failed, using memory storage:', error);
      this.memoryStorage.delete(key);
    }
  }

  // Account methods
  async saveAccount(account: BankAccount): Promise<void> {
    if (this.isOfflineStorageReady && this.offlineStorage) {
      await this.offlineStorage.saveAccount(account);
    } else {
      const accounts = await this.getAllAccounts();
      const existingIndex = accounts.findIndex(a => a.id === account.id);
      if (existingIndex >= 0) {
        accounts[existingIndex] = account;
      } else {
        accounts.push(account);
      }
      this.saveToLocalStorage(this.getStorageKey('accounts'), accounts);
    }
  }

  async getAllAccounts(): Promise<BankAccount[]> {
    if (this.isOfflineStorageReady && this.offlineStorage) {
      return await this.offlineStorage.getAllAccounts();
    } else {
      return this.getFromLocalStorage(this.getStorageKey('accounts')) || [];
    }
  }

  async getAccount(id: string): Promise<BankAccount | null> {
    if (this.isOfflineStorageReady && this.offlineStorage) {
      return await this.offlineStorage.getAccount(id);
    } else {
      const accounts = await this.getAllAccounts();
      return accounts.find(a => a.id === id) || null;
    }
  }

  async removeAccount(id: string): Promise<void> {
    if (this.isOfflineStorageReady && this.offlineStorage) {
      await this.offlineStorage.deleteAccount(id);
    } else {
      const accounts = await this.getAllAccounts();
      const filtered = accounts.filter(a => a.id !== id);
      this.saveToLocalStorage(this.getStorageKey('accounts'), filtered);
    }
  }

  // Transaction methods
  async saveTransaction(transaction: Transaction): Promise<void> {
    if (this.isOfflineStorageReady && this.offlineStorage) {
      await this.offlineStorage.saveTransaction(transaction);
    } else {
      const transactions = await this.getAllTransactions();
      const existingIndex = transactions.findIndex(t => t.id === transaction.id);
      if (existingIndex >= 0) {
        transactions[existingIndex] = transaction;
      } else {
        transactions.push(transaction);
      }
      this.saveToLocalStorage(this.getStorageKey('transactions'), transactions);
    }
  }

  async getAllTransactions(): Promise<Transaction[]> {
    if (this.isOfflineStorageReady && this.offlineStorage) {
      return await this.offlineStorage.getAllTransactions();
    } else {
      return this.getFromLocalStorage(this.getStorageKey('transactions')) || [];
    }
  }

  async getTransactionsByAccount(accountId: string): Promise<Transaction[]> {
    if (this.isOfflineStorageReady && this.offlineStorage) {
      return await this.offlineStorage.getTransactionsByAccount(accountId);
    } else {
      const transactions = await this.getAllTransactions();
      return transactions.filter(t => t.accountId === accountId);
    }
  }

  async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    if (this.isOfflineStorageReady && this.offlineStorage) {
      return await this.offlineStorage.getTransactionsByDateRange(startDate, endDate);
    } else {
      const transactions = await this.getAllTransactions();
      return transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
    }
  }

  // Expense methods
  async saveExpense(expense: Expense): Promise<void> {
    if (this.isOfflineStorageReady && this.offlineStorage) {
      await this.offlineStorage.saveExpense(expense);
    } else {
      const expenses = await this.getAllExpenses();
      const existingIndex = expenses.findIndex(e => e.id === expense.id);
      if (existingIndex >= 0) {
        expenses[existingIndex] = expense;
      } else {
        expenses.push(expense);
      }
      this.saveToLocalStorage(this.getStorageKey('expenses'), expenses);
    }
  }

  async getAllExpenses(): Promise<Expense[]> {
    if (this.isOfflineStorageReady && this.offlineStorage) {
      return await this.offlineStorage.getAllExpenses();
    } else {
      return this.getFromLocalStorage(this.getStorageKey('expenses')) || [];
    }
  }

  async deleteExpense(id: string): Promise<void> {
    if (this.isOfflineStorageReady && this.offlineStorage) {
      await this.offlineStorage.deleteExpense(id);
    } else {
      const expenses = await this.getAllExpenses();
      const filtered = expenses.filter(e => e.id !== id);
      this.saveToLocalStorage(this.getStorageKey('expenses'), filtered);
    }
  }

  // Subscription methods
  async saveSubscription(subscription: Subscription): Promise<void> {
    if (this.isOfflineStorageReady && this.offlineStorage) {
      await this.offlineStorage.saveSubscription(subscription);
    } else {
      const subscriptions = await this.getAllSubscriptions();
      const existingIndex = subscriptions.findIndex(s => s.id === subscription.id);
      if (existingIndex >= 0) {
        subscriptions[existingIndex] = subscription;
      } else {
        subscriptions.push(subscription);
      }
      this.saveToLocalStorage(this.getStorageKey('subscriptions'), subscriptions);
    }
  }

  async getAllSubscriptions(): Promise<Subscription[]> {
    if (this.isOfflineStorageReady && this.offlineStorage) {
      return await this.offlineStorage.getAllSubscriptions();
    } else {
      return this.getFromLocalStorage(this.getStorageKey('subscriptions')) || [];
    }
  }

  async deleteSubscription(id: string): Promise<void> {
    if (this.isOfflineStorageReady && this.offlineStorage) {
      await this.offlineStorage.deleteSubscription(id);
    } else {
      const subscriptions = await this.getAllSubscriptions();
      const filtered = subscriptions.filter(s => s.id !== id);
      this.saveToLocalStorage(this.getStorageKey('subscriptions'), filtered);
    }
  }

  // Sync methods
  async getLastSyncTime(): Promise<Date | null> {
    if (this.isOfflineStorageReady && this.offlineStorage) {
      return await this.offlineStorage.getLastSyncTime();
    } else {
      const syncTime = this.getFromLocalStorage(this.getStorageKey('lastSync'));
      return syncTime ? new Date(syncTime) : null;
    }
  }

  async setLastSyncTime(date: Date): Promise<void> {
    if (this.isOfflineStorageReady && this.offlineStorage) {
      await this.offlineStorage.setLastSyncTime(date);
    } else {
      this.saveToLocalStorage(this.getStorageKey('lastSync'), date.getTime());
    }
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    if (this.isOfflineStorageReady && this.offlineStorage) {
      await this.offlineStorage.clearAllData();
    } else {
      // Clear localStorage
      const keys = ['accounts', 'transactions', 'expenses', 'subscriptions', 'lastSync'];
      keys.forEach(key => {
        this.removeFromLocalStorage(this.getStorageKey(key));
      });
      // Clear memory storage
      this.memoryStorage.clear();
    }
  }

  async getStorageInfo(): Promise<{ type: string; available: boolean; usage?: number; quota?: number }> {
    if (this.isOfflineStorageReady && this.offlineStorage) {
      const usage = await this.offlineStorage.getStorageUsage();
      return {
        type: 'IndexedDB',
        available: true,
        usage: usage.estimatedUsage,
        quota: usage.quota
      };
    } else if (typeof Storage !== 'undefined') {
      return {
        type: 'localStorage',
        available: true
      };
    } else {
      return {
        type: 'memory',
        available: true
      };
    }
  }

  async close(): Promise<void> {
    if (this.offlineStorage) {
      await this.offlineStorage.close();
    }
  }
}

// Singleton instance
let storageWrapperInstance: StorageWrapper | null = null;

export async function initStorageWrapper(userId: string, encryptionKey: string): Promise<StorageWrapper> {
  if (!storageWrapperInstance) {
    storageWrapperInstance = new StorageWrapper(userId, encryptionKey);
    await storageWrapperInstance.initialize();
  }
  return storageWrapperInstance;
}

export function getStorageWrapper(): StorageWrapper {
  if (!storageWrapperInstance) {
    throw new Error('Storage wrapper not initialized. Call initStorageWrapper first.');
  }
  return storageWrapperInstance;
}

export async function clearStorageWrapper(): Promise<void> {
  if (storageWrapperInstance) {
    await storageWrapperInstance.clearAllData();
    await storageWrapperInstance.close();
    storageWrapperInstance = null;
  }
}
