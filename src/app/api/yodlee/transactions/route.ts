import { NextRequest, NextResponse } from 'next/server';
import YodleeService from '@/lib/yodlee';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountIds, fromDate, toDate } = body;

    const yodleeService = YodleeService.getInstance();
    
    const startDate = fromDate ? new Date(fromDate) : undefined;
    const endDate = toDate ? new Date(toDate) : undefined;
    
    const transactions = await yodleeService.getTransactions(accountIds, startDate, endDate);
    
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching Yodlee transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
