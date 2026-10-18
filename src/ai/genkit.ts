import { genkit, type Genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

let instance: Genkit | null = null;

/** True when the Google AI plugin has a key. Never expose this key to the browser. */
export function geminiConfigured(): boolean {
  return Boolean(
    process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GENAI_API_KEY
  );
}

/**
 * Lazily construct Genkit. Importing this module must not throw when no key
 * is set, so routes can return a labeled sample response instead.
 */
export function getAi(): Genkit | null {
  if (!geminiConfigured()) return null;
  if (!instance) {
    instance = genkit({
      plugins: [googleAI()],
      model: process.env.GEMINI_MODEL || process.env.AI_MODEL || 'googleai/gemini-2.0-flash',
    });
  }
  return instance;
}
