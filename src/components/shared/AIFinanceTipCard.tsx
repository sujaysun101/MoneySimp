// src/components/shared/AIFinanceTipCard.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lightbulb, RefreshCw, Sparkles, Loader2, Calendar } from 'lucide-react';
import { getPersonalizedFinanceTip } from '@/app/actions';
import type { Expense, Subscription, Goal } from '@/lib/types';

interface SmartMoneyTipsProps {
  expenses?: Expense[];
  subscriptions?: Subscription[];
  goals?: Goal[];
}

interface DailyTip {
  tip: string;
  category: string;
  impact: 'low' | 'medium' | 'high';
  generatedDate: string;
}

export function AIFinanceTipCard({ 
  expenses = [], 
  subscriptions = [], 
  goals = []
}: SmartMoneyTipsProps) {
  const [currentTip, setCurrentTip] = useState<DailyTip | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<string>('');

  // Check for daily tip on mount
  useEffect(() => {
    const checkDailyTip = async () => {
      const today = new Date().toDateString();
      const stored = localStorage.getItem('smartMoneyTip');
      
      if (stored) {
        try {
          const storedTip = JSON.parse(stored);
          if (storedTip.date === today) {
            // Use today's tip
            setCurrentTip(storedTip);
            setLastGenerated('Today');
            return;
          }
        } catch (e) {
          console.log('Invalid stored tip, generating new one');
        }
      }
      
      // Generate new tip for today
      if (expenses.length > 0) {
        setIsLoading(true);
        setError(null);

        try {
          // Get recent expenses (last 7 days)
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          
          const recentExpenses = expenses.filter(exp => 
            new Date(exp.date) >= sevenDaysAgo
          );

          // Calculate recent spending patterns
          const recentTotal = recentExpenses.reduce((sum, exp) => sum + exp.amount, 0);
          const weeklyAverage = recentTotal;
          const monthlyProjection = weeklyAverage * 4.33;

          // Category breakdown
          const categorySpending = recentExpenses.reduce((acc, exp) => {
            acc[exp.categoryId] = (acc[exp.categoryId] || 0) + exp.amount;
            return acc;
          }, {} as Record<string, number>);

          const topCategory = Object.entries(categorySpending)
            .sort(([,a], [,b]) => b - a)[0];

          // Create concise data summary for AI
          const dataSummary = `Recent 7-day spending: $${recentTotal.toFixed(2)}. Monthly projection: $${monthlyProjection.toFixed(2)}. Top category: ${topCategory?.[0] || 'none'} ($${topCategory?.[1]?.toFixed(2) || '0'}). Active subscriptions: ${subscriptions.length}. Financial goals: ${goals.length}.`;

          console.log('Generating daily tip with recent data:', dataSummary);

          const result = await getPersonalizedFinanceTip({
            spendingHabits: dataSummary,
            recentTransactions: recentExpenses.slice(0, 5).map(exp => ({
              amount: exp.amount,
              category: exp.categoryId,
              date: new Date(exp.date).toISOString(),
              description: exp.description
            })),
            currentMonthSpending: categorySpending,
            subscriptions: subscriptions.map(sub => ({
              name: sub.name,
              amount: sub.amount,
              frequency: sub.frequency
            })),
            goals: goals.map(goal => ({
              name: goal.name,
              target: goal.targetAmount,
              saved: goal.savedAmount
            })),
            requestType: 'general'
          });

          if (result) {
            const dailyTip: DailyTip = {
              tip: result.tip,
              category: result.tipType.replace('_', ' '),
              impact: result.priority,
              generatedDate: new Date().toLocaleDateString()
            };
            
            setCurrentTip(dailyTip);
            setLastGenerated(new Date().toLocaleTimeString());
            
            // Store in localStorage with today's date
            localStorage.setItem('smartMoneyTip', JSON.stringify({
              ...dailyTip,
              date: today
            }));
            
            console.log('Daily tip generated successfully:', dailyTip);
          }
        } catch (err) {
          console.error('Error generating daily tip:', err);
          setError('Unable to generate tip. Please try again.');
        } finally {
          setIsLoading(false);
        }
      }
    };

    checkDailyTip();
  }, [expenses.length, subscriptions.length, goals.length]);

  // Handle refresh - generate new tip
  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get recent expenses (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentExpenses = expenses.filter(exp => 
        new Date(exp.date) >= sevenDaysAgo
      );

      // Calculate recent spending patterns
      const recentTotal = recentExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const weeklyAverage = recentTotal;
      const monthlyProjection = weeklyAverage * 4.33;

      // Category breakdown
      const categorySpending = recentExpenses.reduce((acc, exp) => {
        acc[exp.categoryId] = (acc[exp.categoryId] || 0) + exp.amount;
        return acc;
      }, {} as Record<string, number>);

      const topCategory = Object.entries(categorySpending)
        .sort(([,a], [,b]) => b - a)[0];

      // Create concise data summary for AI
      const dataSummary = `Recent 7-day spending: $${recentTotal.toFixed(2)}. Monthly projection: $${monthlyProjection.toFixed(2)}. Top category: ${topCategory?.[0] || 'none'} ($${topCategory?.[1]?.toFixed(2) || '0'}). Active subscriptions: ${subscriptions.length}. Financial goals: ${goals.length}.`;

      console.log('Refreshing tip with recent data:', dataSummary);

      const result = await getPersonalizedFinanceTip({
        spendingHabits: dataSummary,
        recentTransactions: recentExpenses.slice(0, 5).map(exp => ({
          amount: exp.amount,
          category: exp.categoryId,
          date: new Date(exp.date).toISOString(),
          description: exp.description
        })),
        currentMonthSpending: categorySpending,
        subscriptions: subscriptions.map(sub => ({
          name: sub.name,
          amount: sub.amount,
          frequency: sub.frequency
        })),
        goals: goals.map(goal => ({
          name: goal.name,
          target: goal.targetAmount,
          saved: goal.savedAmount
        })),
        requestType: 'general'
      });

      if (result) {
        const dailyTip: DailyTip = {
          tip: result.tip,
          category: result.tipType.replace('_', ' '),
          impact: result.priority,
          generatedDate: new Date().toLocaleDateString()
        };
        
        setCurrentTip(dailyTip);
        setLastGenerated(new Date().toLocaleTimeString());
        
        // Store in localStorage with today's date
        const today = new Date().toDateString();
        localStorage.setItem('smartMoneyTip', JSON.stringify({
          ...dailyTip,
          date: today
        }));
        
        console.log('New tip generated on refresh:', dailyTip);
      }
    } catch (err) {
      console.error('Error refreshing tip:', err);
      setError('Unable to generate tip. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [expenses, subscriptions, goals]);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-orange-600 bg-orange-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high': return 'High Impact';
      case 'medium': return 'Medium Impact';
      default: return 'Low Impact';
    }
  };

  return (
    <Card className="shadow-lg border-l-4 border-l-blue-500">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          Smart Money Tips
          <Badge variant="outline" className="text-xs">
            Daily AI
          </Badge>
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="h-8 w-8 p-0"
          title="Get new tip"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing your recent spending...
            </div>
            <div className="h-20 bg-muted/50 rounded animate-pulse" />
          </div>
        ) : error ? (
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : currentTip ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge 
                variant="secondary" 
                className={`${getImpactColor(currentTip.impact)} border-0`}
              >
                {getImpactBadge(currentTip.impact)}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {currentTip.category}
              </Badge>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border">
              <p className="text-sm leading-relaxed text-gray-700 font-medium">
                {currentTip.tip}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Generated: {lastGenerated}
              </span>
              <span>Based on your recent activity</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-2">No recent spending data</p>
            <p className="text-xs text-muted-foreground">Add some expenses to get personalized tips!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
