// src/lib/subscriptionUtils.ts
import type { Subscription } from '@/lib/types';
import { differenceInDays, isPast, isToday, addDays, addWeeks, addMonths, addYears } from 'date-fns';

export interface SubscriptionReminder {
  subscription: Subscription;
  type: 'overdue' | 'due-today' | 'due-soon' | 'upcoming';
  daysUntilDue: number;
  message: string;
}

export function getSubscriptionReminders(subscriptions: Subscription[]): SubscriptionReminder[] {
  const today = new Date();
  const reminders: SubscriptionReminder[] = [];
  
  subscriptions
    .filter(sub => sub.isActive && sub.reminderEnabled)
    .forEach(subscription => {
      const daysUntilDue = differenceInDays(subscription.nextPaymentDate, today);
      
      let type: SubscriptionReminder['type'];
      let message: string;
      
      if (isPast(subscription.nextPaymentDate) && !isToday(subscription.nextPaymentDate)) {
        type = 'overdue';
        message = `${subscription.name} payment is overdue!`;
      } else if (isToday(subscription.nextPaymentDate)) {
        type = 'due-today';
        message = `${subscription.name} payment is due today ($${subscription.amount.toFixed(2)})`;
      } else if (daysUntilDue <= subscription.reminderDays) {
        type = 'due-soon';
        message = `${subscription.name} payment is due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'} ($${subscription.amount.toFixed(2)})`;
      } else {
        type = 'upcoming';
        message = `${subscription.name} payment is due in ${daysUntilDue} days`;
      }
      
      reminders.push({
        subscription,
        type,
        daysUntilDue,
        message,
      });
    });
  
  // Sort by urgency (overdue first, then due today, then by days until due)
  return reminders.sort((a, b) => {
    const urgencyOrder = { 'overdue': 0, 'due-today': 1, 'due-soon': 2, 'upcoming': 3 };
    if (urgencyOrder[a.type] !== urgencyOrder[b.type]) {
      return urgencyOrder[a.type] - urgencyOrder[b.type];
    }
    return a.daysUntilDue - b.daysUntilDue;
  });
}

export function calculateNextPaymentDate(currentDate: Date, frequency: string): Date {
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
}

export function calculateMonthlyEquivalent(amount: number, frequency: string): number {
  const multipliers = {
    'daily': 30,
    'weekly': 4.33,
    'monthly': 1,
    'yearly': 1/12
  };
  return amount * (multipliers[frequency as keyof typeof multipliers] || 1);
}

export function detectPotentialSubscriptions(expenses: any[]): any[] {
  // This is a simplified version - in a real app you might want more sophisticated detection
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const recentExpenses = expenses.filter(expense => 
    new Date(expense.date) >= sixMonthsAgo
  );
  
  // Group by similar amounts and descriptions
  const groups = new Map();
  
  recentExpenses.forEach(expense => {
    const key = `${expense.description.toLowerCase().trim()}-${Math.round(expense.amount)}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(expense);
  });
  
  const potentialSubscriptions: any[] = [];
  
  groups.forEach((expenses, key) => {
    if (expenses.length >= 2) { // At least 2 occurrences
      expenses.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const intervals = [];
      for (let i = 1; i < expenses.length; i++) {
        const interval = differenceInDays(new Date(expenses[i].date), new Date(expenses[i-1].date));
        intervals.push(interval);
      }
      
      const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
      
      // Check if intervals are consistent (within 20% variance)
      const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
      const consistency = 1 - (Math.sqrt(variance) / avgInterval);
      
      if (consistency > 0.7) { // 70% consistency threshold
        let frequency: string;
        if (avgInterval <= 2) frequency = 'daily';
        else if (avgInterval <= 10) frequency = 'weekly';
        else if (avgInterval <= 45) frequency = 'monthly';
        else frequency = 'yearly';
        
        potentialSubscriptions.push({
          name: expenses[0].description,
          amount: expenses[0].amount,
          frequency,
          categoryId: expenses[0].categoryId,
          confidence: consistency,
          occurrences: expenses.length,
          lastDate: expenses[expenses.length - 1].date,
        });
      }
    }
  });
  
  return potentialSubscriptions.sort((a, b) => b.confidence - a.confidence);
}

// Browser notification utility
export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return Promise.resolve('denied');
  }
  
  if (Notification.permission === 'granted') {
    return Promise.resolve('granted');
  }
  
  if (Notification.permission === 'denied') {
    return Promise.resolve('denied');
  }
  
  return Notification.requestPermission();
}

export function showSubscriptionNotification(reminder: SubscriptionReminder): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }
  
  const options: NotificationOptions = {
    body: reminder.message,
    icon: '/icon-192x192.png', // Make sure you have this icon
    badge: '/icon-72x72.png',
    tag: `subscription-${reminder.subscription.id}`,
    requireInteraction: reminder.type === 'overdue' || reminder.type === 'due-today'
  };
  
  new Notification(`MoneySimp - ${reminder.type === 'overdue' ? 'Overdue Payment' : 'Payment Reminder'}`, options);
}
