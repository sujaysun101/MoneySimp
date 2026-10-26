import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });

  response.cookies.set({
    name: 'moneysimp_session',
    value: '',
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });

  response.cookies.set({
    name: 'moneysimp_logged_in',
    value: '',
    httpOnly: false,
    path: '/',
    maxAge: 0,
  });

  return response;
}
