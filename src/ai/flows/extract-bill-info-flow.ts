'use server';
/**
 * @fileOverview A Genkit flow for extracting expense information from bill images.
 *
 * - extractBillInfo - A function that handles the bill information extraction process.
 * - ExtractBillInfoInput - The input type for the extractBillInfo function.
 * - ExtractedExpenseItem - The type for a single extracted expense item.
 * - ExtractBillInfoOutput - The return type for the extractBillInfo function.
 */

import {ai} from '@/ai/genkit';
import {z}  from 'genkit';
import { CATEGORIES } from '@/lib/constants';
import Tesseract from 'tesseract.js';

const categoryNames = CATEGORIES.map(c => c.name).join(', ');

const ExtractBillInfoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a bill or receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  userId: z.string().optional().describe("Optional user ID for future personalization."),
});
export type ExtractBillInfoInput = z.infer<typeof ExtractBillInfoInputSchema>;

const ExtractedExpenseItemSchema = z.object({
  description: z.string().describe('Detailed description of the expense item or service.'),
  amount: z.number().describe('The monetary amount of the expense item.'),
  date: z.string().describe('The date of the transaction in YYYY-MM-DD format. If not found, use current date.'),
  categoryName: z.string().describe(`The suggested category name for this expense. Choose from: ${categoryNames}. If unsure, suggest 'Other'.`),
  vendor: z.string().optional().describe('The name of the vendor or store, if identifiable.'),
});
export type ExtractedExpenseItem = z.infer<typeof ExtractedExpenseItemSchema>;

const ExtractBillInfoOutputSchema = z.object({
  expenses: z.array(ExtractedExpenseItemSchema).describe('A list of extracted expense items from the bill. If the bill represents a single transaction, this array will contain one item. If multiple distinct items are on the bill that could be separate expenses, list them individually.'),
});
export type ExtractBillInfoOutput = z.infer<typeof ExtractBillInfoOutputSchema>;


// This is the only function that needs to be exported for external use.
export async function extractBillInfo(input: ExtractBillInfoInput): Promise<ExtractBillInfoOutput> {
  return extractBillInfoFlow(input);
}

// Internal prompt definition - not exported
const prompt = ai.definePrompt({
  name: 'extractBillInfoPrompt',
  input: { schema: ExtractBillInfoInputSchema.extend({ ocrText: z.string().optional() }) },
  output: {schema: ExtractBillInfoOutputSchema},
  prompt: `You are an expert financial assistant specializing in parsing receipts and bills.

Analyze the provided bill image and the OCR text. Extract all relevant information to create expense records.

OCR text of the bill:
{{ocrText}}

Your goal is to identify:
1.  The vendor/store name.
2.  The date of the transaction. If no date is clearly visible, use today's date in YYYY-MM-DD format.
3.  Individual items or services listed, along with their prices. If it's a summary bill (e.g., a utility bill), extract the total amount due.
4.  For each item or for the total bill, suggest an appropriate expense category.

Available category names are: ${categoryNames}.
If an item doesn't fit well into any of these, suggest 'Other'.

If there are multiple distinct items on the bill that could be considered separate expenses (e.g., different items on a grocery receipt that the user might want to track individually), list them as separate expense objects in the 'expenses' array. If the bill is for a single service or a total amount (like a utility bill or a single restaurant meal), the 'expenses' array should contain one item.

For each expense item, provide:
-   'description': A clear description of the item or service (e.g., "Milk 1 Gallon", "Monthly Electricity Bill", "Dinner at The Cafe"). Include the vendor name in the description if it helps clarity (e.g., "Groceries from SuperMart").
-   'amount': The numerical amount of the expense.
-   'date': The transaction date in YYYY-MM-DD format.
-   'categoryName': One of the suggested category names.
-   'vendor': (Optional) The name of the vendor or store.

Image of the bill:
{{media url=photoDataUri}}

Return the extracted information in the specified JSON format.
Example for a grocery receipt with multiple items:
{
  "expenses": [
    { "description": "Organic Apples - SuperMart", "amount": 5.99, "date": "2024-03-15", "categoryName": "Groceries", "vendor": "SuperMart" },
    { "description": "Whole Wheat Bread - SuperMart", "amount": 3.49, "date": "2024-03-15", "categoryName": "Groceries", "vendor": "SuperMart" }
  ]
}
Example for a utility bill:
{
  "expenses": [
    { "description": "Electricity Bill - City Power", "amount": 75.50, "date": "2024-03-10", "categoryName": "Utilities", "vendor": "City Power" }
  ]
}
`,
});

// Internal flow definition - not exported
const extractBillInfoFlow = ai.defineFlow(
  {
    name: 'extractBillInfoFlow',
    inputSchema: ExtractBillInfoInputSchema,
    outputSchema: ExtractBillInfoOutputSchema,
  },
  async (input) => {
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    // 1. OCR
    const ocrText = await extractTextFromImage(input.photoDataUri);
    // 2. Preprocess
    const cleanedText = preprocessOcrText(ocrText);
    // 3. Parse (optional: can be used for debugging or future improvements)
    const parsed = parseReceiptText(cleanedText);
    // 4. LLM step: pass OCR text to the prompt
    const { output } = await prompt({ ...input, ocrText: cleanedText });
    if (!output || !output.expenses || output.expenses.length === 0) {
      return {
        expenses: [{
          description: "Unable to extract details from bill",
          amount: 0,
          date: currentDate,
          categoryName: "Other",
          vendor: "Unknown"
        }]
      };
    }
    const processedExpenses = output.expenses.map(exp => ({
      ...exp,
      date: exp.date || currentDate, // Ensure date is always set
      categoryName: CATEGORIES.find(c => c.name.toLowerCase() === exp.categoryName?.toLowerCase()) ? exp.categoryName : "Other", // Validate category
    }));
    return { expenses: processedExpenses };
  }
);

// 1. OCR Step (Tesseract.js integration)
async function extractTextFromImage(photoDataUri: string): Promise<string> {
  try {
    const result = await Tesseract.recognize(photoDataUri, 'eng', {
      logger: m => console.log(m), // Optional: remove or replace with your logger
    });
    return result.data.text || '';
  } catch (err) {
    console.error('OCR extraction failed:', err);
    return '';
  }
}

// 2. Preprocessing (expand abbreviations, clean up text)
function preprocessOcrText(ocrText: string): string {
  // Example abbreviation mapping
  const abbreviations: Record<string, string> = {
    'CHSE': 'Cheese',
    'PC': "President's Choice",
    'MSHRMS': 'Mushrooms',
    'WHT': 'White',
    'HNYCRP': 'Honeycrisp',
    'SNAP PEAS': 'Snap Peas',
    'GRLC': 'Garlic',
    'HMS': 'Hummus',
    'BALDR CHED': 'Balderson Cheddar',
    // Add more as needed
  };
  let cleaned = ocrText;
  for (const [abbr, full] of Object.entries(abbreviations)) {
    const regex = new RegExp(abbr, 'gi');
    cleaned = cleaned.replace(regex, full);
  }
  // Additional cleaning: remove extra spaces, join broken lines, etc.
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  return cleaned;
}

// 3. Parsing (extract vendor, date, and items)
function parseReceiptText(ocrText: string) {
  // Simple regex-based extraction (expand as needed)
  const vendorMatch = ocrText.match(/^[A-Z0-9\s\-&']{3,}/m);
  const dateMatch = ocrText.match(/\b(\d{4}[\/-]\d{2}[\/-]\d{2}|\d{2}[\/-]\d{2}[\/-]\d{2,4})\b/);
  // Extract line items: look for lines with a price at the end
  const itemRegex = /^(.+?)\s+(\d+\.\d{2})$/gm;
  const items: { description: string; amount: number }[] = [];
  let match;
  while ((match = itemRegex.exec(ocrText)) !== null) {
    items.push({ description: match[1].trim(), amount: parseFloat(match[2]) });
  }
  return {
    vendor: vendorMatch ? vendorMatch[0].trim() : '',
    date: dateMatch ? dateMatch[0] : '',
    items,
  };
}
