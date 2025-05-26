// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider, TwitterAuthProvider } from 'firebase/auth';

// --- Firebase Configuration ---
// IMPORTANT: Hardcoding credentials is NOT recommended for production.
// These were provided for immediate local development debugging.
// Consider moving these to a .env.local file.

const firebaseConfig = {
  apiKey: "AIzaSyAIWwRxYDQzm35LVZBdktiZET3QSShXvV8",
  authDomain: "pennywise-n5hqy.firebaseapp.com",
  projectId: "pennywise-n5hqy",
  storageBucket: "pennywise-n5hqy.appspot.com", // Standard Firebase Storage bucket format
  messagingSenderId: "452857348094",
  appId: "1:452857348094:web:eb8e6dc818c20ad0004aaf"
  // measurementId is optional.
};

console.log("[Firebase Init] Using hardcoded Firebase configuration for local development.");
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY_HERE" || firebaseConfig.apiKey === "AIzaSyAIWwRxYDQzm35LVZBdktiZET3QSShXvV8_EXAMPLE") {
    console.warn("[Firebase Init] The API key looks like a placeholder or the one you initially provided. Ensure it's your actual project API key for 'pennywise-n5hqy'.");
}
if (!firebaseConfig.projectId) {
    console.error("[Firebase Init] CRITICAL: Firebase Project ID is missing in the hardcoded config!");
}


// Initialize Firebase
let app: FirebaseApp;

if (!getApps().length) {
  try {
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        throw new Error("Firebase API Key or Project ID is missing in the hardcoded configuration.");
    }
    app = initializeApp(firebaseConfig);
    console.log("[Firebase Init] Firebase app initialized successfully with hardcoded config.");
  } catch (error) {
    console.error("[Firebase Init] Firebase initialization failed with an error (using hardcoded config):", error);
    // This error is likely if the API key is malformed or truly invalid for the project.
    // Or if critical config like projectId is missing.
  }
} else {
  app = getApps()[0];
  console.log("[Firebase Init] Firebase app already initialized.");
}

// @ts-ignore - app might be undefined if initialization failed, getAuth will then throw an error.
const auth = getAuth(app); 
const googleProvider = new GoogleAuthProvider();
const microsoftProvider = new OAuthProvider('microsoft.com');
const twitterProvider = new TwitterAuthProvider();


export { app, auth, googleProvider, microsoftProvider, twitterProvider };