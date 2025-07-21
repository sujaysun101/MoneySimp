import { NextRequest, NextResponse } from 'next/server';
import YodleeService from '@/lib/yodlee';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userToken } = body;

    const yodleeService = YodleeService.getInstance();
    const accounts = await yodleeService.getAccounts(userToken);
    
    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error fetching Yodlee accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const yodleeService = YodleeService.getInstance();
    const accounts = await yodleeService.getAccounts();
    
    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error fetching Yodlee accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}
