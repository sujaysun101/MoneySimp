import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, updateUser, deleteUser, findUserById } from '@/lib/auth/user-store';

async function checkAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('moneysimp_session')?.value;
  if (!token) return null;

  const session = verifySessionToken(token);
  if (!session || session.role !== 'admin') return null;

  return session;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { role, displayName, permissions } = body;

    // Guard: Prevent admin from demoting themselves if they are the primary admin
    const targetUser = findUserById(id);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (targetUser.username.toLowerCase() === 'admin' && role && role !== 'admin') {
      return NextResponse.json({ error: 'Cannot demote the primary root admin account.' }, { status: 400 });
    }

    const result = updateUser(id, {
      role,
      displayName,
      permissions,
    });

    if (result.error || !result.user) {
      return NextResponse.json({ error: result.error || 'Failed to update user.' }, { status: 400 });
    }

    return NextResponse.json({ user: result.user, message: 'User privileges updated successfully.' });
  } catch (error: any) {
    console.error('[Admin API] Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
    }

    const { id } = await context.params;
    const result = deleteUser(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to delete user.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully.' });
  } catch (error: any) {
    console.error('[Admin API] Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user.' }, { status: 500 });
  }
}
