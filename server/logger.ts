import { randomUUID } from "crypto";

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface LogContext {
  requestId?: string;
  userId?: string;
  operation?: string;
  additionalContext?: Record<string, any>;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  functionArgs?: Record<string, any>;
  requestBody?: any;
  duration?: number;
}

class StructuredLogger {
  private context: LogContext = {};

  setContext(context: Partial<LogContext>) {
    this.context = { ...this.context, ...context };
  }

  clearContext() {
    this.context = {};
  }

  private formatLogEntry(level: LogLevel, message: string, additional?: {
    error?: Error;
    context?: Partial<LogContext>;
    functionArgs?: Record<string, any>;
    requestBody?: any;
    duration?: number;
  }): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...this.context,
        ...additional?.context
      }
    };

    if (additional?.error) {
      entry.error = {
        name: additional.error.name,
        message: additional.error.message,
        stack: additional.error.stack,
        code: (additional.error as any).code
      };
    }

    if (additional?.functionArgs) {
      entry.functionArgs = additional.functionArgs;
    }

    if (additional?.requestBody) {
      entry.requestBody = additional.requestBody;
    }

    if (additional?.duration) {
      entry.duration = additional.duration;
    }

    return entry;
  }

  private output(entry: LogEntry) {
    // In production, this would go to proper logging infrastructure
    // For development, output to console
    if (entry.level === 'ERROR' || entry.level === 'FATAL') {
      console.error(JSON.stringify(entry, null, 2));
    } else {
      console.log(JSON.stringify(entry, null, 2));
    }
  }

  debug(message: string, context?: Partial<LogContext>) {
    this.output(this.formatLogEntry('DEBUG', message, { context }));
  }

  info(message: string, context?: Partial<LogContext>) {
    this.output(this.formatLogEntry('INFO', message, { context }));
  }

  warn(message: string, context?: Partial<LogContext>) {
    this.output(this.formatLogEntry('WARN', message, { context }));
  }

  error(message: string, error?: Error, context?: {
    functionArgs?: Record<string, any>;
    requestBody?: any;
    additionalContext?: Record<string, any>;
  }) {
    this.output(this.formatLogEntry('ERROR', message, {
      error,
      context: context?.additionalContext,
      functionArgs: context?.functionArgs,
      requestBody: context?.requestBody
    }));
  }

  fatal(message: string, error?: Error, context?: {
    functionArgs?: Record<string, any>;
    requestBody?: any;
    additionalContext?: Record<string, any>;
  }) {
    this.output(this.formatLogEntry('FATAL', message, {
      error,
      context: context?.additionalContext,
      functionArgs: context?.functionArgs,
      requestBody: context?.requestBody
    }));
  }

  logRequest(method: string, path: string, statusCode: number, duration: number, context?: {
    requestBody?: any;
    responseBody?: any;
    error?: Error;
  }) {
    const level: LogLevel = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO';
    const message = `${method} ${path} ${statusCode} in ${duration}ms`;
    
    this.output(this.formatLogEntry(level, message, {
      context: context?.error ? { operation: 'http_request' } : undefined,
      error: context?.error,
      requestBody: context?.requestBody,
      duration
    }));
  }
}

export const logger = new StructuredLogger();

export function generateRequestId(): string {
  return randomUUID();
}

export function withRequestContext<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: LogContext
): T {
  return (async (...args: Parameters<T>) => {
    logger.setContext(context);
    try {
      const result = await fn(...args);
      logger.clearContext();
      return result;
    } catch (error) {
      logger.clearContext();
      throw error;
    }
  }) as T;
}

// Error handling wrapper for async operations
export async function withErrorHandling<T>(
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
    logger.debug(`Starting operation: ${operation}`, {
      operation,
      ...context
    });
    
    const result = await fn();
    const duration = Date.now() - startTime;
    
    logger.debug(`Completed operation: ${operation}`, {
      operation,
      duration,
      ...context
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error(
      `Operation failed: ${operation}`,
      error instanceof Error ? error : new Error(String(error)),
      {
        functionArgs: context?.functionArgs,
        requestBody: context?.requestBody,
        additionalContext: {
          operation,
          duration,
          userId: context?.userId,
          requestId: context?.requestId
        }
      }
    );
    
    throw error;
  }
}