import { NextRequest, NextResponse } from 'next/server';
import { PlaidService } from '@/lib/plaid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, accountIds, startDate, endDate } = body;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      );
    }

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const transactions = await PlaidService.getTransactions(
      accessToken,
      start ?? new Date(),
      end ?? new Date(),
      accountIds
    );
    
    return NextResponse.json({ success: true, transactions });
  } catch (error) {
    console.error('Error fetching Plaid transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
