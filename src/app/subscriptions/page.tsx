"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  RefreshCw,
  Plus,
  Sparkles,
  AlertTriangle,
  Calendar,
  DollarSign,
  TrendingDown,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Filter,
  Search,
  Bell,
  HelpCircle,
  Sliders
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SubscriptionList } from '@/components/subscriptions/SubscriptionList';
import { SubscriptionForm, type SubscriptionFormValues } from '@/components/subscriptions/SubscriptionForm';
import { SubscriptionDetection } from '@/components/subscriptions/SubscriptionDetection';
import { useToast } from '@/hooks/use-toast';
import type { Subscription, Expense } from '@/lib/types';
import { SUBSCRIPTIONS_STORAGE_KEY, EXPENSES_STORAGE_KEY } from '@/lib/constants';
import { format, differenceInDays, addMonths, addDays } from 'date-fns';

const DEMO_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'sub_netflix',
    name: 'Netflix Premium 4K',
    amount: 22.99,
    frequency: 'monthly',
    nextPaymentDate: addDays(new Date(), 4),
    categoryId: 'entertainment',
    isActive: true,
    detectedFromBank: true,
    reminderEnabled: true,
    reminderDays: 3,
    provider: 'Netflix',
    cancellationUrl: 'https://www.netflix.com/youraccount',
    notes: 'Family streaming account',
  },
  {
    id: 'sub_spotify',
    name: 'Spotify Family Plan',
    amount: 16.99,
    frequency: 'monthly',
    nextPaymentDate: addDays(new Date(), 11),
    categoryId: 'entertainment',
    isActive: true,
    detectedFromBank: true,
    reminderEnabled: true,
    reminderDays: 3,
    provider: 'Spotify',
    cancellationUrl: 'https://www.spotify.com/account/subscription/',
  },
  {
    id: 'sub_chatgpt',
    name: 'ChatGPT Plus (OpenAI)',
    amount: 20.00,
    frequency: 'monthly',
    nextPaymentDate: addDays(new Date(), 19),
    categoryId: 'business',
    isActive: true,
    detectedFromBank: false,
    reminderEnabled: true,
    reminderDays: 2,
    provider: 'OpenAI',
    cancellationUrl: 'https://chat.openai.com/#settings',
    notes: 'Tax-deductible AI assistant',
  },
  {
    id: 'sub_prime',
    name: 'Amazon Prime Annual',
    amount: 139.00,
    frequency: 'yearly',
    nextPaymentDate: addDays(new Date(), 65),
    categoryId: 'other',
    isActive: true,
    detectedFromBank: true,
    reminderEnabled: true,
    reminderDays: 7,
    provider: 'Amazon',
    cancellationUrl: 'https://www.amazon.com/mc/manage',
  },
  {
    id: 'sub_gym',
    name: 'Equinox Fitness Club',
    amount: 240.00,
    frequency: 'monthly',
    nextPaymentDate: addDays(new Date(), 2),
    categoryId: 'healthcare',
    isActive: true,
    detectedFromBank: false,
    reminderEnabled: true,
    reminderDays: 5,
    provider: 'Equinox',
    notes: 'Review usage pace',
  },
  {
    id: 'sub_icloud',
    name: 'iCloud+ 2TB Storage',
    amount: 9.99,
    frequency: 'monthly',
    nextPaymentDate: addDays(new Date(), 24),
    categoryId: 'utilities',
    isActive: false, // Paused
    detectedFromBank: false,
    reminderEnabled: false,
    reminderDays: 3,
    provider: 'Apple',
  },
];

export default function SubscriptionsPage() {
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Load subscriptions and expenses from localStorage
  useEffect(() => {
    try {
      const storedSubs = localStorage.getItem(SUBSCRIPTIONS_STORAGE_KEY);
      if (storedSubs) {
        const parsed = JSON.parse(storedSubs).map((s: any) => ({
          ...s,
          nextPaymentDate: new Date(s.nextPaymentDate || Date.now()),
          lastPaymentDate: s.lastPaymentDate ? new Date(s.lastPaymentDate) : undefined,
        }));
        setSubscriptions(parsed);
      } else {
        setSubscriptions(DEMO_SUBSCRIPTIONS);
        localStorage.setItem(SUBSCRIPTIONS_STORAGE_KEY, JSON.stringify(DEMO_SUBSCRIPTIONS));
      }

      const storedExp = localStorage.getItem(EXPENSES_STORAGE_KEY);
      if (storedExp) {
        const parsedExp = JSON.parse(storedExp).map((e: any) => ({
          ...e,
          date: new Date(e.date || Date.now()),
        }));
        setExpenses(parsedExp);
      }
    } catch (err) {
      console.error('Failed to load subscriptions/expenses:', err);
      setSubscriptions(DEMO_SUBSCRIPTIONS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSubscriptions = (newList: Subscription[]) => {
    setSubscriptions(newList);
    try {
      localStorage.setItem(SUBSCRIPTIONS_STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
      console.error('Failed to save subscriptions:', e);
    }
  };

  const handleResetDemo = () => {
    saveSubscriptions(DEMO_SUBSCRIPTIONS);
    toast({
      title: 'Demo Subscriptions Loaded',
      description: 'Loaded sample SaaS, entertainment, and membership subscriptions.',
    });
  };

  const handleFormSubmit = (data: SubscriptionFormValues, editingId?: string) => {
    if (editingId) {
      const updated = subscriptions.map(sub => {
        if (sub.id === editingId) {
          return {
            ...sub,
            ...data,
          };
        }
        return sub;
      });
      saveSubscriptions(updated);
      toast({ title: 'Subscription Updated', description: `${data.name} has been updated.` });
    } else {
      const newSub: Subscription = {
        id: `sub_${Date.now()}`,
        ...data,
        isActive: true,
        detectedFromBank: false,
      };
      saveSubscriptions([...subscriptions, newSub]);
      toast({ title: 'Subscription Added', description: `${data.name} is now tracked.` });
    }
    setIsFormOpen(false);
    setEditingSub(null);
  };

  const handleDelete = (id: string) => {
    const updated = subscriptions.filter(s => s.id !== id);
    saveSubscriptions(updated);
    toast({ title: 'Subscription Removed', description: 'Item removed from your tracking list.' });
  };

  const handleToggleActive = (id: string) => {
    const updated = subscriptions.map(s => {
      if (s.id === id) {
        const nextState = !s.isActive;
        toast({
          title: nextState ? 'Subscription Resumed' : 'Subscription Paused',
          description: `${s.name} marked as ${nextState ? 'active' : 'inactive'}.`,
        });
        return { ...s, isActive: nextState };
      }
      return s;
    });
    saveSubscriptions(updated);
  };

  const handleAddDetected = (detected: Omit<Subscription, 'id'>) => {
    const newSub: Subscription = {
      id: `sub_det_${Date.now()}`,
      ...detected,
    };
    saveSubscriptions([...subscriptions, newSub]);
    toast({
      title: 'Added From Detection',
      description: `${newSub.name} ($${newSub.amount}/${newSub.frequency}) added to your subscriptions.`,
    });
  };

  // Financial Metrics Calculations
  const metrics = useMemo(() => {
    const active = subscriptions.filter(s => s.isActive);
    let monthlyBurn = 0;

    for (const sub of active) {
      if (sub.frequency === 'daily') monthlyBurn += sub.amount * 30;
      else if (sub.frequency === 'weekly') monthlyBurn += sub.amount * 4.33;
      else if (sub.frequency === 'monthly') monthlyBurn += sub.amount;
      else if (sub.frequency === 'yearly') monthlyBurn += sub.amount / 12;
    }

    const annualBurn = monthlyBurn * 12;

    // Find closest upcoming renewal
    const now = new Date();
    const sortedUpcoming = [...active].sort(
      (a, b) => new Date(a.nextPaymentDate).getTime() - new Date(b.nextPaymentDate).getTime()
    );
    const nextSub = sortedUpcoming[0];

    return {
      monthlyBurn,
      annualBurn,
      activeCount: active.length,
      inactiveCount: subscriptions.length - active.length,
      nextSub,
    };
  }, [subscriptions]);

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(s => {
      const matchSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.provider && s.provider.toLowerCase().includes(search.toLowerCase()));

      if (filterStatus === 'active') return matchSearch && s.isActive;
      if (filterStatus === 'inactive') return matchSearch && !s.isActive;
      return matchSearch;
    });
  }, [subscriptions, search, filterStatus]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Subscriptions & Recurring Bills</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Detect silent subscription creep, forecast renewal drains, and eliminate unused memberships.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleResetDemo} className="text-xs">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-accent" />
            Reset Demo
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setEditingSub(null);
              setIsFormOpen(true);
            }}
            className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Subscription
          </Button>
        </div>
      </div>

      {/* Burn Rate Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Monthly Burn Rate
            </CardTitle>
            <DollarSign className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-accent">
              ${metrics.monthlyBurn.toFixed(2)}
              <span className="text-xs text-muted-foreground font-normal"> / mo</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active recurring commitments
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Annualized Projection
            </CardTitle>
            <TrendingDown className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${metrics.annualBurn.toFixed(2)}
              <span className="text-xs text-muted-foreground font-normal"> / yr</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">If all services renew for 1 year</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tracked Services
            </CardTitle>
            <RefreshCw className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {metrics.activeCount} <span className="text-xs font-normal text-muted-foreground">active</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{metrics.inactiveCount} paused or cancelled</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Nearest Renewal
            </CardTitle>
            <Calendar className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            {metrics.nextSub ? (
              <div>
                <div className="text-lg font-bold text-foreground truncate">{metrics.nextSub.name}</div>
                <p className="text-xs text-accent font-semibold mt-0.5">
                  ${metrics.nextSub.amount.toFixed(2)} • Due in {Math.max(0, differenceInDays(new Date(metrics.nextSub.nextPaymentDate), new Date()))} days
                </p>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No upcoming renewals</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs Layout */}
      <Tabs defaultValue="list" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              Active Subscriptions ({metrics.activeCount})
            </TabsTrigger>
            <TabsTrigger value="detection" className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              Smart AI Detection
            </TabsTrigger>
            <TabsTrigger value="playbooks" className="flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              Cancellation Playbooks
            </TabsTrigger>
          </TabsList>

          {/* Quick Filters */}
          <div className="flex items-center gap-2">
            <div className="relative w-48 sm:w-60">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-3" />
              <Input
                type="text"
                placeholder="Search subscriptions..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>

            <select
              className="h-9 rounded-md border border-input bg-background px-2.5 text-xs"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Paused Only</option>
            </select>
          </div>
        </div>

        {/* TAB 1: ALL SUBSCRIPTIONS */}
        <TabsContent value="list" className="pt-4">
          <SubscriptionList
            subscriptions={filteredSubscriptions}
            onDeleteSubscription={handleDelete}
            onEditSubscription={sub => {
              setEditingSub(sub);
              setIsFormOpen(true);
            }}
            onToggleActive={handleToggleActive}
          />
        </TabsContent>

        {/* TAB 2: SMART AI DETECTION */}
        <TabsContent value="detection" className="pt-4">
          <SubscriptionDetection
            expenses={expenses}
            existingSubscriptions={subscriptions}
            onAddDetectedSubscription={handleAddDetected}
          />
        </TabsContent>

        {/* TAB 3: CANCELLATION PLAYBOOKS */}
        <TabsContent value="playbooks" className="pt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-accent" />
                Zero-Fee Direct Cancellation Guides
              </CardTitle>
              <CardDescription>
                Other apps charge you a 30-40% finder fee to cancel your subscriptions. MoneySimp gives you direct 1-click access to cancel yourself for free.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Netflix', url: 'https://www.netflix.com/youraccount', steps: 'Account → Cancel Membership → Finish Cancellation' },
                  { name: 'Spotify', url: 'https://www.spotify.com/account/subscription/', steps: 'Your Plan → Change Plan → Scroll to Cancel Spotify' },
                  { name: 'Amazon Prime', url: 'https://www.amazon.com/mc/manage', steps: 'Manage Membership → Update, Cancel and More → End Membership' },
                  { name: 'Apple / App Store', url: 'https://support.apple.com/HT202039', steps: 'Settings → Apple ID → Subscriptions → Select & Cancel' },
                  { name: 'OpenAI ChatGPT', url: 'https://chat.openai.com/#settings', steps: 'Profile Icon → My Plan → Manage My Subscription → Cancel' },
                  { name: 'Adobe Creative Cloud', url: 'https://account.adobe.com/plans', steps: 'Manage Plan → Cancel your plan → Select reason & confirm' },
                  { name: 'Gym / Equinox', url: 'https://www.equinox.com/contactus', steps: 'Submit written notice 30 days prior or cancel via concierge app' },
                  { name: 'Google One / YouTube', url: 'https://myaccount.google.com/payments-and-subscriptions', steps: 'Subscriptions → Manage → Cancel Subscription' },
                ].map(item => (
                  <div key={item.name} className="p-4 rounded-xl border border-border bg-card space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground text-sm">{item.name}</span>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
                      >
                        Cancel Link <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.steps}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ADD / EDIT SUBSCRIPTION DIALOG */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSub ? `Edit: ${editingSub.name}` : 'Track New Subscription'}
            </DialogTitle>
            <DialogDescription>
              Set up automated renewal reminders and keep tabs on recurring bill drains.
            </DialogDescription>
          </DialogHeader>

          <SubscriptionForm
            onSubscriptionSubmit={handleFormSubmit}
            editingSubscription={editingSub}
            onCancelEdit={() => {
              setIsFormOpen(false);
              setEditingSub(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
