// Minimal Firebase Admin initialization for server-side verification & persistence.
import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let adminApp; // eslint-disable-line
if (!getApps().length) {
  try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
      adminApp = initializeApp({ credential: cert(serviceAccount) });
    } else {
      adminApp = initializeApp({ credential: applicationDefault() });
    }
  } catch (e) {
    console.warn('[firebaseAdmin] Init failed', e);
  }
}

export const adminDb = (() => { try { return getFirestore(); } catch { return undefined; } })();
export const adminAuth = (() => { try { return getAuth(); } catch { return undefined; } })();
