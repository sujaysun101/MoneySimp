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

class OfflineStorage {
  private db: IDBPDatabase<MoneySimplDB> | null = null;
  private encryptionKey: string;
  private userId: string;

  constructor(userId: string, encryptionKey: string) {
    this.userId = userId;
    this.encryptionKey = encryptionKey;
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
    if (!this.db) throw new Error('Database not initialized');
    const encrypted = this.encryptItem(account);
    await this.db.put('accounts', { id: account.id, ...encrypted });
  }

  async getAccount(id: string): Promise<BankAccount | null> {
    if (!this.db) throw new Error('Database not initialized');
    const encrypted = await this.db.get('accounts', id);
    return encrypted ? this.decryptItem<BankAccount>(encrypted) : null;
  }

  async getAllAccounts(): Promise<BankAccount[]> {
    if (!this.db) throw new Error('Database not initialized');
    const encrypted = await this.db.getAll('accounts');
    return encrypted.map(item => this.decryptItem<BankAccount>(item));
  }

  async deleteAccount(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.delete('accounts', id);
  }

  // Transactions
  async saveTransaction(transaction: Transaction): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const encrypted = this.encryptItem(transaction);
    await this.db.put('transactions', { id: transaction.id, ...encrypted });
  }

  async getTransactionsByAccount(accountId: string): Promise<Transaction[]> {
    if (!this.db) throw new Error('Database not initialized');
    const encrypted = await this.db.getAllFromIndex('transactions', 'by-account', accountId);
    return encrypted.map(item => this.decryptItem<Transaction>(item));
  }

  async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    if (!this.db) throw new Error('Database not initialized');
    const range = IDBKeyRange.bound(startDate.getTime(), endDate.getTime());
    const encrypted = await this.db.getAllFromIndex('transactions', 'by-date', range);
    return encrypted.map(item => this.decryptItem<Transaction>(item));
  }

  async getAllTransactions(): Promise<Transaction[]> {
    if (!this.db) throw new Error('Database not initialized');
    const encrypted = await this.db.getAll('transactions');
    return encrypted.map(item => this.decryptItem<Transaction>(item));
  }

  // Expenses (manual entries)
  async saveExpense(expense: Expense): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const encrypted = this.encryptItem(expense);
    await this.db.put('expenses', { id: expense.id, ...encrypted });
  }

  async getAllExpenses(): Promise<Expense[]> {
    if (!this.db) throw new Error('Database not initialized');
    const encrypted = await this.db.getAll('expenses');
    return encrypted.map(item => this.decryptItem<Expense>(item));
  }

  async deleteExpense(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.delete('expenses', id);
  }

  // Subscriptions
  async saveSubscription(subscription: Subscription): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const encrypted = this.encryptItem(subscription);
    await this.db.put('subscriptions', { id: subscription.id, ...encrypted });
  }

  async getAllSubscriptions(): Promise<Subscription[]> {
    if (!this.db) throw new Error('Database not initialized');
    const encrypted = await this.db.getAll('subscriptions');
    return encrypted.map(item => this.decryptItem<Subscription>(item));
  }

  async deleteSubscription(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.delete('subscriptions', id);
  }

  // Sync management
  async getLastSyncTime(): Promise<Date | null> {
    if (!this.db) throw new Error('Database not initialized');
    const metadata = await this.db.get('metadata', 'lastSync');
    return metadata ? new Date(metadata.lastSync) : null;
  }

  async setLastSyncTime(date: Date): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('metadata', {
      lastSync: date.getTime(),
      version: 1,
      userId: this.userId
    }, 'lastSync');
  }

  async addPendingSync(operation: 'create' | 'update' | 'delete', table: string, data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.add('pendingSync', {
      operation,
      table,
      data,
      timestamp: Date.now()
    });
  }

  async getPendingSyncOperations(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAll('pendingSync');
  }

  async clearPendingSyncOperations(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.clear('pendingSync');
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const storeNames = ['accounts', 'transactions', 'expenses', 'subscriptions', 'metadata', 'pendingSync'] as const;
    
    const transaction = this.db.transaction(storeNames, 'readwrite');
    await Promise.all(storeNames.map(store => transaction.objectStore(store).clear()));
    await transaction.done;
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
