import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { generateIncidentId, createUserError } from '../utils/incident';
import { USER_ERROR_MESSAGES, HTTP_STATUS } from '../constants';
import { logger } from '../logger';
import { requireAuthMiddleware } from '../middleware/security';
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

export default router;
