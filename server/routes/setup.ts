import { Request, Response, Router } from 'express';
import { storage } from '../storage';
import { logger } from '../logger';
import { withDatabaseErrorHandling } from '../utils/database-errors';

const router = Router();

/**
 * ONE-TIME SETUP: Initialize bootstrap system
 * This creates the system admin user and bootstrap invite codes
 * Can only be run when no super admin exists (security measure)
 */
router.post('/initialize-bootstrap', async (req: Request, res: Response) => {
  try {
    logger.info('Bootstrap initialization requested');
    
    // Security check: Only allow if no super admin exists
    const superAdminCount = await withDatabaseErrorHandling(
      'check_super_admin_count',
      () => storage.getSuperAdminCount()
    );
    
    if (superAdminCount > 0) {
      logger.warn('Bootstrap initialization rejected - super admin already exists');
      return res.status(403).json({
        success: false,
        error: 'Bootstrap system already initialized. Super admin exists.',
        superAdminCount
      });
    }
    
    // Step 1: Create bootstrap-admin system user
    logger.info('Creating bootstrap-admin system user');
    
    let bootstrapAdmin;
    try {
      bootstrapAdmin = await withDatabaseErrorHandling(
        'create_bootstrap_admin',
        () => storage.createUser({
          userId: 'bootstrap-admin',
          email: 'system@cortexindex.com',
          role: 'super_admin'
        })
      );
      logger.info('Bootstrap admin user created successfully');
    } catch (error: any) {
      // If user already exists, get it
      if (error.message?.includes('duplicate') || error.message?.includes('already exists')) {
        logger.info('Bootstrap admin user already exists, fetching it');
        bootstrapAdmin = await withDatabaseErrorHandling(
          'get_bootstrap_admin',
          () => storage.getUser('bootstrap-admin')
        );
      } else {
        throw error;
      }
    }
    
    if (!bootstrapAdmin) {
      throw new Error('Failed to create or retrieve bootstrap admin user');
    }
    
    // Step 2: Create bootstrap invite codes
    const inviteCodes = [
      {
        code: 'KJVFGZDZ',
        role: 'admin' as const,
        allowedUses: 3,
        remainingUses: 1,
        expiresAt: new Date('2025-10-25T00:00:00Z'),
        issuedBy: 'bootstrap-admin',
        description: 'Production admin bootstrap invite',
        status: 'active' as const
      },
      {
        code: 'P7LF4MYU',
        role: 'super_admin' as const,
        allowedUses: 2,
        remainingUses: 2,
        expiresAt: new Date('2025-10-25T12:00:00Z'),
        issuedBy: 'bootstrap-admin',
        description: 'Production super admin bootstrap invite',
        status: 'active' as const
      }
    ];
    
    const createdInvites = [];
    
    for (const invite of inviteCodes) {
      try {
        logger.info(`Creating bootstrap invite: ${invite.code}`);
        const created = await withDatabaseErrorHandling(
          'create_bootstrap_invite',
          () => storage.createBootstrapInvite(invite)
        );
        createdInvites.push(created);
        logger.info(`Bootstrap invite created: ${invite.code}`);
      } catch (error: any) {
        // If invite already exists, that's okay
        if (error.message?.includes('duplicate') || error.message?.includes('already exists')) {
          logger.info(`Bootstrap invite ${invite.code} already exists, skipping`);
        } else {
          logger.error(`Failed to create bootstrap invite ${invite.code}:`, error);
          throw error;
        }
      }
    }
    
    logger.info('Bootstrap initialization completed successfully');
    
    return res.json({
      success: true,
      message: 'Bootstrap system initialized successfully',
      bootstrapAdmin: {
        userId: bootstrapAdmin.userId,
        email: bootstrapAdmin.email,
        role: bootstrapAdmin.role
      },
      invites: createdInvites.map(inv => ({
        code: inv.code,
        role: inv.role,
        remainingUses: inv.remainingUses,
        expiresAt: inv.expiresAt
      }))
    });
    
  } catch (error: any) {
    logger.error('Bootstrap initialization failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to initialize bootstrap system',
      details: error.stack
    });
  }
});

export default router;
