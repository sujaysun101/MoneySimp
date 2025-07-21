// src/components/subscriptions/SubscriptionList.tsx
"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, Trash2, ExternalLink, Bell, BellOff, Calendar, DollarSign, RefreshCw } from 'lucide-react';
import type { Subscription } from '@/lib/types';
import { CATEGORIES } from '@/lib/constants';
import { format, differenceInDays, isPast, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { CancellationHelper } from './CancellationHelper';

interface SubscriptionListProps {
  subscriptions: Subscription[];
  onDeleteSubscription: (subscriptionId: string) => void;
  onEditSubscription: (subscription: Subscription) => void;
  onToggleActive: (subscriptionId: string) => void;
}

export function SubscriptionList({ subscriptions, onDeleteSubscription, onEditSubscription, onToggleActive }: SubscriptionListProps) {
  if (subscriptions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <RefreshCw className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Subscriptions Yet</h3>
          <p className="text-muted-foreground">Add your first subscription to start tracking your recurring expenses.</p>
        </CardContent>
      </Card>
    );
  }

  const getFrequencyDisplay = (frequency: string) => {
    const displays = {
      daily: 'Daily',
      weekly: 'Weekly', 
      monthly: 'Monthly',
      yearly: 'Yearly'
    };
    return displays[frequency as keyof typeof displays] || frequency;
  };

  const getPaymentStatus = (nextPaymentDate: Date) => {
    const today = new Date();
    const daysUntilPayment = differenceInDays(nextPaymentDate, today);
    
    if (isPast(nextPaymentDate) && !isToday(nextPaymentDate)) {
      return { status: 'overdue', label: 'Overdue', variant: 'destructive' as const };
    } else if (isToday(nextPaymentDate)) {
      return { status: 'today', label: 'Due Today', variant: 'destructive' as const };
    } else if (daysUntilPayment <= 3) {
      return { status: 'soon', label: `Due in ${daysUntilPayment} day${daysUntilPayment === 1 ? '' : 's'}`, variant: 'secondary' as const };
    } else if (daysUntilPayment <= 7) {
      return { status: 'upcoming', label: `Due in ${daysUntilPayment} days`, variant: 'outline' as const };
    } else {
      return { status: 'normal', label: `Due ${format(nextPaymentDate, 'MMM d')}`, variant: 'outline' as const };
    }
  };

  const calculateMonthlyAmount = (amount: number, frequency: string) => {
    const multipliers = {
      daily: 30,
      weekly: 4.33,
      monthly: 1,
      yearly: 1/12
    };
    return amount * (multipliers[frequency as keyof typeof multipliers] || 1);
  };

  // Group subscriptions by status
  const activeSubscriptions = subscriptions.filter(sub => sub.isActive);
  const inactiveSubscriptions = subscriptions.filter(sub => !sub.isActive);

  // Sort active subscriptions by next payment date
  const sortedActiveSubscriptions = activeSubscriptions.sort((a, b) => 
    a.nextPaymentDate.getTime() - b.nextPaymentDate.getTime()
  );

  const totalMonthlyAmount = activeSubscriptions.reduce((total, sub) => 
    total + calculateMonthlyAmount(sub.amount, sub.frequency), 0
  );

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Subscription Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{activeSubscriptions.length}</div>
              <div className="text-sm text-muted-foreground">Active Subscriptions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">${totalMonthlyAmount.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Est. Monthly Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {activeSubscriptions.filter(sub => {
                  const status = getPaymentStatus(sub.nextPaymentDate);
                  return status.status === 'today' || status.status === 'overdue' || status.status === 'soon';
                }).length}
              </div>
              <div className="text-sm text-muted-foreground">Due Soon/Overdue</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Subscriptions */}
      {sortedActiveSubscriptions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Active Subscriptions</h3>
          <div className="grid gap-4">
            {sortedActiveSubscriptions.map((subscription) => {
              const category = CATEGORIES.find(c => c.id === subscription.categoryId);
              const paymentStatus = getPaymentStatus(subscription.nextPaymentDate);
              const CategoryIcon = category?.icon || DollarSign;
              
              return (
                <Card key={subscription.id} className={cn(
                  "transition-all duration-200 hover:shadow-md",
                  paymentStatus.status === 'overdue' && "border-red-200 bg-red-50/50",
                  paymentStatus.status === 'today' && "border-orange-200 bg-orange-50/50"
                )}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <CategoryIcon className="h-6 w-6 text-primary" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-lg">{subscription.name}</h4>
                            {subscription.detectedFromBank && (
                              <Badge variant="secondary" className="text-xs">Auto-detected</Badge>
                            )}
                          </div>
                          
                          {subscription.provider && (
                            <p className="text-sm text-muted-foreground mb-2">{subscription.provider}</p>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              ${subscription.amount.toFixed(2)} {getFrequencyDisplay(subscription.frequency).toLowerCase()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(subscription.nextPaymentDate, 'MMM d, yyyy')}
                            </span>
                            {subscription.reminderEnabled ? (
                              <span className="flex items-center gap-1 text-green-600">
                                <Bell className="h-4 w-4" />
                                Reminders on
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <BellOff className="h-4 w-4" />
                                No reminders
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={paymentStatus.variant}>
                              {paymentStatus.label}
                            </Badge>
                            <Badge variant="outline">
                              {category?.name || 'Other'}
                            </Badge>
                          </div>

                          {subscription.notes && (
                            <p className="text-sm text-muted-foreground mt-2">{subscription.notes}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <CancellationHelper subscription={subscription} />
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditSubscription(subscription)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onToggleActive(subscription.id)}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          Pause
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Subscription</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the subscription for "{subscription.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDeleteSubscription(subscription.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Inactive Subscriptions */}
      {inactiveSubscriptions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-muted-foreground">Paused Subscriptions</h3>
          <div className="grid gap-4">
            {inactiveSubscriptions.map((subscription) => {
              const category = CATEGORIES.find(c => c.id === subscription.categoryId);
              const CategoryIcon = category?.icon || DollarSign;
              
              return (
                <Card key={subscription.id} className="opacity-60">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-2 bg-muted rounded-lg">
                          <CategoryIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-lg">{subscription.name}</h4>
                            <Badge variant="secondary">Paused</Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>${subscription.amount.toFixed(2)} {getFrequencyDisplay(subscription.frequency).toLowerCase()}</span>
                            <span>{category?.name || 'Other'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onToggleActive(subscription.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          Resume
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Subscription</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the subscription for "{subscription.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDeleteSubscription(subscription.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
