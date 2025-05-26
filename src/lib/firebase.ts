// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider, TwitterAuthProvider } from 'firebase/auth';

// --- Firebase Configuration ---
// IMPORTANT: The configuration below is hardcoded based on your input.
// For production or shared code, these credentials should be stored securely
// in a .env.local file and accessed via process.env.NEXT_PUBLIC_...
// This approach is for immediate local development debugging only.
const firebaseConfig = {
  apiKey: "AIzaSyAIWwRxYDQzm35LVZBdktiZET3QSShXvV8",
  authDomain: "pennywise-n5hqy.firebaseapp.com",
  projectId: "pennywise-n5hqy",
  storageBucket: "pennywise-n5hqy.firebasestorage.app", // Corrected from .firebasestorage.app
  messagingSenderId: "452857348094",
  appId: "1:452857348094:web:eb8e6dc818c20ad0004aaf"
  // measurementId is optional and was not provided in your config.
};

if (process.env.NODE_ENV === 'development') {
    console.log("[Firebase Init] Using hardcoded Firebase configuration for local development.");
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith("AIzaSyAIWwRxYDQzm35LVZBdktiZET3QSShXvV8")) {
        console.warn("[Firebase Init] The API key looks like a placeholder or the one you provided. Ensure it's your actual project API key.");
    }
}

// Initialize Firebase
let app: FirebaseApp;

if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    if (process.env.NODE_ENV === 'development') {
      console.log("[Firebase Init] Firebase app initialized successfully with hardcoded config.");
    }
  } catch (error) {
    console.error("[Firebase Init] Firebase initialization failed with an error (using hardcoded config):", error);
    // This error is likely if the API key is malformed or truly invalid for the project.
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