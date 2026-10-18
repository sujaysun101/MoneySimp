import { NextResponse } from 'next/server';
import { sessionCookieOptions } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('ms_demo', '', { ...sessionCookieOptions, maxAge: 0 });
  return res;
}
