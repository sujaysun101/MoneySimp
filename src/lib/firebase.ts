
// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider, TwitterAuthProvider } from 'firebase/auth';

// Log the API key for debugging purposes (ONLY in development)
if (process.env.NODE_ENV === 'development') {
  console.log('Attempting to initialize Firebase with API Key:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "Key Found (see your .env.local)" : "API Key Not Found or Undefined");
  // To avoid logging the actual key, you can also log its presence or a masked version
  // console.log('NEXT_PUBLIC_FIREBASE_API_KEY available:', !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const microsoftProvider = new OAuthProvider('microsoft.com');
// Twitter (X) provider can be complex due to API changes.
// Firebase's TwitterAuthProvider might require additional setup or use of older Twitter API versions.
// For robust X login, consider using a generic OAuth provider with X's v2 API or a dedicated library if needed.
const twitterProvider = new TwitterAuthProvider();


export { app, auth, googleProvider, microsoftProvider, twitterProvider };

