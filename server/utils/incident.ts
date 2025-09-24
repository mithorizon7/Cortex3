import { randomUUID } from "crypto";

/**
 * Generate a unique incident ID for user-facing error reporting
 * Format: INC-YYYY-XXXXXXXX (8 random chars)
 */
export function generateIncidentId(): string {
  const year = new Date().getFullYear();
  const randomString = randomUUID().substring(0, 8).toUpperCase();
  return `INC-${year}-${randomString}`;
}

/**
 * Sanitize error message for user display
 * Remove technical details but keep useful information
 */
export function sanitizeErrorForUser(error: unknown): string {
  if (error instanceof Error) {
    // Remove stack traces and internal details
    const message = error.message.toLowerCase();
    
    // Common patterns to clean up
    if (message.includes('validation')) return 'Invalid input provided';
    if (message.includes('network') || message.includes('fetch')) return 'Network connection error';
    if (message.includes('timeout')) return 'Request timed out';
    if (message.includes('not found')) return 'Requested resource not found';
    if (message.includes('unauthorized')) return 'Authentication required';
    if (message.includes('forbidden')) return 'Access denied';
    
    // For unknown errors, return generic message
    return 'An unexpected error occurred';
  }
  
  return 'An unexpected error occurred';
}

/**
 * Create user-friendly error response
 */
export function createUserError(
  message: string,
  incidentId: string,
  statusCode: number = 500
) {
  return {
    error: message,
    incidentId,
    timestamp: new Date().toISOString(),
    statusCode
  };
}

/**
 * Centralized error response handler for API routes
 * Ensures consistent error formatting and logging across all endpoints
 */
export function handleApiError(
  error: unknown,
  operation: string,
  incidentId: string,
  logger: any,
  context?: {
    requestId?: string;
    userId?: string;
    functionArgs?: Record<string, any>;
    requestBody?: any;
  }
): { status: number; response: any } {
  
  // Log the error with structured context
  logger.error(
    `API operation failed: ${operation}`,
    error instanceof Error ? error : new Error(String(error)),
    {
      functionArgs: context?.functionArgs,
      requestBody: context?.requestBody,
      additionalContext: {
        operation,
        requestId: context?.requestId,
        userId: context?.userId,
        incidentId
      }
    }
  );

  // Categorize error type and determine appropriate response
  if (error instanceof Error) {
    // Check for validation errors (Zod, input validation)
    const isValidationError = 
      error.name === 'ZodError' ||
      error.message.includes('validation') ||
      error.message.includes('Invalid') ||
      error.message.includes('Expected');

    if (isValidationError) {
      return {
        status: 400,
        response: createUserError(
          'Please check your input and try again',
          incidentId,
          400
        )
      };
    }

    // Check for "not found" errors
    if (error.message.includes('not found') || error.message.includes('Not found')) {
      return {
        status: 404,
        response: createUserError(
          'The requested information could not be found',
          incidentId,
          404
        )
      };
    }

    // Check for authentication/authorization errors
    if (error.message.includes('unauthorized') || error.message.includes('Unauthorized')) {
      return {
        status: 401,
        response: createUserError(
          'Authentication required. Please sign in and try again',
          incidentId,
          401
        )
      };
    }

    // Check for timeout errors
    if (error.message.includes('timeout') || error.message.includes('timed out')) {
      return {
        status: 503,
        response: createUserError(
          'Request timed out. Please try again',
          incidentId,
          503
        )
      };
    }
  }

  // Default to 500 Internal Server Error for unexpected errors
  return {
    status: 500,
    response: createUserError(
      'We are experiencing technical difficulties. Please try again shortly',
      incidentId,
      500
    )
  };
}