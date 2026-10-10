import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signOut,
  onAuthStateChanged,
  type User,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { initializeFirestore, getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Suppress harmless internal WebChannel connection transport retries and stream errors in console
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const firstStr = String(args[0] || '');
    if (firstStr.includes('WebChannelConnection') || firstStr.includes('@firebase/firestore')) {
      return;
    }
    originalWarn.apply(console, args);
  };

  const originalError = console.error;
  console.error = (...args: any[]) => {
    const firstStr = String(args[0] || '');
    if (firstStr.includes('WebChannelConnection') || firstStr.includes('@firebase/firestore')) {
      return;
    }
    originalError.apply(console, args);
  };
}

// Initialize Firebase App singleton
export const firebaseApp = getApps().length === 0
  ? initializeApp(firebaseConfigJson)
  : getApp();

export const auth = getAuth(firebaseApp);

// Initialize Firestore database instance with auto long polling to prevent WebChannel Write stream broken pipes
const databaseId = (firebaseConfigJson as any).firestoreDatabaseId;
export const db = (() => {
  try {
    if (databaseId && databaseId !== '(default)') {
      return initializeFirestore(firebaseApp, { experimentalAutoDetectLongPolling: true }, databaseId);
    }
    return initializeFirestore(firebaseApp, { experimentalAutoDetectLongPolling: true });
  } catch {
    return (databaseId && databaseId !== '(default)')
      ? getFirestore(firebaseApp, databaseId)
      : getFirestore(firebaseApp);
  }
})();

// Configure session persistence
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Firebase persistence warning:', err);
});

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

const GOOGLE_OAUTH_CLIENT_ID = '506588241024-php69dmgr659mm5a91lpusfv3rdc2t91.apps.googleusercontent.com';

// Local custom user representation compatible with Firebase User
let localAppUser: any = null;
const authListeners: Set<(user: any) => void> = new Set();

// Initialize session (restores Google user or creates instant guest session)
export async function ensureSession(): Promise<any> {
  if (typeof window === 'undefined') return null;

  // 1. Check existing saved Google user session
  const savedGoogle = localStorage.getItem('growth_app_user_session');
  if (savedGoogle) {
    try {
      const parsed = JSON.parse(savedGoogle);
      if (parsed && parsed.token) {
        localAppUser = {
          ...parsed,
          isGuest: false,
          getIdToken: async () => parsed.token,
        };
        notifyAuthChange(localAppUser);
        return localAppUser;
      }
    } catch {}
  }

  // 2. Otherwise obtain server-signed guest session
  let guestId = localStorage.getItem('growth_guest_id');
  let guestToken = localStorage.getItem('growth_guest_token');

  if (!guestId || !guestToken) {
    try {
      const res = await fetch('/api/auth/guest-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId }),
      });
      const data = await res.json();
      if (data.success && data.token && data.user?.uid) {
        guestId = String(data.user.uid);
        guestToken = String(data.token);
        localStorage.setItem('growth_guest_id', guestId);
        localStorage.setItem('growth_guest_token', guestToken);
      }
    } catch (e) {
      console.warn('Guest token init warning:', e);
    }
  }

  if (guestId && guestToken) {
    localAppUser = {
      uid: guestId,
      email: null,
      displayName: 'کاربر مهمان',
      photoURL: null,
      isGuest: true,
      token: guestToken,
      getIdToken: async () => guestToken!,
    };
    notifyAuthChange(localAppUser);
    return localAppUser;
  }

  return null;
}

// Kick off session immediately
if (typeof window !== 'undefined') {
  ensureSession().catch(() => {});
}

function notifyAuthChange(user: any) {
  authListeners.forEach((fn) => {
    try {
      fn(user);
    } catch (e) {}
  });
}

/**
 * Initiates Google Sign-In (Direct Google Identity Services - works seamlessly in Iran without firebaseapp.com)
 */
export async function loginWithGoogle(): Promise<any> {
  const google = typeof window !== 'undefined' ? (window as any).google : null;

  // 1. Try Google Identity Services (GIS - direct Google OAuth on accounts.google.com)
  if (google?.accounts?.oauth2) {
    return new Promise((resolve, reject) => {
      try {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_OAUTH_CLIENT_ID,
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              console.warn('Google Identity error:', tokenResponse);
              reject(new Error(tokenResponse.error_description || tokenResponse.error));
              return;
            }
            try {
              const res = await fetch('/api/auth/google-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken: tokenResponse.access_token }),
              });
              const data = await res.json();
              if (!data.success || !data.user) {
                throw new Error(data.message || 'ورود با حساب گوگل با خطا مواجه شد.');
              }

              const userObj = {
                uid: data.user.uid,
                email: data.user.email,
                displayName: data.user.displayName,
                photoURL: data.user.photoURL,
                token: data.token,
                getIdToken: async () => data.token,
              };

              // Optionally link with Firebase Auth to populate auth.currentUser
              try {
                const cred = GoogleAuthProvider.credential(null, tokenResponse.access_token);
                await signInWithCredential(auth, cred);
              } catch (_) {}

              localAppUser = userObj;
              localStorage.setItem('growth_app_user_session', JSON.stringify(userObj));
              notifyAuthChange(userObj);
              resolve(userObj);
            } catch (fetchErr) {
              reject(fetchErr);
            }
          },
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
      } catch (gisInitErr) {
        console.warn('GIS init failed, falling back to Firebase popup:', gisInitErr);
        // Fallback to Firebase popup
        signInWithPopup(auth, googleProvider)
          .then((result) => {
            localAppUser = result.user;
            notifyAuthChange(result.user);
            resolve(result.user);
          })
          .catch(reject);
      }
    });
  }

  // 2. Fallback: Firebase popup
  try {
    const result = await signInWithPopup(auth, googleProvider);
    localAppUser = result.user;
    notifyAuthChange(result.user);
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
  localAppUser = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('growth_app_user_session');
  }
  await signOut(auth).catch(() => {});
  // Automatically restore guest session so visitor can still chat
  await ensureSession();
}

/**
 * Retrieves the current ID token for Authorization headers
 */
export async function getCurrentIdToken(forceRefresh: boolean = false): Promise<string | null> {
  if (localAppUser?.getIdToken) {
    return localAppUser.getIdToken(forceRefresh);
  }
  const session = await ensureSession();
  if (session?.getIdToken) {
    return session.getIdToken(forceRefresh);
  }
  if (auth.currentUser) {
    return auth.currentUser.getIdToken(forceRefresh);
  }
  return null;
}

/**
 * Subscribes to auth state changes (supports both GIS and Firebase)
 */
export function onAuthChange(callback: (user: any) => void) {
  authListeners.add(callback);

  // Immediately call with cached user if available
  if (localAppUser) {
    callback(localAppUser);
  }

  // Listen to Firebase auth
  const unsubFb = onAuthStateChanged(auth, (fbUser) => {
    if (fbUser) {
      localAppUser = fbUser;
      callback(fbUser);
    } else if (!localAppUser) {
      callback(null);
    }
  });

  return () => {
    authListeners.delete(callback);
    unsubFb();
  };
}
