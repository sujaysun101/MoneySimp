
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating personalized financial tips based on user spending habits.
 *
 * - generateFinanceTip - A function that generates personalized financial tips.
 * - FinanceTipInput - The input type for the generateFinanceTip function.
 * - FinanceTipOutput - The return type for the generateFinanceTip function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FinanceTipInputSchema = z.object({
  spendingHabits: z
    .string()
    .describe(
      'A detailed description of the user spending habits, including categories, amounts, and frequency.'
    ),
});
export type FinanceTipInput = z.infer<typeof FinanceTipInputSchema>;

const FinanceTipOutputSchema = z.object({
  tip: z.string().describe('A personalized financial tip based on the user spending habits.'),
});
export type FinanceTipOutput = z.infer<typeof FinanceTipOutputSchema>;

export async function generateFinanceTip(input: FinanceTipInput): Promise<FinanceTipOutput> {
  return generateFinanceTipFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financeTipPrompt',
  input: {schema: FinanceTipInputSchema},
  output: {schema: FinanceTipOutputSchema},
  prompt: `You are a personal finance advisor. Based on the user's spending habits, provide one actionable and personalized financial tip.

Spending Habits: {{{spendingHabits}}}

Tip: `,
});

const generateFinanceTipFlow = ai.defineFlow(
  {
    name: 'generateFinanceTipFlow',
    inputSchema: FinanceTipInputSchema,
    outputSchema: FinanceTipOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      // Handle the case where output might be null or undefined, though Genkit definePrompt with schema should ensure structure
      return { tip: "Could not generate a tip at this moment. Try to create a clear budget." };
    }
    return output;
  }
);

// Explicitly export only types and the main async function
export {
    type FinanceTipInput,
    type FinanceTipOutput
};
