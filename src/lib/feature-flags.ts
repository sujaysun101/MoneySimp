// Feature flags for different banking integrations and modes
export const FEATURE_FLAGS = {
  // Bank integration options
  BANK_INTEGRATION: process.env.NEXT_PUBLIC_ENABLE_BANK_INTEGRATION === 'true',
  PLAID_ENABLED: !!(process.env.NEXT_PUBLIC_PLAID_CLIENT_ID && process.env.PLAID_SECRET),
  YODLEE_ENABLED: !!(process.env.NEXT_PUBLIC_YODLEE_CLIENT_ID && process.env.YODLEE_SECRET),
  
  // Mode settings
  MANUAL_MODE_ONLY: process.env.NEXT_PUBLIC_MANUAL_MODE_ONLY === 'true',
  AUTO_SYNC_ENABLED: process.env.NEXT_PUBLIC_AUTO_SYNC === 'true',
  
  // Feature toggles
  SUBSCRIPTION_DETECTION: process.env.NEXT_PUBLIC_SUBSCRIPTION_DETECTION !== 'false',
  OFFLINE_MODE: process.env.NEXT_PUBLIC_OFFLINE_MODE !== 'false',
  ENCRYPTION_ENABLED: process.env.NEXT_PUBLIC_ENCRYPTION_ENABLED !== 'false',
  
  // Premium features
  ADVANCED_ANALYTICS: process.env.NEXT_PUBLIC_ADVANCED_ANALYTICS === 'true',
  MULTI_CURRENCY: process.env.NEXT_PUBLIC_MULTI_CURRENCY === 'true',
  EXPORT_FEATURES: process.env.NEXT_PUBLIC_EXPORT_FEATURES === 'true',
} as const;

export type BankIntegrationStatus = 
  | 'manual-only' 
  | 'plaid-enabled' 
  | 'yodlee-enabled' 
  | 'both-enabled' 
  | 'manual-fallback';

export const getBankIntegrationStatus = (): BankIntegrationStatus => {
  if (FEATURE_FLAGS.MANUAL_MODE_ONLY) {
    return 'manual-only';
  }
  
  if (FEATURE_FLAGS.PLAID_ENABLED && FEATURE_FLAGS.YODLEE_ENABLED) {
    return 'both-enabled';
  }
  
  if (FEATURE_FLAGS.PLAID_ENABLED) {
    return 'plaid-enabled';
  }
  
  if (FEATURE_FLAGS.YODLEE_ENABLED) {
    return 'yodlee-enabled';
  }
  
  return 'manual-fallback';
};

export const getAvailableBankProviders = () => {
  const providers = [];
  
  if (FEATURE_FLAGS.PLAID_ENABLED) {
    providers.push({
      id: 'plaid',
      name: 'Plaid',
      description: 'Connect to 11,000+ banks and credit unions',
      features: ['Real-time transactions', 'Account balances', 'Subscription detection'],
      countries: ['US', 'CA', 'UK', 'EU'],
      status: 'active'
    });
  }
  
  if (FEATURE_FLAGS.YODLEE_ENABLED) {
    providers.push({
      id: 'yodlee',
      name: 'Yodlee',
      description: 'Enterprise-grade financial data aggregation',
      features: ['Transaction categorization', 'Recurring payments', 'Global coverage'],
      countries: ['US', 'CA', 'UK', 'AU', 'IN'],
      status: 'active'
    });
  }
  
  if (providers.length === 0) {
    providers.push({
      id: 'manual',
      name: 'Manual Entry',
      description: 'Complete privacy with manual expense tracking',
      features: ['Full control', 'No data sharing', 'Offline support'],
      countries: ['Global'],
      status: 'active'
    });
  }
  
  return providers;
};

export const shouldShowBankConnection = (): boolean => {
  return FEATURE_FLAGS.BANK_INTEGRATION && !FEATURE_FLAGS.MANUAL_MODE_ONLY;
};

export const getFeatureDescription = (feature: keyof typeof FEATURE_FLAGS): string => {
  const descriptions = {
    BANK_INTEGRATION: 'Automatically connect to your bank accounts',
    PLAID_ENABLED: 'Plaid bank integration for US, CA, UK, and EU banks',
    YODLEE_ENABLED: 'Yodlee bank integration for global coverage',
    MANUAL_MODE_ONLY: 'Privacy-first manual expense tracking only',
    AUTO_SYNC_ENABLED: 'Automatic transaction synchronization',
    SUBSCRIPTION_DETECTION: 'Smart detection of recurring subscriptions',
    OFFLINE_MODE: 'Work without internet connection',
    ENCRYPTION_ENABLED: 'Client-side encryption for sensitive data',
    ADVANCED_ANALYTICS: 'Detailed spending insights and forecasting',
    MULTI_CURRENCY: 'Support for multiple currencies',
    EXPORT_FEATURES: 'Export data to CSV, PDF, and other formats'
  };
  
  return descriptions[feature] || 'Feature description not available';
};

// Runtime feature detection
export const detectRuntimeCapabilities = () => {
  const capabilities = {
    localStorage: typeof window !== 'undefined' && 'localStorage' in window,
    indexedDB: typeof window !== 'undefined' && 'indexedDB' in window,
    webCrypto: typeof window !== 'undefined' && 'crypto' in window && 'subtle' in window.crypto,
    serviceWorker: typeof window !== 'undefined' && 'serviceWorker' in navigator,
    notifications: typeof window !== 'undefined' && 'Notification' in window,
    geolocation: typeof window !== 'undefined' && 'geolocation' in navigator,
  };
  
  return capabilities;
};

// Configuration validation
export const validateConfiguration = () => {
  const issues = [];
  
  if (FEATURE_FLAGS.BANK_INTEGRATION && !FEATURE_FLAGS.PLAID_ENABLED && !FEATURE_FLAGS.YODLEE_ENABLED) {
    issues.push('Bank integration enabled but no providers configured');
  }
  
  if (FEATURE_FLAGS.PLAID_ENABLED && (!process.env.NEXT_PUBLIC_PLAID_CLIENT_ID || !process.env.PLAID_SECRET)) {
    issues.push('Plaid enabled but missing credentials');
  }
  
  if (FEATURE_FLAGS.YODLEE_ENABLED && (!process.env.NEXT_PUBLIC_YODLEE_CLIENT_ID || !process.env.YODLEE_SECRET)) {
    issues.push('Yodlee enabled but missing credentials');
  }
  
  if (FEATURE_FLAGS.ENCRYPTION_ENABLED && !process.env.ENCRYPTION_KEY) {
    issues.push('Encryption enabled but no encryption key provided');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};

export default FEATURE_FLAGS;
