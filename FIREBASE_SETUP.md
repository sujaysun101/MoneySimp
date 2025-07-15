# Firebase Setup Instructions

## 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. After creating the project, click on the web icon (</>) to add a web app
4. Register your app with a nickname
5. Copy the Firebase configuration object

## 2. Set Up Environment Variables
Create a `.env.local` file in the root of your project and add the following variables:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Clerk Configuration (if not already set)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

## 3. Set Up Firestore Database
1. In the Firebase Console, go to Firestore Database
2. Click "Create database"
3. Start in production mode (you can change rules later)
4. Choose a location close to your users
5. Click "Enable"

## 4. Set Up Security Rules (Optional but Recommended)
Update your Firestore security rules to secure your data. Here's a basic example:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /goals/{goalId} {
      allow read, write: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## 5. Install Firebase CLI (Optional for Deployment)
```bash
npm install -g firebase-tools
firebase login
firebase init
```

## 6. Test Your Setup
1. Start your development server:
   ```bash
   npm run dev
   ```
2. Visit `http://localhost:3000/goals` to test the goals feature
3. Try creating a new goal and verify it appears in your Firestore database

## Troubleshooting
- If you see "Missing or insufficient permissions" errors, check your Firestore security rules
- Make sure all environment variables are correctly set in `.env.local`
- Check the browser console for any error messages
- Ensure your Firebase project has billing enabled if you exceed the free tier limits
