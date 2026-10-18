import { NextResponse } from 'next/server';
import { sessionCookieOptions, signUserCookie, verifyFirebaseIdToken } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    return NextResponse.json({ error: 'Missing sign-in token.' }, { status: 400 });
  }
  const user = await verifyFirebaseIdToken(token);
  if (!user) {
    return NextResponse.json({ error: 'That sign-in token is not valid.' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set('ms_session', signUserCookie(user), sessionCookieOptions);
  res.cookies.set('ms_demo', '', { ...sessionCookieOptions, maxAge: 0 });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('ms_session', '', { ...sessionCookieOptions, maxAge: 0 });
  return res;
}
