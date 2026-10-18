import { NextResponse } from 'next/server';
import { FinanceTipInputSchema, generateFinanceTip } from '@/ai/flows/finance-tips';
import { consumeAiToken, getRequestUser } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const user = await getRequestUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON.' }, { status: 400 });
  }

  const parsed = FinanceTipInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid spending summary.', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (!consumeAiToken(user.uid)) {
    return NextResponse.json({ error: 'Too many requests. Try again in a minute.' }, { status: 429 });
  }

  try {
    const result = await generateFinanceTip(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Finance tip failed:', error);
    return NextResponse.json({
      tip: 'Track every purchase for seven days, then cut the largest non-essential category by 10 percent.',
      tipType: 'general',
      priority: 'medium',
      actionItems: ['Log this week of spending', 'Name the top category', 'Set one limit'],
      sample: true,
      label: 'Sample response — Gemini did not return a tip.',
    });
  }
}
