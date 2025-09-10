import { Request, Response, NextFunction } from 'express';
import { logger, generateRequestId } from './logger';
import { generateIncidentId, createUserError, sanitizeErrorForUser } from './utils/incident';
import { DatabaseError } from './utils/database-errors';
import { USER_ERROR_MESSAGES, HTTP_STATUS } from './constants';

// Extend Express Request type to include our custom properties
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      userId?: string;
      startTime: number;
    }
  }
}

export function requestContextMiddleware(req: Request, res: Response, next: NextFunction) {
  // Generate unique request ID
  req.requestId = generateRequestId();
  req.startTime = Date.now();
  
  // Extract user ID from headers/session if available
  // For now, using a header-based approach - in production this might come from JWT or session
  req.userId = req.headers['x-user-id'] as string || 'anonymous';
  
  // Extract frontend request ID for correlation if provided
  const frontendRequestId = req.headers['x-frontend-request-id'] as string;
  
  // Set logger context for this request (preserve frontendRequestId if available)
  logger.setContext({
    requestId: req.requestId,
    userId: req.userId,
    additionalContext: frontendRequestId ? { frontendRequestId } : undefined
  });

  // Override res.json to capture response bodies for logging
  const originalJson = res.json;
  let capturedResponse: any = undefined;
  
  res.json = function(body: any) {
    capturedResponse = body;
    return originalJson.call(this, body);
  };

  // Log request completion
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    // SECURITY: Never log request/response bodies in production to prevent sensitive data exposure
    // Only log metadata for debugging
    const isDevMode = process.env.NODE_ENV === 'development';
    const shouldLogBody = isDevMode && req.path.startsWith('/api') && req.method !== 'GET';
    
    logger.logRequest(req.method, req.path, res.statusCode, duration, {
      requestBody: shouldLogBody ? req.body : undefined,
      responseBody: shouldLogBody && res.statusCode >= 400 ? capturedResponse : undefined,
      hasRequestBody: !!req.body,
      hasResponseBody: !!capturedResponse
    });
    
    // Clear context after request
    logger.clearContext();
  });

  next();
}

export function errorHandlerMiddleware(err: any, req: Request, res: Response, next: NextFunction) {
  // Detect and handle different error types with appropriate status codes
  let status = err.status || err.statusCode;
  let userMessage: string;
  
  // Handle database errors with specific status codes and messages
  if (err instanceof DatabaseError) {
    status = err.statusCode;
    userMessage = err.userMessage;
  }
  // Handle Zod validation errors with proper 422 status
  else if (err.name === 'ZodError' || (err.issues && Array.isArray(err.issues))) {
    status = HTTP_STATUS.UNPROCESSABLE_ENTITY;
  } 
  else if (!status) {
    status = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  }
  
  const incidentId = generateIncidentId();
  
  // Log the error with full technical details and incident ID
  // SECURITY: Never log request bodies to prevent sensitive data exposure in production
  const isDevMode = process.env.NODE_ENV === 'development';
  
  logger.error(
    `Unhandled error in request: ${req.method} ${req.path}`,
    err instanceof Error ? err : new Error(String(err)),
    {
      requestBody: isDevMode ? req.body : undefined,
      hasRequestBody: !!req.body,
      additionalContext: {
        operation: 'request_handler',
        requestId: req.requestId,
        userId: req.userId,
        method: req.method,
        path: req.path,
        statusCode: status,
        incidentId // Critical: Log incident ID for correlation
      }
    }
  );

  // Create user-friendly error response with incident ID
  if (!userMessage) {
    if (status >= 500) {
      userMessage = USER_ERROR_MESSAGES.SERVER_ERROR;
    } else if (status === HTTP_STATUS.NOT_FOUND) {
      userMessage = USER_ERROR_MESSAGES.NOT_FOUND;
    } else if (status === HTTP_STATUS.BAD_REQUEST || status === HTTP_STATUS.UNPROCESSABLE_ENTITY) {
      userMessage = USER_ERROR_MESSAGES.VALIDATION_ERROR;
    } else if (status === HTTP_STATUS.TOO_MANY_REQUESTS) {
      userMessage = USER_ERROR_MESSAGES.RATE_LIMIT_ERROR;
    } else {
      userMessage = sanitizeErrorForUser(err);
    }
  }

  // Return user-friendly error with incident ID
  res.status(status).json(createUserError(userMessage, incidentId, status));
  
  // Clear context
  logger.clearContext();
}