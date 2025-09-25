import { Request, Response, Router } from 'express';
import { generateIncidentId, createUserError, sanitizeErrorForUser } from '../utils/incident';
import { USER_ERROR_MESSAGES, HTTP_STATUS } from '../constants';
import { logger } from '../logger';
import { requireAuthMiddleware, requireAdminMiddleware, requireSuperAdminMiddleware } from '../middleware/security';
import { withDatabaseErrorHandling } from '../utils/database-errors';
import { storage } from '../storage';
import { insertCohortSchema, insertUserSchema, cohorts, type Cohort } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// Schema for joining a cohort
const joinCohortSchema = z.object({
  code: z.string().min(6).max(6, 'Cohort code must be exactly 6 characters'),
});

/**
 * Get all cohorts (admin/super admin only)
 */
router.get('/', requireAdminMiddleware, async (req: Request, res: Response) => {
  const incidentId = generateIncidentId();
  
  try {
    logger.info('Fetching cohorts', {
      additionalContext: {
        operation: 'get_cohorts',
        incidentId,
        userId: req.userId
      }
    });
    
    // Get user to check role for access control
    const user = await withDatabaseErrorHandling(
      'get_user_for_cohorts_database',
      () => storage.getUser(req.userId!)
    );
    
    if (!user) {
      logger.warn('User not found when fetching cohorts', {
        additionalContext: {
          operation: 'get_cohorts_user_not_found',
          userId: req.userId,
          incidentId
        }
      });
      
      res.status(HTTP_STATUS.FORBIDDEN)
        .json(createUserError('User profile not found', incidentId, HTTP_STATUS.FORBIDDEN));
      return;
    }
    
    let cohorts: Cohort[] = [];
    
    if (user.role === 'super_admin') {
      // Super admins can see all cohorts
      cohorts = await withDatabaseErrorHandling(
        'get_all_cohorts_database',
        () => storage.getAllCohorts()
      );
    } else if (user.role === 'admin' && user.cohortId) {
      // Regular admins see only their cohort
      const cohort = await withDatabaseErrorHandling(
        'get_admin_cohort_database',
        () => storage.getCohort(user.cohortId!)
      );
      
      if (cohort) {
        cohorts = [cohort];
      }
    }
    
    res.json(cohorts);
    
  } catch (error) {
    logger.error(
      'Failed to fetch cohorts',
      error instanceof Error ? error : new Error(String(error)),
      {
        additionalContext: {
          operation: 'get_cohorts_error',
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
 * Create new cohort (super admin only)
 */
router.post('/', requireSuperAdminMiddleware, async (req: Request, res: Response) => {
  const incidentId = generateIncidentId();
  
  try {
    logger.info('Creating new cohort', {
      additionalContext: {
        operation: 'create_cohort',
        incidentId,
        userId: req.userId,
        cohortName: req.body.name
      }
    });
    
    // Validate request body
    const validatedData = insertCohortSchema.parse(req.body);
    
    // Generate secure unique 6-digit access code
    let code: string;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      // Generate cryptographically secure 6-digit code
      const randomBytes = require('crypto').randomBytes(3);
      code = (parseInt(randomBytes.toString('hex'), 16) % 1000000).toString().padStart(6, '0');
      attempts++;
      
      // Check if code already exists
      const existingCohort = await withDatabaseErrorHandling(
        'check_cohort_code_uniqueness',
        () => storage.getCohortByCode(code)
      );
      
      if (!existingCohort) break;
      
    } while (attempts < maxAttempts);
    
    if (attempts >= maxAttempts) {
      logger.error(
        'Failed to generate unique cohort code after maximum attempts',
        new Error('Code generation failed'),
        {
          additionalContext: {
            operation: 'create_cohort_code_generation_failed',
            attempts,
            incidentId
          }
        }
      );
      
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json(createUserError('Unable to generate unique access code. Please try again.', incidentId, HTTP_STATUS.INTERNAL_SERVER_ERROR));
      return;
    }
    
    const cohort = await withDatabaseErrorHandling(
      'create_cohort_database',
      () => storage.createCohort({
        ...validatedData,
        code
      })
    );
    
    res.status(HTTP_STATUS.CREATED).json(cohort);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid cohort creation data', {
        additionalContext: {
          operation: 'create_cohort_validation_error',
          validationErrors: error.errors,
          incidentId
        }
      });
      
      res.status(HTTP_STATUS.BAD_REQUEST)
        .json(createUserError('Invalid cohort data provided', incidentId, HTTP_STATUS.BAD_REQUEST));
      return;
    }
    
    logger.error(
      'Failed to create cohort',
      error instanceof Error ? error : new Error(String(error)),
      {
        additionalContext: {
          operation: 'create_cohort_error',
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
 * Get specific cohort (admin/super admin only)
 */
router.get('/:id', requireAdminMiddleware, async (req: Request, res: Response) => {
  const incidentId = generateIncidentId();
  const cohortId = req.params.id;
  
  try {
    logger.info('Fetching cohort by ID', {
      additionalContext: {
        operation: 'get_cohort_by_id',
        incidentId,
        userId: req.userId,
        cohortId
      }
    });
    
    const cohort = await withDatabaseErrorHandling(
      'get_cohort_database',
      () => storage.getCohort(cohortId)
    );
    
    if (!cohort) {
      logger.warn('Cohort not found', {
        additionalContext: {
          operation: 'get_cohort_not_found',
          cohortId,
          incidentId
        }
      });
      
      res.status(HTTP_STATUS.NOT_FOUND)
        .json(createUserError('Cohort not found', incidentId, HTTP_STATUS.NOT_FOUND));
      return;
    }
    
    // Access control: Check if user can access this cohort
    const user = await withDatabaseErrorHandling(
      'get_user_for_cohort_access',
      () => storage.getUser(req.userId!)
    );
    
    if (!user) {
      logger.warn('User not found when accessing cohort', {
        additionalContext: {
          operation: 'get_cohort_user_not_found',
          userId: req.userId,
          cohortId,
          incidentId
        }
      });
      
      res.status(HTTP_STATUS.FORBIDDEN)
        .json(createUserError('User profile not found', incidentId, HTTP_STATUS.FORBIDDEN));
      return;
    }
    
    // Super admins can access any cohort, regular admins only their own
    if (user.role !== 'super_admin' && user.cohortId !== cohortId) {
      logger.warn('Admin attempting to access unauthorized cohort', {
        additionalContext: {
          operation: 'get_cohort_unauthorized_access',
          userId: req.userId,
          userRole: user.role,
          userCohortId: user.cohortId,
          requestedCohortId: cohortId,
          incidentId
        }
      });
      
      res.status(HTTP_STATUS.FORBIDDEN)
        .json(createUserError('Access denied. You can only view your own cohort.', incidentId, HTTP_STATUS.FORBIDDEN));
      return;
    }
    
    res.json(cohort);
    
  } catch (error) {
    logger.error(
      'Failed to fetch cohort',
      error instanceof Error ? error : new Error(String(error)),
      {
        additionalContext: {
          operation: 'get_cohort_error',
          cohortId,
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
 * Update cohort (admin for their cohort, super admin for all)
 */
router.put('/:id', requireAdminMiddleware, async (req: Request, res: Response) => {
  const incidentId = generateIncidentId();
  const cohortId = req.params.id;
  
  try {
    logger.info('Updating cohort', {
      additionalContext: {
        operation: 'update_cohort',
        incidentId,
        userId: req.userId,
        cohortId
      }
    });
    
    // Validate request body (partial update)
    const updateData = insertCohortSchema.partial().parse(req.body);
    
    // Access control: Check if user can update this cohort
    const user = await withDatabaseErrorHandling(
      'get_user_for_cohort_update',
      () => storage.getUser(req.userId!)
    );
    
    if (!user) {
      logger.warn('User not found when updating cohort', {
        additionalContext: {
          operation: 'update_cohort_user_not_found',
          userId: req.userId,
          cohortId,
          incidentId
        }
      });
      
      res.status(HTTP_STATUS.FORBIDDEN)
        .json(createUserError('User profile not found', incidentId, HTTP_STATUS.FORBIDDEN));
      return;
    }
    
    // Super admins can update any cohort, regular admins only their own
    if (user.role !== 'super_admin' && user.cohortId !== cohortId) {
      logger.warn('Admin attempting to update unauthorized cohort', {
        additionalContext: {
          operation: 'update_cohort_unauthorized_access',
          userId: req.userId,
          userRole: user.role,
          userCohortId: user.cohortId,
          requestedCohortId: cohortId,
          incidentId
        }
      });
      
      res.status(HTTP_STATUS.FORBIDDEN)
        .json(createUserError('Access denied. You can only update your own cohort.', incidentId, HTTP_STATUS.FORBIDDEN));
      return;
    }
    
    const updatedCohort = await withDatabaseErrorHandling(
      'update_cohort_database',
      () => storage.updateCohort(cohortId, updateData)
    );
    
    if (!updatedCohort) {
      logger.warn('Cohort not found for update', {
        additionalContext: {
          operation: 'update_cohort_not_found',
          cohortId,
          incidentId
        }
      });
      
      res.status(HTTP_STATUS.NOT_FOUND)
        .json(createUserError('Cohort not found', incidentId, HTTP_STATUS.NOT_FOUND));
      return;
    }
    
    res.json(updatedCohort);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid cohort update data', {
        additionalContext: {
          operation: 'update_cohort_validation_error',
          validationErrors: error.errors,
          incidentId
        }
      });
      
      res.status(HTTP_STATUS.BAD_REQUEST)
        .json(createUserError('Invalid cohort update data provided', incidentId, HTTP_STATUS.BAD_REQUEST));
      return;
    }
    
    logger.error(
      'Failed to update cohort',
      error instanceof Error ? error : new Error(String(error)),
      {
        additionalContext: {
          operation: 'update_cohort_error',
          cohortId,
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
 * Join cohort with access code (authenticated users)
 */
router.post('/join', requireAuthMiddleware, async (req: Request, res: Response) => {
  const incidentId = generateIncidentId();
  
  try {
    logger.info('User attempting to join cohort', {
      additionalContext: {
        operation: 'join_cohort',
        incidentId,
        userId: req.userId
      }
    });
    
    // Validate request body
    const { code } = joinCohortSchema.parse(req.body);
    
    // Find cohort by access code
    const cohort = await withDatabaseErrorHandling(
      'get_cohort_by_code_database',
      () => storage.getCohortByCode(code)
    );
    
    if (!cohort) {
      logger.warn('Invalid cohort access code', {
        additionalContext: {
          operation: 'join_cohort_invalid_code',
          code,
          incidentId
        }
      });
      
      res.status(HTTP_STATUS.NOT_FOUND)
        .json(createUserError('Invalid cohort access code', incidentId, HTTP_STATUS.NOT_FOUND));
      return;
    }
    
    // Check if cohort is active
    if (cohort.status !== 'active') {
      logger.warn('Cohort is not active', {
        additionalContext: {
          operation: 'join_cohort_inactive',
          cohortId: cohort.id,
          status: cohort.status,
          incidentId
        }
      });
      
      res.status(HTTP_STATUS.FORBIDDEN)
        .json(createUserError('This cohort is no longer accepting new members', incidentId, HTTP_STATUS.FORBIDDEN));
      return;
    }
    
    // Check if cohort has available slots
    if (cohort.usedSlots >= cohort.allowedSlots) {
      logger.warn('Cohort is full', {
        additionalContext: {
          operation: 'join_cohort_full',
          cohortId: cohort.id,
          usedSlots: cohort.usedSlots,
          allowedSlots: cohort.allowedSlots,
          incidentId
        }
      });
      
      res.status(HTTP_STATUS.FORBIDDEN)
        .json(createUserError('This cohort is full', incidentId, HTTP_STATUS.FORBIDDEN));
      return;
    }
    
    // Get or create user profile
    let user = await withDatabaseErrorHandling(
      'get_user_database',
      () => storage.getUser(req.userId!)
    );
    
    if (!user) {
      // Create user profile if it doesn't exist (first time joining a cohort)
      // For now, use a placeholder email - in production this would come from Firebase token
      user = await withDatabaseErrorHandling(
        'create_user_database',
        () => storage.createUser({
          userId: req.userId!,
          email: `user-${req.userId}@cortex.example`,  // Placeholder until Firebase token extraction is implemented
          role: 'user'
        })
      );
    }
    
    // Check if user is already in a cohort
    if (user.cohortId) {
      logger.warn('User already belongs to a cohort', {
        additionalContext: {
          operation: 'join_cohort_already_member',
          userId: req.userId,
          existingCohortId: user.cohortId,
          requestedCohortId: cohort.id,
          incidentId
        }
      });
      
      res.status(HTTP_STATUS.CONFLICT)
        .json(createUserError('You are already a member of a cohort. Contact your administrator to change cohorts.', incidentId, HTTP_STATUS.CONFLICT));
      return;
    }
    
    // Join the cohort atomically (user membership + increment used slots)
    const joinResult = await withDatabaseErrorHandling(
      'join_cohort_atomic_database',
      () => storage.joinCohortAtomic(req.userId!, cohort.id)
    );
    
    if (!joinResult) {
      logger.error(
        'Failed to join cohort atomically',
        new Error('Atomic join operation failed'),
        {
          additionalContext: {
            operation: 'join_cohort_atomic_failed',
            userId: req.userId,
            cohortId: cohort.id,
            incidentId
          }
        }
      );
      
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json(createUserError('Failed to join cohort', incidentId, HTTP_STATUS.INTERNAL_SERVER_ERROR));
      return;
    }
    
    res.json({
      message: 'Successfully joined cohort',
      cohort: {
        id: joinResult.cohort.id,
        name: joinResult.cohort.name,
        description: joinResult.cohort.description,
        usedSlots: joinResult.cohort.usedSlots
      },
      user: joinResult.user
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid join cohort data', {
        additionalContext: {
          operation: 'join_cohort_validation_error',
          validationErrors: error.errors,
          incidentId
        }
      });
      
      res.status(HTTP_STATUS.BAD_REQUEST)
        .json(createUserError('Invalid access code format', incidentId, HTTP_STATUS.BAD_REQUEST));
      return;
    }
    
    logger.error(
      'Failed to join cohort',
      error instanceof Error ? error : new Error(String(error)),
      {
        additionalContext: {
          operation: 'join_cohort_error',
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
 * Get cohort users (admin/super admin only)
 */
router.get('/:id/users', requireAdminMiddleware, async (req: Request, res: Response) => {
  const incidentId = generateIncidentId();
  const cohortId = req.params.id;
  
  try {
    logger.info('Fetching cohort users', {
      additionalContext: {
        operation: 'get_cohort_users',
        incidentId,
        userId: req.userId,
        cohortId
      }
    });
    
    // Access control: Check if user can view cohort users
    const user = await withDatabaseErrorHandling(
      'get_user_for_cohort_users',
      () => storage.getUser(req.userId!)
    );
    
    if (!user) {
      logger.warn('User not found when accessing cohort users', {
        additionalContext: {
          operation: 'get_cohort_users_user_not_found',
          userId: req.userId,
          cohortId,
          incidentId
        }
      });
      
      res.status(HTTP_STATUS.FORBIDDEN)
        .json(createUserError('User profile not found', incidentId, HTTP_STATUS.FORBIDDEN));
      return;
    }
    
    // Super admins can view any cohort users, regular admins only their own
    if (user.role !== 'super_admin' && user.cohortId !== cohortId) {
      logger.warn('Admin attempting to view unauthorized cohort users', {
        additionalContext: {
          operation: 'get_cohort_users_unauthorized_access',
          userId: req.userId,
          userRole: user.role,
          userCohortId: user.cohortId,
          requestedCohortId: cohortId,
          incidentId
        }
      });
      
      res.status(HTTP_STATUS.FORBIDDEN)
        .json(createUserError('Access denied. You can only view users in your own cohort.', incidentId, HTTP_STATUS.FORBIDDEN));
      return;
    }
    
    const users = await withDatabaseErrorHandling(
      'get_cohort_users_database',
      () => storage.getCohortUsers(cohortId)
    );
    
    res.json(users);
    
  } catch (error) {
    logger.error(
      'Failed to fetch cohort users',
      error instanceof Error ? error : new Error(String(error)),
      {
        additionalContext: {
          operation: 'get_cohort_users_error',
          cohortId,
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