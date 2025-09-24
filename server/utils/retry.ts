import { logger } from "../logger";
import { generateIncidentId } from "./incident";

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  jitterFactor: number; // 0.1 = 10% jitter
  retryableErrorClassifier?: (error: unknown) => boolean;
}

export interface RetryContext {
  operation: string;
  incidentId: string;
  attempt: number;
  maxAttempts: number;
  delay?: number;
  error?: unknown;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  jitterFactor: 0.1,
  retryableErrorClassifier: (error: unknown) => {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      const errorCode = (error as any).code?.toLowerCase() || '';
      
      // Network/connection errors
      if (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('timed out') ||
        message.includes('econnreset') ||
        message.includes('enotfound') ||
        message.includes('etimedout') ||
        message.includes('connection refused') ||
        message.includes('temporarily unavailable') ||
        message.includes('service unavailable') ||
        message.includes('too many requests') ||
        errorCode === 'network_error' ||
        errorCode === 'econnreset' ||
        errorCode === 'etimedout' ||
        errorCode === 'enotfound'
      ) {
        return true;
      }
      
      // Rate limiting (common HTTP status patterns)
      if (
        message.includes('429') ||
        message.includes('rate limit') ||
        message.includes('quota exceeded')
      ) {
        return true;
      }
      
      // Server errors (5xx) that might be transient
      if (
        message.includes('500') ||
        message.includes('502') ||
        message.includes('503') ||
        message.includes('504') ||
        message.includes('internal server error') ||
        message.includes('bad gateway') ||
        message.includes('gateway timeout')
      ) {
        return true;
      }
    }
    
    return false;
  }
};

/**
 * Centralized retry/backoff utility for external service calls
 * Provides exponential backoff with jitter and configurable retry logic
 */
export async function executeWithRetry<T>(
  operation: string,
  fn: (context: RetryContext) => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const incidentId = generateIncidentId();
  
  logger.debug('Starting retry operation', {
    additionalContext: {
      operation,
      incidentId,
      maxAttempts: finalConfig.maxAttempts
    }
  });
  
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    const context: RetryContext = {
      operation,
      incidentId,
      attempt,
      maxAttempts: finalConfig.maxAttempts
    };
    
    try {
      const result = await fn(context);
      
      if (attempt > 1) {
        logger.info('Retry operation succeeded', {
          additionalContext: {
            operation,
            incidentId,
            successfulAttempt: attempt,
            totalAttempts: finalConfig.maxAttempts
          }
        });
      }
      
      return result;
      
    } catch (error) {
      lastError = error;
      const isLastAttempt = attempt === finalConfig.maxAttempts;
      const isRetryable = finalConfig.retryableErrorClassifier!(error);
      
      logger.error(
        `Retry operation failed (attempt ${attempt}/${finalConfig.maxAttempts})`,
        error instanceof Error ? error : new Error(String(error)),
        {
          additionalContext: {
            operation,
            incidentId,
            attempt,
            maxAttempts: finalConfig.maxAttempts,
            isRetryable,
            isLastAttempt
          }
        }
      );
      
      // If it's the last attempt or error is not retryable, fail
      if (isLastAttempt || !isRetryable) {
        if (isLastAttempt && isRetryable) {
          logger.error(
            'Retry operation exhausted all attempts',
            new Error(`Operation '${operation}' failed after ${finalConfig.maxAttempts} attempts. Incident ID: ${incidentId}`),
            {
              additionalContext: {
                operation,
                incidentId,
                finalAttempt: attempt,
                allAttemptsFailed: true
              }
            }
          );
        }
        throw error;
      }
      
      // Calculate delay for next attempt (exponential backoff with jitter)
      const exponentialDelay = finalConfig.baseDelay * Math.pow(2, attempt - 1);
      const jitter = exponentialDelay * finalConfig.jitterFactor * Math.random();
      const delay = Math.min(exponentialDelay + jitter, finalConfig.maxDelay);
      
      context.delay = Math.round(delay);
      context.error = error;
      
      logger.debug(`Retrying operation in ${context.delay}ms`, {
        additionalContext: {
          operation,
          incidentId,
          attempt,
          nextAttempt: attempt + 1,
          delay: context.delay
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, context.delay));
    }
  }
  
  // This should never be reached due to the logic above, but TypeScript needs it
  throw lastError;
}

/**
 * Specialized retry config for external API calls (Gemini, Firebase)
 */
export const EXTERNAL_API_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 2000, // 2 seconds
  maxDelay: 30000, // 30 seconds  
  jitterFactor: 0.2, // 20% jitter for API calls
  retryableErrorClassifier: DEFAULT_CONFIG.retryableErrorClassifier
};

/**
 * Specialized retry config for database operations (shorter delays)
 */
export const DATABASE_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 2,
  baseDelay: 500, // 500ms
  maxDelay: 5000, // 5 seconds
  jitterFactor: 0.1,
  retryableErrorClassifier: (error: unknown) => {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      // Database connection/timeout errors
      if (
        message.includes('connection') ||
        message.includes('timeout') ||
        message.includes('econnreset') ||
        message.includes('pool') ||
        message.includes('deadlock')
      ) {
        return true;
      }
    }
    return false;
  }
};