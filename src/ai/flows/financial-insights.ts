/**
 * AI-powered financial insights and analysis functions
 */

export interface AnalysisInput {
  currentMonthSpending: Record<string, number>;
  previousMonthsSpending: Record<string, number>[];
  subscriptions: Array<{
    name: string;
    amount: number;
    frequency: string;
    category: string;
  }>;
  goals?: Array<{
    name: string;
    targetAmount: number;
    savedAmount: number;
  }>;
}

export interface InsightsOutput {
  spendingAnomalies: Array<{
    alert: string;
    severity: 'low' | 'medium' | 'high';
    category?: string;
  }>;
  costCuttingSuggestions: Array<{
    suggestion: string;
    difficulty: 'easy' | 'medium' | 'hard';
    potentialSavings: number;
    category?: string;
  }>;
  priorityRecommendations: Array<{
    title: string;
    description: string;
    urgency: 'low' | 'medium' | 'high';
  }>;
}

export interface AnomalyResult {
  isAnomaly: boolean;
  message: string;
  severity: 'low' | 'medium' | 'high';
  suggestion?: string;
}

export async function analyzeSpendingPatterns(input: AnalysisInput): Promise<InsightsOutput> {
  const insights: InsightsOutput = {
    spendingAnomalies: [],
    costCuttingSuggestions: [],
    priorityRecommendations: []
  };

  try {
    // Analyze spending anomalies
    const currentTotal = Object.values(input.currentMonthSpending).reduce((sum, amount) => sum + amount, 0);
    const previousTotal = input.previousMonthsSpending[0] ? 
      Object.values(input.previousMonthsSpending[0]).reduce((sum, amount) => sum + amount, 0) : 0;

    if (previousTotal > 0 && currentTotal > previousTotal * 1.3) {
      insights.spendingAnomalies.push({
        alert: `Your spending this month ($${currentTotal.toFixed(2)}) is ${((currentTotal / previousTotal - 1) * 100).toFixed(0)}% higher than last month.`,
        severity: currentTotal > previousTotal * 1.5 ? 'high' : 'medium'
      });
    }

    // Analyze by category
    Object.entries(input.currentMonthSpending).forEach(([category, amount]) => {
      const previousAmount = input.previousMonthsSpending[0]?.[category] || 0;
      
      if (previousAmount > 0 && amount > previousAmount * 1.5) {
        insights.spendingAnomalies.push({
          alert: `${category} spending increased by ${((amount / previousAmount - 1) * 100).toFixed(0)}%`,
          severity: amount > previousAmount * 2 ? 'high' : 'medium',
          category
        });
      }
    });

    // Generate cost-cutting suggestions
    const highSpendingCategories = Object.entries(input.currentMonthSpending)
      .filter(([, amount]) => amount > 200)
      .sort(([, a], [, b]) => b - a);

    highSpendingCategories.forEach(([category, amount]) => {
      if (category.toLowerCase().includes('dining') || category.toLowerCase().includes('restaurant')) {
        insights.costCuttingSuggestions.push({
          suggestion: `Consider meal planning and cooking at home more often to reduce dining expenses`,
          difficulty: 'easy',
          potentialSavings: amount * 0.3,
          category
        });
      }
      
      if (category.toLowerCase().includes('entertainment')) {
        insights.costCuttingSuggestions.push({
          suggestion: `Look for free or low-cost entertainment alternatives`,
          difficulty: 'easy',
          potentialSavings: amount * 0.2,
          category
        });
      }
    });

    // Subscription analysis
    const monthlySubCost = input.subscriptions.reduce((sum, sub) => {
      const monthlyCost = sub.frequency === 'monthly' ? sub.amount : 
                         sub.frequency === 'yearly' ? sub.amount / 12 : sub.amount;
      return sum + monthlyCost;
    }, 0);

    if (monthlySubCost > 100) {
      insights.costCuttingSuggestions.push({
        suggestion: `Review your ${input.subscriptions.length} subscriptions costing $${monthlySubCost.toFixed(2)}/month total`,
        difficulty: 'easy',
        potentialSavings: monthlySubCost * 0.25,
        category: 'subscriptions'
      });
    }

    // Priority recommendations
    if (currentTotal > 3000) {
      insights.priorityRecommendations.push({
        title: 'High Monthly Spending',
        description: 'Consider creating a detailed budget to track and control expenses',
        urgency: 'high'
      });
    }

    if (input.goals && input.goals.length > 0) {
      const underperformingGoals = input.goals.filter(goal => 
        goal.savedAmount < goal.targetAmount * 0.5
      );
      
      if (underperformingGoals.length > 0) {
        insights.priorityRecommendations.push({
          title: 'Goal Progress',
          description: `You have ${underperformingGoals.length} goals that need more attention`,
          urgency: 'medium'
        });
      }
    }

  } catch (error) {
    console.error('Error analyzing spending patterns:', error);
  }

  return insights;
}

export async function checkSpendingAnomaly(
  category: string,
  currentAmount: number,
  historicalAmounts: number[]
): Promise<AnomalyResult> {
  try {
    if (historicalAmounts.length === 0) {
      return {
        isAnomaly: false,
        message: 'No historical data available',
        severity: 'low'
      };
    }

    const average = historicalAmounts.reduce((sum, amount) => sum + amount, 0) / historicalAmounts.length;
    const threshold = average * 1.5; // 50% above average

    if (currentAmount <= threshold) {
      return {
        isAnomaly: false,
        message: 'Spending is within normal range',
        severity: 'low'
      };
    }

    const percentageIncrease = ((currentAmount / average - 1) * 100).toFixed(0);
    const severity: 'low' | 'medium' | 'high' = 
      currentAmount > average * 2 ? 'high' : 
      currentAmount > average * 1.75 ? 'medium' : 'low';

    return {
      isAnomaly: true,
      message: `${category} spending ($${currentAmount.toFixed(2)}) is ${percentageIncrease}% above your average of $${average.toFixed(2)}`,
      severity,
      suggestion: severity === 'high' ? 
        `Consider reviewing recent ${category} expenses and setting a spending limit` :
        `Monitor ${category} spending more closely this month`
    };

  } catch (error) {
    console.error('Error checking spending anomaly:', error);
    return {
      isAnomaly: false,
      message: 'Error analyzing spending data',
      severity: 'low'
    };
  }
}
