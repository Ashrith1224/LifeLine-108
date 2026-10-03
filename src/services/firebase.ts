import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyB2EmaExtrI7CNU1TObwRGPbmXwXlXFSaI',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'lifeline-108.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'lifeline-108',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'lifeline-108.firebasestorage.app',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '855648538896',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:855648538896:web:656b4bc35cb7ae6b741595',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-YQ5MD4Y083'
};

// Initialize Firebase (guard against multiple initializations in SSR/HMR)
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export default { app, auth, db, googleProvider };
