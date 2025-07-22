import { NextRequest, NextResponse } from 'next/server';
import { YodleeSubscriptionDetector } from '@/lib/yodlee';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountIds } = body;

    const detector = new YodleeSubscriptionDetector();
    const subscriptions = await detector.detectSubscriptions(accountIds);
    
    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error('Error detecting subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to detect subscriptions' },
      { status: 500 }
    );
  }
}
