// src/lib/firestore.ts
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  writeBatch,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { BankAccount, Transaction, Expense, Subscription } from './types';
import { encryptData, decryptData } from './encryption';

export class FirestoreService {
  private userId: string;
  private encryptionKey: string;

  constructor(userId: string, encryptionKey: string) {
    this.userId = userId;
    this.encryptionKey = encryptionKey;
  }

  // Helper methods for simple field encryption
  private encrypt(value: string): string {
    const encrypted = encryptData(value, this.encryptionKey);
    return JSON.stringify(encrypted);
  }

  private decrypt(encryptedValue: string): string {
    try {
      const encryptedData = JSON.parse(encryptedValue);
      return decryptData<string>(encryptedData, this.encryptionKey);
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedValue; // Return original if decryption fails
    }
  }

  private encryptSensitiveData(data: any): any {
    // Clone the object to avoid modifying the original
    const encrypted = { ...data };
    
    // Encrypt sensitive fields
    const sensitiveFields = ['balance', 'amount', 'accessToken', 'accountNumber', 'routingNumber'];
    
    for (const field of sensitiveFields) {
      if (encrypted[field] !== undefined) {
        encrypted[field] = encryptData(String(encrypted[field]), this.encryptionKey);
      }
    }
    
    return encrypted;
  }

  private decryptSensitiveData(data: any): any {
    if (!data) return data;
    
    // Clone the object to avoid modifying the original
    const decrypted = { ...data };
    
    // Decrypt sensitive fields
    const sensitiveFields = ['balance', 'amount', 'accessToken', 'accountNumber', 'routingNumber'];
    
    for (const field of sensitiveFields) {
      if (decrypted[field] !== undefined) {
        try {
          const decryptedValue = this.decrypt(decrypted[field]);
          // Convert back to number for financial fields
          if (['balance', 'amount'].includes(field)) {
            decrypted[field] = parseFloat(decryptedValue);
          } else {
            decrypted[field] = decryptedValue;
          }
        } catch (error) {
          console.error(`Failed to decrypt field ${field}:`, error);
        }
      }
    }
    
    return decrypted;
  }

  // Bank Accounts
  async saveBankAccount(account: BankAccount): Promise<string> {
    if (!db) throw new Error('Firestore not initialized');
    
    const accountData = {
      ...this.encryptSensitiveData(account),
      userId: this.userId,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    };

    if (account.id) {
      // Update existing account
      const accountRef = doc(db, 'bankAccounts', account.id);
      await updateDoc(accountRef, accountData);
      return account.id;
    } else {
      // Create new account
      const accountRef = await addDoc(collection(db, 'bankAccounts'), accountData);
      return accountRef.id;
    }
  }

  async getBankAccount(accountId: string): Promise<BankAccount | null> {
    if (!db) throw new Error('Firestore not initialized');
    
    const accountRef = doc(db, 'bankAccounts', accountId);
    const accountSnap = await getDoc(accountRef);
    
    if (accountSnap.exists()) {
      const data = accountSnap.data();
      if (data.userId === this.userId) {
        return {
          ...this.decryptSensitiveData(data),
          id: accountSnap.id
        } as BankAccount;
      }
    }
    
    return null;
  }

  async getAllBankAccounts(): Promise<BankAccount[]> {
    if (!db) throw new Error('Firestore not initialized');
    
    const accountsQuery = query(
      collection(db, 'bankAccounts'),
      where('userId', '==', this.userId)
      // Removed orderBy to avoid index requirements - we can sort client-side if needed
    );
    
    const querySnapshot = await getDocs(accountsQuery);
    const accounts: BankAccount[] = [];
    
    querySnapshot.forEach((doc) => {
      accounts.push({
        ...this.decryptSensitiveData(doc.data()),
        id: doc.id
      } as BankAccount);
    });
    
    // Sort client-side by createdAt if the field exists
    accounts.sort((a, b) => {
      const aDate = (a as any).createdAt || new Date(0);
      const bDate = (b as any).createdAt || new Date(0);
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });
    
    return accounts;
  }

  async deleteBankAccount(accountId: string): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');
    
    // First verify the account belongs to the user
    const account = await this.getBankAccount(accountId);
    if (!account) throw new Error('Account not found or unauthorized');
    
    const batch = writeBatch(db);
    
    // Delete the account
    const accountRef = doc(db, 'bankAccounts', accountId);
    batch.delete(accountRef);
    
    // Delete all transactions for this account
    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', this.userId),
      where('accountId', '==', accountId)
    );
    
    const transactionDocs = await getDocs(transactionsQuery);
    transactionDocs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  }

  // Transactions
  async saveTransaction(transaction: Transaction): Promise<string> {
    if (!db) throw new Error('Firestore not initialized');
    
    const transactionData = {
      ...this.encryptSensitiveData(transaction),
      userId: this.userId,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      date: Timestamp.fromDate(new Date(transaction.date))
    };

    if (transaction.id) {
      // Update existing transaction
      const transactionRef = doc(db, 'transactions', transaction.id);
      await updateDoc(transactionRef, transactionData);
      return transaction.id;
    } else {
      // Create new transaction
      const transactionRef = await addDoc(collection(db, 'transactions'), transactionData);
      return transactionRef.id;
    }
  }

  async getTransactionsByAccount(accountId: string, pageSize: number = 50, lastDoc?: any): Promise<{ transactions: Transaction[], lastDoc?: any }> {
    if (!db) throw new Error('Firestore not initialized');
    
    let transactionsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', this.userId),
      where('accountId', '==', accountId),
      orderBy('date', 'desc'),
      limit(pageSize)
    );
    
    if (lastDoc) {
      transactionsQuery = query(transactionsQuery, startAfter(lastDoc));
    }
    
    const querySnapshot = await getDocs(transactionsQuery);
    const transactions: Transaction[] = [];
    let lastDocument = null;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        ...this.decryptSensitiveData(data),
        id: doc.id,
        date: data.date.toDate().toISOString().split('T')[0]
      } as Transaction);
      lastDocument = doc;
    });
    
    return { transactions, lastDoc: lastDocument };
  }

  async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    if (!db) throw new Error('Firestore not initialized');
    
    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', this.userId),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(transactionsQuery);
    const transactions: Transaction[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        ...this.decryptSensitiveData(data),
        id: doc.id,
        date: data.date.toDate().toISOString().split('T')[0]
      } as Transaction);
    });
    
    return transactions;
  }

  // Expenses (Manual entries)
  async saveExpense(expense: Expense): Promise<string> {
    if (!db) throw new Error('Firestore not initialized');
    
    const expenseData = {
      ...this.encryptSensitiveData(expense),
      userId: this.userId,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      date: Timestamp.fromDate(new Date(expense.date))
    };

    if (expense.id) {
      const expenseRef = doc(db, 'expenses', expense.id);
      await updateDoc(expenseRef, expenseData);
      return expense.id;
    } else {
      const expenseRef = await addDoc(collection(db, 'expenses'), expenseData);
      return expenseRef.id;
    }
  }

  async getAllExpenses(): Promise<Expense[]> {
    if (!db) throw new Error('Firestore not initialized');
    
    const expensesQuery = query(
      collection(db, 'expenses'),
      where('userId', '==', this.userId),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(expensesQuery);
    const expenses: Expense[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      expenses.push({
        ...this.decryptSensitiveData(data),
        id: doc.id,
        date: data.date.toDate().toISOString().split('T')[0]
      } as Expense);
    });
    
    return expenses;
  }

  async deleteExpense(expenseId: string): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');
    
    const expenseRef = doc(db, 'expenses', expenseId);
    const expenseSnap = await getDoc(expenseRef);
    
    if (expenseSnap.exists() && expenseSnap.data().userId === this.userId) {
      await deleteDoc(expenseRef);
    } else {
      throw new Error('Expense not found or unauthorized');
    }
  }

  // Subscriptions
  async saveSubscription(subscription: Subscription): Promise<string> {
    if (!db) throw new Error('Firestore not initialized');
    
    const subscriptionData = {
      ...this.encryptSensitiveData(subscription),
      userId: this.userId,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    };

    if (subscription.id) {
      const subscriptionRef = doc(db, 'subscriptions', subscription.id);
      await updateDoc(subscriptionRef, subscriptionData);
      return subscription.id;
    } else {
      const subscriptionRef = await addDoc(collection(db, 'subscriptions'), subscriptionData);
      return subscriptionRef.id;
    }
  }

  async getAllSubscriptions(): Promise<Subscription[]> {
    if (!db) throw new Error('Firestore not initialized');
    
    const subscriptionsQuery = query(
      collection(db, 'subscriptions'),
      where('userId', '==', this.userId)
      // Removed orderBy to avoid index requirements - sorting client-side instead
    );
    
    const querySnapshot = await getDocs(subscriptionsQuery);
    const subscriptions: Subscription[] = [];
    
    querySnapshot.forEach((doc) => {
      subscriptions.push({
        ...this.decryptSensitiveData(doc.data()),
        id: doc.id
      } as Subscription);
    });
    
    // Sort client-side by createdAt if available
    subscriptions.sort((a, b) => {
      const aDate = (a as any).createdAt || new Date(0);
      const bDate = (b as any).createdAt || new Date(0);
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });
    
    return subscriptions;
  }

  async deleteSubscription(subscriptionId: string): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');
    
    const subscriptionRef = doc(db, 'subscriptions', subscriptionId);
    const subscriptionSnap = await getDoc(subscriptionRef);
    
    if (subscriptionSnap.exists() && subscriptionSnap.data().userId === this.userId) {
      await deleteDoc(subscriptionRef);
    } else {
      throw new Error('Subscription not found or unauthorized');
    }
  }

  // Sync Management
  async updateLastSyncTime(syncTime: Date): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');
    
    const syncRef = doc(db, 'userSyncData', this.userId);
    await updateDoc(syncRef, {
      lastSyncTime: Timestamp.fromDate(syncTime),
      updatedAt: serverTimestamp()
    });
  }

  async getLastSyncTime(): Promise<Date | null> {
    if (!db) throw new Error('Firestore not initialized');
    
    const syncRef = doc(db, 'userSyncData', this.userId);
    const syncSnap = await getDoc(syncRef);
    
    if (syncSnap.exists()) {
      const data = syncSnap.data();
      return data.lastSyncTime?.toDate() || null;
    }
    
    return null;
  }

  // Bulk operations for sync
  async bulkSaveTransactions(transactions: Transaction[]): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');
    
    const batch = writeBatch(db);
    
    transactions.forEach((transaction) => {
      const transactionData = {
        ...this.encryptSensitiveData(transaction),
        userId: this.userId,
        updatedAt: serverTimestamp(),
        date: Timestamp.fromDate(new Date(transaction.date))
      };
      
      if (transaction.id) {
        const transactionRef = doc(db!, 'transactions', transaction.id);
        batch.update(transactionRef, transactionData);
      } else {
        const transactionRef = doc(collection(db!, 'transactions'));
        batch.set(transactionRef, transactionData);
      }
    });
    
    await batch.commit();
  }

  // Analytics and insights
  async getSpendingByCategory(startDate: Date, endDate: Date): Promise<{ category: string, amount: number }[]> {
    if (!db) throw new Error('Firestore not initialized');
    
    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', this.userId),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      where('amount', '<', 0) // Only expenses (negative amounts)
    );
    
    const querySnapshot = await getDocs(transactionsQuery);
    const categoryTotals: { [key: string]: number } = {};
    
    querySnapshot.forEach((doc) => {
      const data = this.decryptSensitiveData(doc.data());
      const category = data.category || 'Uncategorized';
      const amount = Math.abs(data.amount || 0);
      
      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
    });
    
    return Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount
    }));
  }
}

// Singleton pattern for Firestore service
let firestoreServiceInstance: FirestoreService | null = null;

export function initFirestoreService(userId: string, encryptionKey: string): FirestoreService {
  firestoreServiceInstance = new FirestoreService(userId, encryptionKey);
  return firestoreServiceInstance;
}

export function getFirestoreService(): FirestoreService {
  if (!firestoreServiceInstance) {
    throw new Error('Firestore service not initialized. Call initFirestoreService first.');
  }
  return firestoreServiceInstance;
}

export function clearFirestoreService(): void {
  firestoreServiceInstance = null;
}