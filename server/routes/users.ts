import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { generateIncidentId, createUserError } from '../utils/incident';
import { USER_ERROR_MESSAGES, HTTP_STATUS } from '../constants';
import { logger } from '../logger';
import { requireAuthMiddleware, requireAdminMiddleware, requireSuperAdminMiddleware } from '../middleware/security';
import { withDatabaseErrorHandling } from '../utils/database-errors';
import { storage } from '../storage';

const router = Router();

/**
 * Get current user profile
 */
router.get('/profile', requireAuthMiddleware, async (req: Request, res: Response) => {
  const incidentId = generateIncidentId();

  try {
    logger.info('Fetching user profile', {
      additionalContext: {
        operation: 'get_user_profile',
        incidentId,
        userId: req.userId
      }
    });
    
    const user = await withDatabaseErrorHandling(
      'get_user_profile_database',
      () => storage.getUser(req.userId!)
    );
    
    if (!user) {
      logger.warn('User profile not found', {
        additionalContext: {
          operation: 'get_user_profile_not_found',
          userId: req.userId,
          incidentId
        }
      });
      
      res.status(HTTP_STATUS.NOT_FOUND)
        .json(createUserError('User profile not found', incidentId, HTTP_STATUS.NOT_FOUND));
      return;
    }
    
    // Fetch cohort details if user has a cohort
    let cohortInfo = null;
    if (user.cohortId) {
      try {
        const cohort = await withDatabaseErrorHandling(
          'get_user_cohort_database',
          () => storage.getCohort(user.cohortId!)
        );
        
        if (cohort) {
          cohortInfo = {
            id: cohort.id,
            code: cohort.code,
            name: cohort.name
          };
        }
      } catch (error) {
        // Log error but don't fail the request
        logger.warn('Failed to fetch user cohort details', {
          additionalContext: {
            operation: 'get_user_cohort_failed',
            userId: req.userId,
            cohortId: user.cohortId,
            incidentId
          }
        });
      }
    }
    
    // Return user profile with cohort information
    res.json({
      ...user,
      cohort: cohortInfo
    });
    
  } catch (error) {
    logger.error(
      'Failed to fetch user profile',
      error instanceof Error ? error : new Error(String(error)),
      {
        additionalContext: {
          operation: 'get_user_profile_error',
          userId: req.userId,
          incidentId
        }
      }
    );
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(createUserError(USER_ERROR_MESSAGES.SERVER_ERROR, incidentId, HTTP_STATUS.INTERNAL_SERVER_ERROR));
  }
});

const createUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  email: z.string().email('A valid email address is required'),
  role: z.enum(['user', 'admin', 'super_admin']).optional()
});

/**
 * Create a new user profile if one does not already exist
 */
router.post('/', requireAuthMiddleware, async (req: Request, res: Response) => {
  const incidentId = generateIncidentId();

  try {
    const payload = createUserSchema.parse(req.body);

    if (req.userId !== payload.userId) {
      logger.warn('User ID mismatch during profile creation attempt', {
        additionalContext: {
          operation: 'create_user_id_mismatch',
          authenticatedUserId: req.userId,
          requestedUserId: payload.userId,
          incidentId
        }
      });

      res.status(HTTP_STATUS.FORBIDDEN)
        .json(createUserError('You are not authorized to create this user profile.', incidentId, HTTP_STATUS.FORBIDDEN));
      return;
    }

    if (req.userEmail && req.userEmail.toLowerCase() !== payload.email.toLowerCase()) {
      logger.warn('Email mismatch during profile creation attempt', {
        additionalContext: {
          operation: 'create_user_email_mismatch',
          userId: req.userId,
          tokenEmail: req.userEmail,
          payloadEmail: payload.email,
          incidentId
        }
      });

      res.status(HTTP_STATUS.BAD_REQUEST)
        .json(createUserError('Email address mismatch. Please sign in again.', incidentId, HTTP_STATUS.BAD_REQUEST));
      return;
    }

    const existingUser = await withDatabaseErrorHandling(
      'get_user_database',
      () => storage.getUser(payload.userId)
    );

    if (existingUser) {
      logger.info('User profile already exists - returning existing profile', {
        additionalContext: {
          operation: 'create_user_existing_profile',
          userId: payload.userId,
          incidentId
        }
      });

      res.json(existingUser);
      return;
    }

    const user = await withDatabaseErrorHandling(
      'create_user_database',
      () => storage.createUser({
        userId: payload.userId,
        email: payload.email,
        role: payload.role ?? 'user'
      })
    );

    logger.info('User profile created successfully', {
      additionalContext: {
        operation: 'create_user_success',
        userId: payload.userId,
        incidentId
      }
    });

    res.status(HTTP_STATUS.CREATED).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid data provided while creating user profile', {
        additionalContext: {
          operation: 'create_user_validation_error',
          incidentId,
          issues: error.issues
        }
      });

      res.status(HTTP_STATUS.BAD_REQUEST)
        .json(createUserError(USER_ERROR_MESSAGES.VALIDATION_ERROR, incidentId, HTTP_STATUS.BAD_REQUEST));
      return;
    }

    logger.error(
      'Failed to create user profile',
      error instanceof Error ? error : new Error(String(error)),
      {
        additionalContext: {
          operation: 'create_user_error',
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
 * Get all users (Admin and Super Admin)
 */
router.get('/admin/all-users', requireAdminMiddleware, async (req: Request, res: Response) => {
  const incidentId = generateIncidentId();

  try {
    logger.info('Fetching all users', {
      additionalContext: {
        operation: 'get_all_users',
        incidentId,
        requestedBy: req.userId
      }
    });

    const users = await withDatabaseErrorHandling(
      'get_all_users_database',
      () => storage.getAllUsers()
    );

    // Fetch cohort details for each user
    const usersWithCohorts = await Promise.all(
      users.map(async (user) => {
        let cohortInfo = null;
        if (user.cohortId) {
          try {
            const cohort = await withDatabaseErrorHandling(
              'get_user_cohort_database',
              () => storage.getCohort(user.cohortId!)
            );
            if (cohort) {
              cohortInfo = {
                id: cohort.id,
                code: cohort.code,
                name: cohort.name,
                status: cohort.status
              };
            }
          } catch (error) {
            logger.warn('Failed to fetch cohort details for user', {
              additionalContext: {
                operation: 'get_user_cohort_failed',
                userId: user.userId,
                cohortId: user.cohortId,
                incidentId
              }
            });
          }
        }
        return {
          ...user,
          cohort: cohortInfo
        };
      })
    );

    logger.info('All users retrieved successfully', {
      additionalContext: {
        operation: 'get_all_users_success',
        userCount: users.length,
        incidentId
      }
    });

    res.json(usersWithCohorts);
  } catch (error) {
    logger.error(
      'Failed to fetch all users',
      error instanceof Error ? error : new Error(String(error)),
      {
        additionalContext: {
          operation: 'get_all_users_error',
          requestedBy: req.userId,
          incidentId
        }
      }
    );

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(createUserError(USER_ERROR_MESSAGES.SERVER_ERROR, incidentId, HTTP_STATUS.INTERNAL_SERVER_ERROR));
  }
});

const updateUserRoleSchema = z.object({
  role: z.enum(['user', 'admin', 'super_admin'])
});

/**
 * Update user role (Super Admin only - admins can only demote to user)
 */
router.patch('/admin/:userId/role', requireAdminMiddleware, async (req: Request, res: Response) => {
  const incidentId = generateIncidentId();
  const { userId } = req.params;

  try {
    const payload = updateUserRoleSchema.parse(req.body);

    // Get requesting user's profile to check if they're super admin
    const requestingUser = await withDatabaseErrorHandling(
      'get_requesting_user_profile',
      () => storage.getUser(req.userId!)
    );

    if (!requestingUser) {
      logger.error('Requesting user not found during role update', {
        additionalContext: {
          operation: 'update_user_role_user_not_found',
          requestingUserId: req.userId,
          incidentId
        }
      });
      res.status(HTTP_STATUS.UNAUTHORIZED)
        .json(createUserError(USER_ERROR_MESSAGES.UNAUTHORIZED, incidentId, HTTP_STATUS.UNAUTHORIZED));
      return;
    }

    // Get target user to check their current role
    const targetUser = await withDatabaseErrorHandling(
      'get_target_user_profile',
      () => storage.getUser(userId)
    );

    if (!targetUser) {
      logger.warn('Target user not found during role update', {
        additionalContext: {
          operation: 'update_user_role_target_not_found',
          targetUserId: userId,
          incidentId
        }
      });
      res.status(HTTP_STATUS.NOT_FOUND)
        .json(createUserError('User not found', incidentId, HTTP_STATUS.NOT_FOUND));
      return;
    }

    // Only super admins can promote to admin or super_admin
    if (requestingUser.role !== 'super_admin' && (payload.role === 'admin' || payload.role === 'super_admin')) {
      logger.warn('Admin attempted to promote user to admin role', {
        additionalContext: {
          operation: 'update_user_role_unauthorized_promotion',
          requestingUserId: req.userId,
          requestingUserRole: requestingUser.role,
          targetUserId: userId,
          attemptedRole: payload.role,
          incidentId
        }
      });

      res.status(HTTP_STATUS.FORBIDDEN)
        .json(createUserError('Only super admins can promote users to admin or super admin roles', incidentId, HTTP_STATUS.FORBIDDEN));
      return;
    }

    // Only super admins can demote existing admins or super_admins
    if (requestingUser.role !== 'super_admin' && (targetUser.role === 'admin' || targetUser.role === 'super_admin')) {
      logger.warn('Admin attempted to modify privileged user role', {
        additionalContext: {
          operation: 'update_user_role_unauthorized_demotion',
          requestingUserId: req.userId,
          requestingUserRole: requestingUser.role,
          targetUserId: userId,
          targetUserCurrentRole: targetUser.role,
          attemptedRole: payload.role,
          incidentId
        }
      });

      res.status(HTTP_STATUS.FORBIDDEN)
        .json(createUserError('Only super admins can modify admin or super admin roles', incidentId, HTTP_STATUS.FORBIDDEN));
      return;
    }

    logger.info('Updating user role', {
      additionalContext: {
        operation: 'update_user_role',
        incidentId,
        targetUserId: userId,
        targetUserCurrentRole: targetUser.role,
        newRole: payload.role,
        requestedBy: req.userId
      }
    });

    const user = await withDatabaseErrorHandling(
      'update_user_role_database',
      () => storage.updateUser(userId, { role: payload.role })
    );

    if (!user) {
      logger.warn('User not found for role update', {
        additionalContext: {
          operation: 'update_user_role_not_found',
          targetUserId: userId,
          incidentId
        }
      });

      res.status(HTTP_STATUS.NOT_FOUND)
        .json(createUserError('User not found', incidentId, HTTP_STATUS.NOT_FOUND));
      return;
    }

    logger.info('User role updated successfully', {
      additionalContext: {
        operation: 'update_user_role_success',
        targetUserId: userId,
        newRole: payload.role,
        incidentId
      }
    });

    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid data provided while updating user role', {
        additionalContext: {
          operation: 'update_user_role_validation_error',
          incidentId,
          issues: error.issues
        }
      });

      res.status(HTTP_STATUS.BAD_REQUEST)
        .json(createUserError(USER_ERROR_MESSAGES.VALIDATION_ERROR, incidentId, HTTP_STATUS.BAD_REQUEST));
      return;
    }

    logger.error(
      'Failed to update user role',
      error instanceof Error ? error : new Error(String(error)),
      {
        additionalContext: {
          operation: 'update_user_role_error',
          targetUserId: userId,
          incidentId
        }
      }
    );

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(createUserError(USER_ERROR_MESSAGES.SERVER_ERROR, incidentId, HTTP_STATUS.INTERNAL_SERVER_ERROR));
  }
});

const updateUserCohortSchema = z.object({
  cohortId: z.string().nullable()
});

/**
 * Update user cohort membership (Admin and Super Admin)
 */
router.patch('/admin/:userId/cohort', requireAdminMiddleware, async (req: Request, res: Response) => {
  const incidentId = generateIncidentId();
  const { userId } = req.params;

  try {
    const payload = updateUserCohortSchema.parse(req.body);

    logger.info('Updating user cohort', {
      additionalContext: {
        operation: 'update_user_cohort',
        incidentId,
        targetUserId: userId,
        newCohortId: payload.cohortId,
        requestedBy: req.userId
      }
    });

    const user = await withDatabaseErrorHandling(
      'update_user_cohort_database',
      () => storage.updateUser(userId, { cohortId: payload.cohortId })
    );

    if (!user) {
      logger.warn('User not found for cohort update', {
        additionalContext: {
          operation: 'update_user_cohort_not_found',
          targetUserId: userId,
          incidentId
        }
      });

      res.status(HTTP_STATUS.NOT_FOUND)
        .json(createUserError('User not found', incidentId, HTTP_STATUS.NOT_FOUND));
      return;
    }

    logger.info('User cohort updated successfully', {
      additionalContext: {
        operation: 'update_user_cohort_success',
        targetUserId: userId,
        newCohortId: payload.cohortId,
        incidentId
      }
    });

    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid data provided while updating user cohort', {
        additionalContext: {
          operation: 'update_user_cohort_validation_error',
          incidentId,
          issues: error.issues
        }
      });

      res.status(HTTP_STATUS.BAD_REQUEST)
        .json(createUserError(USER_ERROR_MESSAGES.VALIDATION_ERROR, incidentId, HTTP_STATUS.BAD_REQUEST));
      return;
    }

    logger.error(
      'Failed to update user cohort',
      error instanceof Error ? error : new Error(String(error)),
      {
        additionalContext: {
          operation: 'update_user_cohort_error',
          targetUserId: userId,
          incidentId
        }
      }
    );

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(createUserError(USER_ERROR_MESSAGES.SERVER_ERROR, incidentId, HTTP_STATUS.INTERNAL_SERVER_ERROR));
  }
});

/**
 * Delete user (Admin and Super Admin)
 */
router.delete('/admin/:userId', requireAdminMiddleware, async (req: Request, res: Response) => {
  const incidentId = generateIncidentId();
  const { userId } = req.params;

  try {
    // Prevent deleting yourself
    if (req.userId === userId) {
      logger.warn('User attempted to delete themselves', {
        additionalContext: {
          operation: 'delete_user_self_attempt',
          userId,
          incidentId
        }
      });

      res.status(HTTP_STATUS.BAD_REQUEST)
        .json(createUserError('You cannot delete your own account', incidentId, HTTP_STATUS.BAD_REQUEST));
      return;
    }

    // Get requesting user's profile to check if they're super admin
    const requestingUser = await withDatabaseErrorHandling(
      'get_requesting_user_profile_delete',
      () => storage.getUser(req.userId!)
    );

    if (!requestingUser) {
      logger.error('Requesting user not found during delete', {
        additionalContext: {
          operation: 'delete_user_requesting_not_found',
          requestingUserId: req.userId,
          incidentId
        }
      });
      res.status(HTTP_STATUS.UNAUTHORIZED)
        .json(createUserError(USER_ERROR_MESSAGES.UNAUTHORIZED, incidentId, HTTP_STATUS.UNAUTHORIZED));
      return;
    }

    // Get target user to check their role
    const targetUser = await withDatabaseErrorHandling(
      'get_target_user_profile_delete',
      () => storage.getUser(userId)
    );

    if (!targetUser) {
      logger.warn('Target user not found for deletion', {
        additionalContext: {
          operation: 'delete_user_target_not_found',
          targetUserId: userId,
          incidentId
        }
      });
      res.status(HTTP_STATUS.NOT_FOUND)
        .json(createUserError('User not found', incidentId, HTTP_STATUS.NOT_FOUND));
      return;
    }

    // Only super admins can delete admin or super_admin users
    if (requestingUser.role !== 'super_admin' && (targetUser.role === 'admin' || targetUser.role === 'super_admin')) {
      logger.warn('Admin attempted to delete privileged user', {
        additionalContext: {
          operation: 'delete_user_unauthorized',
          requestingUserId: req.userId,
          requestingUserRole: requestingUser.role,
          targetUserId: userId,
          targetUserRole: targetUser.role,
          incidentId
        }
      });

      res.status(HTTP_STATUS.FORBIDDEN)
        .json(createUserError('Only super admins can delete admin or super admin users', incidentId, HTTP_STATUS.FORBIDDEN));
      return;
    }

    logger.info('Deleting user', {
      additionalContext: {
        operation: 'delete_user',
        incidentId,
        targetUserId: userId,
        targetUserRole: targetUser.role,
        requestedBy: req.userId
      }
    });

    const deleted = await withDatabaseErrorHandling(
      'delete_user_database',
      () => storage.deleteUser(userId)
    );

    if (!deleted) {
      logger.warn('User not found for deletion', {
        additionalContext: {
          operation: 'delete_user_not_found',
          targetUserId: userId,
          incidentId
        }
      });

      res.status(HTTP_STATUS.NOT_FOUND)
        .json(createUserError('User not found', incidentId, HTTP_STATUS.NOT_FOUND));
      return;
    }

    logger.info('User deleted successfully', {
      additionalContext: {
        operation: 'delete_user_success',
        targetUserId: userId,
        incidentId
      }
    });

    res.json({ success: true, message: 'User and their data deleted successfully' });
  } catch (error) {
    logger.error(
      'Failed to delete user',
      error instanceof Error ? error : new Error(String(error)),
      {
        additionalContext: {
          operation: 'delete_user_error',
          targetUserId: userId,
          incidentId
        }
      }
    );

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(createUserError(USER_ERROR_MESSAGES.SERVER_ERROR, incidentId, HTTP_STATUS.INTERNAL_SERVER_ERROR));
  }
});

export default router;
