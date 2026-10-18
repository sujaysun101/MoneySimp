import { NextResponse } from 'next/server';
import { extractAndRecordBill } from '@/app/actions';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON.' }, { status: 400 });
  }

  const photoDataUri = body && typeof body === 'object' && 'photoDataUri' in body
    ? (body as { photoDataUri?: unknown }).photoDataUri
    : undefined;
  if (typeof photoDataUri !== 'string') {
    return NextResponse.json({ error: 'photoDataUri is required.' }, { status: 400 });
  }

  try {
    const result = await extractAndRecordBill(photoDataUri);
    if (result.code === 'invalid') {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
    if (result.code === 'unauthorized') {
      return NextResponse.json({ error: result.message }, { status: 401 });
    }
    if (result.code === 'rate') {
      return NextResponse.json({ error: result.message }, { status: 429 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('Bill extraction failed:', error);
    return NextResponse.json({
      success: true,
      sample: true,
      message: 'Sample extraction — Gemini could not read that image. This example was not saved.',
      expenses: [{
        description: 'Harbor Market groceries (sample)',
        amount: 42.18,
        categoryId: 'groceries',
        date: new Date().toISOString(),
      }],
    });
  }
}
