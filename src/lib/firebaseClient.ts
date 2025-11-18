import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
};

const isConfigAvailable = Boolean(firebaseConfig.apiKey);

let app: FirebaseApp | undefined;

export const isFirebaseEnabled = () => isConfigAvailable;

export const getFirebaseApp = () => {
  if (!isConfigAvailable) {
    throw new Error('Firebase configuration is missing.');
  }
  if (!app) {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  }
  return app;
};

export const getFirebaseAuth = () => {
  if (!isConfigAvailable) {
    throw new Error('Firebase is not configured.');
  }
  return getAuth(getFirebaseApp());
};

export const googleAuthProvider = new GoogleAuthProvider();
