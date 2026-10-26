import type { LucideIcon } from 'lucide-react';

// Currency Types
export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  decimals: number;
  countries: string[];
}

export interface ExchangeRate {
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  timestamp: string;
  source: 'api' | 'manual' | 'cached';
}

export interface CurrencyConversion {
  fromAmount: number;
  fromCurrency: string;
  toAmount: number;
  toCurrency: string;
  rate: number;
  timestamp: string;
}

export interface UserCurrencySettings {
  primaryCurrency: string;
  displayCurrencies: string[];
  autoDetectLocation: boolean;
  autoConvert: boolean;
  rateUpdateFrequency: 'realtime' | 'hourly' | 'daily' | 'manual';
  fallbackCurrency: string;
  roundingMode: 'round' | 'floor' | 'ceil';
  decimalPlaces: number;
}

// Community Forum Types
export interface ForumUser {
  id: string;
  displayName: string;
  avatar?: string;
  reputation: number;
  badge?: 'Saver' | 'Contributor' | 'Expert' | 'Guru' | 'Legend';
  joinedDate: string;
  totalPosts: number;
  totalUpvotes: number;
  totalDownvotes: number;
  bio?: string;
  location?: string;
  savingsGoal?: number;
  achievements: string[];
}

export interface DealInfo {
  originalPrice: string;
  discountedPrice: string;
  discountPercentage: number;
  expiryDate?: string;
  dealUrl?: string;
  couponCode?: string;
}

export interface ForumPost {
  id: string;
  authorId: string;
  author: ForumUser;
  title: string;
  content: string;
  category: ForumCategory;
  tags: string[];
  upvotes: number;
  downvotes: number;
  netScore: number;
  commentCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  isPinned: boolean;
  isFeatured: boolean;
  attachments?: ForumAttachment[];
  dealInfo?: DealInfo;
  relatedExpenseAmount?: number;
  relatedExpenseCurrency?: string;
  dealExpiryDate?: string;
  dealUrl?: string;
  isVerified: boolean;
}

export interface ForumComment {
  id: string;
  postId: string;
  authorId: string;
  author: ForumUser;
  content: string;
  upvotes: number;
  downvotes: number;
  netScore: number;
  parentCommentId?: string;
  replies: ForumComment[];
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  isDeleted: boolean;
}

export interface ForumVote {
  id: string;
  userId: string;
  targetId: string; // postId or commentId
  targetType: 'post' | 'comment';
  voteType: 'upvote' | 'downvote';
  createdAt: string;
}

export interface ForumAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: 'image' | 'pdf' | 'link';
  fileSize?: number;
  thumbnail?: string;
}

export interface ForumNotification {
  id: string;
  userId: string;
  type: 'upvote' | 'comment' | 'reply' | 'mention' | 'feature' | 'achievement' | 'monthly_summary';
  title: string;
  message: string;
  relatedPostId?: string;
  relatedCommentId?: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface MonthlySummary {
  id: string;
  userId: string;
  month: string;
  year: number;
  totalPosts: number;
  totalComments: number;
  totalUpvotesReceived: number;
  totalUpvotesGiven: number;
  reputationGained: number;
  topPost?: ForumPost;
  newAchievements: string[];
  communityRank: number;
  totalCommunityMembers: number;
  savingsTipsShared: number;
  dealsShared: number;
  createdAt: string;
}

export type ForumCategory = 
  | 'saving_tips'
  | 'deals'
  | 'budgeting_strategies'
  | 'investment_advice'
  | 'debt_management'
  | 'financial_goals'
  | 'money_hacks'
  | 'reviews'
  | 'success_stories'
  | 'questions'
  | 'general';

export interface ForumSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  monthlyEmailSummary: boolean;
  notificationTypes: {
    upvotes: boolean;
    comments: boolean;
    replies: boolean;
    mentions: boolean;
    achievements: boolean;
    featuredPosts: boolean;
  };
  privacy: {
    showRealName: boolean;
    showLocation: boolean;
    showSavingsGoal: boolean;
    allowDirectMessages: boolean;
  };
}

export interface Category {
  id: string;
  name: string;
  icon: LucideIcon;
  color?: string; // For charts and tags
}

export interface Expense {
  id: string;
  amount: number;
  currency?: string; // Currency code (e.g., 'USD', 'EUR', 'GBP')
  categoryId: string;
  date: Date;
  description: string;
  billUrl?: string;
  taxDeductible?: boolean;
  taxCategory?: string; // e.g., 'business', 'medical', 'charitable', 'education'
  receiptNumber?: string;
  vendor?: string;
  notes?: string;
  originalAmount?: number; // Original amount before currency conversion
  originalCurrency?: string; // Original currency if converted
  exchangeRate?: number; // Exchange rate used for conversion
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
  accountId: string; // Yodlee account id
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
  provider: 'yodlee' | 'manual' | 'demo'; // Bank integration provider
  providerAccountId?: string; // Provider-specific account identifier
  accessToken?: string; // For Yodlee or similar providers
}

export interface Transaction {
  id: string;
  accountId: string;
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

// Tax-related types
export interface TaxCategory {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  deductionLimit?: number; // Annual limit if any
  requiresReceipt: boolean;
  irs_form?: string; // e.g., 'Schedule A', 'Schedule C'
}

export interface TaxReport {
  id: string;
  taxYear: number;
  generatedDate: Date;
  totalDeductions: number;
  deductionsByCategory: TaxDeductionSummary[];
  expenses: Expense[];
  reportType: 'annual' | 'quarterly' | 'monthly';
  periodStart: Date;
  periodEnd: Date;
}

export interface TaxDeductionSummary {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
  expenseCount: number;
  averageAmount: number;
  percentageOfTotal: number;
}

export interface TaxExportOptions {
  format: 'csv' | 'excel' | 'quickbooks' | 'pdf';
  includeReceipts: boolean;
  groupByCategory: boolean;
  includeNonDeductible: boolean;
  dateRange: {
    start: Date;
    end: Date;
  };
}

export interface QuickBooksIntegration {
  companyId: string;
  accessToken: string;
  refreshToken: string;
  realmId: string;
  lastSync: Date | null;
  enabled: boolean;
}

// Cash Flow types
export interface IncomeSource {
  id: string;
  name: string;
  amount: number;
  currency?: string; // Currency code
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | 'one-time';
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  category: 'salary' | 'freelance' | 'investment' | 'business' | 'other';
  isRecurring: boolean;
  nextPaymentDate?: Date;
  originalAmount?: number; // Original amount before currency conversion
  originalCurrency?: string; // Original currency if converted
  exchangeRate?: number; // Exchange rate used for conversion
}

export interface CashFlowDataPoint {
  month: string;
  year: number;
  monthKey: string; // YYYY-MM format
  income: number;
  expenses: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
  isNegative: boolean;
  projectedIncome?: number;
  projectedExpenses?: number;
  projectedNetFlow?: number;
}

export interface CashFlowForecast {
  period: 'monthly' | 'quarterly' | 'yearly';
  projectionMonths: number;
  data: CashFlowDataPoint[];
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netCashFlow: number;
    averageMonthlyIncome: number;
    averageMonthlyExpenses: number;
    negativeMonths: number;
    worstMonth: CashFlowDataPoint | null;
    bestMonth: CashFlowDataPoint | null;
  };
  recommendations: string[];
}
