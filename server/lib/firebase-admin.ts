import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { logger } from '../logger';

let adminApp: any = null;
let adminAuth: any = null;

/**
 * Initialize Firebase Admin SDK
 * Uses service account credentials for server-side authentication
 */
export const initializeFirebaseAdmin = () => {
  try {
    // Only initialize once
    if (adminApp) {
      return { adminApp, adminAuth };
    }

    // Check if already initialized
    const apps = getApps();
    if (apps.length > 0) {
      adminApp = apps[0];
      adminAuth = getAuth(adminApp);
      return { adminApp, adminAuth };
    }

    // In production, use service account file or environment variables
    // For development, we can use the Firebase emulator or fallback to client-side verification
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
    
    if (!projectId) {
      logger.warn('Firebase project ID not configured for admin SDK');
      return { adminApp: null, adminAuth: null };
    }

    // Try to initialize with service account if available
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    let credential;
    
    if (serviceAccountKey) {
      // Parse service account key from environment variable
      try {
        const serviceAccount = JSON.parse(serviceAccountKey) as ServiceAccount;
        credential = cert(serviceAccount);
      } catch (error) {
        logger.error('Failed to parse Firebase service account key', error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    } else if (serviceAccountPath) {
      // Use service account file path
      credential = cert(serviceAccountPath);
    } else {
      // For development without service account, initialize with minimal config
      // This will work for token verification but won't have admin privileges
      adminApp = initializeApp({
        projectId: projectId,
      });
      adminAuth = getAuth(adminApp);
      
      logger.warn('Firebase Admin initialized without service account credentials - limited functionality available');
      return { adminApp, adminAuth };
    }

    // Initialize with service account credentials
    adminApp = initializeApp({
      credential: credential,
      projectId: projectId,
    });
    
    adminAuth = getAuth(adminApp);
    
    logger.info('Firebase Admin SDK initialized successfully');
    return { adminApp, adminAuth };
    
  } catch (error) {
    logger.error('Firebase Admin initialization failed', error instanceof Error ? error : new Error(String(error)));
    return { adminApp: null, adminAuth: null };
  }
};

/**
 * Verify Firebase ID token and return the decoded token
 * @param idToken - The Firebase ID token to verify
 * @returns Promise<DecodedIdToken> - The verified token payload
 */
export const verifyFirebaseToken = async (idToken: string): Promise<{ uid: string; email?: string } | null> => {
  try {
    if (!adminAuth) {
      const { adminAuth: auth } = initializeFirebaseAdmin();
      if (!auth) {
        logger.error('Firebase Admin not initialized - cannot verify tokens');
        return null;
      }
      adminAuth = auth;
    }

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || undefined
    };
    
  } catch (error) {
    // Log the specific error for debugging
    if (error instanceof Error) {
      if (error.message.includes('Firebase ID token has expired')) {
        logger.debug('Firebase token expired during verification');
      } else if (error.message.includes('Firebase ID token has invalid signature')) {
        logger.warn('Invalid Firebase token signature detected');
      } else {
        logger.warn('Firebase token verification failed', { 
          additionalContext: { 
            operation: 'token_verification_failed', 
            errorMessage: error.message 
          } 
        });
      }
    } else {
      logger.warn('Firebase token verification failed', { 
        additionalContext: { 
          operation: 'token_verification_failed', 
          errorMessage: String(error) 
        } 
      });
    }
    
    return null;
  }
};

/**
 * Check if Firebase Admin is properly configured
 */
export const isFirebaseAdminConfigured = (): boolean => {
  return adminAuth !== null || !!(process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID);
};

// Initialize on module load
initializeFirebaseAdmin();