// src/app/accounts/page.tsx
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePlaidLink } from 'react-plaid-link';
import { Landmark, Plus, Trash2, RefreshCw, AlertTriangle, CheckCircle, Clock, Wifi, WifiOff, ExternalLink, Globe, Loader2 } from 'lucide-react';
import type { BankAccount, Transaction, SyncStatus } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { SecureStorage } from '@/lib/encryption';
import { initOfflineStorage, getOfflineStorage } from '@/lib/offlineStorage';
import { format, formatDistanceToNow } from 'date-fns';
import { FEATURE_FLAGS, getBankIntegrationStatus, getAvailableBankProviders } from '@/lib/feature-flags';
import { BankConnectionBanner } from '@/components/shared/BankConnectionBanner';

// Yodlee Connection Component
function YodleeConnectionCard({ user, onSuccess }: { user: any; onSuccess: (accounts: BankAccount[]) => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [fastLinkUrl, setFastLinkUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const generateFastLink = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/yodlee/fastlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.uid,
          callbackUrl: `${window.location.origin}/api/yodlee/callback`
        }),
      });

      const data = await response.json();
      if (data.fastLinkUrl) {
        setFastLinkUrl(data.fastLinkUrl);
        // Open FastLink in a new window
        window.open(data.fastLinkUrl, '_blank', 'width=800,height=700');
      } else {
        throw new Error(data.error || 'Failed to generate FastLink URL');
      }
    } catch (error) {
      console.error('Error generating FastLink:', error);
      toast({
        title: "Connection Error",
        description: "Failed to initialize Yodlee connection. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      const response = await fetch('/api/yodlee/accounts');
      if (response.ok) {
        const accounts = await response.json();
        onSuccess(accounts);
      }
    } catch (error) {
      console.error('Error testing Yodlee connection:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-green-600" />
          Yodlee Integration
        </CardTitle>
        <CardDescription>
          Connect to 17,000+ banks worldwide with free tier
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={generateFastLink} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ExternalLink className="h-4 w-4 mr-2" />
          )}
          Connect with Yodlee
        </Button>
        
        <Button 
          onClick={testConnection} 
          variant="outline"
          className="w-full"
        >
          Test Connection
        </Button>
        
        <div className="text-xs text-muted-foreground">
          <strong>Coverage:</strong> Global (US, CA, UK, AU, IN, EU)
        </div>
      </CardContent>
    </Card>
  );
}

export default function AccountsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    lastSync: null,
    pendingChanges: 0,
    syncInProgress: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [secureStorage, setSecureStorage] = useState<SecureStorage | null>(null);
  const [user, setUser] = useState<any>(null);
  const [fastLinkUrl, setFastLinkUrl] = useState<string | null>(null);

  // Initialize secure storage and offline storage
  useEffect(() => {
    const initStorage = async () => {
      if (!auth) {
        console.error('Firebase auth is not initialized.');
        setIsLoading(false);
        return;
      }
      const currentUser = auth.currentUser;
      if (currentUser) {
        setUser(currentUser);
        const storage = new SecureStorage(currentUser.uid, currentUser.email || '');
        setSecureStorage(storage);
        
        try {
          await initOfflineStorage(currentUser.uid, storage['encryptionKey']);
          await loadAccountsFromStorage();
        } catch (error) {
          console.error('Failed to initialize storage:', error);
          toast({
            title: "Storage Error",
            description: "Failed to initialize secure storage. Some features may not work properly.",
            variant: "destructive"
          });
        }
      }
      setIsLoading(false);
    };

    initStorage();
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setSyncStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setSyncStatus(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadAccountsFromStorage = async () => {
    try {
      if (secureStorage) {
        const storedAccounts = secureStorage.getItem<BankAccount[]>('bankAccounts');
        if (storedAccounts) {
          setAccounts(storedAccounts.map(acc => ({
            ...acc,
            lastSynced: new Date(acc.lastSynced)
          })));
        }
      }

      // Also load from offline storage
      const offlineStorage = getOfflineStorage();
      const offlineAccounts = await offlineStorage.getAllAccounts();
      if (offlineAccounts.length > 0) {
        setAccounts(offlineAccounts);
      }

      const lastSync = await offlineStorage.getLastSyncTime();
      setSyncStatus(prev => ({ ...prev, lastSync }));
    } catch (error) {
      console.error('Failed to load accounts from storage:', error);
    }
  };

  // Create Plaid Link token
  const createLinkToken = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });

      const data = await response.json();
      if (data.link_token) {
        setLinkToken(data.link_token);
      } else {
        throw new Error(data.error || 'Failed to create link token');
      }
    } catch (error) {
      console.error('Error creating link token:', error);
      toast({
        title: "Connection Error",
        description: "Failed to initialize bank connection. Please try again.",
        variant: "destructive"
      });
    }
  }, [user, toast]);

  // Handle successful Plaid Link
  const onPlaidSuccess = useCallback(async (publicToken: string, metadata: any) => {
    if (!user) return;

    setSyncStatus(prev => ({ ...prev, syncInProgress: true }));

    try {
      // Exchange public token for access token
      const exchangeResponse = await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          publicToken, 
          userId: user.uid 
        }),
      });

      const exchangeData = await exchangeResponse.json();
      if (!exchangeData.success) {
        throw new Error(exchangeData.error);
      }

      // Get accounts
      const accountsResponse = await fetch('/api/plaid/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          accessToken: exchangeData.accessToken, 
          userId: user.uid 
        }),
      });

      const accountsData = await accountsResponse.json();
      if (!accountsData.success) {
        throw new Error(accountsData.error);
      }

      // Store accounts securely
      const newAccounts = [...accounts, ...accountsData.accounts];
      setAccounts(newAccounts);

      if (secureStorage) {
        secureStorage.setItem('bankAccounts', newAccounts);
        secureStorage.setItem('plaidAccessTokens', {
          [metadata.institution.institution_id]: exchangeData.accessToken
        });
      }

      // Store in offline storage
      const offlineStorage = getOfflineStorage();
      for (const account of accountsData.accounts) {
        await offlineStorage.saveAccount(account);
      }
      await offlineStorage.setLastSyncTime(new Date());

      setSyncStatus(prev => ({ 
        ...prev, 
        syncInProgress: false, 
        lastSync: new Date() 
      }));

      toast({
        title: "Bank Connected",
        description: `Successfully connected ${metadata.institution.name} with ${accountsData.accounts.length} account(s).`,
      });

    } catch (error) {
      console.error('Error handling Plaid success:', error);
      setSyncStatus(prev => ({ ...prev, syncInProgress: false }));
      toast({
        title: "Connection Failed",
        description: "Failed to connect your bank account. Please try again.",
        variant: "destructive"
      });
    }
  }, [user, accounts, secureStorage, toast]);

  // Handle successful Yodlee connection
  const handleYodleeSuccess = useCallback(async (accountsData: BankAccount[]) => {
    if (!user || !secureStorage) return;

    setSyncStatus(prev => ({ ...prev, syncInProgress: true }));

    try {
      // Store accounts securely
      const newAccounts = [...accounts, ...accountsData];
      setAccounts(newAccounts);

      if (secureStorage) {
        secureStorage.setItem('bankAccounts', newAccounts);
      }

      // Store in offline storage
      const offlineStorage = getOfflineStorage();
      for (const account of accountsData) {
        await offlineStorage.saveAccount(account);
      }
      await offlineStorage.setLastSyncTime(new Date());

      setSyncStatus(prev => ({ 
        ...prev, 
        syncInProgress: false, 
        lastSync: new Date() 
      }));

      toast({
        title: "Bank Connected",
        description: `Successfully connected ${accountsData.length} account(s) via Yodlee.`,
      });

    } catch (error) {
      console.error('Error handling Yodlee success:', error);
      setSyncStatus(prev => ({ ...prev, syncInProgress: false }));
      toast({
        title: "Connection Failed",
        description: "Failed to connect your bank account. Please try again.",
        variant: "destructive"
      });
    }
  }, [user, accounts, secureStorage, toast]);

  // Plaid Link configuration
  const config = {
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: (err: any, metadata: any) => {
      if (err) {
        console.error('Plaid Link exit error:', err);
      }
    },
    onEvent: (eventName: string, metadata: any) => {
      console.log('Plaid Link event:', eventName, metadata);
    },
  };

  const { open, ready } = usePlaidLink(config);

  // Sync accounts data
  const syncAccounts = async () => {
    if (!user || !secureStorage || !syncStatus.isOnline) return;

    setSyncStatus(prev => ({ ...prev, syncInProgress: true }));

    try {
      const accessTokens = secureStorage.getItem<{[key: string]: string}>('plaidAccessTokens') || {};
      
      for (const [institutionId, accessToken] of Object.entries(accessTokens)) {
        // Refresh accounts
        const accountsResponse = await fetch('/api/plaid/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken, userId: user.uid }),
        });

        const accountsData = await accountsResponse.json();
        if (accountsData.success) {
          // Update local accounts with latest balances
          const updatedAccounts = accounts.map(account => {
            const updated = accountsData.accounts.find((acc: BankAccount) => acc.id === account.id);
            return updated ? { ...updated, lastSynced: new Date() } : account;
          });
          setAccounts(updatedAccounts);

          // Update storage
          secureStorage.setItem('bankAccounts', updatedAccounts);
          const offlineStorage = getOfflineStorage();
          for (const account of updatedAccounts) {
            await offlineStorage.saveAccount(account);
          }
        }
      }

      const now = new Date();
      await getOfflineStorage().setLastSyncTime(now);
      setSyncStatus(prev => ({ 
        ...prev, 
        syncInProgress: false, 
        lastSync: now 
      }));

      toast({
        title: "Sync Complete",
        description: "Account balances have been updated.",
      });

    } catch (error) {
      console.error('Error syncing accounts:', error);
      setSyncStatus(prev => ({ ...prev, syncInProgress: false }));
      toast({
        title: "Sync Failed",
        description: "Failed to sync account data. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Remove account
  const removeAccount = async (accountId: string) => {
    try {
      const updatedAccounts = accounts.filter(acc => acc.id !== accountId);
      setAccounts(updatedAccounts);

      if (secureStorage) {
        secureStorage.setItem('bankAccounts', updatedAccounts);
      }

      await getOfflineStorage().deleteAccount(accountId);

      toast({
        title: "Account Removed",
        description: "Bank account has been removed from your dashboard.",
      });
    } catch (error) {
      console.error('Error removing account:', error);
      toast({
        title: "Remove Failed",
        description: "Failed to remove account. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <p>Loading accounts...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Bank Accounts</h1>
        <p className="text-muted-foreground">Connect and manage all your financial accounts in one place.</p>
      </div>

      {/* Sync Status */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {syncStatus.isOnline ? (
                  <Wifi className="h-5 w-5 text-green-600" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-600" />
                )}
                <span className="text-sm font-medium">
                  {syncStatus.isOnline ? 'Online' : 'Offline Mode'}
                </span>
              </div>
              
              {syncStatus.lastSync && (
                <div className="text-sm text-muted-foreground">
                  Last synced: {formatDistanceToNow(syncStatus.lastSync, { addSuffix: true })}
                </div>
              )}
            </div>
            
            <Button
              onClick={syncAccounts}
              disabled={!syncStatus.isOnline || syncStatus.syncInProgress}
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncStatus.syncInProgress ? 'animate-spin' : ''}`} />
              Sync
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Offline Alert */}
      {!syncStatus.isOnline && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You're currently offline. Account balances may not be up to date. Data will sync when you're back online.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="accounts">My Accounts</TabsTrigger>
          <TabsTrigger value="connect">Connect New Account</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-6">
          {accounts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Landmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Accounts Connected</h3>
                <p className="text-muted-foreground mb-4">
                  Connect your bank accounts to get started with automatic transaction tracking.
                </p>
                <Button onClick={() => createLinkToken()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Connect Your First Account
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{accounts.length}</div>
                      <div className="text-sm text-muted-foreground">Connected Accounts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        ${accounts.reduce((sum, acc) => sum + acc.balance.current, 0).toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Balance</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {accounts.filter(acc => acc.isActive).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Active Accounts</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Accounts List */}
              {accounts.map((account) => (
                <Card key={account.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <Landmark className="h-6 w-6 text-primary" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{account.name}</h3>
                            <Badge variant={account.isActive ? "default" : "secondary"}>
                              {account.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {account.institutionName} • ****{account.mask}
                          </p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="font-medium">Current Balance</div>
                              <div className="text-lg font-bold">
                                ${account.balance.current.toFixed(2)}
                              </div>
                            </div>
                            
                            {account.balance.available && (
                              <div>
                                <div className="font-medium">Available</div>
                                <div className="text-green-600 font-semibold">
                                  ${account.balance.available.toFixed(2)}
                                </div>
                              </div>
                            )}
                            
                            <div>
                              <div className="font-medium">Account Type</div>
                              <div className="capitalize">{account.type}</div>
                            </div>
                            
                            <div>
                              <div className="font-medium">Last Updated</div>
                              <div>{format(account.lastSynced, 'MMM d, h:mm a')}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeAccount(account.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="connect" className="space-y-6">
          {/* Bank Connection Banner */}
          <BankConnectionBanner />

          {/* Multi-Provider Connection Options */}
          {FEATURE_FLAGS.BANK_INTEGRATION && !FEATURE_FLAGS.MANUAL_MODE_ONLY && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Plaid Connection */}
              {FEATURE_FLAGS.PLAID_ENABLED && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Landmark className="h-5 w-5 text-blue-600" />
                      Plaid Integration
                    </CardTitle>
                    <CardDescription>
                      Connect to 11,000+ US banks and credit unions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!linkToken ? (
                      <Button onClick={createLinkToken} className="w-full">
                        Initialize Plaid Connection
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          <span>Ready to connect</span>
                        </div>
                        
                        <Button 
                          onClick={() => open()} 
                          disabled={!ready}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Connect with Plaid
                        </Button>
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground">
                      <strong>Coverage:</strong> US, Canada, UK, EU
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Yodlee Connection */}
              {FEATURE_FLAGS.YODLEE_ENABLED && (
                <YodleeConnectionCard user={user} onSuccess={handleYodleeSuccess} />
              )}
            </div>
          )}

          {/* Manual Mode Information */}
          {FEATURE_FLAGS.MANUAL_MODE_ONLY && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-blue-600" />
                  Manual Account Management
                </CardTitle>
                <CardDescription>
                  Add account information manually for complete privacy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" onClick={() => router.push('/expenses')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Manual Account
                </Button>
                
                <div className="text-sm text-muted-foreground">
                  Track expenses manually without connecting to any bank. Your data stays completely private.
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Information */}
          {FEATURE_FLAGS.BANK_INTEGRATION && (
            <Card>
              <CardHeader>
                <CardTitle>Security & Privacy</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Bank-level 256-bit encryption
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Read-only access (we cannot move money)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Data encrypted locally and in transit
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Works offline after initial setup
                  </li>
                  {FEATURE_FLAGS.YODLEE_ENABLED && (
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Global bank coverage with Yodlee
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
