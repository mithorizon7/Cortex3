import { Request, Response, Router } from 'express';
import { storage } from '../storage';
import { logger } from '../logger';
import { isFirebaseAdminConfigured } from '../lib/firebase-admin';

const router = Router();

/**
 * System diagnostic endpoint - helps diagnose user creation issues
 * SAFE: Only checks if configs exist, never exposes actual secret values
 */
router.get('/system-health', async (req: Request, res: Response) => {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    checks: {}
  };

  try {
    // Check 1: Required environment variables exist (not their values)
    diagnostics.checks.environmentVariables = {
      BOOTSTRAP_ADMIN_CODE: !!process.env.BOOTSTRAP_ADMIN_CODE,
      FIREBASE_SERVICE_ACCOUNT_KEY: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      VITE_FIREBASE_APP_ID: !!process.env.VITE_FIREBASE_APP_ID,
      DATABASE_URL: !!process.env.DATABASE_URL,
      allPresent: !!(
        process.env.BOOTSTRAP_ADMIN_CODE &&
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY &&
        process.env.VITE_FIREBASE_APP_ID &&
        process.env.DATABASE_URL
      )
    };

    // Check 2: Database connectivity and bootstrap invites
    try {
      const bootstrapInvites = await storage.getAllBootstrapInvites();
      diagnostics.checks.database = {
        connected: true,
        bootstrapInvitesCount: bootstrapInvites.length,
        bootstrapInvitesFound: bootstrapInvites.length > 0,
        inviteCodes: bootstrapInvites.map((inv: any) => ({
          code: inv.code,
          role: inv.role,
          remainingUses: inv.remainingUses,
          status: inv.status,
          expiresAt: inv.expiresAt
        }))
      };
    } catch (dbError: any) {
      diagnostics.checks.database = {
        connected: false,
        error: dbError.message
      };
    }

    // Check 3: Firebase Admin initialization status
    try {
      const firebaseConfigured = isFirebaseAdminConfigured();
      diagnostics.checks.firebaseAdmin = {
        configured: firebaseConfigured,
        status: firebaseConfigured ? 'ready' : 'not_configured'
      };
    } catch (firebaseError: any) {
      diagnostics.checks.firebaseAdmin = {
        configured: false,
        error: firebaseError.message
      };
    }

    // Check 4: User storage capability test
    try {
      // Try to get super admin count as a health check
      const superAdminCount = await storage.getSuperAdminCount();
      diagnostics.checks.userStorage = {
        accessible: true,
        superAdminCount
      };
    } catch (storageError: any) {
      diagnostics.checks.userStorage = {
        accessible: false,
        error: storageError.message
      };
    }

    // Overall health status
    const allChecksPass = 
      diagnostics.checks.environmentVariables?.allPresent &&
      diagnostics.checks.database?.connected &&
      diagnostics.checks.database?.bootstrapInvitesFound &&
      diagnostics.checks.firebaseAdmin?.configured &&
      diagnostics.checks.userStorage?.accessible;

    diagnostics.status = allChecksPass ? 'healthy' : 'unhealthy';
    diagnostics.readyForUserCreation = allChecksPass;

    // Log diagnostic request
    logger.info(`System health check: ${diagnostics.status} (${diagnostics.environment})`);

    res.json(diagnostics);
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Diagnostic endpoint error: ${errorMessage}`);

    res.status(500).json({
      status: 'error',
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Quick validation check for an access code
 */
router.post('/validate-code', async (req: Request, res: Response) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    const invite = await storage.getBootstrapInvite(code);
    
    if (!invite) {
      return res.json({
        valid: false,
        reason: 'Code not found in database'
      });
    }

    if (invite.status !== 'active') {
      return res.json({
        valid: false,
        reason: 'Code is not active'
      });
    }

    if (invite.remainingUses <= 0) {
      return res.json({
        valid: false,
        reason: 'Code has no remaining uses'
      });
    }

    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return res.json({
        valid: false,
        reason: 'Code has expired'
      });
    }

    return res.json({
      valid: true,
      role: invite.role,
      remainingUses: invite.remainingUses
    });
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Code validation error: ${errorMessage}`);

    return res.status(500).json({
      valid: false,
      reason: 'System error during validation'
    });
  }
});

export default router;
