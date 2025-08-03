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
  apiKey: "AIzaSyARyJsuVrCmepJthP1PjPpg3z85MIogqLY",
  authDomain: "emob-dc8bc.firebaseapp.com",
  projectId: "emob-dc8bc",
  storageBucket: "emob-dc8bc.firebasestorage.app",
  messagingSenderId: "260595746840",
  appId: "1:260595746840:web:98cc2c4a862237a6e65b6d",
  measurementId: "G-7JDT9P7YWW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics (only in browser environment)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;