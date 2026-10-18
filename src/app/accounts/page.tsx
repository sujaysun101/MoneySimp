"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Landmark, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { ACCOUNTS_STORAGE_KEY } from '@/lib/constants';
import { isDemoMode } from '@/lib/demo-client';
import type { BankAccount } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';

function readAccounts(): BankAccount[] {
  const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((account: BankAccount) => ({
      ...account,
      lastSynced: new Date(account.lastSynced),
    }));
  } catch {
    return [];
  }
}

export default function AccountsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [demo, setDemo] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const yodleeReady = Boolean(process.env.NEXT_PUBLIC_YODLEE_CLIENT_ID);

  useEffect(() => {
    if (!localStorage.getItem('moneySimpLoggedIn')) {
      router.replace('/login');
      return;
    }
    setDemo(isDemoMode());
    setAccounts(readAccounts());
    setLoading(false);
  }, [router]);

  async function connectBank() {
    const user = auth?.currentUser;
    if (!user) {
      toast({ title: 'Sign in required', description: 'Bank linking uses your Firebase account, not the demo household.', variant: 'destructive' });
      return;
    }
    setConnecting(true);
    try {
      const response = await fetch('/api/yodlee/fastlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, callbackUrl: `${window.location.origin}/api/yodlee/callback` }),
      });
      const data = await response.json();
      if (!response.ok || !data.fastLinkUrl) {
        throw new Error(data.error || 'Yodlee did not return a connection link.');
      }
      window.open(data.fastLinkUrl, 'yodlee-fastlink', 'width=800,height=700');
      toast({ title: 'Bank connection', description: 'Finish linking in the window that opened.' });
    } catch (error) {
      toast({
        title: 'Could not start bank linking',
        description: error instanceof Error ? error.message : 'Try again after checking Yodlee credentials.',
        variant: 'destructive',
      });
    } finally {
      setConnecting(false);
    }
  }

  if (loading) return <PageSkeleton />;

  const net = accounts.reduce((sum, account) => {
    const current = account.balance?.current || 0;
    return account.type === 'credit' || account.type === 'loan' ? sum - current : sum + current;
  }, 0);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-1 py-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold sm:text-3xl">Accounts</h2>
          <p className="text-muted-foreground">Balances you track here. Linking a bank is optional.</p>
        </div>
        <p className="text-sm text-muted-foreground">Net {net < 0 ? '-' : ''}${Math.abs(net).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Landmark className="h-10 w-10 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No accounts yet</h3>
            <p className="max-w-md text-sm text-muted-foreground">You can log expenses without a bank. The demo household includes sample checking, savings, and card balances.</p>
            <Button asChild variant="outline"><Link href="/expenses">Add an expense instead</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-lg">{account.name}</CardTitle>
                  <Badge variant={account.provider === 'demo' ? 'secondary' : 'outline'}>
                    {account.provider === 'demo' ? 'Sample' : account.type}
                  </Badge>
                </div>
                <CardDescription>{account.institutionName} · ···· {account.mask}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  ${account.balance.current.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="mt-1 text-sm capitalize text-muted-foreground">{account.type}{account.balance.limit ? ` · limit $${account.balance.limit.toLocaleString('en-US')}` : ''}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Link a bank</CardTitle>
          <CardDescription>
            {demo
              ? 'Demo mode keeps these sample balances on this browser. Sign out and create an account when you want to connect a live institution through Yodlee.'
              : yodleeReady
                ? 'Yodlee is configured for this environment. Connecting opens their secure window.'
                : 'Yodlee credentials are not set, so live bank linking stays off. Expense tracking still works.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={connectBank} disabled={demo || !yodleeReady || connecting}>
            {connecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {demo ? 'Unavailable in the demo' : yodleeReady ? 'Connect with Yodlee' : 'Yodlee is not configured'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
