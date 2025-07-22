
// src/app/actions.ts
'use server';
import { generateFinanceTip, type FinanceTipInput, type FinanceTipOutput } from '@/ai/flows/finance-tips';
import { extractBillInfo, type ExtractBillInfoInput, type ExtractBillInfoOutput, type ExtractedExpenseItem } from '@/ai/flows/extract-bill-info-flow';
import { CATEGORIES } from '@/lib/constants';
import type { Expense } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function getPersonalizedFinanceTip(input: any): Promise<FinanceTipOutput> {
  try {
    console.log('Generating personalized finance tip with enhanced fallbacks');
    
    // Try AI generation first
    const result = await generateFinanceTip(input);
    
    // Validate the result
    if (result && result.tip && result.tip.length > 10) {
      return result;
    }
    
    throw new Error('AI tip generation returned invalid result');
    
  } catch (error) {
    console.error('Error in getPersonalizedFinanceTip:', error);
    
    // Enhanced fallbacks based on input data
    const { currentMonthSpending, subscriptions, goals, requestType } = input;
    
    // Analyze spending data for personalized fallback
    if (currentMonthSpending && Object.keys(currentMonthSpending).length > 0) {
      const spendingValues = Object.values(currentMonthSpending) as number[];
      const totalSpending = spendingValues.reduce((a, b) => a + b, 0);
      const categories = Object.keys(currentMonthSpending);
      
      if (totalSpending > 2000) {
        return {
          tip: `Your monthly spending is $${totalSpending.toFixed(0)}. Consider tracking daily expenses to identify savings opportunities of 10-15%.`,
          tipType: "cost_cutting",
          priority: "high",
          actionItems: [
            "Review your top 3 spending categories",
            "Set daily spending alerts",
            "Try the 24-hour rule for non-essential purchases",
            "Find one category to reduce by 20%"
          ]
        };
      }
    }
    
    // Subscription-specific tip
    if (subscriptions && subscriptions.length > 2) {
      const monthlySubCost = subscriptions.reduce((sum: number, sub: any) => {
        const monthly = sub.frequency === 'yearly' ? (sub.amount || 0) / 12 : (sub.amount || 0);
        return sum + monthly;
      }, 0);
      
      return {
        tip: `You have ${subscriptions.length} subscriptions costing ~$${monthlySubCost.toFixed(0)}/month. Review and cancel unused services to save money.`,
        tipType: "subscription_optimization",
        priority: "medium",
        actionItems: [
          "List all active subscriptions",
          "Check usage for each service this month",
          "Cancel subscriptions unused in 30+ days",
          "Set monthly subscription review reminder"
        ]
      };
    }
    
    // Goal-specific tip
    if (goals && goals.length > 0) {
      const activeGoal = goals[0];
      const progress = ((activeGoal.saved || 0) / (activeGoal.target || 1)) * 100;
      
      return {
        tip: `Your goal "${activeGoal.name}" is ${progress.toFixed(0)}% complete. Automate savings to reach it faster.`,
        tipType: "general",
        priority: "medium",
        actionItems: [
          "Set up automatic transfers to goal savings",
          "Calculate weekly savings needed",
          "Find one expense to cut for your goal",
          "Track progress weekly"
        ]
      };
    }
    
    // Request type specific fallbacks
    switch (requestType) {
      case 'subscription_optimization':
        return {
          tip: "Review all your monthly subscriptions. The average person can save $50-100/month by canceling unused services.",
          tipType: "subscription_optimization",
          priority: "medium",
          actionItems: [
            "List all recurring charges",
            "Cancel unused subscriptions",
            "Negotiate better rates for kept services",
            "Set monthly review reminder"
          ]
        };
        
      case 'cost_cutting':
        return {
          tip: "Cook meals at home 3 more times per week to save $100-200 monthly on dining expenses.",
          tipType: "cost_cutting",
          priority: "high",
          actionItems: [
            "Plan weekly meals in advance",
            "Create grocery shopping list",
            "Batch cook on weekends",
            "Learn 5 quick, healthy recipes"
          ]
        };
        
      case 'forecast':
        return {
          tip: "Track expenses for 2 weeks to predict monthly spending patterns and identify budget leaks.",
          tipType: "forecast",
          priority: "medium",
          actionItems: [
            "Use expense tracking app daily",
            "Categorize every purchase",
            "Calculate average daily spending",
            "Set realistic monthly budget limits"
          ]
        };
        
      default:
        return {
          tip: "Start tracking all expenses for one week to gain awareness of spending patterns. Small changes can lead to 10-15% savings.",
          tipType: "general",
          priority: "high",
          actionItems: [
            "Track every purchase for 7 days",
            "Categorize all expenses",
            "Identify top 3 spending categories",
            "Set target to reduce one category by 10%"
          ]
        };
    }
  }
}

export async function extractAndRecordBill(photoDataUri: string): Promise<{ success: boolean; expenses?: Partial<Expense>[]; message: string }> {
  try {
    const input: ExtractBillInfoInput = { photoDataUri };
    const result: ExtractBillInfoOutput = await extractBillInfo(input);

    if (!result.expenses || result.expenses.length === 0) {
      return { success: false, message: "No expenses could be extracted from the bill." };
    }

    const newExpenses: Partial<Expense>[] = result.expenses.map((item: ExtractedExpenseItem) => {
      const category = CATEGORIES.find(c => c.name.toLowerCase() === item.categoryName.toLowerCase());
      const newDate = new Date(item.date);
      // Validate date
      const validDate = isNaN(newDate.getTime()) ? new Date() : newDate;

      return {
        id: uuidv4(), // Will be added by handleAddExpense usually, but good to have a placeholder if needed directly
        description: item.description || "Scanned Item",
        amount: item.amount || 0,
        categoryId: category ? category.id : 'other', // Default to 'other' if no match
        date: validDate,
        // billUrl could be added here if we store the uploaded image
      };
    });

    return { success: true, expenses: newExpenses, message: "Expenses extracted successfully." };

  } catch (error) {
    console.error("Error extracting bill information:", error);
    return { success: false, message: "Failed to extract information from the bill. Please try again or enter manually." };
  }
}
