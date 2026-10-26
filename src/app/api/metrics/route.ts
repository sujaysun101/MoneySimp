import { NextRequest } from 'next/server';
import { cookies, headers } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

// Simple in-memory accumulator (resets on server restart). Replace with persistent store if needed.
let recentMetrics: any[] = [];

async function isAuthorized(): Promise<{ ok: boolean; uid?: string; isAdmin?: boolean; reason?: string }> {
  const cookieStore = await cookies();
  const hdrs = await headers();
  const idToken = cookieStore.get('firebaseIdToken')?.value || hdrs.get('x-firebase-id-token') || '';
  const apiKeyHeader = hdrs.get('x-metrics-api-key');
  const expectedKey = process.env.METRICS_API_KEY;
  if (expectedKey && apiKeyHeader === expectedKey) return { ok: true, uid: 'apiKey', isAdmin: true };
  if (!idToken) return { ok: false, reason: 'missing token' };
  if (!adminAuth) return { ok: false, reason: 'admin not initialized' };
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
  const isAdmin = !!decoded.admin || (!!process.env.ADMIN_UID && decoded.uid === process.env.ADMIN_UID);
  return { ok: true, uid: decoded.uid, isAdmin: Boolean(isAdmin) };
  } catch (e) {
    return { ok: false, reason: 'invalid token' };
  }
}

export async function POST(req: NextRequest) {
  const authz = await isAuthorized();
  const allowAnon = process.env.METRICS_REQUIRE_AUTH !== 'true'; // default allow unless explicitly required
  if (!authz.ok && !allowAnon) {
    return new Response(JSON.stringify({ ok: false, error: 'unauthorized', reason: authz.reason }), { status: 401 });
  }
  try {
    const body = await req.json();
    if (Array.isArray(body.metrics)) {
      recentMetrics.push(...body.metrics);
      // Keep only last 200
      if (recentMetrics.length > 200) recentMetrics = recentMetrics.slice(-200);
      // Persist to Firestore if available
      if (adminDb && authz.ok) {
        const batch = adminDb.batch();
        body.metrics.forEach((m: any) => {
          const ref = adminDb!.collection('metrics').doc();
          batch.set(ref, { ...m, ts: Date.now(), uid: authz.uid });
        });
        await batch.commit().catch(() => {});
      }
    }
    return new Response(JSON.stringify({ ok: true, persisted: authz.ok && Boolean(adminDb), anon: !authz.ok }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const authz = await isAuthorized();
  if (!authz.ok) return new Response(JSON.stringify({ ok: false, error: 'unauthorized', reason: authz.reason }), { status: 401 });
  const { searchParams } = new URL(req.url);
  if (searchParams.get('clear') === '1') {
    recentMetrics = [];
    if (adminDb && authz.isAdmin) {
      // Firestore clear (shallow, last 500) - optional lightweight cleanup
      const snap = await adminDb.collection('metrics').orderBy('ts', 'desc').limit(500).get().catch(() => undefined);
      if (snap && !snap.empty) {
        const batch = adminDb.batch();
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit().catch(() => {});
      }
    }
    return new Response(JSON.stringify({ ok: true, cleared: true }), { status: 200 });
  }
  // Optionally fetch from Firestore if present (recent 100)
  let firestoreMetrics: any[] = [];
  if (adminDb) {
    const snap = await adminDb.collection('metrics').orderBy('ts', 'desc').limit(100).get().catch(() => undefined);
    if (snap) firestoreMetrics = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  return new Response(JSON.stringify({ metrics: recentMetrics, firestore: firestoreMetrics }), { status: 200 });
}
