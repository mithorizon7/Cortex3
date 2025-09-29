import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { logger } from '../logger';
import { generateIncidentId } from '../utils/incident';
import { executeWithRetry, EXTERNAL_API_RETRY_CONFIG } from '../utils/retry';

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

    // Try to initialize with service account if available
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    let credential;
    let projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
    
    if (serviceAccountKey) {
      // Parse service account key from environment variable
      try {
        const serviceAccount = JSON.parse(serviceAccountKey) as ServiceAccount;
        // Extract project ID from service account if not explicitly set
        if (!projectId && serviceAccount.project_id) {
          projectId = serviceAccount.project_id;
          logger.info(`Using project ID from service account: ${projectId}`);
        }
        credential = cert(serviceAccount);
      } catch (error) {
        logger.error('Failed to parse Firebase service account key', error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    }
    
    // Check if we have a project ID from any source
    if (!projectId) {
      logger.warn('Firebase project ID not configured and not found in service account');
      return { adminApp: null, adminAuth: null };
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
  const incidentId = generateIncidentId();
  
  // Circuit breaker - if admin auth isn't available, don't retry
  if (!adminAuth) {
    const { adminAuth: auth } = initializeFirebaseAdmin();
    if (!auth) {
      logger.error(
        'Firebase Admin not initialized - cannot verify tokens',
        new Error(`Firebase Admin SDK not initialized. Incident ID: ${incidentId}`),
        {
          additionalContext: { 
            operation: 'token_verification_init_failed',
            incidentId 
          }
        }
      );
      return null;
    }
    adminAuth = auth;
  }
  
  try {
    const decodedToken = await executeWithRetry(
      'firebase_token_verification',
      async (context) => {
        logger.debug(`Firebase token verification attempt ${context.attempt}`, {
          additionalContext: {
            operation: 'firebase_token_verification_attempt',
            incidentId: context.incidentId,
            attempt: context.attempt,
            maxAttempts: context.maxAttempts
          }
        });

        const token = await adminAuth.verifyIdToken(idToken);
        
        logger.debug('Firebase token verified successfully', {
          additionalContext: {
            operation: 'token_verification_success',
            uid: token.uid,
            hasEmail: !!token.email,
            incidentId: context.incidentId,
            attempt: context.attempt
          }
        });
        
        return token;
      },
      {
        ...EXTERNAL_API_RETRY_CONFIG,
        retryableErrorClassifier: (error: unknown) => {
          if (error instanceof Error) {
            const message = error.message.toLowerCase();
            const errorCode = (error as any).code?.toLowerCase() || '';
            
            // Non-retryable errors: expired/invalid tokens
            if (
              message.includes('firebase id token has expired') ||
              message.includes('firebase id token has invalid signature') ||
              message.includes('token used too early') ||
              message.includes('invalid token') ||
              message.includes('token has expired') ||
              message.includes('invalid signature')
            ) {
              return false;
            }
            
            // Retryable errors: network issues, service unavailable
            if (
              message.includes('network') ||
              message.includes('timeout') ||
              message.includes('econnreset') ||
              message.includes('enotfound') ||
              message.includes('temporarily unavailable') ||
              message.includes('service unavailable') ||
              message.includes('internal error') ||
              message.includes('too many requests') ||
              message.includes('rate limit') ||
              errorCode.includes('unavailable') ||
              errorCode.includes('timeout') ||
              errorCode.includes('deadline-exceeded') ||
              errorCode === 'network_error'
            ) {
              return true;
            }
          }
          return false;
        }
      }
    );
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || undefined
    };
    
  } catch (error) {
    // Special handling for auth-related errors
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('firebase id token has expired') || message.includes('token has expired')) {
        logger.debug('Firebase token expired during verification', {
          additionalContext: { 
            operation: 'token_verification_expired',
            incidentId
          }
        });
      } else if (message.includes('firebase id token has invalid signature') || message.includes('invalid signature')) {
        logger.warn('Invalid Firebase token signature detected', {
          additionalContext: { 
            operation: 'token_verification_invalid_signature',
            incidentId
          }
        });
      } else {
        logger.error(
          'Firebase token verification failed after all retries',
          error,
          {
            additionalContext: {
              operation: 'firebase_token_verification_final_failure',
              incidentId
            }
          }
        );
      }
    }
    
    return null;
  }
};

/**
 * Create a test user account using Firebase Admin SDK
 * Only works in development environment with proper admin credentials
 */
export const createTestAccount = async (): Promise<{ uid: string; email: string }> => {
  const TEST_EMAIL = 'test.user@cortexapp.dev';
  const TEST_PASSWORD = 'TestUser2024!';
  const TEST_DISPLAY_NAME = 'CORTEX Test User';
  const incidentId = generateIncidentId();

  try {
    if (!adminAuth) {
      const { adminAuth: auth } = initializeFirebaseAdmin();
      if (!auth) {
        const error = new Error('Firebase Admin not initialized - cannot create users');
        logger.error(
          'Failed to initialize Firebase Admin for test account creation',
          error,
          {
            additionalContext: { 
              operation: 'test_account_creation_init_failed',
              incidentId
            }
          }
        );
        throw error;
      }
      adminAuth = auth;
    }

    // Check if user already exists
    try {
      const existingUser = await executeWithRetry(
        'firebase_get_user_by_email',
        () => adminAuth.getUserByEmail(TEST_EMAIL),
        EXTERNAL_API_RETRY_CONFIG
      ) as any; // Type assertion for Firebase UserRecord
      logger.info('Test user already exists', { 
        additionalContext: { 
          operation: 'test_account_exists',
          uid: existingUser.uid,
          email: existingUser.email,
          incidentId
        }
      });
      return { uid: existingUser.uid, email: existingUser.email };
    } catch (error) {
      // User doesn't exist, proceed to create them
      if (error instanceof Error && error.message.includes('no user record')) {
        logger.info('Test user does not exist - proceeding with creation', {
          additionalContext: {
            operation: 'test_account_creation_needed',
            incidentId
          }
        });
      } else {
        // Log unexpected errors during user lookup
        logger.warn('Unexpected error checking for existing test user', {
          additionalContext: {
            operation: 'test_account_lookup_error',
            errorMessage: error instanceof Error ? error.message : String(error),
            incidentId
          }
        });
      }
    }

    // Create the test user with retry logic
    const userRecord = await executeWithRetry(
      'firebase_create_test_user',
      async (context) => {
        logger.debug(`Creating test user attempt ${context.attempt}`, {
          additionalContext: {
            operation: 'firebase_create_test_user_attempt',
            incidentId: context.incidentId,
            attempt: context.attempt,
            email: TEST_EMAIL
          }
        });

        return await adminAuth.createUser({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          displayName: TEST_DISPLAY_NAME,
          emailVerified: true, // Auto-verify for test account
        });
      },
      EXTERNAL_API_RETRY_CONFIG
    );

    logger.info('Test user account created successfully', {
      additionalContext: {
        operation: 'test_account_created',
        uid: userRecord.uid,
        email: userRecord.email,
        incidentId
      }
    });

    return { uid: userRecord.uid, email: userRecord.email };
    
  } catch (error) {
    // Enhanced error handling for Firebase Admin errors
    if (error instanceof Error) {
      // Handle specific Firebase error codes
      const errorCode = (error as any).code;
      
      if (errorCode === 'auth/email-already-exists') {
        logger.warn('Test account already exists during creation attempt', {
          additionalContext: {
            operation: 'test_account_already_exists',
            incidentId
          }
        });
        // This shouldn't happen due to our check above, but handle gracefully
        throw new Error(`Test account already exists. Incident ID: ${incidentId}`);
      } else if (errorCode === 'auth/invalid-email') {
        logger.error(
          'Invalid email format for test account',
          error,
          {
            additionalContext: {
              operation: 'test_account_invalid_email',
              incidentId
            }
          }
        );
        throw new Error(`Invalid email format for test account. Incident ID: ${incidentId}`);
      } else {
        logger.error(
          'Failed to create test user account',
          error,
          {
            additionalContext: {
              operation: 'test_account_creation_failed',
              errorCode: errorCode || 'unknown',
              incidentId
            }
          }
        );
        throw new Error(`Failed to create test account. Incident ID: ${incidentId}`);
      }
    } else {
      logger.error(
        'Unknown error during test account creation',
        new Error(String(error)),
        {
          additionalContext: {
            operation: 'test_account_unknown_error',
            incidentId
          }
        }
      );
      throw new Error(`Unknown error during test account creation. Incident ID: ${incidentId}`);
    }
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