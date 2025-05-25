
// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider, TwitterAuthProvider } from 'firebase/auth';

// --- Enhanced Firebase Configuration Debugging ---
if (process.env.NODE_ENV === 'development') {
  console.log("--- Firebase Configuration Check (src/lib/firebase.ts) ---");
  const expectedEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID', // Measurement ID is often optional for basic Auth but good practice
  ];

  let allCriticalVarsPresent = true;
  let apiKeyMissing = false;
  let projectIdMissing = false;

  expectedEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (value && value.trim().length > 0) {
      console.log(`[Firebase ENV] ${varName}: Found and has a value.`);
    } else {
      console.error(`[Firebase ENV] ${varName}: NOT FOUND or empty! This is a likely cause of the Firebase error.`);
      if (varName === 'NEXT_PUBLIC_FIREBASE_API_KEY') {
        allCriticalVarsPresent = false;
        apiKeyMissing = true;
      }
      if (varName === 'NEXT_PUBLIC_FIREBASE_PROJECT_ID') {
        allCriticalVarsPresent = false;
        projectIdMissing = true;
      }
    }
  });

  if (!allCriticalVarsPresent) {
    console.error("--------------------------------------------------------------------------------------");
    console.error("CRITICAL: One or more essential Firebase environment variables are missing or empty.");
    if (apiKeyMissing) console.error(" Specifically, NEXT_PUBLIC_FIREBASE_API_KEY seems to be missing or empty.");
    if (projectIdMissing) console.error(" Specifically, NEXT_PUBLIC_FIREBASE_PROJECT_ID seems to be missing or empty.");
    console.error("Please ensure you have a '.env.local' file in your project's root directory.");
    console.error("This file MUST contain your actual Firebase project credentials, like so:");
    console.error("NEXT_PUBLIC_FIREBASE_API_KEY=\"YOUR_API_KEY_HERE\"");
    console.error("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=\"YOUR_AUTH_DOMAIN_HERE\"");
    console.error("NEXT_PUBLIC_FIREBASE_PROJECT_ID=\"YOUR_PROJECT_ID_HERE\"");
    console.error("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=\"YOUR_STORAGE_BUCKET_HERE\"");
    console.error("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=\"YOUR_MESSAGING_SENDER_ID_HERE\"");
    console.error("NEXT_PUBLIC_FIREBASE_APP_ID=\"YOUR_APP_ID_HERE\"");
    console.error("NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=\"YOUR_MEASUREMENT_ID_HERE\" (Optional but recommended)");
    console.error("After creating or updating the .env.local file, YOU MUST RESTART your Next.js development server (e.g., stop and rerun `npm run dev`).");
    console.error("--------------------------------------------------------------------------------------");
  } else {
    console.log("[Firebase ENV] All expected Firebase environment variables appear to be present and have values.");
  }
  console.log("--- End of Firebase Configuration Check ---");
}
// --- End of Firebase Debugging ---

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
  // Check for essential config values before attempting to initialize
  if (firebaseConfig.apiKey && firebaseConfig.apiKey.trim().length > 0 && 
      firebaseConfig.projectId && firebaseConfig.projectId.trim().length > 0) {
    try {
      app = initializeApp(firebaseConfig);
      if (process.env.NODE_ENV === 'development') {
        console.log("[Firebase Init] Firebase app initialized successfully.");
      }
    } catch (error) {
      console.error("[Firebase Init] Firebase initialization failed with an error:", error);
      // This error is likely if the API key is present but malformed or truly invalid for the project.
    }
  } else {
    // This specific log will appear if the env vars weren't picked up correctly by Next.js
    // and thus `firebaseConfig.apiKey` or `firebaseConfig.projectId` are undefined or empty.
    console.error(
      "CRITICAL Firebase Setup Issue: API Key or Project ID is missing or empty in the firebaseConfig object when attempting to initialize Firebase. " +
      "This strongly suggests your .env.local file is not set up correctly, or the Next.js server was not restarted after changes. " +
      "Firebase CANNOT be initialized. Please check the console logs above for '[Firebase ENV]' messages."
    );
    // `app` will remain undefined, and subsequent calls like `getAuth(app)` will fail.
  }
} else {
  app = getApps()[0];
  if (process.env.NODE_ENV === 'development') {
    console.log("[Firebase Init] Firebase app already initialized.");
  }
}

// @ts-ignore - app might be undefined if initialization failed, getAuth will then throw an error.
const auth = getAuth(app); 
const googleProvider = new GoogleAuthProvider();
const microsoftProvider = new OAuthProvider('microsoft.com');
const twitterProvider = new TwitterAuthProvider();


export { app, auth, googleProvider, microsoftProvider, twitterProvider };

