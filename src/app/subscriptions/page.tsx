"use client";

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { SubscriptionForm, type SubscriptionFormValues } from '@/components/subscriptions/SubscriptionForm';
import { SubscriptionList } from '@/components/subscriptions/SubscriptionList';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SUBSCRIPTIONS_STORAGE_KEY } from '@/lib/constants';
import type { Subscription } from '@/lib/types';

function readSubscriptions(): Subscription[] {
  const raw = localStorage.getItem(SUBSCRIPTIONS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((sub: Subscription) => ({
      ...sub,
      nextPaymentDate: new Date(sub.nextPaymentDate),
      lastPaymentDate: sub.lastPaymentDate ? new Date(sub.lastPaymentDate) : undefined,
    }));
  } catch {
    return [];
  }
}

function monthlyAmount(sub: Subscription) {
  if (sub.frequency === 'yearly') return sub.amount / 12;
  if (sub.frequency === 'weekly') return sub.amount * 4.33;
  if (sub.frequency === 'daily') return sub.amount * 30;
  return sub.amount;
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [editing, setEditing] = useState<Subscription | null>(null);

  const persist = useCallback((next: Subscription[]) => {
    setSubscriptions(next);
    localStorage.setItem(SUBSCRIPTIONS_STORAGE_KEY, JSON.stringify(next));
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('moneySimpLoggedIn')) {
      router.replace('/login');
      return;
    }
    setSubscriptions(readSubscriptions());
    setLoading(false);
  }, [router]);

  function onSubmit(data: SubscriptionFormValues, editingId?: string) {
    if (editingId) {
      persist(subscriptions.map((sub) => sub.id === editingId ? { ...sub, ...data, isActive: sub.isActive, detectedFromBank: sub.detectedFromBank } : sub));
      setEditing(null);
      return;
    }
    persist([{
      id: uuidv4(),
      ...data,
      isActive: true,
      detectedFromBank: false,
    }, ...subscriptions]);
  }

  if (loading) return <PageSkeleton />;

  const activeMonthly = subscriptions.filter((sub) => sub.isActive).reduce((sum, sub) => sum + monthlyAmount(sub), 0);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-1 py-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold sm:text-3xl">Subscriptions</h2>
          <p className="text-muted-foreground">Recurring charges and the next renewal date.</p>
        </div>
        <p className="text-sm text-muted-foreground">About ${activeMonthly.toFixed(2)} / month active</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editing ? 'Edit subscription' : 'Add a subscription'}</CardTitle>
          <CardDescription>Reminders use the next payment date and the lead time you set.</CardDescription>
        </CardHeader>
        <CardContent>
          <SubscriptionForm
            onSubscriptionSubmit={onSubmit}
            editingSubscription={editing}
            onCancelEdit={() => setEditing(null)}
          />
        </CardContent>
      </Card>

      <SubscriptionList
        subscriptions={subscriptions}
        onDeleteSubscription={(id) => persist(subscriptions.filter((sub) => sub.id !== id))}
        onEditSubscription={setEditing}
        onToggleActive={(id) => persist(subscriptions.map((sub) => sub.id === id ? { ...sub, isActive: !sub.isActive } : sub))}
      />
    </div>
  );
}
