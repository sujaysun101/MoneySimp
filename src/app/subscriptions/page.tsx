// src/app/subscriptions/page.tsx
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SubscriptionForm, type SubscriptionFormValues } from '@/components/subscriptions/SubscriptionForm';
import { SubscriptionList } from '@/components/subscriptions/SubscriptionList';
import { SubscriptionDetection } from '@/components/subscriptions/SubscriptionDetection';
import { CancellationHelper } from '@/components/subscriptions/CancellationHelper';
import type { Subscription, Expense, BankAccount } from '@/lib/types';
import { SUBSCRIPTIONS_STORAGE_KEY, EXPENSES_STORAGE_KEY } from '@/lib/constants';
import { FEATURE_FLAGS } from '@/lib/feature-flags';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { Bell, RefreshCw, AlertTriangle, Zap, CreditCard, Eye, Plus, Search, Banknote, Globe, Phone, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { addDays, isPast, isToday, differenceInDays, addMonths, addWeeks, addYears } from 'date-fns';

export default function SubscriptionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [detectedSubscriptions, setDetectedSubscriptions] = useState<any[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [activeTab, setActiveTab] = useState("manage");
  const [selectedSubscription, setSelectedSubscription] = useState<any | null>(null);
  const initialSaveEffectRun = useRef(true);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('moneySimpLoggedIn');
    if (!isLoggedIn && !(auth && auth.currentUser)) { 
      router.replace('/login');
    } else {
      setIsLoading(false);
      checkConnectedAccounts();
    }
  }, [router]);

  const checkConnectedAccounts = async () => {
    try {
      // Check for Yodlee accounts
      const yodleeAccounts = localStorage.getItem('yodlee_accounts');
      if (yodleeAccounts) {
        const accounts = JSON.parse(yodleeAccounts);
        setConnectedAccounts(accounts);
        await detectSubscriptions(accounts);
      }
      
      // Check for Plaid accounts (if needed)
      const plaidAccounts = localStorage.getItem('plaid_accounts');
      if (plaidAccounts) {
        const accounts = JSON.parse(plaidAccounts);
        setConnectedAccounts(prev => [...prev, ...accounts]);
        await detectSubscriptions([...connectedAccounts, ...accounts]);
      }
    } catch (error) {
      console.error('Error checking connected accounts:', error);
    }
  };

  const detectSubscriptions = async (accounts?: BankAccount[]) => {
    try {
      setIsDetecting(true);
      const accountsToUse = accounts || connectedAccounts;
      
      if (accountsToUse.length === 0) {
        return;
      }

      // Use Yodlee or Plaid depending on which accounts are connected
      const yodleeAccounts = accountsToUse.filter(acc => acc.provider === 'yodlee');
    const plaidAccounts = accountsToUse.filter(acc => (acc as any).provider === 'plaid');
      
      let detected: any[] = [];

      if (yodleeAccounts.length > 0) {
        const response = await fetch('/api/yodlee/detect-subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            accountIds: yodleeAccounts.map(acc => acc.providerAccountId || acc.accountId) 
          })
        });
        
        if (response.ok) {
          const yodleeData = await response.json();
          detected.push(...yodleeData.subscriptions);
        }
      }

      if (plaidAccounts.length > 0) {
        const response = await fetch('/api/plaid/detect-subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            accountIds: plaidAccounts.map(acc => acc.accessToken || acc.accountId) 
          })
        });
        
        if (response.ok) {
          const plaidData = await response.json();
          detected.push(...plaidData.subscriptions);
        }
      }

      setDetectedSubscriptions(detected);

    } catch (error) {
      console.error('Error detecting subscriptions:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  const connectBank = async () => {
    try {
      const response = await fetch('/api/feature-flags');
      const featureFlags = await response.json();
      
      if (featureFlags.ENABLE_YODLEE) {
        // Use Yodlee FastLink
        const fastLinkResponse = await fetch('/api/yodlee/fastlink', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: 'user123', // You might want to get this from auth
            callbackUrl: `${window.location.origin}/api/yodlee/callback`
          })
        });
        
        if (fastLinkResponse.ok) {
          const { fastLinkUrl } = await fastLinkResponse.json();
          
          // Open FastLink in a popup
          const popup = window.open(fastLinkUrl, 'yodlee_fastlink', 'width=800,height=600,scrollbars=yes,resizable=yes');
          
          // Listen for popup close or success message
          const checkConnection = setInterval(async () => {
            if (popup?.closed) {
              clearInterval(checkConnection);
              await checkConnectedAccounts();
              toast({
                title: "Bank Connection",
                description: "Bank connection process completed. Checking for accounts...",
              });
            }
          }, 1000);
          
        } else {
          throw new Error('Failed to generate FastLink URL');
        }
      } else if (featureFlags.ENABLE_PLAID) {
        // Use Plaid Link (implement if needed)
        toast({
          title: "Plaid Integration",
          description: "Plaid integration not implemented in this demo",
          variant: "destructive",
        });
      } else {
        toast({
          title: "No Bank Integration",
          description: "Bank integration is not enabled",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error connecting bank:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect bank account",
        variant: "destructive",
      });
    }
  };

  // Load expenses (needed for subscription detection)
  useEffect(() => {
    if (isLoading) return;
    const storedExpenses = localStorage.getItem(EXPENSES_STORAGE_KEY);
    if (storedExpenses) {
      try {
        const parsedExpenses: Expense[] = JSON.parse(storedExpenses).map((exp: any) => ({
          ...exp,
          date: new Date(exp.date), 
        }));
        setExpenses(parsedExpenses);
      } catch (error) {
        console.error("[SubscriptionsPage] Failed to parse expenses:", error);
        setExpenses([]); 
      }
    } else {
      setExpenses([]); 
    }
  }, [isLoading]);

  // Load subscriptions from local storage
  useEffect(() => {
    if (isLoading) return;

    console.log(`[SubscriptionsPage] Loading subscriptions from localStorage with key: ${SUBSCRIPTIONS_STORAGE_KEY}`);
    const storedSubscriptions = localStorage.getItem(SUBSCRIPTIONS_STORAGE_KEY);
    
    if (storedSubscriptions) {
      try {
        const parsedData = JSON.parse(storedSubscriptions);
        
        if (!Array.isArray(parsedData)) {
          console.error("[SubscriptionsPage] Stored subscriptions data is not an array. Clearing localStorage.");
          localStorage.removeItem(SUBSCRIPTIONS_STORAGE_KEY);
          setSubscriptions([]);
          return;
        }
        
        const parsedSubscriptions: Subscription[] = parsedData.map((sub: any) => ({
          ...sub,
          nextPaymentDate: new Date(sub.nextPaymentDate),
          lastPaymentDate: sub.lastPaymentDate ? new Date(sub.lastPaymentDate) : undefined,
        }));
        
        console.log("[SubscriptionsPage] Loaded subscriptions:", parsedSubscriptions);
        setSubscriptions(parsedSubscriptions);
      } catch (error) {
        console.error("[SubscriptionsPage] Failed to parse subscriptions from localStorage:", error);
        localStorage.removeItem(SUBSCRIPTIONS_STORAGE_KEY);
        setSubscriptions([]);
      }
    } else {
      console.log("[SubscriptionsPage] No stored subscriptions found. Initializing to empty array.");
      setSubscriptions([]);
    }
  }, [isLoading]);

  // Save subscriptions to local storage whenever they change
  useEffect(() => {
    if (isLoading) {
      initialSaveEffectRun.current = true;
      return;
    }

    if (initialSaveEffectRun.current) {
      initialSaveEffectRun.current = false;
      if (subscriptions.length === 0 && !localStorage.getItem(SUBSCRIPTIONS_STORAGE_KEY)) {
        console.log("[SubscriptionsPage] Save skipped on initial load with empty subscriptions.");
        return;
      }
    }
    
    const storableSubscriptions = subscriptions.map(sub => ({
      ...sub,
      nextPaymentDate: sub.nextPaymentDate.toISOString(),
      lastPaymentDate: sub.lastPaymentDate?.toISOString(),
    }));
    
    localStorage.setItem(SUBSCRIPTIONS_STORAGE_KEY, JSON.stringify(storableSubscriptions));
    console.log("[SubscriptionsPage] Saved subscriptions to localStorage:", storableSubscriptions);
  }, [subscriptions, isLoading]);

  const calculateNextPaymentDate = (currentDate: Date, frequency: string): Date => {
    const nextDate = new Date(currentDate);
    
    switch (frequency) {
      case 'daily':
        return addDays(nextDate, 1);
      case 'weekly':
        return addWeeks(nextDate, 1);
      case 'monthly':
        return addMonths(nextDate, 1);
      case 'yearly':
        return addYears(nextDate, 1);
      default:
        return addMonths(nextDate, 1);
    }
  };

  const handleSubscriptionSubmit = (data: SubscriptionFormValues, editingSubscriptionId?: string) => {
    if (editingSubscriptionId) {
      setSubscriptions(prevSubscriptions =>
        prevSubscriptions.map(sub =>
          sub.id === editingSubscriptionId
            ? { 
                ...sub, 
                ...data,
                lastPaymentDate: sub.lastPaymentDate,
                detectedFromBank: sub.detectedFromBank,
              }
            : sub
        )
      );
      toast({
        title: "Subscription Updated",
        description: `Subscription "${data.name}" has been updated.`,
      });
      setEditingSubscription(null);
    } else {
      const newSubscription: Subscription = {
        id: uuidv4(),
        ...data,
        isActive: true,
        detectedFromBank: false,
      };
      setSubscriptions(prevSubscriptions => [...prevSubscriptions, newSubscription]);
      toast({
        title: "Subscription Added",
        description: `Subscription "${data.name}" has been added.`,
      });
    }
  };

  const handleDeleteSubscription = (subscriptionId: string) => {
    const subscriptionToDelete = subscriptions.find(sub => sub.id === subscriptionId);
    setSubscriptions(prevSubscriptions => prevSubscriptions.filter(sub => sub.id !== subscriptionId));
    toast({
      title: "Subscription Deleted",
      description: `Subscription "${subscriptionToDelete?.name || 'Unknown'}" has been deleted.`,
      variant: "destructive"
    });
    if (editingSubscription && editingSubscription.id === subscriptionId) {
      setEditingSubscription(null);
    }
  };

  const handleEditSubscription = (subscriptionToEdit: Subscription) => {
    setEditingSubscription(subscriptionToEdit);
    setActiveTab("manage");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingSubscription(null);
  };

  const handleToggleActive = (subscriptionId: string) => {
    setSubscriptions(prevSubscriptions =>
      prevSubscriptions.map(sub =>
        sub.id === subscriptionId
          ? { 
              ...sub, 
              isActive: !sub.isActive,
              // If reactivating, update next payment date
              nextPaymentDate: !sub.isActive 
                ? calculateNextPaymentDate(new Date(), sub.frequency)
                : sub.nextPaymentDate
            }
          : sub
      )
    );
    
    const subscription = subscriptions.find(sub => sub.id === subscriptionId);
    toast({
      title: subscription?.isActive ? "Subscription Paused" : "Subscription Resumed",
      description: `Subscription "${subscription?.name}" has been ${subscription?.isActive ? 'paused' : 'resumed'}.`,
    });
  };

  const handleAddDetectedSubscription = (subscriptionData: Omit<Subscription, 'id'>) => {
    const newSubscription: Subscription = {
      id: uuidv4(),
      ...subscriptionData,
    };
    setSubscriptions(prevSubscriptions => [...prevSubscriptions, newSubscription]);
    toast({
      title: "Subscription Added",
      description: `Auto-detected subscription "${subscriptionData.name}" has been added.`,
    });
  };

  // Check for upcoming payments and overdue subscriptions
  const getUpcomingPayments = () => {
    const today = new Date();
    const activeSubscriptions = subscriptions.filter(sub => sub.isActive);
    
    const overdue = activeSubscriptions.filter(sub => isPast(sub.nextPaymentDate) && !isToday(sub.nextPaymentDate));
    const dueToday = activeSubscriptions.filter(sub => isToday(sub.nextPaymentDate));
    const dueSoon = activeSubscriptions.filter(sub => {
      const daysUntil = differenceInDays(sub.nextPaymentDate, today);
      return daysUntil > 0 && daysUntil <= 3;
    });

    return { overdue, dueToday, dueSoon };
  };

  const { overdue, dueToday, dueSoon } = getUpcomingPayments();
  const hasAlerts = overdue.length > 0 || dueToday.length > 0 || dueSoon.length > 0;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <p>Loading subscriptions...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Subscription Management</h1>
        <p className="text-muted-foreground">Track, manage, and get reminders for your recurring subscriptions.</p>
      </div>

      {/* Payment Alerts */}
      {hasAlerts && (
        <div className="mb-6 space-y-2">
          {overdue.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {overdue.length} subscription{overdue.length === 1 ? ' is' : 's are'} overdue: {overdue.map(sub => sub.name).join(', ')}
              </AlertDescription>
            </Alert>
          )}
          
          {dueToday.length > 0 && (
            <Alert>
              <Bell className="h-4 w-4" />
              <AlertDescription>
                {dueToday.length} subscription{dueToday.length === 1 ? ' is' : 's are'} due today: {dueToday.map(sub => sub.name).join(', ')}
              </AlertDescription>
            </Alert>
          )}
          
          {dueSoon.length > 0 && (
            <Alert>
              <Bell className="h-4 w-4" />
              <AlertDescription>
                {dueSoon.length} subscription{dueSoon.length === 1 ? ' is' : 's are'} due soon: {dueSoon.map(sub => sub.name).join(', ')}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="manage">Manage Subscriptions</TabsTrigger>
          <TabsTrigger value="detect">Smart Detection</TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>{editingSubscription ? 'Edit Subscription' : 'Add New Subscription'}</CardTitle>
              <CardDescription>
                {editingSubscription
                  ? `Update the details for ${editingSubscription.name}.`
                  : 'Add a new recurring subscription to track.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubscriptionForm
                onSubscriptionSubmit={handleSubscriptionSubmit}
                editingSubscription={editingSubscription}
                onCancelEdit={handleCancelEdit}
              />
            </CardContent>
          </Card>

          <SubscriptionList
            subscriptions={subscriptions}
            onDeleteSubscription={handleDeleteSubscription}
            onEditSubscription={handleEditSubscription}
            onToggleActive={handleToggleActive}
          />
        </TabsContent>

        <TabsContent value="detect" className="space-y-6">
          {/* Bank Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Bank Account Connection
              </CardTitle>
              <CardDescription>
                Connect your bank accounts to automatically detect and analyze recurring subscriptions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {connectedAccounts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <Banknote className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-lg font-medium">No Connected Accounts</p>
                    <p className="text-muted-foreground">Connect a bank account to start detecting subscriptions automatically</p>
                  </div>
                  <Button onClick={connectBank} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Connect Bank Account
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Connected Accounts</p>
                      <p className="text-sm text-muted-foreground">
                        {connectedAccounts.length} account{connectedAccounts.length !== 1 ? 's' : ''} connected
                      </p>
                    </div>
                    <Button onClick={connectBank} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another Account
                    </Button>
                  </div>
                  
                  <div className="grid gap-3">
                    {connectedAccounts.map((account, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <Banknote className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">{account.name || 'Bank Account'}</p>
                            <p className="text-sm text-muted-foreground">
                              {account.provider?.toUpperCase()} • {account.type || 'Checking'}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          Connected
                        </Badge>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    onClick={() => detectSubscriptions()} 
                    disabled={isDetecting}
                    className="w-full"
                  >
                    {isDetecting ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent" />
                        Analyzing Transactions...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Detect Subscriptions
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detected Subscriptions */}
          {detectedSubscriptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Detected Subscriptions
                </CardTitle>
                <CardDescription>
                  We found {detectedSubscriptions.length} potential recurring subscription{detectedSubscriptions.length !== 1 ? 's' : ''} in your transaction history.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {detectedSubscriptions.map((detected, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {detected.merchant?.charAt(0)?.toUpperCase() || 'S'}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium">{detected.merchant || 'Unknown Service'}</h4>
                            <p className="text-sm text-muted-foreground">
                              ${detected.amount?.toFixed(2) || '0.00'} • {detected.frequency || 'Monthly'}
                            </p>
                          </div>
                        </div>
                        {detected.lastTransaction && (
                          <p className="text-xs text-muted-foreground ml-13">
                            Last charged: {new Date(detected.lastTransaction).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSubscription(detected)}
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAddDetectedSubscription(detected)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Track
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Manual Detection Fallback */}
          {connectedAccounts.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Manual Detection</CardTitle>
                <CardDescription>
                  Analyze your existing expenses to detect potential subscriptions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubscriptionDetection
                  expenses={expenses}
                  existingSubscriptions={subscriptions}
                  onAddDetectedSubscription={handleAddDetectedSubscription}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Cancellation Helper Modal */}
      {selectedSubscription && (
        <Dialog open={!!selectedSubscription} onOpenChange={() => setSelectedSubscription(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Cancel Subscription</DialogTitle>
              <DialogDescription>
                Get help canceling your subscription to {selectedSubscription.merchant || 'this service'}.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">{selectedSubscription.merchant}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Amount: ${selectedSubscription.amount?.toFixed(2)} • {selectedSubscription.frequency}
                  </p>
                  <p className="text-sm">
                    This subscription was detected from your bank transactions. 
                    Here are some common ways to cancel this type of service:
                  </p>
                </div>
                
                <div className="grid gap-3">
                  <Button variant="outline" className="justify-start h-auto p-4">
                    <Globe className="h-4 w-4 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Visit Website</div>
                      <div className="text-sm text-muted-foreground">Go to account settings or billing section</div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="justify-start h-auto p-4">
                    <Phone className="h-4 w-4 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Call Customer Service</div>
                      <div className="text-sm text-muted-foreground">Request cancellation over the phone</div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="justify-start h-auto p-4">
                    <Mail className="h-4 w-4 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Send Email</div>
                      <div className="text-sm text-muted-foreground">Email customer support for cancellation</div>
                    </div>
                  </Button>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => setSelectedSubscription(null)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // Mark as cancelled and add to tracked subscriptions
                      const newSub: Subscription = {
                        id: uuidv4(),
                        name: selectedSubscription.merchant || 'Detected Subscription',
                        amount: selectedSubscription.amount || 0,
                        frequency: selectedSubscription.frequency || 'monthly',
                        nextPaymentDate: new Date(),
                        lastPaymentDate: undefined,
                        categoryId: '',
                        isActive: false,
                        notes: 'Detected from bank transactions - marked for cancellation',
                        detectedFromBank: true,
                        reminderEnabled: false,
                        reminderDays: 1,
                      };
                      setSubscriptions(prev => [...prev, newSub]);
                      setSelectedSubscription(null);
                    }}
                    className="flex-1"
                  >
                    Track as Cancelled
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}