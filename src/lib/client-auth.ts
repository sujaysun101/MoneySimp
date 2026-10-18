'use client';

import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { clearDemoClientState, isDemoMode } from '@/lib/demo-client';

export async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    if (auth?.currentUser) {
      headers.Authorization = `Bearer ${await auth.currentUser.getIdToken()}`;
    }
  } catch (error) {
    console.error('Could not read the Firebase ID token:', error);
  }
  return headers;
}

export async function establishFirebaseSession(): Promise<boolean> {
  if (!auth?.currentUser) return false;
  const idToken = await auth.currentUser.getIdToken();
  const res = await fetch('/api/session', {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}` },
  });
  return res.ok;
}

export async function endSession(): Promise<void> {
  if (isDemoMode()) {
    await fetch('/api/demo/end', { method: 'POST' });
    clearDemoClientState();
    return;
  }
  await fetch('/api/session', { method: 'DELETE' });
  localStorage.removeItem('moneySimpLoggedIn');
  localStorage.removeItem('moneySimpUserEmail');
  localStorage.removeItem('moneySimpUserId');
  localStorage.removeItem('moneySimpUserName');
  if (auth) {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }
}
