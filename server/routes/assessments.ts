import { Request, Response, Router } from 'express';
import { assessmentService } from '../services/assessment.service';
import { generateIncidentId, createUserError, sanitizeErrorForUser } from '../utils/incident';
import { USER_ERROR_MESSAGES, HTTP_STATUS } from '../constants';
import { logger } from '../logger';
import { requireAuthMiddleware } from '../middleware/security';

const router = Router();

/**
 * Create new assessment
 */
router.post('/', requireAuthMiddleware, async (req: Request, res: Response) => {
  const incidentId = generateIncidentId();
  
  try {
    logger.info('Creating new assessment', {
      additionalContext: {
        operation: 'create_assessment',
        incidentId,
        hasContextProfile: !!req.body.contextProfile
      }
    });
    
    const assessment = await assessmentService.createAssessment({
      contextProfile: req.body.contextProfile,
      userId: req.userId!
    });
    
    res.status(HTTP_STATUS.CREATED).json(assessment);
    
  } catch (error) {
    logger.error(
      'Failed to create assessment',
      error instanceof Error ? error : new Error(String(error)),
      {
        requestBody: req.body,
        additionalContext: {
          operation: 'create_assessment_error',
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
 * Get assessment by ID
 */
router.get('/:id', requireAuthMiddleware, async (req: Request, res: Response) => {
  const incidentId = generateIncidentId();
  const assessmentId = req.params.id;
  
  try {
    logger.info('Fetching assessment', {
      additionalContext: {
        operation: 'get_assessment',
        assessmentId,
        incidentId
      }
    });
    
    const assessment = await assessmentService.getAssessment(assessmentId, req.userId!);
    
    if (!assessment) {
      logger.warn('Assessment not found', {
        additionalContext: {
          assessmentId,
          operation: 'get_assessment_not_found',
          incidentId
        }
      });
      
      return res.status(HTTP_STATUS.NOT_FOUND)
        .json(createUserError(USER_ERROR_MESSAGES.NOT_FOUND, incidentId, HTTP_STATUS.NOT_FOUND));
    }
    
    res.json(assessment);
    
  } catch (error) {
    logger.error(
      'Failed to fetch assessment',
      error instanceof Error ? error : new Error(String(error)),
      {
        functionArgs: { id: assessmentId },
        additionalContext: {
          operation: 'get_assessment_error',
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
 * Update assessment with pulse responses
 */
router.patch('/:id/pulse', requireAuthMiddleware, async (req: Request, res: Response) => {
  const incidentId = generateIncidentId();
  const assessmentId = req.params.id;
  
  try {
    logger.info('Updating assessment with pulse responses', {
      additionalContext: {
        operation: 'update_pulse_responses',
        assessmentId,
        incidentId,
        responseCount: req.body.pulseResponses ? Object.keys(req.body.pulseResponses).length : 0
      }
    });
    
    const assessment = await assessmentService.updatePulseResponses(
      assessmentId,
      req.body.pulseResponses
    );
    
    if (!assessment) {
      return res.status(HTTP_STATUS.NOT_FOUND)
        .json(createUserError(USER_ERROR_MESSAGES.NOT_FOUND, incidentId, HTTP_STATUS.NOT_FOUND));
    }
    
    res.json(assessment);
    
  } catch (error) {
    logger.error(
      'Failed to update pulse responses',
      error instanceof Error ? error : new Error(String(error)),
      {
        requestBody: req.body,
        functionArgs: { id: assessmentId },
        additionalContext: {
          operation: 'update_pulse_error',
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
 * Update assessment data (e.g., value overlay)
 */
router.patch('/:id', requireAuthMiddleware, async (req: Request, res: Response) => {
  const incidentId = generateIncidentId();
  const assessmentId = req.params.id;
  
  try {
    logger.info('Updating assessment data', {
      additionalContext: {
        operation: 'update_assessment_data',
        assessmentId,
        incidentId,
        hasValueOverlay: !!req.body.valueOverlay
      }
    });
    
    const assessment = await assessmentService.updateAssessmentData(
      assessmentId,
      req.body
    );
    
    if (!assessment) {
      return res.status(HTTP_STATUS.NOT_FOUND)
        .json(createUserError(USER_ERROR_MESSAGES.NOT_FOUND, incidentId, HTTP_STATUS.NOT_FOUND));
    }
    
    res.json(assessment);
    
  } catch (error) {
    logger.error(
      'Failed to update assessment data',
      error instanceof Error ? error : new Error(String(error)),
      {
        requestBody: req.body,
        functionArgs: { id: assessmentId },
        additionalContext: {
          operation: 'update_assessment_data_error',
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

/**
 * Complete assessment and generate final results
 */
router.patch('/:id/complete', requireAuthMiddleware, async (req: Request, res: Response) => {
  const incidentId = generateIncidentId();
  const assessmentId = req.params.id;
  
  try {
    logger.info('Completing assessment', {
      additionalContext: {
        operation: 'complete_assessment',
        assessmentId,
        incidentId
      }
    });
    
    const assessment = await assessmentService.completeAssessment(assessmentId);
    
    if (!assessment) {
      return res.status(HTTP_STATUS.NOT_FOUND)
        .json(createUserError(USER_ERROR_MESSAGES.NOT_FOUND, incidentId, HTTP_STATUS.NOT_FOUND));
    }
    
    res.json(assessment);
    
  } catch (error) {
    logger.error(
      'Failed to complete assessment',
      error instanceof Error ? error : new Error(String(error)),
      {
        functionArgs: { id: assessmentId },
        additionalContext: {
          operation: 'complete_assessment_error',
          requestId: req.requestId,
          userId: req.userId,
          incidentId
        }
      }
    );
    
    const status = error instanceof Error && error.message.includes('must have pulse responses') 
      ? HTTP_STATUS.BAD_REQUEST 
      : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      
    const userMessage = status === HTTP_STATUS.BAD_REQUEST 
      ? 'Assessment must be completed in the correct order'
      : USER_ERROR_MESSAGES.SERVER_ERROR;
    
    res.status(status).json(createUserError(userMessage, incidentId, status));
  }
});

export default router;