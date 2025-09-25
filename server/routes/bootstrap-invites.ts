import { Request, Response, Router } from 'express';
import { generateIncidentId, createUserError, sanitizeErrorForUser } from '../utils/incident';
import { USER_ERROR_MESSAGES, HTTP_STATUS } from '../constants';
import { logger } from '../logger';
import { requireAdminMiddleware, requireSuperAdminMiddleware } from '../middleware/security';
import { withDatabaseErrorHandling } from '../utils/database-errors';
import { storage } from '../storage';
import { insertBootstrapInviteSchema } from '@shared/schema';
import { z } from 'zod';
import { randomBytes } from 'crypto';

const router = Router();

// Schema for creating bootstrap invites
const createBootstrapInviteSchema = z.object({
  role: z.enum(['super_admin', 'admin'], { required_error: 'Role is required' }),
  allowedUses: z.number().min(1).max(100, 'Allowed uses must be between 1 and 100'),
  expiresAt: z.string().datetime('Invalid expiration date format'),
  description: z.string().optional()
});

// Schema for updating bootstrap invites
const updateBootstrapInviteSchema = z.object({
  description: z.string().optional(),
  expiresAt: z.string().datetime('Invalid expiration date format').optional()
});

/**
 * Generate a secure random bootstrap invite code
 */
function generateBootstrapCode(): string {
  // Generate 8 character alphanumeric code (excluding confusing characters)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const randomData = randomBytes(8);
  let code = '';
  
  for (let i = 0; i < 8; i++) {
    code += chars[randomData[i] % chars.length];
  }
  
  return code;
}

/**
 * Get all bootstrap invites (super admin only)
 */
router.get('/', requireAdminMiddleware, async (req: Request, res: Response) => {
  const incidentId = generateIncidentId();
  
  try {
    logger.info('Fetching bootstrap invites', {
      additionalContext: {
        operation: 'get_bootstrap_invites',
        incidentId,
        userId: req.userId
      }
    });
    
    const invites = await withDatabaseErrorHandling(
      'get_all_bootstrap_invites_database',
      () => storage.getAllBootstrapInvites()
    );
    
    res.json(invites);
    
  } catch (error) {
    logger.error(
      'Failed to fetch bootstrap invites',
      error instanceof Error ? error : new Error(String(error)),
      {
        additionalContext: {
          operation: 'get_bootstrap_invites_error',
          userId: req.userId,
          incidentId
        }
      }
    );
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(createUserError(USER_ERROR_MESSAGES.SERVER_ERROR, incidentId, HTTP_STATUS.INTERNAL_SERVER_ERROR));
  }
});

/**
 * Create new bootstrap invite (super admin only)
 */
router.post('/', requireAdminMiddleware, async (req: Request, res: Response) => {
  const incidentId = generateIncidentId();
  
  try {
    logger.info('Creating new bootstrap invite', {
      additionalContext: {
        operation: 'create_bootstrap_invite',
        incidentId,
        userId: req.userId,
        role: req.body.role
      }
    });
    
    // Validate request body
    const validatedData = createBootstrapInviteSchema.parse(req.body);
    
    // Security check: Prevent privilege escalation
    // Get current user to check their role
    const currentUser = await withDatabaseErrorHandling(
      'get_current_user_for_role_check',
      () => storage.getUser(req.userId!)
    );
    
    if (!currentUser) {
      logger.warn('User not found during bootstrap invite creation', {
        additionalContext: {
          operation: 'create_bootstrap_invite_user_not_found',
          userId: req.userId,
          incidentId
        }
      });
      
      res.status(HTTP_STATUS.FORBIDDEN)
        .json(createUserError('User not found', incidentId, HTTP_STATUS.FORBIDDEN));
      return;
    }
    
    // Role-based permission check
    if (currentUser.role === 'admin' && validatedData.role === 'super_admin') {
      logger.warn('Admin user attempted to create super_admin bootstrap invite', {
        additionalContext: {
          operation: 'privilege_escalation_attempt',
          userId: req.userId,
          userRole: currentUser.role,
          requestedRole: validatedData.role,
          incidentId
        }
      });
      
      res.status(HTTP_STATUS.FORBIDDEN)
        .json(createUserError('Insufficient privileges to create super admin invites', incidentId, HTTP_STATUS.FORBIDDEN));
      return;
    }
    
    // Generate unique code
    let code: string;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      code = generateBootstrapCode();
      attempts++;
      
      // Check if code already exists
      const existingInvite = await withDatabaseErrorHandling(
        'check_bootstrap_code_exists',
        () => storage.getBootstrapInvite(code)
      );
      
      if (!existingInvite) break;
      
      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique bootstrap code');
      }
    } while (true);
    
    // Create the invite
    const inviteData = {
      code,
      role: validatedData.role,
      allowedUses: validatedData.allowedUses,
      remainingUses: validatedData.allowedUses,
      expiresAt: new Date(validatedData.expiresAt),
      issuedBy: req.userId!,
      status: 'active' as const,
      description: validatedData.description || `Bootstrap invite for ${validatedData.role} access`
    };
    
    const invite = await withDatabaseErrorHandling(
      'create_bootstrap_invite_database',
      () => storage.createBootstrapInvite(inviteData)
    );
    
    res.status(HTTP_STATUS.CREATED).json(invite);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid bootstrap invite creation data', {
        additionalContext: {
          operation: 'create_bootstrap_invite_validation_error',
          validationErrors: error.errors,
          incidentId
        }
      });
      
      res.status(HTTP_STATUS.BAD_REQUEST)
        .json(createUserError('Invalid bootstrap invite data provided', incidentId, HTTP_STATUS.BAD_REQUEST));
      return;
    }
    
    logger.error(
      'Failed to create bootstrap invite',
      error instanceof Error ? error : new Error(String(error)),
      {
        additionalContext: {
          operation: 'create_bootstrap_invite_error',
          userId: req.userId,
          incidentId
        }
      }
    );
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(createUserError(USER_ERROR_MESSAGES.SERVER_ERROR, incidentId, HTTP_STATUS.INTERNAL_SERVER_ERROR));
  }
});

/**
 * Update bootstrap invite (super admin only)
 */
router.put('/:id', requireSuperAdminMiddleware, async (req: Request, res: Response) => {
  const incidentId = generateIncidentId();
  const inviteId = req.params.id;
  
  try {
    logger.info('Updating bootstrap invite', {
      additionalContext: {
        operation: 'update_bootstrap_invite',
        incidentId,
        userId: req.userId,
        inviteId
      }
    });
    
    // Validate request body
    const validatedData = updateBootstrapInviteSchema.parse(req.body);
    
    // Convert string date to Date object if provided
    const updateData = {
      ...validatedData,
      expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined
    };
    
    const updatedInvite = await withDatabaseErrorHandling(
      'update_bootstrap_invite_database',
      () => storage.updateBootstrapInvite(inviteId, updateData)
    );
    
    if (!updatedInvite) {
      logger.warn('Bootstrap invite not found for update', {
        additionalContext: {
          operation: 'update_bootstrap_invite_not_found',
          inviteId,
          incidentId
        }
      });
      
      res.status(HTTP_STATUS.NOT_FOUND)
        .json(createUserError('Bootstrap invite not found', incidentId, HTTP_STATUS.NOT_FOUND));
      return;
    }
    
    res.json(updatedInvite);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid bootstrap invite update data', {
        additionalContext: {
          operation: 'update_bootstrap_invite_validation_error',
          validationErrors: error.errors,
          incidentId
        }
      });
      
      res.status(HTTP_STATUS.BAD_REQUEST)
        .json(createUserError('Invalid bootstrap invite update data provided', incidentId, HTTP_STATUS.BAD_REQUEST));
      return;
    }
    
    logger.error(
      'Failed to update bootstrap invite',
      error instanceof Error ? error : new Error(String(error)),
      {
        additionalContext: {
          operation: 'update_bootstrap_invite_error',
          inviteId,
          userId: req.userId,
          incidentId
        }
      }
    );
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(createUserError(USER_ERROR_MESSAGES.SERVER_ERROR, incidentId, HTTP_STATUS.INTERNAL_SERVER_ERROR));
  }
});

/**
 * Revoke bootstrap invite (super admin only)
 */
router.delete('/:id', requireSuperAdminMiddleware, async (req: Request, res: Response) => {
  const incidentId = generateIncidentId();
  const inviteId = req.params.id;
  
  try {
    logger.info('Revoking bootstrap invite', {
      additionalContext: {
        operation: 'revoke_bootstrap_invite',
        incidentId,
        userId: req.userId,
        inviteId
      }
    });
    
    const revokedInvite = await withDatabaseErrorHandling(
      'revoke_bootstrap_invite_database',
      () => storage.revokeBootstrapInvite(inviteId)
    );
    
    if (!revokedInvite) {
      logger.warn('Bootstrap invite not found for revocation', {
        additionalContext: {
          operation: 'revoke_bootstrap_invite_not_found',
          inviteId,
          incidentId
        }
      });
      
      res.status(HTTP_STATUS.NOT_FOUND)
        .json(createUserError('Bootstrap invite not found', incidentId, HTTP_STATUS.NOT_FOUND));
      return;
    }
    
    res.json({ success: true, message: 'Bootstrap invite revoked successfully' });
    
  } catch (error) {
    logger.error(
      'Failed to revoke bootstrap invite',
      error instanceof Error ? error : new Error(String(error)),
      {
        additionalContext: {
          operation: 'revoke_bootstrap_invite_error',
          inviteId,
          userId: req.userId,
          incidentId
        }
      }
    );
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(createUserError(USER_ERROR_MESSAGES.SERVER_ERROR, incidentId, HTTP_STATUS.INTERNAL_SERVER_ERROR));
  }
});

export default router;