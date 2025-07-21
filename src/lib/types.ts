import type { LucideIcon } from 'lucide-react';

export interface Category {
  id: string;
  name: string;
  icon: LucideIcon;
  color?: string; // For charts and tags
}

export interface Expense {
  id: string;
  amount: number;
  categoryId: string;
  date: Date;
  description: string;
  billUrl?: string; 
}

export interface Budget {
  id: string;
  categoryId: string;
  name: string; // Category name for display
  icon: LucideIcon; // Category icon for display
  amount: number;
  spentAmount: number; 
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline?: Date;
  createdAt: Date;
  notes?: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'yearly' | 'weekly' | 'daily';
  nextPaymentDate: Date;
  categoryId: string;
  isActive: boolean;
  detectedFromBank: boolean;
  reminderEnabled: boolean;
  reminderDays: number; // Days before due date to remind
  lastPaymentDate?: Date;
  notes?: string;
  provider?: string; // e.g., Netflix, Spotify, etc.
  cancellationUrl?: string; // URL to cancel subscription
}

export interface BankAccount {
  id: string;
  institutionId: string;
  institutionName: string;
  accountId: string; // Plaid account_id or Yodlee account id
  name: string;
  officialName?: string;
  type: 'checking' | 'savings' | 'credit' | 'loan' | 'investment' | 'other';
  subtype?: string;
  balance: {
    available?: number;
    current: number;
    limit?: number;
  };
  mask: string; // Last 4 digits
  isActive: boolean;
  lastSynced: Date;
  currency: string;
  provider: 'plaid' | 'yodlee'; // Bank integration provider
  providerAccountId?: string; // Provider-specific account identifier
  accessToken?: string; // For Plaid or similar providers
}

export interface Transaction {
  id: string;
  accountId: string;
  plaidTransactionId?: string;
  amount: number;
  date: Date;
  description: string;
  merchantName?: string;
  categoryId: string;
  category: string[];
  isRecurring?: boolean;
  confidence?: number; // For recurring detection
  pending: boolean;
  location?: {
    address?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
    lat?: number;
    lon?: number;
  };
  paymentMeta?: {
    referenceNumber?: string;
    ppdId?: string;
    payee?: string;
    byOrderOf?: string;
    payer?: string;
    paymentMethod?: string;
    paymentProcessor?: string;
    reason?: string;
  };
}

export interface PlaidLinkSuccess {
  publicToken: string;
  metadata: {
    institution: {
      name: string;
      institution_id: string;
    };
    accounts: Array<{
      id: string;
      name: string;
      mask: string;
      type: string;
      subtype: string;
    }>;
  };
}

export interface EncryptedData {
  data: string; // encrypted data
  iv: string; // initialization vector
  timestamp: number;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingChanges: number;
  syncInProgress: boolean;
}
