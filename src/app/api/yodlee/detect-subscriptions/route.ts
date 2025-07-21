import { NextRequest, NextResponse } from 'next/server';
import YodleeService, { YodleeSubscriptionDetector } from '@/lib/yodlee';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountIds } = body;

    if (!accountIds || !Array.isArray(accountIds)) {
      return NextResponse.json(
        { error: 'Account IDs are required' },
        { status: 400 }
      );
    }

    const subscriptionDetector = new YodleeSubscriptionDetector();
    
    // Detect subscriptions from transactions
    const detectedSubscriptions = await subscriptionDetector.detectSubscriptions(accountIds);
    
    return NextResponse.json({ 
      subscriptions: detectedSubscriptions,
      count: detectedSubscriptions.length
    });
  } catch (error) {
    console.error('Error detecting subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to detect subscriptions' },
      { status: 500 }
    );
  }
}
