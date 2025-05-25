// src/app/actions.ts
'use server';
import { generateFinanceTip, type FinanceTipInput, type FinanceTipOutput } from '@/ai/flows/finance-tips';

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
