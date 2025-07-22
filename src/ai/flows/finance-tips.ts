
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating personalized financial tips with rate limiting and caching.
 *
 * - generateFinanceTip - A function that generates personalized financial tips with fallbacks.
 * - FinanceTipInput - The input type for the generateFinanceTip function.
 * - FinanceTipOutput - The return type for the generateFinanceTip function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Add caching and rate limiting
const TIP_CACHE = new Map<string, { tip: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3; // Only 3 requests per minute
const REQUEST_TIMESTAMPS: number[] = [];

// Local fallback tips
const FALLBACK_TIPS = [
  {
    tip: "Review your subscriptions monthly. Cancel unused services to save $50-200 per month.",
    tipType: "subscription_optimization",
    priority: "medium",
    actionItems: ["Review all active subscriptions", "Cancel unused services", "Set reminder for monthly review"]
  },
  {
    tip: "Track your daily expenses for a week to identify spending patterns and potential savings.",
    tipType: "general",
    priority: "high",
    actionItems: ["Use expense tracking app", "Categorize all expenses", "Identify top spending categories"]
  },
  {
    tip: "Set up automatic transfers to savings. Even $25/week adds up to $1,300 per year.",
    tipType: "general",
    priority: "medium",
    actionItems: ["Set up automatic savings transfer", "Start with small amount", "Increase gradually"]
  },
  {
    tip: "Compare prices before major purchases. Use price comparison tools to save 10-30%.",
    tipType: "cost_saving",
    priority: "medium",
    actionItems: ["Research before buying", "Use price comparison websites", "Check for discount codes"]
  },
  {
    tip: "Cook meals at home 3 more times per week to save approximately $100-150 per month.",
    tipType: "cost_saving",
    priority: "high",
    actionItems: ["Plan weekly meals", "Buy groceries in bulk", "Prep meals in advance"]
  }
];

function isRateLimited(): boolean {
  const now = Date.now();
  // Remove old timestamps
  while (REQUEST_TIMESTAMPS.length > 0 && REQUEST_TIMESTAMPS[0] < now - RATE_LIMIT_WINDOW) {
    REQUEST_TIMESTAMPS.shift();
  }
  return REQUEST_TIMESTAMPS.length >= MAX_REQUESTS_PER_WINDOW;
}

function addRequestTimestamp(): void {
  REQUEST_TIMESTAMPS.push(Date.now());
}

function getCacheKey(input: any): string {
  const totalSpending = input.currentMonthSpending 
    ? Object.values(input.currentMonthSpending as Record<string, number>).reduce((a, b) => a + b, 0)
    : 0;
  
  return JSON.stringify({
    spendingHabits: input.spendingHabits,
    totalSpending,
    subscriptionCount: input.subscriptions?.length || 0
  });
}

function getFromCache(key: string): any | null {
  const cached = TIP_CACHE.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.tip;
  }
  return null;
}

function saveToCache(key: string, tip: any): void {
  TIP_CACHE.set(key, { tip, timestamp: Date.now() });
}

function getFallbackTip(requestType?: string): any {
  const filtered = requestType 
    ? FALLBACK_TIPS.filter(tip => tip.tipType === requestType)
    : FALLBACK_TIPS;
  
  const tips = filtered.length > 0 ? filtered : FALLBACK_TIPS;
  return tips[Math.floor(Math.random() * tips.length)];
}

const FinanceTipInputSchema = z.object({
  spendingHabits: z
    .string()
    .describe(
      'A detailed description of the user spending habits, including categories, amounts, and frequency.'
    ),
  recentTransactions: z.array(z.object({
    amount: z.number(),
    category: z.string(),
    date: z.string(),
    description: z.string(),
  })).optional(),
  currentMonthSpending: z.record(z.number()).optional(),
  previousMonthSpending: z.record(z.number()).optional(),
  subscriptions: z.array(z.object({
    name: z.string(),
    amount: z.number(),
    frequency: z.string(),
  })).optional(),
  goals: z.array(z.object({
    name: z.string(),
    target: z.number(),
    saved: z.number(),
  })).optional(),
  requestType: z.enum(['general', 'anomaly', 'cost_cutting', 'forecast', 'subscription_optimization']).optional(),
});
export type FinanceTipInput = z.infer<typeof FinanceTipInputSchema>;

const FinanceTipOutputSchema = z.object({
  tip: z.string().describe('A specific, actionable financial tip'),
  tipType: z.enum(['general', 'anomaly', 'cost_cutting', 'forecast', 'subscription_optimization']).default('general'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  actionItems: z.array(z.string()).describe('Specific steps the user can take'),
});
export type FinanceTipOutput = z.infer<typeof FinanceTipOutputSchema>;

export async function generateFinanceTip(input: FinanceTipInput): Promise<FinanceTipOutput> {
  const cacheKey = getCacheKey(input);
  
  // Check cache first
  const cachedTip = getFromCache(cacheKey);
  if (cachedTip) {
    console.log('Returning cached finance tip');
    return cachedTip;
  }
  
  // Check rate limiting
  if (isRateLimited()) {
    console.log('Rate limited, returning fallback tip');
    return getFallbackTip(input.requestType);
  }
  
  try {
    addRequestTimestamp();
    const result = await generateFinanceTipFlow(input);
    
    // Cache the result
    saveToCache(cacheKey, result);
    return result;
    
  } catch (error: any) {
    console.log('AI request failed, using fallback:', error.message);
    return getFallbackTip(input.requestType);
  }
}

const prompt = ai.definePrompt({
  name: 'financeTipPrompt',
  input: {schema: FinanceTipInputSchema},
  output: {schema: FinanceTipOutputSchema},
  prompt: `You are a personal finance advisor. Based on the user's spending habits and financial data, provide one actionable and personalized financial tip.

Spending Habits: {{{spendingHabits}}}
{{#if currentMonthSpending}}Current Month Spending: {{{currentMonthSpending}}}{{/if}}
{{#if subscriptions}}Subscriptions: {{{subscriptions}}}{{/if}}
{{#if goals}}Financial Goals: {{{goals}}}{{/if}}

Provide a specific, actionable tip with priority level and concrete action steps. Focus on the most impactful recommendation based on their data.`,
});

const generateFinanceTipFlow = ai.defineFlow(
  {
    name: 'generateFinanceTipFlow',
    inputSchema: FinanceTipInputSchema,
    outputSchema: FinanceTipOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      if (!output) {
        return getFallbackTip(input.requestType);
      }
      return output;
    } catch (error) {
      console.error('Flow execution failed:', error);
      return getFallbackTip(input.requestType);
    }
  }
);

// Explicitly export only types and the main async function
export {};
