"use client";

import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Globe,
  Loader2,
  DollarSign,
  TrendingUp,
  CreditCard,
  PiggyBank,
  Wallet,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Layers,
  Edit2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { BankAccount } from '@/lib/types';
import { ACCOUNTS_STORAGE_KEY } from '@/lib/constants';
import { format } from 'date-fns';

const DEMO_ACCOUNTS: BankAccount[] = [
  {
    id: 'demo_chk_1',
    institutionId: 'inst_chase',
    institutionName: 'Chase Bank',
    accountId: 'acc_chase_chk',
    name: 'Total Checking',
    officialName: 'Chase Premier Plus Checking',
    type: 'checking',
    balance: { current: 4320.50, available: 4250.00 },
    mask: '4821',
    isActive: true,
    lastSynced: new Date(),
    currency: 'USD',
    provider: 'demo',
  },
  {
    id: 'demo_sav_1',
    institutionId: 'inst_ally',
    institutionName: 'Ally Bank',
    accountId: 'acc_ally_sav',
    name: 'High Yield Savings',
    officialName: 'Ally Online Savings (4.25% APY)',
    type: 'savings',
    balance: { current: 15850.00, available: 15850.00 },
    mask: '9012',
    isActive: true,
    lastSynced: new Date(),
    currency: 'USD',
    provider: 'demo',
  },
  {
    id: 'demo_crd_1',
    institutionId: 'inst_amex',
    institutionName: 'American Express',
    accountId: 'acc_amex_gold',
    name: 'Gold Card',
    officialName: 'American Express Gold Rewards',
    type: 'credit',
    balance: { current: -785.40, limit: 10000.00 },
    mask: '3104',
    isActive: true,
    lastSynced: new Date(),
    currency: 'USD',
    provider: 'demo',
  },
  {
    id: 'demo_inv_1',
    institutionId: 'inst_vanguard',
    institutionName: 'Vanguard',
    accountId: 'acc_vanguard_tax',
    name: 'Brokerage Index Fund',
    officialName: 'Vanguard 500 Index Admiral',
    type: 'investment',
    balance: { current: 22400.00 },
    mask: '7749',
    isActive: true,
    lastSynced: new Date(),
    currency: 'USD',
    provider: 'demo',
  },
];

export default function AccountsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Manual Account Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [instName, setInstName] = useState('');
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<BankAccount['type']>('checking');
  const [balance, setBalance] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [mask, setMask] = useState('');
  const [currency, setCurrency] = useState('USD');

  // Edit Account Balance State
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [editBalance, setEditBalance] = useState('');

  // Yodlee Modal State
  const [isYodleeModalOpen, setIsYodleeModalOpen] = useState(false);
  const [isYodleeLoading, setIsYodleeLoading] = useState(false);

  // Load Accounts from LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored).map((a: any) => ({
          ...a,
          lastSynced: new Date(a.lastSynced || Date.now()),
        }));
        setAccounts(parsed);
      } else {
        // First time initialization: populate with demo accounts for immediate delight
        setAccounts(DEMO_ACCOUNTS);
        localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(DEMO_ACCOUNTS));
      }
    } catch (e) {
      console.error('Failed to parse accounts:', e);
      setAccounts(DEMO_ACCOUNTS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveAccounts = (newAccounts: BankAccount[]) => {
    setAccounts(newAccounts);
    try {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(newAccounts));
    } catch (e) {
      console.error('Failed to save accounts:', e);
    }
  };

  const handleLoadDemo = () => {
    saveAccounts(DEMO_ACCOUNTS);
    toast({
      title: 'Demo Portfolio Loaded',
      description: 'Loaded checking, savings, credit, and investment demo accounts.',
    });
  };

  const handleAddManualAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instName || !accName || !balance) {
      toast({ title: 'Missing Information', description: 'Please fill in institution, name, and balance.', variant: 'destructive' });
      return;
    }

    const numBalance = parseFloat(balance);
    const numLimit = creditLimit ? parseFloat(creditLimit) : undefined;

    const newAcc: BankAccount = {
      id: `acc_manual_${Date.now()}`,
      institutionId: `inst_${instName.toLowerCase().replace(/\s+/g, '_')}`,
      institutionName: instName,
      accountId: `acc_${Date.now()}`,
      name: accName,
      officialName: `${instName} ${accName}`,
      type: accType,
      balance: {
        current: accType === 'credit' ? -Math.abs(numBalance) : numBalance,
        available: accType === 'credit' ? (numLimit ? numLimit - Math.abs(numBalance) : undefined) : numBalance,
        limit: numLimit,
      },
      mask: mask ? mask.slice(-4) : Math.floor(1000 + Math.random() * 9000).toString(),
      isActive: true,
      lastSynced: new Date(),
      currency: currency.toUpperCase(),
      provider: 'manual',
    };

    saveAccounts([...accounts, newAcc]);
    setIsManualModalOpen(false);
    setInstName('');
    setAccName('');
    setBalance('');
    setCreditLimit('');
    setMask('');

    toast({
      title: 'Account Added',
      description: `${newAcc.name} (${newAcc.institutionName}) has been added.`,
    });
  };

  const handleSaveEditedBalance = () => {
    if (!editingAccount) return;
    const num = parseFloat(editBalance);
    if (isNaN(num)) return;

    const updated = accounts.map(a => {
      if (a.id === editingAccount.id) {
        return {
          ...a,
          balance: {
            ...a.balance,
            current: a.type === 'credit' ? -Math.abs(num) : num,
          },
          lastSynced: new Date(),
        };
      }
      return a;
    });

    saveAccounts(updated);
    setEditingAccount(null);
    toast({ title: 'Balance Updated', description: 'New account balance recorded.' });
  };

  const handleDeleteAccount = (id: string) => {
    const updated = accounts.filter(a => a.id !== id);
    saveAccounts(updated);
    toast({ title: 'Account Removed', description: 'The account was removed from your tracking.' });
  };

  const handleSyncAccount = (id: string) => {
    const updated = accounts.map(a => {
      if (a.id === id) {
        return { ...a, lastSynced: new Date() };
      }
      return a;
    });
    saveAccounts(updated);
    toast({ title: 'Account Refreshed', description: 'Synchronized with latest balance records.' });
  };

  // Calculations
  const totalAssets = accounts
    .filter(a => a.type !== 'credit' && a.type !== 'loan')
    .reduce((sum, a) => sum + (a.balance.current || 0), 0);

  const totalLiabilities = accounts
    .filter(a => a.type === 'credit' || a.type === 'loan')
    .reduce((sum, a) => sum + Math.abs(a.balance.current || 0), 0);

  const netWorth = totalAssets - totalLiabilities;
  const liquidCash = accounts
    .filter(a => a.type === 'checking' || a.type === 'savings')
    .reduce((sum, a) => sum + (a.balance.current || 0), 0);

  const getAccountIcon = (type: BankAccount['type']) => {
    switch (type) {
      case 'checking': return Landmark;
      case 'savings': return PiggyBank;
      case 'credit': return CreditCard;
      case 'investment': return TrendingUp;
      default: return Wallet;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Linked Accounts & Assets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Aggregated balances, bank connections, cash flow liquidity, and liability tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleLoadDemo} className="text-xs">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-accent" />
            Reset Demo
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsYodleeModalOpen(true)}
            className="text-xs border-primary/30 text-primary hover:bg-primary/10"
          >
            <Globe className="w-3.5 h-3.5 mr-1" />
            Live Bank Sync
          </Button>

          <Button
            size="sm"
            onClick={() => setIsManualModalOpen(true)}
            className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Net Worth & Liquidity Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Net Worth
            </CardTitle>
            <DollarSign className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">
              ${netWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-primary font-medium mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> Across {accounts.length} linked accounts
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Liquid Cash (Checking + Savings)
            </CardTitle>
            <Wallet className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${liquidCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Available for immediate expenses</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Debt & Credit
            </CardTitle>
            <CreditCard className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              ${totalLiabilities.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Active credit card balances</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Investments
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ${(totalAssets - liquidCash).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Equities, retirement & brokerages</p>
          </CardContent>
        </Card>
      </div>

      {/* Account Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Your Accounts</h2>
          <span className="text-xs text-muted-foreground font-mono">{accounts.length} active</span>
        </div>

        {accounts.length === 0 ? (
          <Card className="border-dashed border-2 p-12 text-center">
            <Landmark className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold text-lg text-foreground">No Accounts Connected</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
              Add your accounts manually or load our sample portfolio to test tracking.
            </p>
            <div className="flex justify-center gap-3">
              <Button size="sm" onClick={() => setIsManualModalOpen(true)} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-1" /> Add Account
              </Button>
              <Button size="sm" variant="outline" onClick={handleLoadDemo}>
                Load Demo Portfolio
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map(acc => {
              const Icon = getAccountIcon(acc.type);
              const isCredit = acc.type === 'credit' || acc.type === 'loan';
              const displayBalance = Math.abs(acc.balance.current);

              return (
                <Card key={acc.id} className="border-border hover:border-primary/40 hover:shadow-md transition-all">
                  <CardHeader className="pb-3 flex flex-row items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                        acc.type === 'checking' ? 'bg-primary/10 text-primary' :
                        acc.type === 'savings' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                        acc.type === 'credit' ? 'bg-accent/15 text-accent' :
                        'bg-purple-500/10 text-purple-600'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold leading-tight">{acc.name}</CardTitle>
                        <CardDescription className="text-xs font-mono">
                          {acc.institutionName} •••• {acc.mask}
                        </CardDescription>
                      </div>
                    </div>

                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                      {acc.type}
                    </Badge>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground">Current Balance</span>
                      <div className="text-right">
                        <span className={`text-xl font-bold ${isCredit ? 'text-accent' : 'text-foreground'}`}>
                          {isCredit ? '-' : ''}${displayBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <div className="text-[11px] text-muted-foreground font-mono">{acc.currency}</div>
                      </div>
                    </div>

                    {acc.balance.limit && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-muted-foreground">
                          <span>Limit: ${acc.balance.limit.toLocaleString()}</span>
                          <span>{Math.round((displayBalance / acc.balance.limit) * 100)}% utilized</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-accent h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, Math.round((displayBalance / acc.balance.limit) * 100))}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Clock className="w-3 h-3" />
                        {format(new Date(acc.lastSynced), 'MMM d, h:mm a')}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingAccount(acc);
                            setEditBalance(Math.abs(acc.balance.current).toString());
                          }}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Edit Balance"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleSyncAccount(acc.id)}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary"
                          title="Sync"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAccount(acc.id)}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ADD MANUAL ACCOUNT MODAL */}
      <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleAddManualAccount}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Add Account
              </DialogTitle>
              <DialogDescription>
                Track checking, savings, credit cards, or cash balances without connecting bank credentials.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Financial Institution *</label>
                <Input
                  type="text"
                  placeholder="e.g. Chase, Bank of America, Fidelity"
                  value={instName}
                  onChange={e => setInstName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Account Nickname *</label>
                <Input
                  type="text"
                  placeholder="e.g. Primary Checking, Emergency Fund"
                  value={accName}
                  onChange={e => setAccName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Account Type</label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={accType}
                    onChange={e => setAccType(e.target.value as any)}
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="credit">Credit Card</option>
                    <option value="investment">Investment / Brokerage</option>
                    <option value="loan">Loan / Mortgage</option>
                    <option value="other">Cash / Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Currency</label>
                  <Input
                    type="text"
                    placeholder="USD"
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Current Balance ($) *</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={balance}
                    onChange={e => setBalance(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Last 4 Digits</label>
                  <Input
                    type="text"
                    maxLength={4}
                    placeholder="1234"
                    value={mask}
                    onChange={e => setMask(e.target.value)}
                  />
                </div>
              </div>

              {accType === 'credit' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Credit Limit ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="5000.00"
                    value={creditLimit}
                    onChange={e => setCreditLimit(e.target.value)}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsManualModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                Save Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT BALANCE MODAL */}
      <Dialog open={Boolean(editingAccount)} onOpenChange={open => !open && setEditingAccount(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Balance</DialogTitle>
            <DialogDescription>
              {editingAccount?.name} ({editingAccount?.institutionName})
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-2">
            <label className="text-xs font-semibold">New Balance ($)</label>
            <Input
              type="number"
              step="0.01"
              value={editBalance}
              onChange={e => setEditBalance(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAccount(null)}>Cancel</Button>
            <Button onClick={handleSaveEditedBalance} className="bg-primary hover:bg-primary/90">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* YODLEE INTEGRATION MODAL */}
      <Dialog open={isYodleeModalOpen} onOpenChange={setIsYodleeModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Automated Bank Connection
            </DialogTitle>
            <DialogDescription>
              Connect to 17,000+ banks worldwide via secure FastLink.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm text-muted-foreground">
            <Alert className="bg-primary/5 border-primary/20">
              <Shield className="w-4 h-4 text-primary" />
              <AlertDescription className="text-xs text-foreground">
                Bank credentials are never stored by MoneySimp. Encryption is end-to-end via bank-grade tokens.
              </AlertDescription>
            </Alert>

            <div className="space-y-2 text-xs">
              <p><strong>Environment:</strong> Sandbox (Free Developer Tier)</p>
              <p><strong>Coverage:</strong> US, UK, Canada, Australia, India, and EU institutions.</p>
              <p className="text-muted-foreground">
                To link real credentials or custom sandboxes, ensure <code>NEXT_PUBLIC_YODLEE_CLIENT_ID</code> is configured in your environment file.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsYodleeModalOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setIsYodleeModalOpen(false);
                toast({
                  title: 'Sandbox Simulation',
                  description: 'Loaded certified sample bank accounts for demonstration.',
                });
                handleLoadDemo();
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Simulate Bank Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
