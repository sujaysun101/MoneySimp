import { NextResponse } from 'next/server';
import { findUserByIdentifier, verifyUserPassword, toPublicUser, createSessionToken } from '@/lib/auth/user-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Username/Email and password are required.' },
        { status: 400 }
      );
    }

    const user = findUserByIdentifier(identifier);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username/email or password.' },
        { status: 401 }
      );
    }

    const isValid = verifyUserPassword(user, password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid username/email or password.' },
        { status: 401 }
      );
    }

    const publicUser = toPublicUser(user);
    const token = createSessionToken(publicUser);

    const response = NextResponse.json({
      success: true,
      user: publicUser,
      message: 'Login successful',
    });

    // Set HTTP-only session cookie
    response.cookies.set({
      name: 'moneysimp_session',
      value: token,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Also set a non-httpOnly readable hint cookie for fast client-side checks
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
    console.error('[Auth API] Login error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during login.' },
      { status: 500 }
    );
  }
}
