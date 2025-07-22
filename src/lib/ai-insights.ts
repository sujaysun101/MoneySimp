/**
 * @fileOverview AI-powered financial insights service that integrates spending analysis,
 * anomaly detection, and personalized recommendations into the app.
 */

import type { Expense, Subscription, Goal, Budget } from '@/lib/types';

export interface SpendingInsight {
  id: string;
  type: 'anomaly' | 'cost_saving' | 'forecast' | 'subscription' | 'general';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  potentialSavings?: number;
  actionItems: string[];
  category?: string;
  createdAt: Date;
}

export interface SpendingForecast {
  category: string;
  predictedAmount: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonalFactor?: number;
}

export class AIInsightsService {
  // Analyze spending patterns and generate insights
  static async generateSpendingInsights(
    expenses: Expense[],
    subscriptions: Subscription[],
    goals?: Goal[],
    budgets?: Budget[]
  ): Promise<SpendingInsight[]> {
    try {
      const spendingInsights: SpendingInsight[] = [];
      
      // Simple local analysis without AI
      const currentMonth = new Date();
      const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
      
      const currentMonthExpenses = expenses.filter(e => this.isSameMonth(e.date, currentMonth));
      const lastMonthExpenses = expenses.filter(e => this.isSameMonth(e.date, lastMonth));
      
      const currentTotal = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
      const lastTotal = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      // Spending increase alert
      if (lastTotal > 0 && currentTotal > lastTotal * 1.3) {
        spendingInsights.push({
          id: `spending-increase-${Date.now()}`,
          type: 'anomaly',
          title: 'Spending Alert',
          message: `Your spending this month ($${currentTotal.toFixed(2)}) is ${((currentTotal / lastTotal - 1) * 100).toFixed(0)}% higher than last month.`,
          severity: currentTotal > lastTotal * 1.5 ? 'high' : 'medium',
          actionItems: ['Review recent expenses', 'Set up spending alerts', 'Create a budget'],
          createdAt: new Date()
        });
      }
      
      // High subscription costs
      const monthlySubCost = subscriptions.reduce((sum, sub) => {
        const monthly = sub.frequency === 'monthly' ? sub.amount : 
                       sub.frequency === 'yearly' ? sub.amount / 12 : sub.amount;
        return sum + monthly;
      }, 0);
      
      if (monthlySubCost > 100) {
        spendingInsights.push({
          id: `sub-cost-${Date.now()}`,
          type: 'cost_saving',
          title: 'High Subscription Costs',
          message: `You're spending $${monthlySubCost.toFixed(2)}/month on ${subscriptions.length} subscriptions.`,
          severity: monthlySubCost > 200 ? 'high' : 'medium',
          potentialSavings: monthlySubCost * 0.25,
          actionItems: ['Review all subscriptions', 'Cancel unused services', 'Look for cheaper alternatives'],
          createdAt: new Date()
        });
      }
      
      return spendingInsights.sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });

    } catch (error) {
      console.error('Error generating spending insights:', error);
      return [];
    }
  }

  // Quick anomaly detection for real-time alerts
  static async detectCategoryAnomaly(
    category: string,
    currentAmount: number,
    expenses: Expense[]
  ): Promise<SpendingInsight | null> {
    try {
      // Get historical amounts for this category
      const historicalAmounts = this.getHistoricalCategorySpending(category, expenses, 6);
      
      if (historicalAmounts.length < 2) return null;

      // Simple anomaly detection
      const average = historicalAmounts.reduce((sum, amount) => sum + amount, 0) / historicalAmounts.length;
      const threshold = average * 1.5; // 50% above average is considered anomaly
      
      if (currentAmount <= threshold) return null;

      const severity: 'low' | 'medium' | 'high' = 
        currentAmount > average * 2 ? 'high' : 
        currentAmount > average * 1.75 ? 'medium' : 'low';

      return {
        id: `anomaly-${category}-${Date.now()}`,
        type: 'anomaly',
        title: 'Spending Alert',
        message: `Your ${category} spending ($${currentAmount.toFixed(2)}) is ${((currentAmount / average - 1) * 100).toFixed(0)}% above your usual average of $${average.toFixed(2)}.`,
        severity,
        category,
        actionItems: [
          'Review recent expenses in this category',
          'Consider setting up spending alerts',
          'Create a budget limit for this category'
        ],
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error detecting category anomaly:', error);
      return null;
    }
  }

  // Generate personalized tips with enhanced context
  static async generatePersonalizedTip(
    expenses: Expense[],
    subscriptions: Subscription[],
    goals?: Goal[],
    requestType?: 'general' | 'anomaly' | 'cost_cutting' | 'forecast' | 'subscription_optimization'
  ) {
    try {
      const currentMonth = new Date();
      const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);

      const currentMonthSpending = this.groupExpensesByCategory(
        expenses.filter(e => this.isSameMonth(e.date, currentMonth))
      );
      const previousMonthSpending = this.groupExpensesByCategory(
        expenses.filter(e => this.isSameMonth(e.date, lastMonth))
      );

      // Calculate spending changes
      const currentTotal = Object.values(currentMonthSpending).reduce((sum, amount) => sum + amount, 0);
      const previousTotal = Object.values(previousMonthSpending).reduce((sum, amount) => sum + amount, 0);
      const spendingChange = currentTotal - previousTotal;
      
      // Subscription-specific tips
      if (requestType === 'subscription_optimization' || subscriptions.length > 5) {
        const monthlySubTotal = subscriptions.reduce((sum, sub) => {
          const monthly = sub.frequency === 'monthly' ? sub.amount : 
                        sub.frequency === 'yearly' ? sub.amount / 12 : sub.amount;
          return sum + monthly;
        }, 0);
        
        return {
          tip: `You're spending $${monthlySubTotal.toFixed(2)}/month on ${subscriptions.length} subscriptions. Consider reviewing and canceling unused ones.`,
          tipType: 'subscription_optimization' as const,
          priority: monthlySubTotal > 100 ? 'high' as const : 'medium' as const,
          actionItems: [
            'Review all active subscriptions',
            'Cancel unused services',
            'Look for cheaper alternatives'
          ]
        };
      }
      
      // Spending increase tips
      if (spendingChange > 200) {
        return {
          tip: `Your spending increased by $${spendingChange.toFixed(2)} this month. Focus on your highest spending categories.`,
          tipType: 'anomaly' as const,
          priority: spendingChange > 500 ? 'high' as const : 'medium' as const,
          actionItems: [
            'Review recent large expenses',
            'Set up spending alerts',
            'Create category budgets'
          ]
        };
      }
      
      // Default tip
      return {
        tip: 'Track your expenses regularly to understand your spending patterns better.',
        tipType: 'general' as const,
        priority: 'medium' as const,
        actionItems: ['Review your recent expenses', 'Set up a monthly budget']
      };

    } catch (error) {
      console.error('Error generating personalized tip:', error);
      return {
        tip: 'Track your expenses regularly to understand your spending patterns better.',
        tipType: 'general' as const,
        priority: 'medium' as const,
        actionItems: ['Review your recent expenses', 'Set up a monthly budget']
      };
    }
  }

  // Helper methods
  private static groupExpensesByCategory(expenses: Expense[]): Record<string, number> {
    return expenses.reduce((acc, expense) => {
      acc[expense.categoryId] = (acc[expense.categoryId] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);
  }

  private static isSameMonth(date: Date, targetMonth: Date): boolean {
    return date.getFullYear() === targetMonth.getFullYear() && 
           date.getMonth() === targetMonth.getMonth();
  }

  private static isWithinDays(date: Date, days: number): boolean {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);
    return diffDays <= days;
  }

  private static getHistoricalCategorySpending(category: string, expenses: Expense[], months: number): number[] {
    const monthlyTotals: number[] = [];
    const now = new Date();
    
    for (let i = 1; i <= months; i++) {
      const targetMonth = new Date(now.getFullYear(), now.getMonth() - i);
      const monthExpenses = expenses.filter(e => 
        e.categoryId === category && this.isSameMonth(e.date, targetMonth)
      );
      const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      if (total > 0) monthlyTotals.push(total);
    }
    
    return monthlyTotals;
  }

  private static generateSpendingHabitsDescription(expenses: Expense[]): string {
    const categories = this.groupExpensesByCategory(expenses);
    const total = Object.values(categories).reduce((sum, amount) => sum + amount, 0);
    
    const descriptions = Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => {
        const percentage = ((amount / total) * 100).toFixed(1);
        return `${category}: $${amount.toFixed(2)} (${percentage}%)`;
      });

    return `Monthly spending breakdown: ${descriptions.join(', ')}. Total: $${total.toFixed(2)}`;
  }
}

export default AIInsightsService;