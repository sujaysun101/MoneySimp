// src/lib/hybridStorage.ts
import { BankAccount, Transaction, Expense, Subscription } from './types';
import { FirestoreService, initFirestoreService, getFirestoreService } from './firestore';
import { StorageWrapper, initStorageWrapper, getStorageWrapper } from './storageWrapper';

/**
 * HybridStorage provides a robust storage solution that combines:
 * 1. Firestore (primary, secure cloud storage)
 * 2. IndexedDB/localStorage (offline backup and sync)
 * 
 * Strategy:
 * - Writes go to both Firestore and local storage
 * - Reads prefer Firestore when online, fall back to local when offline
 * - Automatic sync when connection is restored
 */
export class HybridStorage {
  private firestoreService: FirestoreService;
  private localStorageWrapper: StorageWrapper;
  private isOnline: boolean = navigator.onLine;
  private syncQueue: Array<{ operation: string, data: any, timestamp: number }> = [];

  constructor(
    private userId: string, 
    private encryptionKey: string
  ) {
    this.firestoreService = initFirestoreService(userId, encryptionKey);
    this.localStorageWrapper = {} as StorageWrapper; // Will be initialized async
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async initialize(): Promise<void> {
    this.localStorageWrapper = await initStorageWrapper(this.userId, this.encryptionKey);
  }

  private async addToSyncQueue(operation: string, data: any): Promise<void> {
    this.syncQueue.push({
      operation,
      data,
      timestamp: Date.now()
    });
    
    // Also save to local storage sync queue for persistence
    try {
      await this.localStorageWrapper.saveTransaction({
        id: `sync_${Date.now()}`,
        accountId: 'sync_queue',
        amount: 0,
        description: operation,
        category: ['sync'],
        categoryId: 'sync',
        pending: false,
        date: new Date(),
        metadata: data
      } as Transaction);
    } catch (error) {
      console.warn('Failed to persist sync queue item:', error);
    }
  }

  private async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) return;

    console.log(`Processing ${this.syncQueue.length} queued operations...`);
    
    const processedItems: Array<{ operation: string, data: any, timestamp: number }> = [];
    
    for (const item of this.syncQueue) {
      try {
        switch (item.operation) {
          case 'saveAccount':
            await this.firestoreService.saveBankAccount(item.data);
            break;
          case 'saveTransaction':
            await this.firestoreService.saveTransaction(item.data);
            break;
          case 'saveExpense':
            await this.firestoreService.saveExpense(item.data);
            break;
          case 'saveSubscription':
            await this.firestoreService.saveSubscription(item.data);
            break;
          case 'deleteAccount':
            await this.firestoreService.deleteBankAccount(item.data.id);
            break;
          case 'deleteExpense':
            await this.firestoreService.deleteExpense(item.data.id);
            break;
          case 'deleteSubscription':
            await this.firestoreService.deleteSubscription(item.data.id);
            break;
        }
        processedItems.push(item);
      } catch (error) {
        console.error(`Failed to sync ${item.operation}:`, error);
        // Keep failed items in queue for retry
      }
    }
    
    // Remove successfully processed items
    this.syncQueue = this.syncQueue.filter(item => !processedItems.includes(item));
    
    if (processedItems.length > 0) {
      console.log(`Successfully synced ${processedItems.length} operations`);
    }
  }

  // Bank Accounts
  async saveBankAccount(account: BankAccount): Promise<string> {
    // Always save to local storage first (for immediate UI update)
    await this.localStorageWrapper.saveAccount(account);
    
    if (this.isOnline) {
      try {
        const id = await this.firestoreService.saveBankAccount(account);
        // Update local storage with the server ID if it's a new account
        if (!account.id && id) {
          await this.localStorageWrapper.saveAccount({ ...account, id });
        }
        return id;
      } catch (error) {
        console.warn('Failed to save account to Firestore, queuing for sync:', error);
        await this.addToSyncQueue('saveAccount', account);
        return account.id || `temp_${Date.now()}`;
      }
    } else {
      await this.addToSyncQueue('saveAccount', account);
      return account.id || `temp_${Date.now()}`;
    }
  }

  async getAllBankAccounts(): Promise<BankAccount[]> {
    if (this.isOnline) {
      try {
        const accounts = await this.firestoreService.getAllBankAccounts();
        // Update local cache
        for (const account of accounts) {
          await this.localStorageWrapper.saveAccount(account);
        }
        console.log('Successfully fetched accounts from Firestore:', accounts.length);
        return accounts;
      } catch (error) {
        console.warn('Failed to fetch accounts from Firestore, using local cache:', error);
        // Continue to use local cache
      }
    }
    
    const localAccounts = await this.localStorageWrapper.getAllAccounts();
    console.log('Using local cache for accounts:', localAccounts.length);
    return localAccounts;
  }

  async getBankAccount(accountId: string): Promise<BankAccount | null> {
    if (this.isOnline) {
      try {
        const account = await this.firestoreService.getBankAccount(accountId);
        if (account) {
          // Update local cache
          await this.localStorageWrapper.saveAccount(account);
          return account;
        }
      } catch (error) {
        console.warn('Failed to fetch account from Firestore, using local cache:', error);
      }
    }
    
    return await this.localStorageWrapper.getAccount(accountId);
  }

  async deleteBankAccount(accountId: string): Promise<void> {
    // Remove from local storage immediately
    await this.localStorageWrapper.removeAccount(accountId);
    
    if (this.isOnline) {
      try {
        await this.firestoreService.deleteBankAccount(accountId);
      } catch (error) {
        console.warn('Failed to delete account from Firestore, queuing for sync:', error);
        await this.addToSyncQueue('deleteAccount', { id: accountId });
      }
    } else {
      await this.addToSyncQueue('deleteAccount', { id: accountId });
    }
  }

  // Transactions
  async saveTransaction(transaction: Transaction): Promise<string> {
    // Always save to local storage first
    await this.localStorageWrapper.saveTransaction(transaction);
    
    if (this.isOnline) {
      try {
        const id = await this.firestoreService.saveTransaction(transaction);
        if (!transaction.id && id) {
          await this.localStorageWrapper.saveTransaction({ ...transaction, id });
        }
        return id;
      } catch (error) {
        console.warn('Failed to save transaction to Firestore, queuing for sync:', error);
        await this.addToSyncQueue('saveTransaction', transaction);
        return transaction.id || `temp_${Date.now()}`;
      }
    } else {
      await this.addToSyncQueue('saveTransaction', transaction);
      return transaction.id || `temp_${Date.now()}`;
    }
  }

  async getTransactionsByAccount(accountId: string): Promise<Transaction[]> {
    if (this.isOnline) {
      try {
        const { transactions } = await this.firestoreService.getTransactionsByAccount(accountId);
        // Update local cache
        for (const transaction of transactions) {
          await this.localStorageWrapper.saveTransaction(transaction);
        }
        return transactions;
      } catch (error) {
        console.warn('Failed to fetch transactions from Firestore, using local cache:', error);
      }
    }
    
    return await this.localStorageWrapper.getTransactionsByAccount(accountId);
  }

  async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    if (this.isOnline) {
      try {
        const transactions = await this.firestoreService.getTransactionsByDateRange(startDate, endDate);
        // Update local cache
        for (const transaction of transactions) {
          await this.localStorageWrapper.saveTransaction(transaction);
        }
        return transactions;
      } catch (error) {
        console.warn('Failed to fetch transactions from Firestore, using local cache:', error);
      }
    }
    
    return await this.localStorageWrapper.getTransactionsByDateRange(startDate, endDate);
  }

  // Expenses
  async saveExpense(expense: Expense): Promise<string> {
    await this.localStorageWrapper.saveExpense(expense);
    
    if (this.isOnline) {
      try {
        const id = await this.firestoreService.saveExpense(expense);
        if (!expense.id && id) {
          await this.localStorageWrapper.saveExpense({ ...expense, id });
        }
        return id;
      } catch (error) {
        console.warn('Failed to save expense to Firestore, queuing for sync:', error);
        await this.addToSyncQueue('saveExpense', expense);
        return expense.id || `temp_${Date.now()}`;
      }
    } else {
      await this.addToSyncQueue('saveExpense', expense);
      return expense.id || `temp_${Date.now()}`;
    }
  }

  async getAllExpenses(): Promise<Expense[]> {
    if (this.isOnline) {
      try {
        const expenses = await this.firestoreService.getAllExpenses();
        // Update local cache
        for (const expense of expenses) {
          await this.localStorageWrapper.saveExpense(expense);
        }
        return expenses;
      } catch (error) {
        console.warn('Failed to fetch expenses from Firestore, using local cache:', error);
      }
    }
    
    return await this.localStorageWrapper.getAllExpenses();
  }

  async deleteExpense(expenseId: string): Promise<void> {
    await this.localStorageWrapper.deleteExpense(expenseId);
    
    if (this.isOnline) {
      try {
        await this.firestoreService.deleteExpense(expenseId);
      } catch (error) {
        console.warn('Failed to delete expense from Firestore, queuing for sync:', error);
        await this.addToSyncQueue('deleteExpense', { id: expenseId });
      }
    } else {
      await this.addToSyncQueue('deleteExpense', { id: expenseId });
    }
  }

  // Subscriptions
  async saveSubscription(subscription: Subscription): Promise<string> {
    await this.localStorageWrapper.saveSubscription(subscription);
    
    if (this.isOnline) {
      try {
        const id = await this.firestoreService.saveSubscription(subscription);
        if (!subscription.id && id) {
          await this.localStorageWrapper.saveSubscription({ ...subscription, id });
        }
        return id;
      } catch (error) {
        console.warn('Failed to save subscription to Firestore, queuing for sync:', error);
        await this.addToSyncQueue('saveSubscription', subscription);
        return subscription.id || `temp_${Date.now()}`;
      }
    } else {
      await this.addToSyncQueue('saveSubscription', subscription);
      return subscription.id || `temp_${Date.now()}`;
    }
  }

  async getAllSubscriptions(): Promise<Subscription[]> {
    if (this.isOnline) {
      try {
        const subscriptions = await this.firestoreService.getAllSubscriptions();
        // Update local cache
        for (const subscription of subscriptions) {
          await this.localStorageWrapper.saveSubscription(subscription);
        }
        return subscriptions;
      } catch (error) {
        console.warn('Failed to fetch subscriptions from Firestore, using local cache:', error);
      }
    }
    
    return await this.localStorageWrapper.getAllSubscriptions();
  }

  async deleteSubscription(subscriptionId: string): Promise<void> {
    await this.localStorageWrapper.deleteSubscription(subscriptionId);
    
    if (this.isOnline) {
      try {
        await this.firestoreService.deleteSubscription(subscriptionId);
      } catch (error) {
        console.warn('Failed to delete subscription from Firestore, queuing for sync:', error);
        await this.addToSyncQueue('deleteSubscription', { id: subscriptionId });
      }
    } else {
      await this.addToSyncQueue('deleteSubscription', { id: subscriptionId });
    }
  }

  // Sync management
  async getLastSyncTime(): Promise<Date | null> {
    if (this.isOnline) {
      try {
        const syncTime = await this.firestoreService.getLastSyncTime();
        if (syncTime) {
          await this.localStorageWrapper.setLastSyncTime(syncTime);
        }
        return syncTime;
      } catch (error) {
        console.warn('Failed to get sync time from Firestore, using local cache:', error);
      }
    }
    
    return await this.localStorageWrapper.getLastSyncTime();
  }

  async setLastSyncTime(date: Date): Promise<void> {
    await this.localStorageWrapper.setLastSyncTime(date);
    
    if (this.isOnline) {
      try {
        await this.firestoreService.updateLastSyncTime(date);
      } catch (error) {
        console.warn('Failed to update sync time in Firestore:', error);
      }
    }
  }

  // Analytics
  async getSpendingByCategory(startDate: Date, endDate: Date): Promise<{ category: string, amount: number }[]> {
    if (this.isOnline) {
      try {
        return await this.firestoreService.getSpendingByCategory(startDate, endDate);
      } catch (error) {
        console.warn('Failed to get spending data from Firestore, using local analysis:', error);
      }
    }
    
    // Fallback to local analysis
    const transactions = await this.localStorageWrapper.getTransactionsByDateRange(startDate, endDate);
    const categoryTotals: { [key: string]: number } = {};
    
    transactions
      .filter(t => t.amount < 0) // Only expenses
      .forEach(t => {
        const category = (t.category && t.category.length > 0) ? t.category[0] : 'Uncategorized';
        const amount = Math.abs(t.amount || 0);
        categoryTotals[category] = (categoryTotals[category] || 0) + amount;
      });
    
    return Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount
    }));
  }

  // Utility methods
  async getStorageInfo(): Promise<{
    firestore: { available: boolean, error?: string },
    local: { type: string, available: boolean, usage?: number, quota?: number },
    syncQueue: { pendingItems: number }
  }> {
    const localInfo = await this.localStorageWrapper.getStorageInfo();
    
    return {
      firestore: {
        available: this.isOnline,
        error: this.isOnline ? undefined : 'Offline'
      },
      local: localInfo,
      syncQueue: {
        pendingItems: this.syncQueue.length
      }
    };
  }

  async clearAllData(): Promise<void> {
    await this.localStorageWrapper.clearAllData();
    this.syncQueue = [];
    
    if (this.isOnline) {
      try {
        // Note: We don't have a clearAll method in Firestore service for safety
        // This would need to be implemented carefully with proper authorization
        console.warn('Firestore data clearing not implemented for safety');
      } catch (error) {
        console.error('Failed to clear Firestore data:', error);
      }
    }
  }

  async forceSyncAll(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    try {
      // Sync all local data to Firestore
      const [accounts, expenses, subscriptions] = await Promise.all([
        this.localStorageWrapper.getAllAccounts(),
        this.localStorageWrapper.getAllExpenses(),
        this.localStorageWrapper.getAllSubscriptions()
      ]);

      // Sync accounts
      for (const account of accounts) {
        await this.firestoreService.saveBankAccount(account);
        
        // Sync transactions for this account
        const transactions = await this.localStorageWrapper.getTransactionsByAccount(account.id);
        for (const transaction of transactions) {
          await this.firestoreService.saveTransaction(transaction);
        }
      }

      // Sync expenses
      for (const expense of expenses) {
        await this.firestoreService.saveExpense(expense);
      }

      // Sync subscriptions
      for (const subscription of subscriptions) {
        await this.firestoreService.saveSubscription(subscription);
      }

      // Process any remaining sync queue items
      await this.processSyncQueue();

      await this.setLastSyncTime(new Date());
      
      console.log('Full sync completed successfully');
    } catch (error) {
      console.error('Force sync failed:', error);
      throw error;
    }
  }
}

// Singleton pattern
let hybridStorageInstance: HybridStorage | null = null;

export async function initHybridStorage(userId: string, encryptionKey: string): Promise<HybridStorage> {
  if (!hybridStorageInstance) {
    hybridStorageInstance = new HybridStorage(userId, encryptionKey);
    await hybridStorageInstance.initialize();
  }
  return hybridStorageInstance;
}

export function getHybridStorage(): HybridStorage {
  if (!hybridStorageInstance) {
    throw new Error('Hybrid storage not initialized. Call initHybridStorage first.');
  }
  return hybridStorageInstance;
}

export async function clearHybridStorage(): Promise<void> {
  if (hybridStorageInstance) {
    await hybridStorageInstance.clearAllData();
    hybridStorageInstance = null;
  }
}
