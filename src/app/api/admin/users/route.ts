import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, getAllUsers, createUser } from '@/lib/auth/user-store';

async function checkAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('moneysimp_session')?.value;
  if (!token) return null;

  const session = verifySessionToken(token);
  if (!session || session.role !== 'admin') return null;

  return session;
}

export async function GET() {
  try {
    const admin = await checkAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
    }

    const users = getAllUsers();
    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('[Admin API] Error getting users:', error);
    return NextResponse.json({ error: 'Failed to fetch users.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await checkAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
    }

    const body = await request.json();
    const { username, email, password, displayName, role, permissions } = body;

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Username, email, and password are required.' }, { status: 400 });
    }

    const result = createUser({
      username,
      email,
      password,
      displayName,
      role: role === 'admin' ? 'admin' : 'user',
      permissions,
    });

    if (result.error || !result.user) {
      return NextResponse.json({ error: result.error || 'Failed to create user.' }, { status: 400 });
    }

    return NextResponse.json({ user: result.user, message: 'User created successfully.' });
  } catch (error: any) {
    console.error('[Admin API] Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user.' }, { status: 500 });
  }
}
