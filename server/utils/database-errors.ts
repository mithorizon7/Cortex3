import { HTTP_STATUS } from '../constants';
import { logger } from '../logger';

/**
 * Database error types and their corresponding HTTP status codes
 */
export enum DatabaseErrorType {
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR', 
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  NOT_FOUND = 'NOT_FOUND',
  TRANSACTION_CONFLICT = 'TRANSACTION_CONFLICT',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Structured database error for consistent handling
 */
export class DatabaseError extends Error {
  public readonly type: DatabaseErrorType;
  public readonly statusCode: number;
  public readonly userMessage: string;
  public readonly originalError?: Error;

  constructor(
    type: DatabaseErrorType,
    message: string,
    userMessage: string,
    statusCode: number,
    originalError?: Error
  ) {
    super(message);
    this.name = 'DatabaseError';
    this.type = type;
    this.statusCode = statusCode;
    this.userMessage = userMessage;
    this.originalError = originalError;
  }
}

/**
 * Detect database error type from error messages and codes
 */
export function detectDatabaseErrorType(error: any): DatabaseErrorType {
  const message = error.message?.toLowerCase() || '';
  const code = error.code || '';

  // Connection errors
  if (
    message.includes('connection') ||
    message.includes('connect') ||
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    code === 'ETIMEDOUT'
  ) {
    return DatabaseErrorType.CONNECTION_ERROR;
  }

  // Timeout errors
  if (
    message.includes('timeout') ||
    message.includes('timed out') ||
    code === 'ETIMEOUT'
  ) {
    return DatabaseErrorType.TIMEOUT_ERROR;
  }

  // Constraint violations (PostgreSQL)
  if (
    code === '23505' || // unique_violation
    code === '23503' || // foreign_key_violation
    code === '23502' || // not_null_violation
    code === '23514' || // check_violation
    message.includes('constraint') ||
    message.includes('unique') ||
    message.includes('foreign key') ||
    message.includes('violates')
  ) {
    return DatabaseErrorType.CONSTRAINT_VIOLATION;
  }

  // Transaction conflicts (PostgreSQL)
  if (
    code === '40001' || // serialization_failure
    code === '40P01' || // deadlock_detected
    message.includes('deadlock') ||
    message.includes('serialization failure')
  ) {
    return DatabaseErrorType.TRANSACTION_CONFLICT;
  }

  // Not found (application level)
  if (message.includes('not found')) {
    return DatabaseErrorType.NOT_FOUND;
  }

  return DatabaseErrorType.UNKNOWN;
}

/**
 * Convert database errors to structured DatabaseError instances
 */
export function categorizeDatabaseError(error: any): DatabaseError {
  const type = detectDatabaseErrorType(error);

  switch (type) {
    case DatabaseErrorType.CONNECTION_ERROR:
      return new DatabaseError(
        type,
        `Database connection failed: ${error.message}`,
        'Unable to connect to the database. Please try again in a moment.',
        HTTP_STATUS.SERVICE_UNAVAILABLE,
        error
      );

    case DatabaseErrorType.TIMEOUT_ERROR:
      return new DatabaseError(
        type,
        `Database operation timed out: ${error.message}`,
        'The request took too long to process. Please try again.',
        HTTP_STATUS.SERVICE_UNAVAILABLE,
        error
      );

    case DatabaseErrorType.CONSTRAINT_VIOLATION:
      return new DatabaseError(
        type,
        `Database constraint violation: ${error.message}`,
        'The data provided conflicts with existing records. Please check your input.',
        HTTP_STATUS.CONFLICT,
        error
      );

    case DatabaseErrorType.TRANSACTION_CONFLICT:
      return new DatabaseError(
        type,
        `Database transaction conflict: ${error.message}`,
        'A conflict occurred while saving your data. Please try again.',
        HTTP_STATUS.CONFLICT,
        error
      );

    case DatabaseErrorType.NOT_FOUND:
      return new DatabaseError(
        type,
        `Resource not found: ${error.message}`,
        'The requested resource was not found.',
        HTTP_STATUS.NOT_FOUND,
        error
      );

    default:
      return new DatabaseError(
        DatabaseErrorType.UNKNOWN,
        `Database error: ${error.message}`,
        'A database error occurred. Please try again later.',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        error
      );
  }
}

/**
 * Enhanced error handling wrapper for database operations
 * SECURITY: Uses structured logger with production-safe logging (no sensitive data)
 */
export async function withDatabaseErrorHandling<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: {
    functionArgs?: Record<string, any>;
    requestBody?: any;
    userId?: string;
    requestId?: string;
  }
): Promise<T> {
  const startTime = Date.now();
  
  try {
    return await fn();
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Convert to structured database error
    const dbError = categorizeDatabaseError(error);
    
    // SECURITY: Never log sensitive functionArgs or requestBody in production
    const isDevMode = process.env.NODE_ENV === 'development';
    
    // Use structured logger with safe metadata only
    const safeContext = {
      operation,
      type: dbError.type,
      statusCode: dbError.statusCode,
      duration,
      userId: context?.userId,
      requestId: context?.requestId,
      hasFunctionArgs: !!context?.functionArgs,
      hasRequestBody: !!context?.requestBody
    };
    
    // Log with appropriate level based on error type
    // SECURITY: Never log dbError.message in production as it may contain PII
    const isServiceError = dbError.type === DatabaseErrorType.CONNECTION_ERROR || 
                          dbError.type === DatabaseErrorType.TIMEOUT_ERROR;
    
    if (isServiceError) {
      // Service errors (connectivity/timeouts) are warnings, not application errors
      logger.warn(
        `Database service error: ${operation}`,
        {
          additionalContext: {
            ...safeContext,
            // Only log sensitive details in development
            ...(isDevMode && { 
              errorMessage: dbError.message,
              functionArgs: context?.functionArgs,
              originalError: dbError.originalError 
            })
          }
        }
      );
    } else {
      // Application errors (constraints, conflicts) are errors
      // SECURITY: Never pass original error to logger in production (contains PII)
      const logError = isDevMode 
        ? (dbError.originalError instanceof Error ? dbError.originalError : new Error(String(dbError.originalError)))
        : new Error(`Database error in ${operation}`); // Safe generic error for production
        
      logger.error(
        `Database error: ${operation}`,
        logError,
        {
          additionalContext: {
            ...safeContext,
            // Only log sensitive details in development
            ...(isDevMode && { 
              errorMessage: dbError.message,
              functionArgs: context?.functionArgs
            })
          }
        }
      );
    }

    throw dbError;
  }
}