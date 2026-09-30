import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
export const firebaseApp = getApps().length === 0
  ? initializeApp(firebaseConfigJson)
  : getApp();

export const auth = getAuth(firebaseApp);

// Initialize Firestore database instance
const databaseId = (firebaseConfigJson as any).firestoreDatabaseId;
export const db = databaseId
  ? getFirestore(firebaseApp, databaseId)
  : getFirestore(firebaseApp);

// Test Firestore connection on boot without emitting unhandled console errors
(async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.warn('Firestore offline check:', error.message);
    }
  }
})().catch(() => {});

// Configure session persistence
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Firebase persistence warning:', err);
});

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

/**
 * Initiates Google Sign-In with popup
 */
export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: any) {
    if (err.code === 'auth/popup-blocked') {
      console.warn('Popup was blocked by browser. User should allow popups.');
      throw new Error('POPUP_BLOCKED');
    }
    throw err;
  }
}

/**
 * Signs out current user
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Retrieves the current Firebase ID token for Authorization headers
 */
export async function getCurrentIdToken(forceRefresh: boolean = false): Promise<string | null> {
  if (!auth.currentUser) return null;
  return auth.currentUser.getIdToken(forceRefresh);
}

/**
 * Subscribes to auth state changes
 */
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
