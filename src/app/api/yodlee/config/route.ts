import { NextRequest, NextResponse } from 'next/server';
import { YODLEE_CONFIG } from '@/lib/yodlee';

export async function GET() {
  try {
    return NextResponse.json({
      environment: YODLEE_CONFIG.environment,
      clientId: process.env.NEXT_PUBLIC_YODLEE_CLIENT_ID,
      baseURL: YODLEE_CONFIG.baseURL,
      features: ['transactions', 'accounts', 'recurring-payments', 'categorization']
    });
  } catch (error) {
    console.error('Error fetching Yodlee config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Yodlee configuration' },
      { status: 500 }
    );
  }
}
