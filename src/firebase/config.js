import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyC6VpKW10-JwzkibIiD1tfnpLbqeAYj9wU',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'hativa2treatmentas.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'hativa2treatmentas',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'hativa2treatmentas.firebasestorage.app',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '65408005609',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:65408005609:web:813b79fb0d87110f0e4778',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-NR0NCS2KB7',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
