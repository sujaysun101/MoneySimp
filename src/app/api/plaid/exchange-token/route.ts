import { NextRequest, NextResponse } from 'next/server';
import { PlaidService } from '@/lib/plaid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { public_token, userId, metadata } = body;

    if (!public_token || !userId) {
      return NextResponse.json(
        { error: 'Public token and user ID are required' },
        { status: 400 }
      );
    }

    const accessToken = await PlaidService.exchangePublicToken(public_token);
    
    // In a real app, you would save the access token securely associated with the user
    // For testing purposes, we'll just return it
    
    return NextResponse.json({ 
      accessToken,
      institutionId: metadata?.institution?.institution_id,
      institutionName: metadata?.institution?.name
    });
  } catch (error) {
    console.error('Error exchanging public token:', error);
    return NextResponse.json(
      { error: 'Failed to exchange public token' },
      { status: 500 }
    );
  }
}
