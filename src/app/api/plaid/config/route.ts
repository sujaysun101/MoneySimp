import { NextRequest, NextResponse } from 'next/server';
import { PLAID_CONFIG } from '@/lib/plaid';

export async function GET() {
  try {
    return NextResponse.json({
      environment: PLAID_CONFIG.env,
      clientId: process.env.NEXT_PUBLIC_PLAID_CLIENT_ID,
      products: PLAID_CONFIG.products,
      countryCodes: PLAID_CONFIG.countryCodes
    });
  } catch (error) {
    console.error('Error fetching Plaid config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Plaid configuration' },
      { status: 500 }
    );
  }
}
