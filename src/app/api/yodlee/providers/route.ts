import { NextRequest, NextResponse } from 'next/server';
import YodleeService from '@/lib/yodlee';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    const yodleeService = YodleeService.getInstance();
    const providers = await yodleeService.getProviders(name || undefined);
    
    return NextResponse.json(providers);
  } catch (error) {
    console.error('Error fetching Yodlee providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial institutions' },
      { status: 500 }
    );
  }
}
