// src/components/subscriptions/SubscriptionDetection.tsx
"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Check, X, AlertTriangle, CreditCard, Sparkles, Landmark } from 'lucide-react';
import type { Expense, Subscription, BankAccount } from '@/lib/types';
import { CATEGORIES } from '@/lib/constants';
import { format, subMonths, differenceInDays } from 'date-fns';
import { SecureStorage } from '@/lib/encryption';
import { auth } from '@/lib/firebase';

interface DetectedSubscription {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'yearly' | 'weekly' | 'daily';
  categoryId: string;
  confidence: number;
  expenses: Expense[];
  nextPaymentDate: Date;
  source: 'yodlee_recurring' | 'pattern_detection' | 'manual_expenses';
  accountId?: string;
}

interface SubscriptionDetectionProps {
  expenses: Expense[];
  existingSubscriptions: Subscription[];
  onAddDetectedSubscription: (subscription: Omit<Subscription, 'id'>) => void;
}

export function SubscriptionDetection({ expenses, existingSubscriptions, onAddDetectedSubscription }: SubscriptionDetectionProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedSubscriptions, setDetectedSubscriptions] = useState<DetectedSubscription[]>([]);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  const analyzeSubscriptions = async () => {
    setIsAnalyzing(true);
    
    try {
      // First, try to get real bank data
      const user = auth?.currentUser;
      if (user) {
        const secureStorage = new SecureStorage(user.uid, user.email || '');
        const accounts = secureStorage.getItem<BankAccount[]>('bankAccounts') || [];
        setBankAccounts(accounts);
        
        if (accounts.length > 0) {
          await analyzeBankTransactions(secureStorage, user.uid);
        } else {
          // Fall back to manual expenses analysis
          analyzeManualExpenses();
        }
      } else {
        analyzeManualExpenses();
      }
    } catch (error) {
      console.error('Error analyzing subscriptions:', error);
      // Fall back to manual expenses analysis
      analyzeManualExpenses();
    }
    
    setIsAnalyzing(false);
    setHasAnalyzed(true);
  };

  const analyzeBankTransactions = async (secureStorage: SecureStorage, userId: string) => {
    try {
      const yodleeTokens = secureStorage.getItem<{[key: string]: string}>('yodleeAccessTokens') || {};
      const detected: DetectedSubscription[] = [];
      
      for (const [accountId, accessToken] of Object.entries(yodleeTokens)) {
        // Use Yodlee's subscription detection
        const response = await fetch('/api/yodlee/detect-subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken, userId }),
        });

        const data = await response.json();
        if (data.success && data.subscriptions) {
          data.subscriptions.forEach((sub: any) => {
            // Skip if already exists
            const exists = existingSubscriptions.some(existing => 
              existing.name.toLowerCase() === sub.name.toLowerCase()
            );
            
            if (!exists) {
              detected.push({
                id: `yodlee-${Date.now()}-${Math.random()}`,
                name: sub.name,
                amount: sub.amount,
                frequency: sub.frequency,
                categoryId: sub.categoryId,
                confidence: sub.confidence,
                expenses: [], // Bank transactions don't map to manual expenses
                nextPaymentDate: calculateNextPaymentDate(sub.lastDate || new Date(), sub.frequency),
                source: sub.source || 'yodlee_recurring',
                accountId: sub.accountId,
              });
            }
          });
        }
      }
      
      // Also analyze manual expenses for additional patterns
      const manualDetections = detectRecurringExpenses(expenses, existingSubscriptions);
      detected.push(...manualDetections.map(d => ({ ...d, source: 'manual_expenses' as const })));
      
      setDetectedSubscriptions(detected.sort((a, b) => b.confidence - a.confidence));
    } catch (error) {
      console.error('Error analyzing bank transactions:', error);
      // Fall back to manual analysis
      analyzeManualExpenses();
    }
  };

  const analyzeManualExpenses = () => {
    const detected = detectRecurringExpenses(expenses, existingSubscriptions);
    setDetectedSubscriptions(detected.map(d => ({ ...d, source: 'pattern_detection' as const })));
  };

  const detectRecurringExpenses = (allExpenses: Expense[], existing: Subscription[]): DetectedSubscription[] => {
    const sixMonthsAgo = subMonths(new Date(), 6);
    const recentExpenses = allExpenses.filter(expense => expense.date >= sixMonthsAgo);
    
    // Group expenses by description (normalized)
    const expenseGroups = new Map<string, Expense[]>();
    
    recentExpenses.forEach(expense => {
      const normalizedDescription = normalizeDescription(expense.description);
      if (!expenseGroups.has(normalizedDescription)) {
        expenseGroups.set(normalizedDescription, []);
      }
      expenseGroups.get(normalizedDescription)!.push(expense);
    });

    const detected: DetectedSubscription[] = [];
    const existingNames = new Set(existing.map(sub => sub.name.toLowerCase()));

    expenseGroups.forEach((expenses, description) => {
      if (expenses.length < 2) return; // Need at least 2 occurrences
      
      // Skip if already exists
      if (existingNames.has(description.toLowerCase())) return;

      // Sort by date
      expenses.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      const analysis = analyzeExpensePattern(expenses);
      
      if (analysis.confidence > 0.6) { // 60% confidence threshold
        const lastExpense = expenses[expenses.length - 1];
        const nextPaymentDate = calculateNextPaymentDate(lastExpense.date, analysis.frequency);
        
        detected.push({
          id: `detected-${Date.now()}-${Math.random()}`,
          name: description,
          amount: analysis.averageAmount,
          frequency: analysis.frequency,
          categoryId: lastExpense.categoryId,
          confidence: analysis.confidence,
          expenses: expenses,
          nextPaymentDate: nextPaymentDate,
          source: 'pattern_detection',
        });
      }
    });

    return detected.sort((a, b) => b.confidence - a.confidence);
  };

  const normalizeDescription = (description: string): string => {
    return description
      .toLowerCase()
      .replace(/\d+/g, '') // Remove numbers
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  };

  const analyzeExpensePattern = (expenses: Expense[]) => {
    const amounts = expenses.map(e => e.amount);
    const dates = expenses.map(e => e.date);
    
    // Calculate average amount
    const averageAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    
    // Calculate amount consistency
    const amountVariance = amounts.reduce((sum, amount) => sum + Math.pow(amount - averageAmount, 2), 0) / amounts.length;
    const amountConsistency = 1 - Math.min(amountVariance / averageAmount, 1);
    
    // Calculate date intervals
    const intervals: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      intervals.push(differenceInDays(dates[i], dates[i - 1]));
    }
    
    // Determine frequency based on intervals
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    let frequency: 'monthly' | 'yearly' | 'weekly' | 'daily';
    let expectedInterval: number;
    
    if (avgInterval <= 2) {
      frequency = 'daily';
      expectedInterval = 1;
    } else if (avgInterval <= 10) {
      frequency = 'weekly';
      expectedInterval = 7;
    } else if (avgInterval <= 45) {
      frequency = 'monthly';
      expectedInterval = 30;
    } else {
      frequency = 'yearly';
      expectedInterval = 365;
    }
    
    // Calculate interval consistency
    const intervalVariance = intervals.reduce((sum, interval) => sum + Math.pow(interval - expectedInterval, 2), 0) / intervals.length;
    const intervalConsistency = 1 - Math.min(intervalVariance / expectedInterval, 1);
    
    // Overall confidence score
    const confidence = (amountConsistency * 0.6 + intervalConsistency * 0.4);
    
    return {
      averageAmount,
      frequency,
      confidence: Math.max(0, Math.min(1, confidence)),
    };
  };

  const calculateNextPaymentDate = (lastPaymentDate: Date, frequency: string): Date => {
    const nextDate = new Date(lastPaymentDate);
    
    switch (frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }
    
    return nextDate;
  };

  const handleAddSubscription = (detected: DetectedSubscription) => {
    const newSubscription: Omit<Subscription, 'id'> = {
      name: detected.name,
      amount: detected.amount,
      frequency: detected.frequency,
      nextPaymentDate: detected.nextPaymentDate,
      categoryId: detected.categoryId,
      isActive: true,
      detectedFromBank: true,
      reminderEnabled: true,
      reminderDays: 3,
      notes: `Auto-detected from ${detected.expenses.length} similar expenses`,
    };
    
    onAddDetectedSubscription(newSubscription);
    
    // Remove from detected list
    setDetectedSubscriptions(prev => prev.filter(sub => sub.id !== detected.id));
  };

  const dismissSubscription = (id: string) => {
    setDetectedSubscriptions(prev => prev.filter(sub => sub.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Smart Subscription Detection
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasAnalyzed ? (
          <div className="text-center py-6">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Detect Recurring Expenses</h3>
            <p className="text-muted-foreground mb-4">
              Analyze your expense history to automatically identify potential subscriptions
            </p>
            <Button onClick={analyzeSubscriptions} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing expenses...
                </>
              ) : (
                'Analyze My Expenses'
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {isAnalyzing && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  Analyzing your expense patterns to detect recurring subscriptions...
                </AlertDescription>
              </Alert>
            )}
            
            {detectedSubscriptions.length === 0 && !isAnalyzing && (
              <Alert>
                <Check className="h-4 w-4" />
                <AlertDescription>
                  Great! No new recurring subscriptions were detected in your recent expenses.
                </AlertDescription>
              </Alert>
            )}
            
            {detectedSubscriptions.map((detected) => {
              const category = CATEGORIES.find(c => c.id === detected.categoryId);
              const CategoryIcon = category?.icon || CreditCard;
              
              return (
                <Card key={detected.id} className="border-orange-200 bg-orange-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <CategoryIcon className="h-5 w-5 text-orange-600" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{detected.name}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {Math.round(detected.confidence * 100)}% confidence
                            </Badge>
                          </div>
                          
                          <div className="text-sm text-muted-foreground mb-2">
                            ${detected.amount.toFixed(2)} • {detected.frequency} • {category?.name}
                          </div>
                          
                          <div className="text-xs text-muted-foreground">
                            Based on {detected.expenses.length} similar expenses from{' '}
                            {format(detected.expenses[0].date, 'MMM yyyy')} to{' '}
                            {format(detected.expenses[detected.expenses.length - 1].date, 'MMM yyyy')}
                          </div>
                          
                          <div className="text-xs text-muted-foreground mt-1">
                            Next payment estimated: {format(detected.nextPaymentDate, 'MMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleAddSubscription(detected)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => dismissSubscription(detected.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            <div className="text-center pt-4">
              <Button variant="outline" onClick={analyzeSubscriptions} disabled={isAnalyzing}>
                Re-analyze Expenses
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
