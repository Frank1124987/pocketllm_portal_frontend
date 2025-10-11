/**
 * Firebase Configuration
 * 
 * Setup Instructions:
 * 1. Create a Firebase project at https://console.firebase.google.com
 * 2. Enable Authentication > Sign-in method > Google
 * 3. Get your config from Project Settings > General > Your apps
 * 4. Create a .env file in the project root with these values:
 * 
 * REACT_APP_FIREBASE_API_KEY=your-api-key
 * REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
 * REACT_APP_FIREBASE_PROJECT_ID=your-project-id
 * REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
 * REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
 * REACT_APP_FIREBASE_APP_ID=your-app-id
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;
