import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebaseAdmin';
import { redirect } from 'next/navigation';
import MetricsViewerClient from './viewer';

export const dynamic = 'force-dynamic';

export default async function MetricsAdminPage() {
  const cookieStore = await cookies();
  const idToken = cookieStore.get('firebaseIdToken')?.value;
  let isAdmin = false;
  if (idToken && adminAuth) {
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
  isAdmin = !!decoded.admin || (!!process.env.ADMIN_UID && decoded.uid === process.env.ADMIN_UID);
    } catch {}
  }
  if (!isAdmin) redirect('/');
  return <MetricsViewerClient />;
}
