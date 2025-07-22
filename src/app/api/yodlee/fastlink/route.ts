import { NextRequest, NextResponse } from 'next/server';
import YodleeService from '@/lib/yodlee';

export async function POST(request: NextRequest) {
  try {
    console.log('🔗 FastLink API endpoint called');
    
    const body = await request.json();
    const { userId, callbackUrl } = body;
    console.log('📝 Request data:', { userId: userId ? 'present' : 'missing', callbackUrl });

    if (!userId) {
      console.error('❌ Missing userId in request');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('🏗️ Initializing Yodlee service...');
    const yodleeService = YodleeService.getInstance();
    
    console.log('🚀 Generating FastLink URL...');
    const fastLinkUrl = await yodleeService.generateFastLinkUrl(userId, callbackUrl);
    
    console.log('✅ FastLink URL generated successfully');
    return NextResponse.json({ fastLinkUrl });
  } catch (error) {
    console.error('❌ Error generating FastLink URL:', error);
    
    // More detailed error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to generate FastLink URL',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
