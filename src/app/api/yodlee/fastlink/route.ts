import { NextRequest, NextResponse } from 'next/server';
import YodleeService from '@/lib/yodlee';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, callbackUrl } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const yodleeService = YodleeService.getInstance();
    const fastLinkUrl = await yodleeService.generateFastLinkUrl(userId, callbackUrl);
    
    return NextResponse.json({ fastLinkUrl });
  } catch (error) {
    console.error('Error generating FastLink URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate FastLink URL' },
      { status: 500 }
    );
  }
}
