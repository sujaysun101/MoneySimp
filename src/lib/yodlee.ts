import axios, { AxiosInstance } from 'axios';
import { BankAccount, Transaction } from './types';

export interface YodleeConfig {
  baseURL: string;
  clientId: string;
  secret: string;
  environment: 'sandbox' | 'development' | 'production';
}

export interface YodleeTransaction {
  id: number;
  amount: {
    amount: number;
    currency: string;
  };
  baseType: string;
  categoryType: string;
  categoryId: number;
  category: string;
  subcategory: string;
  description: {
    original: string;
    simple: string;
  };
  date: string;
  status: string;
  accountId: number;
  merchant?: {
    id: string;
    name: string;
    category: string[];
  };
  isRecurring?: boolean;
}

export interface YodleeAccount {
  id: number;
  accountName: string;
  accountNumber: string;
  accountType: string;
  balance: {
    amount: number;
    currency: string;
  };
  availableBalance?: {
    amount: number;
    currency: string;
  };
  providerId: number;
  providerName: string;
  isAsset: boolean;
  isManual: boolean;
  refreshInfo: {
    status: string;
    lastRefreshed: string;
    nextRefreshScheduled?: string;
  };
}

export interface YodleeProvider {
  id: number;
  name: string;
  loginUrl: string;
  baseUrl: string;
  favicon: string;
  logo: string;
  status: string;
  primaryLanguageISOCode: string;
  countryISOCode: string;
  capability: {
    container: string[];
    dataset: {
      name: string;
      attribute: string[];
    }[];
  }[];
}

export const YODLEE_CONFIG: YodleeConfig = {
  baseURL: process.env.NEXT_PUBLIC_YODLEE_ENV === 'production' 
    ? 'https://api.yodlee.com/ysl' 
    : 'https://sandbox.api.yodlee.com/ysl',
  clientId: process.env.NEXT_PUBLIC_YODLEE_CLIENT_ID || '',
  secret: process.env.YODLEE_SECRET || '',
  environment: (process.env.NEXT_PUBLIC_YODLEE_ENV as 'sandbox' | 'development' | 'production') || 'sandbox'
};

class YodleeService {
  private static instance: YodleeService;
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  private constructor() {
    this.client = axios.create({
      baseURL: YODLEE_CONFIG.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Api-Version': '1.1'
      }
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use(async (config) => {
      await this.ensureValidToken();
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });
  }

  static getInstance(): YodleeService {
    if (!YodleeService.instance) {
      YodleeService.instance = new YodleeService();
    }
    return YodleeService.instance;
  }

  private async ensureValidToken(): Promise<void> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return; // Token is still valid
    }

    await this.authenticate();
  }

  private async authenticate(): Promise<void> {
    try {
      const response = await axios.post(
        `${YODLEE_CONFIG.baseURL}/auth/token`,
        {
          clientId: YODLEE_CONFIG.clientId,
          secret: YODLEE_CONFIG.secret
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Api-Version': '1.1'
          }
        }
      );

      const { token } = response.data;
      this.accessToken = token.accessToken;
      
      // Set expiry time (typically 30 minutes)
      this.tokenExpiry = new Date();
      this.tokenExpiry.setMinutes(this.tokenExpiry.getMinutes() + 25); // 5 min buffer
      
    } catch (error) {
      console.error('Yodlee authentication failed:', error);
      throw new Error('Failed to authenticate with Yodlee');
    }
  }

  // Get all supported financial institutions
  async getProviders(name?: string): Promise<YodleeProvider[]> {
    try {
      const params: any = {
        'container': 'bank,creditCard'
      };
      
      if (name) {
        params.name = name;
      }

      const response = await this.client.get('/providers', { params });
      return response.data.provider || [];
    } catch (error) {
      console.error('Error fetching providers:', error);
      throw new Error('Failed to fetch financial institutions');
    }
  }

  // Generate FastLink URL for user authentication
  async generateFastLinkUrl(userId: string, callbackUrl?: string): Promise<string> {
    try {
      const response = await this.client.post('/auth/token', {
        clientId: YODLEE_CONFIG.clientId,
        secret: YODLEE_CONFIG.secret
      });

      const userToken = response.data.token.accessToken;
      
      // FastLink configuration
      const fastLinkConfig = {
        app: 'MoneySimp',
        locale: 'en_US',
        flow: 'add',
        callback: callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/api/yodlee/callback`,
        userExperienceFlow: 'Aggregation',
        configName: 'Aggregation'
      };

      const fastLinkParams = new URLSearchParams(fastLinkConfig);
      const fastLinkUrl = `${YODLEE_CONFIG.baseURL}/authenticate/restserver/fastlink?${fastLinkParams.toString()}&accessToken=${userToken}`;
      
      return fastLinkUrl;
    } catch (error) {
      console.error('Error generating FastLink URL:', error);
      throw new Error('Failed to generate FastLink URL');
    }
  }

  // Get user's bank accounts
  async getAccounts(userToken?: string): Promise<BankAccount[]> {
    try {
      const response = await this.client.get('/accounts', {
        params: {
          container: 'bank,creditCard'
        }
      });

      const yodleeAccounts: YodleeAccount[] = response.data.account || [];
      
      return yodleeAccounts.map(account => ({
        id: account.id.toString(),
        institutionId: account.providerId.toString(),
        institutionName: account.providerName,
        accountId: account.id.toString(),
        name: account.accountName,
        officialName: account.accountName,
        type: this.mapAccountType(account.accountType),
        subtype: account.accountType.toLowerCase(),
        balance: {
          current: account.balance.amount,
          available: account.availableBalance?.amount,
        },
        mask: account.accountNumber.slice(-4),
        isActive: account.refreshInfo.status === 'SUCCESS',
        lastSynced: new Date(account.refreshInfo.lastRefreshed),
        currency: account.balance.currency,
        provider: "yodlee"
      }));
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw new Error('Failed to fetch accounts');
    }
  }

  // Get transactions for accounts
  async getTransactions(
    accountIds?: string[],
    fromDate?: Date,
    toDate?: Date
  ): Promise<Transaction[]> {
    try {
      const params: any = {
        container: 'bank,creditCard'
      };

      if (accountIds && accountIds.length > 0) {
        params.accountId = accountIds.join(',');
      }

      if (fromDate) {
        params.fromDate = fromDate.toISOString().split('T')[0];
      }

      if (toDate) {
        params.toDate = toDate.toISOString().split('T')[0];
      }

      const response = await this.client.get('/transactions', { params });
      const yodleeTransactions: YodleeTransaction[] = response.data.transaction || [];

      return yodleeTransactions.map(transaction => ({
        id: transaction.id.toString(),
        accountId: transaction.accountId.toString(),
        amount: Math.abs(transaction.amount.amount),
        date: new Date(transaction.date),
        description: transaction.description.simple || transaction.description.original,
        merchantName: transaction.merchant?.name,
        category: [this.mapCategory(transaction.category, transaction.subcategory)],
        categoryId: YodleeService.mapCategoryId(transaction.category, transaction.subcategory),
        isRecurring: transaction.isRecurring || false,
        pending: transaction.status === 'PENDING'
      }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw new Error('Failed to fetch transactions');
    }
  }

  // Get recurring transactions for subscription detection
  async getRecurringTransactions(accountIds?: string[]): Promise<Transaction[]> {
    try {
      const params: any = {
        container: 'bank,creditCard',
        categoryType: 'RECURRING'
      };

      if (accountIds && accountIds.length > 0) {
        params.accountId = accountIds.join(',');
      }

      const response = await this.client.get('/transactions', { params });
      const yodleeTransactions: YodleeTransaction[] = response.data.transaction || [];

      return yodleeTransactions
        .filter(t => t.isRecurring || t.categoryType === 'RECURRING')
        .map(transaction => ({
          id: transaction.id.toString(),
          accountId: transaction.accountId.toString(),
          amount: Math.abs(transaction.amount.amount),
          date: new Date(transaction.date),
          description: transaction.description.simple || transaction.description.original,
          merchantName: transaction.merchant?.name,
          category: [this.mapCategory(transaction.category, transaction.subcategory)],
          categoryId: YodleeService.mapCategoryId(transaction.category, transaction.subcategory),
          isRecurring: true,
          pending: false
        }));
    } catch (error) {
      console.error('Error fetching recurring transactions:', error);
      return [];
    }
  }

  // Refresh account data
  async refreshAccounts(accountIds?: string[]): Promise<void> {
    try {
      const body: any = {};
      
      if (accountIds && accountIds.length > 0) {
        body.accountId = accountIds.join(',');
      }

      await this.client.put('/accounts', body);
    } catch (error) {
      console.error('Error refreshing accounts:', error);
      throw new Error('Failed to refresh account data');
    }
  }

  // Helper method to map Yodlee account types to our types
  private mapAccountType(yodleeType: string): 'checking' | 'savings' | 'credit' | 'investment' | 'loan' | 'other' {
    const typeMap: { [key: string]: 'checking' | 'savings' | 'credit' | 'investment' | 'loan' | 'other' } = {
      'CHECKING': 'checking',
      'SAVINGS': 'savings',
      'MONEY_MARKET': 'savings',
      'CD': 'savings',
      'CREDIT_CARD': 'credit',
      'CHARGE_CARD': 'credit',
      'INVESTMENT': 'investment',
      'BROKERAGE': 'investment',
      'IRA': 'investment',
      'LOAN': 'loan',
      'MORTGAGE': 'loan',
      'LINE_OF_CREDIT': 'loan',
      'AUTO_LOAN': 'loan'
    };
    
    return typeMap[yodleeType.toUpperCase()] || 'other';
  }

  // Helper method to map Yodlee categories to our categories
  private mapCategory(category: string, subcategory?: string): string {
    const fullCategory = subcategory ? `${category} > ${subcategory}` : category;
    
    const categoryMap: { [key: string]: string } = {
      'Food': 'Dining',
      'Groceries': 'Groceries',
      'Transportation': 'Transportation',
      'Gas': 'Transportation',
      'Entertainment': 'Entertainment',
      'Healthcare': 'Healthcare',
      'Shopping': 'Shopping',
      'Travel': 'Travel',
      'Utilities': 'Utilities',
      'Home': 'Housing',
      'Education': 'Education',
      'Business': 'Business',
      'Charitable Giving': 'Gifts & Donations'
    };

    // Check for exact match first
    if (categoryMap[category]) {
      return categoryMap[category];
    }

    // Check subcategory
    if (subcategory && categoryMap[subcategory]) {
      return categoryMap[subcategory];
    }

    // Fallback to original category
    return category || 'Other';
  }

  // Helper method to map categories to our category IDs
  static mapCategoryId(category: string, subcategory?: string): string {
    const categoryString = `${category} ${subcategory || ''}`.toLowerCase();
    
    if (categoryString.includes('food') || categoryString.includes('restaurant') || categoryString.includes('dining')) {
      return 'dining';
    }
    if (categoryString.includes('grocery') || categoryString.includes('supermarket')) {
      return 'groceries';
    }
    if (categoryString.includes('gas') || categoryString.includes('transport') || categoryString.includes('automotive')) {
      return 'transportation';
    }
    if (categoryString.includes('entertainment') || categoryString.includes('movie') || categoryString.includes('music')) {
      return 'entertainment';
    }
    if (categoryString.includes('health') || categoryString.includes('medical') || categoryString.includes('pharmacy')) {
      return 'healthcare';
    }
    if (categoryString.includes('clothing') || categoryString.includes('shopping') || categoryString.includes('retail')) {
      return 'clothing';
    }
    if (categoryString.includes('travel') || categoryString.includes('hotel') || categoryString.includes('airline')) {
      return 'travel';
    }
    if (categoryString.includes('utilities') || categoryString.includes('electric') || categoryString.includes('water')) {
      return 'utilities';
    }
    if (categoryString.includes('rent') || categoryString.includes('mortgage') || categoryString.includes('home')) {
      return 'rent';
    }
    if (categoryString.includes('education') || categoryString.includes('school') || categoryString.includes('tuition')) {
      return 'education';
    }
    if (categoryString.includes('business') || categoryString.includes('office')) {
      return 'business';
    }
    if (categoryString.includes('gift') || categoryString.includes('charity') || categoryString.includes('donation')) {
      return 'gifts';
    }

    return 'other';
  }
}

// Subscription detector using Yodlee data
export class YodleeSubscriptionDetector {
  private yodleeService: YodleeService;

  constructor() {
    this.yodleeService = YodleeService.getInstance();
  }

  async detectSubscriptions(accountIds?: string[]): Promise<any[]> {
    try {
      // Get recurring transactions from Yodlee
      const recurringTransactions = await this.yodleeService.getRecurringTransactions(accountIds);
      
      // Get regular transactions for pattern analysis
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 6); // Look back 6 months
      
      const allTransactions = await this.yodleeService.getTransactions(accountIds, startDate, endDate);
      
      const detectedSubscriptions: any[] = [];
      
      // Process Yodlee-identified recurring transactions
      const recurringGroups = new Map<string, Transaction[]>();
      
      recurringTransactions.forEach(transaction => {
        const key = `${transaction.merchantName || transaction.description}-${transaction.amount}`;
        if (!recurringGroups.has(key)) {
          recurringGroups.set(key, []);
        }
        recurringGroups.get(key)!.push(transaction);
      });
      
      // Analyze patterns in regular transactions for additional subscriptions
      const transactionGroups = new Map<string, Transaction[]>();
      
      allTransactions.forEach(transaction => {
        // Check if this is likely an expense (positive amount from bank's perspective means money out)
        const normalizedName = (transaction.merchantName || transaction.description)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '');
        const amountKey = Math.round(transaction.amount * 100); // Avoid floating point issues
        const key = `${normalizedName}-${amountKey}`;
        
        if (!transactionGroups.has(key)) {
          transactionGroups.set(key, []);
        }
        transactionGroups.get(key)!.push(transaction);
      });
      
      // Process both recurring and pattern-detected groups
      const allGroups = new Map([...recurringGroups, ...transactionGroups]);
      
      allGroups.forEach((groupTransactions, key) => {
        if (groupTransactions.length >= 2) {
          groupTransactions.sort((a, b) => a.date.getTime() - b.date.getTime());
          
          const intervals = [];
          for (let i = 1; i < groupTransactions.length; i++) {
            const interval = Math.round((groupTransactions[i].date.getTime() - groupTransactions[i-1].date.getTime()) / (1000 * 60 * 60 * 24));
            intervals.push(interval);
          }
          
          const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
          const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
          const consistency = Math.max(0, 1 - (Math.sqrt(variance) / avgInterval));
          
          if (consistency > 0.7 || groupTransactions.some(t => t.isRecurring)) {
            let frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
            
            if (avgInterval <= 7) frequency = 'daily';
            else if (avgInterval <= 14) frequency = 'weekly';
            else if (avgInterval <= 40) frequency = 'monthly';
            else frequency = 'yearly';
            
            const latest = groupTransactions[groupTransactions.length - 1];
            const nextDate = new Date(latest.date);
            nextDate.setDate(nextDate.getDate() + Math.round(avgInterval));
            
            detectedSubscriptions.push({
              id: `yodlee-${Date.now()}-${Math.random()}`,
              name: latest.merchantName || latest.description,
              amount: latest.amount,
              frequency,
              nextBillingDate: nextDate,
              category: latest.category,
              categoryId: YodleeService.mapCategoryId(latest.category[0] || 'other'),
              isActive: true,
              source: 'yodlee',
              confidence: consistency,
              transactionCount: groupTransactions.length,
              accountId: latest.accountId,
              lastTransaction: latest,
              detectedAt: new Date(),
              isRecurring: groupTransactions.some(t => t.isRecurring)
            });
          }
        }
      });
      
      return detectedSubscriptions.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error('Error detecting subscriptions:', error);
      return [];
    }
  }
}

export default YodleeService;
