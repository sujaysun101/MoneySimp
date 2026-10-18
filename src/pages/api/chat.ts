import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { getAi, geminiConfigured } from '@/ai/genkit';
import { consumeAiToken, resolveSession } from '@/lib/server/session';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '64kb',
    },
  },
};

const ChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().max(2000),
  })).min(1).max(12),
  pageContext: z.string().max(300).optional(),
});

function sampleReply(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('subscription')) {
    return 'List each recurring charge, keep the ones you used in the last 30 days, and cancel the rest. Start with the largest monthly amount.';
  }
  if (q.includes('save') || q.includes('transfer') || q.includes('goal')) {
    return 'A practical starting transfer is 10 percent of this month’s take-home pay, sent the day you are paid. Raise it only after the emergency category stays under budget.';
  }
  if (q.includes('budget')) {
    return 'Set the budget from the average of the last three months, then lower the category that grew the most. Check it once a week, not every purchase.';
  }
  return 'Compare this month’s category totals with last month and change one habit: the largest non-essential category. Small repeats beat a one-week freeze.';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const header = req.headers.authorization || '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7).trim() : undefined;
  const user = await resolveSession({
    demo: req.cookies?.ms_demo,
    session: req.cookies?.ms_session,
    bearer,
  });
  if (!user) {
    return res.status(401).json({ error: 'Sign in required.' });
  }

  const parsed = ChatSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid chat message.', details: parsed.error.flatten() });
  }

  if (!consumeAiToken(user.uid)) {
    return res.status(429).json({ error: 'Too many requests. Try again in a minute.' });
  }

  const lastUser = [...parsed.data.messages].reverse().find((message) => message.role === 'user');
  const question = lastUser?.content || parsed.data.messages[parsed.data.messages.length - 1].content;
  const labeledSample = {
    response: sampleReply(question),
    sample: true,
    label: 'Sample response — set GEMINI_API_KEY to use Gemini.',
  };

  if (!geminiConfigured()) {
    return res.status(200).json(labeledSample);
  }

  try {
    const ai = getAi();
    if (!ai) return res.status(200).json(labeledSample);

    const history = parsed.data.messages
      .map((message) => `${message.role}: ${message.content}`)
      .join('\n')
      .slice(0, 8000);
    const pageContext = parsed.data.pageContext || 'general';
    const fullPrompt = `You are MoneySimp, a personal finance assistant. Answer the latest question using the conversation. Be specific and concise. Do not invent account balances.

Page context: ${pageContext}

Conversation:
${history}`;

    const aiResponse = await ai.generate({
      prompt: fullPrompt,
      config: { maxOutputTokens: 512 },
    });
    const text = (aiResponse.text || '').trim();
    if (!text) return res.status(200).json(labeledSample);
    return res.status(200).json({ response: text, sample: false });
  } catch (error) {
    console.error('AI chat error:', error);
    return res.status(200).json({
      ...labeledSample,
      label: 'Sample response — Gemini did not answer.',
    });
  }
}
