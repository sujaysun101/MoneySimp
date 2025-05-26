
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

const categoryNames = CATEGORIES.map(c => c.name).join(', ');

export const ExtractBillInfoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a bill or receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  userId: z.string().optional().describe("Optional user ID for future personalization."),
});
export type ExtractBillInfoInput = z.infer<typeof ExtractBillInfoInputSchema>;

export const ExtractedExpenseItemSchema = z.object({
  description: z.string().describe('Detailed description of the expense item or service.'),
  amount: z.number().describe('The monetary amount of the expense item.'),
  date: z.string().describe('The date of the transaction in YYYY-MM-DD format. If not found, use current date.'),
  categoryName: z.string().describe(`The suggested category name for this expense. Choose from: ${categoryNames}. If unsure, suggest 'Other'.`),
  vendor: z.string().optional().describe('The name of the vendor or store, if identifiable.'),
});
export type ExtractedExpenseItem = z.infer<typeof ExtractedExpenseItemSchema>;

export const ExtractBillInfoOutputSchema = z.object({
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
  input: {schema: ExtractBillInfoInputSchema},
  output: {schema: ExtractBillInfoOutputSchema},
  prompt: `You are an expert financial assistant specializing in parsing receipts and bills.
Analyze the provided bill image. Extract all relevant information to create expense records.

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

    const {output} = await prompt(input);

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
      date: exp.date || currentDate,
    }));

    return { expenses: processedExpenses };
  }
);
