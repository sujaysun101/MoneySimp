// src/lib/offlineStorage.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { BankAccount, Transaction, Expense, Subscription, EncryptedData } from './types';
import { encryptData, decryptData } from './encryption';

interface MoneySimplDB extends DBSchema {
  accounts: {
    key: string;
    value: EncryptedData & { id: string };
    indexes: { 'by-institution': string };
  };
  transactions: {
    key: string;
    value: EncryptedData & { id: string };
    indexes: { 'by-account': string; 'by-date': number };
  };
  expenses: {
    key: string;
    value: EncryptedData & { id: string };
    indexes: { 'by-category': string; 'by-date': number };
  };
  subscriptions: {
    key: string;
    value: EncryptedData & { id: string };
    indexes: { 'by-active': number };
  };
  metadata: {
    key: string;
    value: {
      lastSync: number;
      version: number;
      userId: string;
    };
  };
  pendingSync: {
    key: number;
    value: {
      id?: number;
      operation: 'create' | 'update' | 'delete';
      table: string;
      data: any;
      timestamp: number;
    };
  };
}

export class OfflineStorage {
  private db: IDBPDatabase<MoneySimplDB> | null = null;
  private encryptionKey: string;
  private userId: string;
  private initPromise: Promise<void> | null = null;

  constructor(userId: string, encryptionKey: string) {
    this.userId = userId;
    this.encryptionKey = encryptionKey;
  }

  private async ensureInit(): Promise<void> {
    if (this.db) return;
    
    if (this.initPromise) {
      await this.initPromise;
      return;
    }
    
    this.initPromise = this.init();
    await this.initPromise;
  }

  async init(): Promise<void> {
    try {
      this.db = await openDB<MoneySimplDB>('MoneySimplDB', 1, {
        upgrade(db) {
          // Accounts store
          const accountsStore = db.createObjectStore('accounts', { keyPath: 'id' });
          accountsStore.createIndex('by-institution', 'institutionId');

          // Transactions store
          const transactionsStore = db.createObjectStore('transactions', { keyPath: 'id' });
          transactionsStore.createIndex('by-account', 'accountId');
          transactionsStore.createIndex('by-date', 'date');

          // Expenses store
          const expensesStore = db.createObjectStore('expenses', { keyPath: 'id' });
          expensesStore.createIndex('by-category', 'categoryId');
          expensesStore.createIndex('by-date', 'date');

          // Subscriptions store
          const subscriptionsStore = db.createObjectStore('subscriptions', { keyPath: 'id' });
          // Store 'isActive' as a number (0 or 1) for indexing
          subscriptionsStore.createIndex('by-active', 'isActive');

          // Metadata store
          db.createObjectStore('metadata', { keyPath: 'key' });

          // Pending sync operations
          db.createObjectStore('pendingSync', { keyPath: 'id', autoIncrement: true });
        },
      });
    } catch (error) {
      console.error('Failed to initialize offline storage:', error);
      throw error;
    }
  }

  private encryptItem(data: any): EncryptedData {
    return encryptData(data, this.encryptionKey);
  }

  private decryptItem<T>(encryptedData: EncryptedData): T {
    return decryptData<T>(encryptedData, this.encryptionKey);
  }

  // Bank Accounts
  async saveAccount(account: BankAccount): Promise<void> {
    await this.ensureInit();
    if (!this.db) throw new Error('Database failed to initialize');
    
    try {
      const encrypted = this.encryptItem(account);
      await this.db.put('accounts', { id: account.id, ...encrypted });
    } catch (error) {
      console.error('Error saving account to offline storage:', error);
      throw error;
    }
  }

  async getAccount(id: string): Promise<BankAccount | null> {
    await this.ensureInit();
    if (!this.db) throw new Error('Database failed to initialize');
    
    try {
      const encrypted = await this.db.get('accounts', id);
      return encrypted ? this.decryptItem<BankAccount>(encrypted) : null;
    } catch (error) {
      console.error('Error getting account from offline storage:', error);
      return null;
    }
  }

  async getAllAccounts(): Promise<BankAccount[]> {
    await this.ensureInit();
    if (!this.db) throw new Error('Database failed to initialize');
    
    try {
      const encrypted = await this.db.getAll('accounts');
      return encrypted.map(item => this.decryptItem<BankAccount>(item));
    } catch (error) {
      console.error('Error getting accounts from offline storage:', error);
      return [];
    }
  }

  async deleteAccount(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.delete('accounts', id);
  }

  // Transactions
  async saveTransaction(transaction: Transaction): Promise<void> {
    await this.ensureInit();
    if (!this.db) throw new Error('Database failed to initialize');
    
    try {
      const encrypted = this.encryptItem(transaction);
      await this.db.put('transactions', { id: transaction.id, ...encrypted });
    } catch (error) {
      console.error('Error saving transaction to offline storage:', error);
      throw error;
    }
  }

  async getTransactionsByAccount(accountId: string): Promise<Transaction[]> {
    await this.ensureInit();
    if (!this.db) throw new Error('Database failed to initialize');
    
    try {
      const encrypted = await this.db.getAllFromIndex('transactions', 'by-account', accountId);
      return encrypted.map(item => this.decryptItem<Transaction>(item));
    } catch (error) {
      console.error('Error getting transactions from offline storage:', error);
      return [];
    }
  }

  async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    try {
      await this.ensureInit();
      if (!this.db) return [];
      const range = IDBKeyRange.bound(startDate.getTime(), endDate.getTime());
      const encrypted = await this.db.getAllFromIndex('transactions', 'by-date', range);
      return encrypted.map(item => this.decryptItem<Transaction>(item));
    } catch (error) {
      console.error('Error getting transactions by date range from offline storage:', error);
      return [];
    }
  }

  async getAllTransactions(): Promise<Transaction[]> {
    try {
      await this.ensureInit();
      if (!this.db) return [];
      const encrypted = await this.db.getAll('transactions');
      return encrypted.map(item => this.decryptItem<Transaction>(item));
    } catch (error) {
      console.error('Error getting all transactions from offline storage:', error);
      return [];
    }
  }

  // Expenses (manual entries)
  async saveExpense(expense: Expense): Promise<void> {
    try {
      await this.ensureInit();
      const encrypted = this.encryptItem(expense);
      if (!this.db) throw new Error('Database failed to initialize');
      await this.db.put('expenses', { id: expense.id, ...encrypted });
    } catch (error) {
      console.error('Error saving expense to offline storage:', error);
    }
  }

  async getAllExpenses(): Promise<Expense[]> {
    try {
      await this.ensureInit();
      if (!this.db) return [];
      const encrypted = await this.db.getAll('expenses');
      return encrypted.map(item => this.decryptItem<Expense>(item));
    } catch (error) {
      console.error('Error getting expenses from offline storage:', error);
      return [];
    }
  }

  async deleteExpense(id: string): Promise<void> {
    try {
      await this.ensureInit();
      if (!this.db) return;
      await this.db.delete('expenses', id);
    } catch (error) {
      console.error('Error deleting expense from offline storage:', error);
    }
  }

  // Subscriptions
  async saveSubscription(subscription: Subscription): Promise<void> {
    try {
      await this.ensureInit();
      if (!this.db) return;
      const encrypted = this.encryptItem(subscription);
      await this.db.put('subscriptions', { id: subscription.id, ...encrypted });
    } catch (error) {
      console.error('Error saving subscription to offline storage:', error);
    }
  }

  async getAllSubscriptions(): Promise<Subscription[]> {
    try {
      await this.ensureInit();
      if (!this.db) return [];
      const encrypted = await this.db.getAll('subscriptions');
      return encrypted.map(item => this.decryptItem<Subscription>(item));
    } catch (error) {
      console.error('Error getting subscriptions from offline storage:', error);
      return [];
    }
  }

  async deleteSubscription(id: string): Promise<void> {
    try {
      await this.ensureInit();
      if (!this.db) return;
      await this.db.delete('subscriptions', id);
    } catch (error) {
      console.error('Error deleting subscription from offline storage:', error);
    }
  }

  // Sync management
  async getLastSyncTime(): Promise<Date | null> {
    try {
      await this.ensureInit();
      if (!this.db) return null;
      const metadata = await this.db.get('metadata', 'lastSync');
      return metadata ? new Date(metadata.lastSync) : null;
    } catch (error) {
      console.error('Error getting last sync time from offline storage:', error);
      return null;
    }
  }

  async setLastSyncTime(date: Date): Promise<void> {
    try {
      await this.ensureInit();
      if (!this.db) return;
      await this.db.put('metadata', {
        lastSync: date.getTime(),
        version: 1,
        userId: this.userId
      }, 'lastSync');
    } catch (error) {
      console.error('Error setting last sync time in offline storage:', error);
    }
  }

  async addPendingSync(operation: 'create' | 'update' | 'delete', table: string, data: any): Promise<void> {
    try {
      await this.ensureInit();
      if (!this.db) return;
      await this.db.add('pendingSync', {
        operation,
        table,
        data,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error adding pending sync operation to offline storage:', error);
    }
  }

  async getPendingSyncOperations(): Promise<any[]> {
    try {
      await this.ensureInit();
      if (!this.db) return [];
      return await this.db.getAll('pendingSync');
    } catch (error) {
      console.error('Error getting pending sync operations from offline storage:', error);
      return [];
    }
  }

  async clearPendingSyncOperations(): Promise<void> {
    try {
      await this.ensureInit();
      if (!this.db) return;
      await this.db.clear('pendingSync');
    } catch (error) {
      console.error('Error clearing pending sync operations from offline storage:', error);
    }
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    try {
      await this.ensureInit();
      if (!this.db) return;
      
      const storeNames = ['accounts', 'transactions', 'expenses', 'subscriptions', 'metadata', 'pendingSync'] as const;
      
      const transaction = this.db.transaction(storeNames, 'readwrite');
      await Promise.all(storeNames.map(store => transaction.objectStore(store).clear()));
      await transaction.done;
    } catch (error) {
      console.error('Error clearing all data from offline storage:', error);
    }
  }

  async getStorageUsage(): Promise<{ estimatedUsage: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        estimatedUsage: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    }
    return { estimatedUsage: 0, quota: 0 };
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Singleton instance
let offlineStorageInstance: OfflineStorage | null = null;

export async function initOfflineStorage(userId: string, encryptionKey: string): Promise<OfflineStorage> {
  if (!offlineStorageInstance) {
    offlineStorageInstance = new OfflineStorage(userId, encryptionKey);
    await offlineStorageInstance.init();
  }
  return offlineStorageInstance;
}

export function getOfflineStorage(): OfflineStorage {
  if (!offlineStorageInstance) {
    throw new Error('Offline storage not initialized. Call initOfflineStorage first.');
  }
  return offlineStorageInstance;
}

export async function clearOfflineStorage(): Promise<void> {
  if (offlineStorageInstance) {
    await offlineStorageInstance.clearAllData();
    await offlineStorageInstance.close();
    offlineStorageInstance = null;
  }
}
