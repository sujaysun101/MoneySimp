// src/lib/plaid.ts
import { Configuration, PlaidApi, PlaidEnvironments, CountryCode, Products } from 'plaid';
import type { BankAccount, Transaction, PlaidLinkSuccess } from './types';
import { CATEGORIES } from './constants';

// Validate required environment variables
if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
  console.error('Missing Plaid credentials in environment variables');
  console.error('Required: PLAID_CLIENT_ID, PLAID_SECRET');
}

// Plaid configuration
const configuration = new Configuration({
  basePath: process.env.PLAID_ENV === 'production' 
    ? PlaidEnvironments.production 
    : process.env.PLAID_ENV === 'development'
    ? PlaidEnvironments.development
    : PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
      'PLAID-SECRET': process.env.PLAID_SECRET!,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

export const PLAID_CONFIG = {
  clientId: process.env.PLAID_CLIENT_ID,
  env: process.env.PLAID_ENV || 'sandbox',
  products: (process.env.PLAID_PRODUCTS || 'transactions,accounts').split(','),
  countryCodes: (process.env.PLAID_COUNTRY_CODES || 'US').split(','),
} as const;

export class PlaidService {
  // Create a link token for Plaid Link
  static async createLinkToken(userId: string): Promise<string> {
    try {
      const request = {
        user: {
          client_user_id: userId,
        },
        client_name: 'MoneySimp',
        products: [Products.Transactions],
        country_codes: [CountryCode.Us],
        language: 'en',
        webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/plaid/webhook`,
      };

      const response = await plaidClient.linkTokenCreate(request);
      return response.data.link_token;
    } catch (error) {
      console.error('Error creating link token:', error);
      throw new Error('Failed to create Plaid link token');
    }
  }

  // Exchange public token for access token
  static async exchangePublicToken(publicToken: string): Promise<string> {
    try {
      const response = await plaidClient.itemPublicTokenExchange({
        public_token: publicToken,
      });
      return response.data.access_token;
    } catch (error) {
      console.error('Error exchanging public token:', error);
      throw new Error('Failed to exchange public token');
    }
  }

  // Get accounts information
  static async getAccounts(accessToken: string): Promise<BankAccount[]> {
    try {
      const response = await plaidClient.accountsGet({
        access_token: accessToken,
      });

      const institutionResponse = await plaidClient.institutionsGetById({
        institution_id: response.data.item.institution_id!,
        country_codes: [CountryCode.Us],
      });

      return response.data.accounts.map(account => ({
        id: account.account_id,
        institutionId: response.data.item.institution_id!,
        institutionName: institutionResponse.data.institution.name,
        accountId: account.account_id,
        name: account.name,
        officialName: account.official_name || undefined,
        type: this.mapAccountType(account.type),
        subtype: account.subtype || undefined,
        balance: {
          available: account.balances.available || undefined,
          current: account.balances.current || 0,
          limit: account.balances.limit || undefined,
        },
        mask: account.mask || '****',
        isActive: true,
        lastSynced: new Date(),
        currency: account.balances.iso_currency_code || 'USD',
        provider: 'plaid',
      }));
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw new Error('Failed to fetch accounts');
    }
  }

  // Get transactions
  static async getTransactions(
    accessToken: string, 
    startDate: Date, 
    endDate: Date,
    accountIds?: string[]
  ): Promise<Transaction[]> {
    try {
      const request: any = {
        access_token: accessToken,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        count: 500,
      };

      if (accountIds) {
        request.account_ids = accountIds;
      }

      const response = await plaidClient.transactionsGet(request);
      
      return response.data.transactions.map(transaction => ({
        id: transaction.transaction_id,
        accountId: transaction.account_id,
        plaidTransactionId: transaction.transaction_id,
        amount: Math.abs(transaction.amount), // Plaid uses negative for outflows
        date: new Date(transaction.date),
        description: transaction.name,
        merchantName: transaction.merchant_name || undefined,
        categoryId: this.mapCategoryId(transaction.category || []),
        category: transaction.category || [],
        pending: transaction.pending,
        location: transaction.location ? {
          address: transaction.location.address || undefined,
          city: transaction.location.city || undefined,
          region: transaction.location.region || undefined,
          postalCode: transaction.location.postal_code || undefined,
          country: transaction.location.country || undefined,
          lat: transaction.location.lat || undefined,
          lon: transaction.location.lon || undefined,
        } : undefined,
        paymentMeta: transaction.payment_meta ? {
          referenceNumber: transaction.payment_meta.reference_number || undefined,
          ppdId: transaction.payment_meta.ppd_id || undefined,
          payee: transaction.payment_meta.payee || undefined,
          byOrderOf: transaction.payment_meta.by_order_of || undefined,
          payer: transaction.payment_meta.payer || undefined,
          paymentMethod: transaction.payment_meta.payment_method || undefined,
          paymentProcessor: transaction.payment_meta.payment_processor || undefined,
          reason: transaction.payment_meta.reason || undefined,
        } : undefined,
      }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw new Error('Failed to fetch transactions');
    }
  }

  // Get recurring transactions for subscription detection
  static async getRecurringTransactions(accessToken: string): Promise<any[]> {
    try {
      const response = await plaidClient.transactionsRecurringGet({
        access_token: accessToken,
      });

      // Plaid API returns recurring transactions in a different structure
      return (response.data as any).outflow || [];
    } catch (error) {
      console.error('Error fetching recurring transactions:', error);
      // Return empty array if recurring transactions API is not available
      return [];
    }
  }

  // Remove/unlink an item
  static async removeItem(accessToken: string): Promise<void> {
    try {
      await plaidClient.itemRemove({
        access_token: accessToken,
      });
    } catch (error) {
      console.error('Error removing item:', error);
      throw new Error('Failed to remove bank connection');
    }
  }

  // Helper method to map Plaid account types to our types
  private static mapAccountType(plaidType: string): BankAccount['type'] {
    const typeMap: { [key: string]: BankAccount['type'] } = {
      'depository': 'checking',
      'credit': 'credit',
      'loan': 'loan',
      'investment': 'investment',
    };
    return typeMap[plaidType] || 'other';
  }

  // Helper method to map Plaid categories to our category IDs
  static mapCategoryId(plaidCategories: string[]): string {
    if (!plaidCategories || plaidCategories.length === 0) {
      return 'other';
    }

    const categoryMapping: { [key: string]: string } = {
      'Food and Drink': 'dining',
      'Grocery': 'groceries',
      'Transportation': 'transportation',
      'Gas Stations': 'transportation',
      'Entertainment': 'entertainment',
      'Healthcare': 'healthcare',
      'Shopping': 'clothing',
      'Travel': 'travel',
      'Utilities': 'utilities',
      'Rent': 'rent',
      'Mortgage': 'rent',
      'Education': 'education',
      'Business Services': 'business',
      'Charitable Giving': 'gifts',
    };

    // Check each category level
    for (const category of plaidCategories) {
      if (categoryMapping[category]) {
        return categoryMapping[category];
      }
    }

    // Check if it contains keywords
    const categoryString = plaidCategories.join(' ').toLowerCase();
    
    if (categoryString.includes('food') || categoryString.includes('restaurant')) {
      return 'dining';
    }
    if (categoryString.includes('grocery') || categoryString.includes('supermarket')) {
      return 'groceries';
    }
    if (categoryString.includes('gas') || categoryString.includes('transport')) {
      return 'transportation';
    }
    if (categoryString.includes('entertainment') || categoryString.includes('movie')) {
      return 'entertainment';
    }
    if (categoryString.includes('health') || categoryString.includes('medical')) {
      return 'healthcare';
    }
    if (categoryString.includes('clothing') || categoryString.includes('apparel')) {
      return 'clothing';
    }
    if (categoryString.includes('travel') || categoryString.includes('hotel')) {
      return 'travel';
    }
    if (categoryString.includes('utility') || categoryString.includes('electric')) {
      return 'utilities';
    }
    if (categoryString.includes('rent') || categoryString.includes('mortgage')) {
      return 'rent';
    }

    return 'other';
  }
}

// Enhanced subscription detection using Plaid's recurring transactions
export class SubscriptionDetector {
  static async detectSubscriptions(accessToken: string): Promise<any[]> {
    try {
      // Get recurring transactions from Plaid
      const recurringTransactions = await PlaidService.getRecurringTransactions(accessToken);
      
      // Get regular transactions for the last 6 months for additional analysis
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const transactions = await PlaidService.getTransactions(accessToken, sixMonthsAgo, new Date());
      
      const detectedSubscriptions = [];
      
      // Process Plaid's recurring transactions
      for (const recurring of recurringTransactions) {
        if (recurring.is_active && recurring.frequency === 'MONTHLY') {
          detectedSubscriptions.push({
            name: recurring.description,
            amount: Math.abs(recurring.average_amount),
            frequency: 'monthly',
            categoryId: PlaidService.mapCategoryId(recurring.category || []),
            confidence: 0.9, // High confidence from Plaid
            source: 'plaid_recurring',
            accountId: recurring.account_id,
            lastAmount: Math.abs(recurring.last_amount),
            lastDate: new Date(recurring.last_date),
          });
        }
      }
      
      // Additional pattern-based detection for transactions not caught by Plaid
      const additionalDetections = this.detectPatternsInTransactions(transactions);
      detectedSubscriptions.push(...additionalDetections);
      
      return detectedSubscriptions.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error('Error detecting subscriptions:', error);
      // Fall back to pattern-based detection only
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const transactions = await PlaidService.getTransactions(accessToken, sixMonthsAgo, new Date());
      return this.detectPatternsInTransactions(transactions);
    }
  }

  private static detectPatternsInTransactions(transactions: Transaction[]): any[] {
    // Group transactions by similar merchant names and amounts
    const groups = new Map<string, Transaction[]>();
    
    transactions.forEach(transaction => {
      // Normalize merchant name for grouping
      const normalizedName = this.normalizeMerchantName(transaction.merchantName || transaction.description);
      const amountKey = Math.round(transaction.amount * 100); // Round to nearest cent
      const key = `${normalizedName}-${amountKey}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(transaction);
    });
    
    const detectedSubscriptions: any[] = [];
    
    groups.forEach((groupTransactions, key) => {
      if (groupTransactions.length >= 2) { // At least 2 transactions
        groupTransactions.sort((a, b) => a.date.getTime() - b.date.getTime());
        
        const intervals = [];
        for (let i = 1; i < groupTransactions.length; i++) {
          const interval = Math.round((groupTransactions[i].date.getTime() - groupTransactions[i-1].date.getTime()) / (1000 * 60 * 60 * 24));
          intervals.push(interval);
        }
        
        const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
        const consistency = Math.max(0, 1 - (Math.sqrt(variance) / avgInterval));
        
        if (consistency > 0.7) { // 70% consistency threshold
          let frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
          if (avgInterval <= 2) frequency = 'daily';
          else if (avgInterval <= 10) frequency = 'weekly';
          else if (avgInterval <= 45) frequency = 'monthly';
          else frequency = 'yearly';
          
          detectedSubscriptions.push({
            name: groupTransactions[0].merchantName || groupTransactions[0].description,
            amount: groupTransactions[0].amount,
            frequency,
            categoryId: groupTransactions[0].categoryId,
            confidence: consistency * 0.8, // Slightly lower confidence than Plaid
            source: 'pattern_detection',
            accountId: groupTransactions[0].accountId,
            occurrences: groupTransactions.length,
            lastDate: groupTransactions[groupTransactions.length - 1].date,
          });
        }
      }
    });
    
    return detectedSubscriptions;
  }
  
  private static normalizeMerchantName(name: string): string {
    return name
      .toLowerCase()
      .replace(/\d+/g, '') // Remove numbers
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
}
