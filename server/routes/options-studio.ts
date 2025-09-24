import { Request, Response, Router } from 'express';
import { storage } from '../storage';
import { generateIncidentId, createUserError, sanitizeErrorForUser } from '../utils/incident';
import { USER_ERROR_MESSAGES, HTTP_STATUS } from '../constants';
import { logger } from '../logger';
import { optionsStudioSessionSchema, type OptionsStudioSession } from '@shared/schema';
import { withDatabaseErrorHandling } from '../utils/database-errors';

const router = Router();

/**
 * Get Options Studio session for an assessment
 */
router.get('/:assessmentId', async (req: Request, res: Response) => {
  const incidentId = generateIncidentId();
  const { assessmentId } = req.params;
  
  try {
    logger.info('Fetching Options Studio session', {
      additionalContext: {
        operation: 'get_options_studio_session',
        assessmentId,
        incidentId
      }
    });
    
    // First verify assessment ownership before allowing Options Studio access
    const assessment = await withDatabaseErrorHandling(
      'get_assessment_for_options_studio',
      () => storage.getAssessment(assessmentId, req.userId)
    );
    
    if (!assessment) {
      logger.warn('Assessment not found or access denied for Options Studio session', {
        additionalContext: {
          assessmentId,
          operation: 'get_options_studio_session_unauthorized',
          incidentId,
          userId: req.userId
        }
      });
      
      return res.status(HTTP_STATUS.NOT_FOUND)
        .json(createUserError(USER_ERROR_MESSAGES.NOT_FOUND, incidentId, HTTP_STATUS.NOT_FOUND));
    }
    
    // Now that we've verified ownership, get the Options Studio session
    const session = await withDatabaseErrorHandling(
      'get_options_studio_session',
      () => storage.getOptionsStudioSession(assessmentId, req.userId)
    );
    
    if (!session) {
      logger.debug('No Options Studio session found for authorized assessment', {
        additionalContext: {
          assessmentId,
          operation: 'get_options_studio_session_empty',
          incidentId
        }
      });
      
      // Return empty session structure to allow initialization (only for authorized assessments)
      const emptySession: OptionsStudioSession = {
        useCase: '',
        goals: [],
        misconceptionResponses: {},
        comparedOptions: [],
        reflectionPrompts: [],
        completed: false
      };
      
      return res.json(emptySession);
    }
    
    res.json(session);
    
  } catch (error) {
    logger.error(
      'Failed to fetch Options Studio session',
      error instanceof Error ? error : new Error(String(error)),
      {
        functionArgs: { assessmentId },
        additionalContext: {
          operation: 'get_options_studio_session_error',
          requestId: req.requestId,
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
 * Create or update Options Studio session for an assessment
 */
router.put('/:assessmentId', async (req: Request, res: Response) => {
  const incidentId = generateIncidentId();
  const { assessmentId } = req.params;
  
  try {
    logger.info('Creating/updating Options Studio session', {
      additionalContext: {
        operation: 'create_update_options_studio_session',
        assessmentId,
        incidentId,
        hasUseCase: !!req.body.useCase,
        goalsCount: req.body.goals?.length || 0,
        comparedOptionsCount: req.body.comparedOptions?.length || 0,
        completed: !!req.body.completed
      }
    });
    
    // Validate request body using Zod schema
    const validationResult = optionsStudioSessionSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      logger.warn('Invalid Options Studio session data', {
        additionalContext: {
          operation: 'options_studio_session_validation_error',
          errors: validationResult.error.errors,
          incidentId
        }
      });
      
      return res.status(HTTP_STATUS.BAD_REQUEST)
        .json(createUserError(USER_ERROR_MESSAGES.VALIDATION_ERROR, incidentId, HTTP_STATUS.BAD_REQUEST));
    }
    
    const sessionData = validationResult.data;
    
    // Check if assessment exists and user owns it
    const assessment = await withDatabaseErrorHandling(
      'get_assessment_for_options_studio_update',
      () => storage.getAssessment(assessmentId, req.userId)
    );
    
    if (!assessment) {
      logger.warn('Assessment not found or access denied for Options Studio session', {
        additionalContext: {
          assessmentId,
          operation: 'options_studio_session_assessment_unauthorized',
          incidentId,
          userId: req.userId
        }
      });
      
      return res.status(HTTP_STATUS.NOT_FOUND)
        .json(createUserError(USER_ERROR_MESSAGES.NOT_FOUND, incidentId, HTTP_STATUS.NOT_FOUND));
    }
    
    const updatedAssessment = await withDatabaseErrorHandling(
      'create_or_update_options_studio_session',
      () => storage.createOrUpdateOptionsStudioSession(
        assessmentId, 
        sessionData,
        req.userId
      )
    );
    
    if (!updatedAssessment) {
      return res.status(HTTP_STATUS.NOT_FOUND)
        .json(createUserError(USER_ERROR_MESSAGES.NOT_FOUND, incidentId, HTTP_STATUS.NOT_FOUND));
    }
    
    // Return the saved session data
    res.json(sessionData);
    
  } catch (error) {
    logger.error(
      'Failed to create/update Options Studio session',
      error instanceof Error ? error : new Error(String(error)),
      {
        requestBody: req.body,
        functionArgs: { assessmentId },
        additionalContext: {
          operation: 'create_update_options_studio_session_error',
          requestId: req.requestId,
          userId: req.userId,
          incidentId
        }
      }
    );
    
    // Check if it's a Zod validation error
    const isValidationError = error instanceof Error && (
      error.message.includes('validation') ||
      error.name === 'ZodError' ||
      error.message.includes('Invalid') ||
      error.message.includes('Expected')
    );
    
    const status = isValidationError 
      ? HTTP_STATUS.BAD_REQUEST 
      : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      
    const userMessage = status === HTTP_STATUS.BAD_REQUEST 
      ? USER_ERROR_MESSAGES.VALIDATION_ERROR
      : USER_ERROR_MESSAGES.SERVER_ERROR;
    
    res.status(status).json(createUserError(userMessage, incidentId, status));
  }
});

/**
 * Partial update for Options Studio session (PATCH for incremental updates)
 */
router.patch('/:assessmentId', async (req: Request, res: Response) => {
  const incidentId = generateIncidentId();
  const { assessmentId } = req.params;
  
  try {
    logger.info('Partially updating Options Studio session', {
      additionalContext: {
        operation: 'patch_options_studio_session',
        assessmentId,
        incidentId,
        updateKeys: Object.keys(req.body)
      }
    });
    
    // First verify assessment ownership before allowing Options Studio access
    const assessment = await withDatabaseErrorHandling(
      'get_assessment_for_options_studio_patch',
      () => storage.getAssessment(assessmentId, req.userId)
    );
    
    if (!assessment) {
      logger.warn('Assessment not found or access denied for Options Studio session patch', {
        additionalContext: {
          assessmentId,
          operation: 'patch_options_studio_session_unauthorized',
          incidentId,
          userId: req.userId
        }
      });
      
      return res.status(HTTP_STATUS.NOT_FOUND)
        .json(createUserError(USER_ERROR_MESSAGES.NOT_FOUND, incidentId, HTTP_STATUS.NOT_FOUND));
    }
    
    // Now that we've verified ownership, get the existing session
    const existingSession = await withDatabaseErrorHandling(
      'get_existing_options_studio_session',
      () => storage.getOptionsStudioSession(assessmentId, req.userId)
    );
    
    if (!existingSession) {
      // If no existing session, initialize with empty structure (only for authorized assessments)
      const emptySession: OptionsStudioSession = {
        useCase: '',
        goals: [],
        misconceptionResponses: {},
        comparedOptions: [],
        reflectionPrompts: [],
        completed: false
      };
      
      // Merge the partial update with empty session
      const sessionData = { ...emptySession, ...req.body };
      
      // Validate the complete session data
      const validationResult = optionsStudioSessionSchema.safeParse(sessionData);
      
      if (!validationResult.success) {
        logger.warn('Invalid partial Options Studio session data', {
          additionalContext: {
            operation: 'options_studio_session_patch_validation_error',
            errors: validationResult.error.errors,
            incidentId
          }
        });
        
        return res.status(HTTP_STATUS.BAD_REQUEST)
          .json(createUserError(USER_ERROR_MESSAGES.VALIDATION_ERROR, incidentId, HTTP_STATUS.BAD_REQUEST));
      }
      
      const updatedAssessment = await withDatabaseErrorHandling(
        'update_options_studio_session_partial',
        () => storage.createOrUpdateOptionsStudioSession(
          assessmentId, 
          validationResult.data,
          req.userId
        )
      );
      
      if (!updatedAssessment) {
        return res.status(HTTP_STATUS.NOT_FOUND)
          .json(createUserError(USER_ERROR_MESSAGES.NOT_FOUND, incidentId, HTTP_STATUS.NOT_FOUND));
      }
      
      return res.json(validationResult.data);
    }
    
    // Merge existing session with partial update
    const sessionData = { ...existingSession, ...req.body };
    
    // Validate the merged session data
    const validationResult = optionsStudioSessionSchema.safeParse(sessionData);
    
    if (!validationResult.success) {
      logger.warn('Invalid partial Options Studio session data after merge', {
        additionalContext: {
          operation: 'options_studio_session_patch_merge_validation_error',
          errors: validationResult.error.errors,
          incidentId
        }
      });
      
      return res.status(HTTP_STATUS.BAD_REQUEST)
        .json(createUserError(USER_ERROR_MESSAGES.VALIDATION_ERROR, incidentId, HTTP_STATUS.BAD_REQUEST));
    }
    
    const updatedAssessment = await withDatabaseErrorHandling(
      'update_options_studio_session_full',
      () => storage.createOrUpdateOptionsStudioSession(
        assessmentId, 
        validationResult.data,
        req.userId
      )
    );
    
    if (!updatedAssessment) {
      return res.status(HTTP_STATUS.NOT_FOUND)
        .json(createUserError(USER_ERROR_MESSAGES.NOT_FOUND, incidentId, HTTP_STATUS.NOT_FOUND));
    }
    
    res.json(validationResult.data);
    
  } catch (error) {
    logger.error(
      'Failed to partially update Options Studio session',
      error instanceof Error ? error : new Error(String(error)),
      {
        requestBody: req.body,
        functionArgs: { assessmentId },
        additionalContext: {
          operation: 'patch_options_studio_session_error',
          requestId: req.requestId,
          userId: req.userId,
          incidentId
        }
      }
    );
    
    const isValidationError = error instanceof Error && (
      error.message.includes('validation') ||
      error.name === 'ZodError' ||
      error.message.includes('Invalid') ||
      error.message.includes('Expected')
    );
    
    const status = isValidationError 
      ? HTTP_STATUS.BAD_REQUEST 
      : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      
    const userMessage = status === HTTP_STATUS.BAD_REQUEST 
      ? USER_ERROR_MESSAGES.VALIDATION_ERROR
      : USER_ERROR_MESSAGES.SERVER_ERROR;
    
    res.status(status).json(createUserError(userMessage, incidentId, status));
  }
});

export default router;