import type { NextApiRequest, NextApiResponse } from 'next';
import { ai } from '@/ai/genkit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { messages, pageContext } = req.body;

  // Validate messages
  if (!Array.isArray(messages)) {
    return res.status(400).json({ response: "Messages must be an array." });
  }
  
  if (messages.some(m => !m || typeof m.role !== 'string' || (!m.content && m.content !== ''))) {
    return res.status(400).json({ response: "Invalid message format." });
  }

  try {
    // Ensure all messages have the correct format
    const formattedMessages = messages.map((msg: any, index: number) => {
      if (!msg) {
        console.warn(`Message at index ${index} is null/undefined`);
        return { role: 'user', content: '' };
      }
      
      return {
        role: msg.role || 'user',
        content: typeof msg.content === 'string' ? msg.content : String(msg.content || '')
      };
    });

    // Compose the prompt for the LLM - using Genkit's expected format
    const conversationHistory = formattedMessages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
    
    const fullPrompt = `You are MoneySimp, a helpful financial assistant chatbot. You help users with personal finance questions, budgeting, investment advice, and financial planning.

Context: This is a personal finance management application where users can track expenses, manage budgets, and get financial insights. Page context: ${pageContext}

IMPORTANT: Format your response using markdown for better readability:
- Use **bold** for important points, key terms, and amounts
- Use *italics* for emphasis and tips
- Use bullet points (-) for lists and multiple items
- Use numbered lists (1.) for step-by-step instructions
- Use \`code formatting\` for specific values, percentages, or formulas
- Use ## headers to organize longer responses into clear sections
- Use > blockquotes for important tips, warnings, or key takeaways
- Keep paragraphs short and scannable
- Use line breaks to separate different concepts

Always provide helpful, accurate financial advice formatted in a clean, easy-to-read manner.

Conversation history:
${conversationHistory}

Please provide a well-formatted markdown response:`;

    const aiResponse = await ai.generate(fullPrompt);

    res.status(200).json({ response: aiResponse.text ?? "" });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ response: "Sorry, I couldn't process your request." });
  }
}