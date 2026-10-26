import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, findUserById, toPublicUser } from '@/lib/auth/user-store';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('moneysimp_session')?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const sessionPayload = verifySessionToken(token);
    if (!sessionPayload) {
      return NextResponse.json({ user: null });
    }

    // Refresh user from store to get current attributes
    const fullUser = findUserById(sessionPayload.id);
    if (!fullUser) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user: toPublicUser(fullUser) });
  } catch (error: any) {
    console.error('[Auth API] /me error:', error);
    return NextResponse.json({ user: null });
  }
}
