import { NextResponse } from 'next/server';
import { sessionCookieOptions, signDemoCookie } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

export async function POST() {
  const res = NextResponse.json({ ok: true, demo: true });
  res.cookies.set('ms_demo', signDemoCookie(), sessionCookieOptions);
  res.cookies.set('ms_session', '', { ...sessionCookieOptions, maxAge: 0 });
  return res;
}
