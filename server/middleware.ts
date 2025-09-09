import { Request, Response, NextFunction } from 'express';
import { logger, generateRequestId } from './logger';

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
  
  // Set logger context for this request
  logger.setContext({
    requestId: req.requestId,
    userId: req.userId
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
    const shouldLogBody = req.path.startsWith('/api') && req.method !== 'GET';
    
    logger.logRequest(req.method, req.path, res.statusCode, duration, {
      requestBody: shouldLogBody ? req.body : undefined,
      responseBody: res.statusCode >= 400 ? capturedResponse : undefined
    });
    
    // Clear context after request
    logger.clearContext();
  });

  next();
}

export function errorHandlerMiddleware(err: any, req: Request, res: Response, next: NextFunction) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  // Log the error with full context
  logger.error(
    `Unhandled error in request: ${req.method} ${req.path}`,
    err instanceof Error ? err : new Error(String(err)),
    {
      requestBody: req.body,
      additionalContext: {
        operation: 'request_handler',
        requestId: req.requestId,
        userId: req.userId,
        method: req.method,
        path: req.path,
        statusCode: status
      }
    }
  );

  // Don't expose internal errors to client in production
  const clientMessage = status >= 500 && process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : message;

  res.status(status).json({ 
    error: clientMessage,
    requestId: req.requestId 
  });
  
  // Clear context
  logger.clearContext();
}