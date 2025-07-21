import { NextRequest, NextResponse } from 'next/server';
import { PlaidService, SubscriptionDetector } from '@/lib/plaid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, accountIds } = body;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      );
    }

    const subscriptions = await SubscriptionDetector.detectSubscriptions(accessToken);
    
    return NextResponse.json({ success: true, subscriptions });
  } catch (error) {
    console.error('Error detecting subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to detect subscriptions' },
      { status: 500 }
    );
  }
}
