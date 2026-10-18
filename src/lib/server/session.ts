import { createHmac, createVerify, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

export type SessionUser = {
  uid: string;
  email?: string;
  demo: boolean;
};

const DEMO_USER: SessionUser = {
  uid: 'demo-household',
  email: 'demo@moneysimp.app',
  demo: true,
};

const PROJECT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  process.env.FIREBASE_PROJECT_ID ||
  'pennywise-n5hqy';

function sessionSecret(): string {
  return process.env.DEMO_SESSION_SECRET || 'moneysimp-demo-session-dev-only';
}

function signPayload(payload: object): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', sessionSecret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function readPayload(token: string | undefined): Record<string, unknown> | null {
  if (!token || token.length > 4096) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = createHmac('sha256', sessionSecret()).update(body).digest('base64url');
  const actualBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (actualBuf.length !== expectedBuf.length || !timingSafeEqual(actualBuf, expectedBuf)) {
    return null;
  }
  try {
    const json = JSON.parse(Buffer.from(body, 'base64url').toString()) as Record<string, unknown>;
    if (typeof json.exp !== 'number' || json.exp < Date.now()) return null;
    return json;
  } catch {
    return null;
  }
}

export function signDemoCookie(): string {
  return signPayload({ kind: 'demo', exp: Date.now() + 1000 * 60 * 60 * 12 });
}

export function signUserCookie(user: { uid: string; email?: string }): string {
  return signPayload({
    kind: 'user',
    uid: user.uid,
    email: user.email || '',
    exp: Date.now() + 1000 * 60 * 60 * 12,
  });
}

export function userFromDemoCookie(token: string | undefined): SessionUser | null {
  const payload = readPayload(token);
  if (!payload || payload.kind !== 'demo') return null;
  return DEMO_USER;
}

export function userFromSessionCookie(token: string | undefined): SessionUser | null {
  const payload = readPayload(token);
  if (!payload || payload.kind !== 'user' || typeof payload.uid !== 'string' || !payload.uid) {
    return null;
  }
  return {
    uid: payload.uid,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    demo: false,
  };
}

let certCache: { certs: Record<string, string>; expires: number } | null = null;

async function googleCerts(): Promise<Record<string, string>> {
  if (certCache && certCache.expires > Date.now()) return certCache.certs;
  const res = await fetch(
    'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
  );
  if (!res.ok) throw new Error('Could not load Firebase token certificates.');
  const certs = (await res.json()) as Record<string, string>;
  const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get('cache-control') || '')?.[1] || 3600);
  certCache = { certs, expires: Date.now() + maxAge * 1000 };
  return certs;
}

/** Verify a Firebase ID token with Google's published certificates. No service account required. */
export async function verifyFirebaseIdToken(token: string): Promise<SessionUser | null> {
  if (!token || token.length > 8192) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString()) as { alg?: string; kid?: string };
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString()) as {
      aud?: string;
      iss?: string;
      exp?: number;
      sub?: string;
      email?: string;
    };
    if (header.alg !== 'RS256' || !header.kid) return null;
    if (payload.aud !== PROJECT_ID) return null;
    if (payload.iss !== `https://securetoken.google.com/${PROJECT_ID}`) return null;
    if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now() - 60_000) return null;
    if (!payload.sub) return null;
    const cert = (await googleCerts())[header.kid];
    if (!cert) return null;
    const verifier = createVerify('RSA-SHA256');
    verifier.update(`${parts[0]}.${parts[1]}`);
    verifier.end();
    if (!verifier.verify(cert, Buffer.from(parts[2], 'base64url'))) return null;
    return { uid: payload.sub, email: payload.email, demo: false };
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    return null;
  }
}

export async function resolveSession(parts: {
  demo?: string;
  session?: string;
  bearer?: string;
}): Promise<SessionUser | null> {
  const demoUser = userFromDemoCookie(parts.demo);
  if (demoUser) return demoUser;
  const sessionUser = userFromSessionCookie(parts.session);
  if (sessionUser) return sessionUser;
  if (parts.bearer) return verifyFirebaseIdToken(parts.bearer);
  return null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  return resolveSession({
    demo: jar.get('ms_demo')?.value,
    session: jar.get('ms_session')?.value,
  });
}

export async function getRequestUser(req: { headers: Headers; cookies?: { get: (name: string) => { value: string } | undefined } }): Promise<SessionUser | null> {
  const header = req.headers.get('authorization') || '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7).trim() : undefined;
  if (req.cookies) {
    return resolveSession({
      demo: req.cookies.get('ms_demo')?.value,
      session: req.cookies.get('ms_session')?.value,
      bearer,
    });
  }
  const jar = await cookies();
  return resolveSession({
    demo: jar.get('ms_demo')?.value,
    session: jar.get('ms_session')?.value,
    bearer,
  });
}

const buckets = new Map<string, { tokens: number; ts: number }>();
const AI_CAPACITY = 12;
const AI_WINDOW_MS = 60_000;

/** Per-user token bucket. Returns false when the caller should receive 429. */
export function consumeAiToken(uid: string): boolean {
  const now = Date.now();
  const refillPerMs = AI_CAPACITY / AI_WINDOW_MS;
  const current = buckets.get(uid);
  const available = current
    ? Math.min(AI_CAPACITY, current.tokens + (now - current.ts) * refillPerMs)
    : AI_CAPACITY;
  if (available < 1) {
    buckets.set(uid, { tokens: available, ts: now });
    return false;
  }
  buckets.set(uid, { tokens: available - 1, ts: now });
  if (buckets.size > 5000) {
    const oldest = buckets.keys().next().value;
    if (oldest) buckets.delete(oldest);
  }
  return true;
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 12,
  secure: process.env.NODE_ENV === 'production',
};
