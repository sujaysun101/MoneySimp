import { NextResponse } from 'next/server';
import { createUser, createSessionToken } from '@/lib/auth/user-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, email, password, displayName } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required.' },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters long.' },
        { status: 400 }
      );
    }

    if (password.length < 3) {
      return NextResponse.json(
        { error: 'Password must be at least 3 characters.' },
        { status: 400 }
      );
    }

    const result = createUser({
      username,
      email,
      password,
      displayName: displayName || username,
      role: 'user',
    });

    if (result.error || !result.user) {
      return NextResponse.json(
        { error: result.error || 'Failed to create user.' },
        { status: 400 }
      );
    }

    const token = createSessionToken(result.user);
    const response = NextResponse.json({
      success: true,
      user: result.user,
      message: 'Account created successfully',
    });

    response.cookies.set({
      name: 'moneysimp_session',
      value: token,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
    });

    response.cookies.set({
      name: 'moneysimp_logged_in',
      value: 'true',
      httpOnly: false,
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error('[Auth API] Signup error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during signup.' },
      { status: 500 }
    );
  }
}
