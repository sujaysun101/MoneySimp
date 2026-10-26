// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider, TwitterAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// We prefer environment variables. Fallback to the previous hardcoded values ONLY for local dev.
// Create a .env.local with NEXT_PUBLIC_FIREBASE_* variables to override these.
const fallbackConfig = {
  apiKey: "AIzaSyAIWwRxYDQzm35LVZBdktiZET3QSShXvV8",
  authDomain: "pennywise-n5hqy.firebaseapp.com",
  projectId: "pennywise-n5hqy",
  storageBucket: "pennywise-n5hqy.appspot.com",
  messagingSenderId: "452857348094",
  appId: "1:452857348094:web:eb8e6dc818c20ad0004aaf"
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || fallbackConfig.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || fallbackConfig.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || fallbackConfig.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || fallbackConfig.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || fallbackConfig.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || fallbackConfig.appId,
};

const usingFallback = Object.values({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}).some(v => !v);

if (usingFallback) {
  console.warn('[Firebase Init] One or more env vars missing. Falling back to hardcoded config (NOT for production).');
}

let app: FirebaseApp | undefined;
try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    console.log('[Firebase Init] Firebase app initialized. Project:', firebaseConfig.projectId);
  } else {
    app = getApps()[0];
    console.log('[Firebase Init] Re-using existing Firebase app.');
  }
} catch (err) {
  console.error('[Firebase Init] Failed to initialize Firebase:', err);
  app = undefined;
}

// Auth & Firestore instances (may be undefined if init failed)
const auth = app ? getAuth(app) : undefined;
const db = app ? getFirestore(app) : undefined;

// Optional local emulator support (set NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true)
if (app && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
  try {
    if (auth) connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    if (db) connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('[Firebase Init] Connected to local Firebase emulators.');
  } catch (e) {
    console.warn('[Firebase Init] Failed to connect to emulators:', e);
  }
}

// Providers
const googleProvider = new GoogleAuthProvider();
const microsoftProvider = new OAuthProvider('microsoft.com');
const twitterProvider = new TwitterAuthProvider();

// Helper for diagnostics in auth issues
export function describeFirebaseConfig() {
  return {
    projectId: firebaseConfig.projectId,
    hasApiKey: Boolean(firebaseConfig.apiKey),
    usingFallback,
    appInitialized: Boolean(app),
  };
}

export { app, auth, db, googleProvider, microsoftProvider, twitterProvider, usingFallback };