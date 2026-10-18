'use server';

import { generateFinanceTip, FinanceTipInputSchema, type FinanceTipResult } from '@/ai/flows/finance-tips';
import { extractBillInfo, type ExtractBillInfoInput, type ExtractBillInfoOutput, type ExtractedExpenseItem } from '@/ai/flows/extract-bill-info-flow';
import { geminiConfigured } from '@/ai/genkit';
import { CATEGORIES } from '@/lib/constants';
import { consumeAiToken, getSessionUser } from '@/lib/server/session';
import type { Expense } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

const signInTip: FinanceTipResult = {
  tip: 'Sign in, or open the demo household, to generate a finance tip.',
  tipType: 'general',
  priority: 'low',
  actionItems: ['Use Try the demo on the sign-in page, or sign in with your account.'],
  label: 'Sign in required.',
};

export async function getPersonalizedFinanceTip(input: unknown): Promise<FinanceTipResult> {
  const user = await getSessionUser();
  if (!user) return signInTip;
  if (!consumeAiToken(user.uid)) {
    return {
      tip: 'Too many tip requests. Wait a minute and try again.',
      tipType: 'general',
      priority: 'low',
      actionItems: [],
      label: 'Rate limited.',
    };
  }
  const parsed = FinanceTipInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      tip: 'That spending summary could not be read. Refresh the page and try again.',
      tipType: 'general',
      priority: 'low',
      actionItems: [],
      sample: true,
      label: 'Sample response — the request was not valid.',
    };
  }
  return generateFinanceTip(parsed.data);
}

const PHOTO_PATTERN = /^data:image\/(?:png|jpeg|jpg|webp|gif);base64,[a-z0-9+/=\s]+$/i;
const MAX_PHOTO_CHARS = 2_000_000;

export type BillExtractionResult = {
  success: boolean;
  expenses?: Partial<Expense>[];
  message: string;
  sample?: boolean;
  code?: 'unauthorized' | 'invalid' | 'rate' | 'ok';
};

function sampleBill(message: string): BillExtractionResult {
  return {
    success: true,
    sample: true,
    code: 'ok',
    message,
    expenses: [{
      id: 'sample-bill',
      description: 'Harbor Market groceries (sample)',
      amount: 42.18,
      categoryId: 'groceries',
      date: new Date(),
    }],
  };
}

export async function extractAndRecordBill(photoDataUri: string): Promise<BillExtractionResult> {
  if (typeof photoDataUri !== 'string' || photoDataUri.length === 0 || photoDataUri.length > MAX_PHOTO_CHARS || !PHOTO_PATTERN.test(photoDataUri)) {
    return {
      success: false,
      code: 'invalid',
      message: 'Upload a PNG, JPEG, WEBP, or GIF receipt under about 1.5 MB.',
    };
  }

  const user = await getSessionUser();
  if (!user) {
    return { success: false, code: 'unauthorized', message: 'Sign in to scan a bill.' };
  }
  if (!consumeAiToken(user.uid)) {
    return { success: false, code: 'rate', message: 'Too many scans. Wait a minute and try again.' };
  }

  if (!geminiConfigured()) {
    return sampleBill('Sample extraction — set GEMINI_API_KEY to read receipts with Gemini. This example was not saved.');
  }

  try {
    const input: ExtractBillInfoInput = { photoDataUri };
    const result: ExtractBillInfoOutput = await extractBillInfo(input);

    if (!result.expenses || result.expenses.length === 0) {
      return sampleBill('Sample extraction — Gemini did not find line items on that image. This example was not saved.');
    }

    const newExpenses: Partial<Expense>[] = result.expenses.map((item: ExtractedExpenseItem) => {
      const category = CATEGORIES.find(c => c.name.toLowerCase() === item.categoryName.toLowerCase());
      const newDate = new Date(item.date);
      const validDate = isNaN(newDate.getTime()) ? new Date() : newDate;
      return {
        id: uuidv4(),
        description: item.description || 'Scanned item',
        amount: item.amount || 0,
        categoryId: category ? category.id : 'other',
        date: validDate,
      };
    });

    return { success: true, code: 'ok', expenses: newExpenses, message: 'Expenses extracted successfully.' };
  } catch (error) {
    console.error('Error extracting bill information:', error);
    return sampleBill('Sample extraction — Gemini could not read that image. This example was not saved.');
  }
}
