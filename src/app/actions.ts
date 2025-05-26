
// src/app/actions.ts
'use server';
import { generateFinanceTip, type FinanceTipInput, type FinanceTipOutput } from '@/ai/flows/finance-tips';
import { extractBillInfo, type ExtractBillInfoInput, type ExtractBillInfoOutput, type ExtractedExpenseItem } from '@/ai/flows/extract-bill-info-flow';
import { CATEGORIES } from '@/lib/constants';
import type { Expense } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function getPersonalizedFinanceTip(spendingHabits: string): Promise<FinanceTipOutput> {
  try {
    if (!spendingHabits || spendingHabits.trim() === "") {
        // Provide a generic tip if no specific habits are available
        return { tip: "Track your expenses for at least a week to get a clearer picture of your spending habits. This will help in identifying areas where you can save." };
    }
    const input: FinanceTipInput = { spendingHabits };
    const result = await generateFinanceTip(input);
    return result;
  } catch (error) {
    console.error("Error generating finance tip:", error);
    // Return a user-friendly error message or a default tip
    return { tip: "Could not generate a tip at this moment. Try focusing on creating a budget for your key spending categories." };
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
