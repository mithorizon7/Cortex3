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