import { Request, Response, Router } from 'express';
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

export default router;