
/**
 * @fileOverview This file defines a Genkit flow for generating personalized financial tips with rate limiting and caching.
 *
 * - generateFinanceTip - A function that generates personalized financial tips with fallbacks.
 * - FinanceTipInput - The input type for the generateFinanceTip function.
 * - FinanceTipOutput - The return type for the generateFinanceTip function.
 */

import {getAi, geminiConfigured} from '@/ai/genkit';
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

const money = z.number().finite().min(-1_000_000).max(1_000_000);
export const FinanceTipInputSchema = z.object({
  spendingHabits: z
    .string()
    .min(1)
    .max(4000)
    .describe(
      'A detailed description of the user spending habits, including categories, amounts, and frequency.'
    ),
  recentTransactions: z.array(z.object({
    amount: money,
    category: z.string().max(80),
    date: z.string().max(40),
    description: z.string().max(200),
  })).max(30).optional(),
  currentMonthSpending: z.record(z.string().max(80), money).optional(),
  previousMonthSpending: z.record(z.string().max(80), money).optional(),
  subscriptions: z.array(z.object({
    name: z.string().max(120),
    amount: money,
    frequency: z.string().max(40),
  })).max(30).optional(),
  goals: z.array(z.object({
    name: z.string().max(120),
    target: money,
    saved: money,
  })).max(30).optional(),
  requestType: z.enum(['general', 'anomaly', 'cost_cutting', 'forecast', 'subscription_optimization']).optional(),
}).refine((value) => {
  const spendingKeys = Object.keys(value.currentMonthSpending || {}).length + Object.keys(value.previousMonthSpending || {}).length;
  return spendingKeys <= 80;
}, { message: 'Too many spending categories.' });
export type FinanceTipInput = z.infer<typeof FinanceTipInputSchema>;

const FinanceTipOutputSchema = z.object({
  tip: z.string().describe('A specific, actionable financial tip'),
  tipType: z.enum(['general', 'anomaly', 'cost_cutting', 'forecast', 'subscription_optimization']).default('general'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  actionItems: z.array(z.string()).describe('Specific steps the user can take'),
});
export type FinanceTipOutput = z.infer<typeof FinanceTipOutputSchema>;

export type FinanceTipResult = FinanceTipOutput & {
  sample?: boolean;
  label?: string;
};

const TIP_TYPES = ['general', 'anomaly', 'cost_cutting', 'forecast', 'subscription_optimization'] as const;
const PRIORITIES = ['low', 'medium', 'high'] as const;

function normalizeTip(raw: { tip?: string; tipType?: string; priority?: string; actionItems?: string[] }): FinanceTipOutput {
  const mappedType = raw.tipType === 'cost_saving' ? 'cost_cutting' : raw.tipType;
  return {
    tip: typeof raw.tip === 'string' && raw.tip.trim() ? raw.tip : 'Track this week of spending before changing a budget.',
    tipType: TIP_TYPES.includes(mappedType as FinanceTipOutput['tipType']) ? mappedType as FinanceTipOutput['tipType'] : 'general',
    priority: PRIORITIES.includes(raw.priority as FinanceTipOutput['priority']) ? raw.priority as FinanceTipOutput['priority'] : 'medium',
    actionItems: Array.isArray(raw.actionItems) ? raw.actionItems.map(String).slice(0, 6) : [],
  };
}

function sampleTip(requestType: string | undefined, label: string): FinanceTipResult {
  return { ...normalizeTip(getFallbackTip(requestType)), sample: true, label };
}

export async function generateFinanceTip(input: FinanceTipInput): Promise<FinanceTipResult> {
  const parsed = FinanceTipInputSchema.safeParse(input);
  if (!parsed.success) {
    return sampleTip(undefined, 'Sample response — the spending summary was not valid for Gemini.');
  }
  const safeInput = parsed.data;
  const cacheKey = getCacheKey(safeInput);

  const cachedTip = getFromCache(cacheKey);
  if (cachedTip) {
    return cachedTip;
  }

  if (!geminiConfigured()) {
    return sampleTip(safeInput.requestType, 'Sample response — set GEMINI_API_KEY to use Gemini.');
  }

  if (isRateLimited()) {
    return { ...normalizeTip(getFallbackTip(safeInput.requestType)), label: 'Showing a saved tip because this minute is rate limited.' };
  }

  try {
    addRequestTimestamp();
    const flow = getFinanceTipFlow();
    if (!flow) {
      return sampleTip(safeInput.requestType, 'Sample response — set GEMINI_API_KEY to use Gemini.');
    }
    const result = normalizeTip(await flow(safeInput));
    saveToCache(cacheKey, result);
    return result;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown error';
    console.log('AI request failed, using fallback:', message);
    return sampleTip(safeInput.requestType, 'Sample response — Gemini did not return a tip.');
  }
}

let financeTipFlow: ((input: FinanceTipInput) => Promise<FinanceTipOutput>) | null | undefined;

function getFinanceTipFlow() {
  if (financeTipFlow !== undefined) return financeTipFlow;
  const ai = getAi();
  if (!ai) {
    financeTipFlow = null;
    return financeTipFlow;
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

Provide a specific, actionable tip with priority level and concrete action steps. Focus on the most impactful recommendation based on their data. Keep the tip under 80 words.`,
  });

  financeTipFlow = ai.defineFlow(
    {
      name: 'generateFinanceTipFlow',
      inputSchema: FinanceTipInputSchema,
      outputSchema: FinanceTipOutputSchema,
    },
    async input => {
      try {
        const {output} = await prompt(input, { config: { maxOutputTokens: 512 } });
        if (!output) {
          return normalizeTip(getFallbackTip(input.requestType));
        }
        return normalizeTip(output);
      } catch (error) {
        console.error('Flow execution failed:', error);
        return normalizeTip(getFallbackTip(input.requestType));
      }
    }
  );
  return financeTipFlow;
}

// Explicitly export only types and the main async function
export {};
