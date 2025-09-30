import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  GoogleAuthProvider, 
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  AuthError,
  UserCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';

// Firebase authDomain configuration for OAuth
const getAuthDomain = (): string => {
  // Always use the Firebase project domain for OAuth
  // This is required because Firebase's auth handler endpoints (/__/auth/handler) 
  // only exist on the firebaseapp.com domain, not on custom domains
  const firebaseAuthDomain = `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`;
  
  // Log the configuration for debugging
  console.log('Firebase Auth Configuration:', {
    currentDomain: window.location.hostname,
    authDomain: firebaseAuthDomain,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    note: 'Using Firebase domain for OAuth handler compatibility'
  });
  
  return firebaseAuthDomain;
};

// Firebase configuration with environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: getAuthDomain(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate required environment variables
const validateConfig = () => {
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_PROJECT_ID', 
    'VITE_FIREBASE_APP_ID'
  ];
  
  const missing = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missing.length > 0) {
    const errorMessage = `Missing required Firebase environment variables: ${missing.join(', ')}`;
    console.warn(errorMessage);
    return false;
  }
  return true;
};

// Initialize Firebase app (singleton pattern)
let app: FirebaseApp;
let auth: Auth;

export const initializeFirebase = async (): Promise<{ app: FirebaseApp | null; auth: Auth | null }> => {
  try {
    if (!validateConfig()) {
      console.warn('Firebase not configured - authentication will be disabled');
      return { app: null, auth: null };
    }
    
    // Only initialize if not already initialized
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    
    auth = getAuth(app);
    
    // Set persistence to LOCAL to ensure auth state survives redirects
    try {
      await setPersistence(auth, browserLocalPersistence);
      console.log('Firebase persistence set to LOCAL for redirect support');
    } catch (persistenceError) {
      console.error('Failed to set Firebase persistence:', persistenceError);
      // Continue anyway - browser should use local persistence by default
    }
    
    return { app, auth };
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    return { app: null, auth: null };
  }
};

// Google Auth Provider setup - only create if Firebase is configured
export const googleProvider = new GoogleAuthProvider();
if (validateConfig()) {
  googleProvider.addScope('email');
  googleProvider.addScope('profile');
  
  // Production-specific OAuth configuration
  if (import.meta.env.PROD) {
    // Set custom parameters for production environment
    googleProvider.setCustomParameters({
      'prompt': 'consent',
      'access_type': 'online'
    });
  }
}

// Initialize Firebase - will be set after async init completes
let firebaseAuth: Auth | null = null;

// Initialize Firebase when module loads
initializeFirebase().then(({ auth }) => {
  firebaseAuth = auth;
  if (auth) {
    console.log('Firebase initialized successfully with persistence');
  }
}).catch((error) => {
  console.error('Failed to initialize Firebase:', error);
});

// Check if Firebase is configured
export const isFirebaseConfigured = (): boolean => {
  return firebaseAuth !== null;
};

// Authentication utility functions
export const signInWithGoogle = async (usePopup = true): Promise<UserCredential> => {
  if (!firebaseAuth) {
    throw new Error('Firebase authentication not configured');
  }
  
  try {
    // In production, always use redirect to avoid popup blockers
    // In development, try popup first for better UX
    const shouldUseRedirect = import.meta.env.PROD || !usePopup;
    
    if (shouldUseRedirect) {
      // Use redirect flow in production to avoid popup blockers
      await signInWithRedirect(firebaseAuth, googleProvider);
      // For redirect, we need to handle the result elsewhere
      throw new Error('REDIRECT_FLOW_INITIATED');
    } else {
      // Try popup in development
      try {
        return await signInWithPopup(firebaseAuth, googleProvider);
      } catch (popupError: any) {
        // If popup is blocked or closed, fall back to redirect
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.code === 'auth/cancelled-popup-request') {
          console.log('Popup blocked or closed, falling back to redirect flow');
          await signInWithRedirect(firebaseAuth, googleProvider);
          throw new Error('REDIRECT_FLOW_INITIATED');
        }
        // For other popup errors, re-throw them
        throw popupError;
      }
    }
  } catch (error) {
    // Enhanced error logging for production debugging
    if (import.meta.env.PROD) {
      console.error('Production OAuth Error Details:', {
        code: (error as any)?.code,
        message: (error as any)?.message,
        domain: window.location.hostname,
        url: window.location.href
      });
    }
    
    throw error;
  }
};

// Email/Password Authentication for testing
export const signInWithEmail = async (email: string, password: string): Promise<UserCredential> => {
  if (!firebaseAuth) {
    throw new Error('Firebase authentication not configured');
  }
  
  try {
    return await signInWithEmailAndPassword(firebaseAuth, email, password);
  } catch (error) {
    console.error('Email sign-in failed:', error);
    throw error;
  }
};

export const createTestAccount = async (email: string, password: string, displayName?: string): Promise<UserCredential> => {
  if (!firebaseAuth) {
    throw new Error('Firebase authentication not configured');
  }
  
  try {
    const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    
    // Update profile with display name if provided
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    return userCredential;
  } catch (error) {
    console.error('Account creation failed:', error);
    throw error;
  }
};

// General sign-up function for new user accounts
export const signUpWithEmail = async (email: string, password: string, displayName?: string): Promise<UserCredential> => {
  if (!firebaseAuth) {
    throw new Error('Firebase authentication not configured');
  }
  
  try {
    const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    
    // Update profile with display name if provided
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    return userCredential;
  } catch (error) {
    console.error('Account creation failed:', error);
    throw error;
  }
};

export const handleRedirectResult = async (): Promise<UserCredential | null> => {
  if (!firebaseAuth) {
    return null;
  }

  try {
    return await getRedirectResult(firebaseAuth);
  } catch (error) {
    console.error('Redirect result handling failed:', error);
    throw error;
  }
};

export const signOut = async (): Promise<void> => {
  if (!firebaseAuth) {
    throw new Error('Firebase authentication not configured');
  }
  
  try {
    await firebaseSignOut(firebaseAuth);
  } catch (error) {
    console.error('Sign out failed:', error);
    throw error;
  }
};

// Password reset functionality
export const resetPassword = async (email: string): Promise<void> => {
  if (!firebaseAuth) {
    throw new Error('Firebase authentication not configured');
  }
  
  try {
    await sendPasswordResetEmail(firebaseAuth, email);
  } catch (error) {
    console.error('Password reset failed:', error);
    throw error;
  }
};

// Auth state listener
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  if (!firebaseAuth) {
    // Return a no-op unsubscribe function when Firebase is not configured
    setTimeout(() => callback(null), 0);
    return () => {};
  }
  return onAuthStateChanged(firebaseAuth, callback);
};

// Error message utilities
export const getAuthErrorMessage = (error: AuthError): string => {
  switch (error.code) {
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked. Please allow popups and try again.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled. Please try again.';
    case 'auth/cancelled-popup-request':
      return 'Another sign-in attempt is in progress. Please wait.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many sign-in attempts. Please try again later.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled. Please contact support.';
    // Email/Password specific errors
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please try again.';
    // Password reset specific errors (note: duplicates handled by catch-all)
    case 'auth/missing-email':
      return 'Please enter your email address.';
    default:
      return 'Sign-in failed. Please try again.';
  }
};

export { firebaseAuth as auth };
export type { User, AuthError, UserCredential };