// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Flag to know if Firebase can be initialized
export const firebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

// Initialize Firebase only on the client when enabled
let app: ReturnType<typeof initializeApp> | null = null;
if (typeof window !== 'undefined' && firebaseEnabled) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (e) {
    // If already initialized or any benign error, ignore
    // console.warn('Firebase init warning:', e);
  }
}

// Initialize Firebase services (null when unavailable)
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;

// Initialize Analytics (only in browser environment when app exists)
export const analytics = app && typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;