// src/components/subscriptions/SubscriptionReminders.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, ExternalLink, ChevronRight, AlertTriangle } from 'lucide-react';
import type { Subscription } from '@/lib/types';
import { getSubscriptionReminders, type SubscriptionReminder } from '@/lib/subscriptionUtils';
import { SUBSCRIPTIONS_STORAGE_KEY } from '@/lib/constants';
import Link from 'next/link';
import { format } from 'date-fns';

interface SubscriptionRemindersProps {
  maxItems?: number;
  showViewAll?: boolean;
}

export function SubscriptionReminders({ maxItems = 5, showViewAll = true }: SubscriptionRemindersProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [reminders, setReminders] = useState<SubscriptionReminder[]>([]);

  useEffect(() => {
    const loadSubscriptions = () => {
      const storedSubscriptions = localStorage.getItem(SUBSCRIPTIONS_STORAGE_KEY);
      if (storedSubscriptions) {
        try {
          const parsedData = JSON.parse(storedSubscriptions);
          const parsedSubscriptions: Subscription[] = parsedData.map((sub: any) => ({
            ...sub,
            nextPaymentDate: new Date(sub.nextPaymentDate),
            lastPaymentDate: sub.lastPaymentDate ? new Date(sub.lastPaymentDate) : undefined,
          }));
          setSubscriptions(parsedSubscriptions);
        } catch (error) {
          console.error("Failed to parse subscriptions:", error);
          setSubscriptions([]);
        }
      }
    };

    loadSubscriptions();
    
    // Update reminders every minute
    const interval = setInterval(loadSubscriptions, 60000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const activeReminders = getSubscriptionReminders(subscriptions).slice(0, maxItems);
    setReminders(activeReminders);
  }, [subscriptions, maxItems]);

  if (reminders.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" />
            Subscription Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <BellOff className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No upcoming payments</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getVariantForType = (type: SubscriptionReminder['type']) => {
    switch (type) {
      case 'overdue':
        return 'destructive' as const;
      case 'due-today':
        return 'destructive' as const;
      case 'due-soon':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  const getIconForType = (type: SubscriptionReminder['type']) => {
    switch (type) {
      case 'overdue':
        return <AlertTriangle className="h-4 w-4" />;
      case 'due-today':
        return <Bell className="h-4 w-4" />;
      case 'due-soon':
        return <Bell className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Subscription Reminders
          </div>
          {reminders.length > 0 && (
            <Badge variant="secondary">
              {reminders.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {reminders.map((reminder) => (
          <div
            key={reminder.subscription.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                {getIconForType(reminder.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm truncate">
                    {reminder.subscription.name}
                  </p>
                  <Badge variant={getVariantForType(reminder.type)} className="text-xs">
                    {reminder.type === 'overdue' ? 'Overdue' : 
                     reminder.type === 'due-today' ? 'Today' :
                     reminder.type === 'due-soon' ? 'Soon' : 'Upcoming'}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>${reminder.subscription.amount.toFixed(2)}</span>
                  <span>•</span>
                  <span>{format(reminder.subscription.nextPaymentDate, 'MMM d')}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-2">
              {reminder.subscription.cancellationUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(reminder.subscription.cancellationUrl, '_blank')}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
              
              <Link href="/subscriptions">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        ))}
        
        {showViewAll && (
          <div className="pt-2">
            <Link href="/subscriptions">
              <Button variant="outline" size="sm" className="w-full">
                View All Subscriptions
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
