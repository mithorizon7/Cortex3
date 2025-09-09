import { Request, Response, NextFunction } from 'express';
import { APP_CONFIG, USER_ERROR_MESSAGES, HTTP_STATUS } from '../constants';
import { generateIncidentId, createUserError } from '../utils/incident';
import { logger } from '../logger';

/**
 * Basic CORS middleware implementation
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const allowedOrigins = APP_CONFIG.CORS.origin as string[];
  const origin = req.headers.origin;
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Frontend-Request-Id, X-User-Id');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
}

/**
 * Basic rate limiting implementation
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const clientId = req.ip || 'unknown';
  const now = Date.now();
  const windowMs = APP_CONFIG.RATE_LIMIT.windowMs;
  const maxRequests = APP_CONFIG.RATE_LIMIT.max;
  
  const clientData = requestCounts.get(clientId);
  
  if (!clientData || now > clientData.resetTime) {
    requestCounts.set(clientId, {
      count: 1,
      resetTime: now + windowMs
    });
    next();
    return;
  }
  
  if (clientData.count >= maxRequests) {
    const incidentId = generateIncidentId();
    
    logger.warn('Rate limit exceeded', {
      additionalContext: {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        incidentId
      }
    });
    
    const errorResponse = createUserError(
      USER_ERROR_MESSAGES.RATE_LIMIT_ERROR,
      incidentId,
      HTTP_STATUS.TOO_MANY_REQUESTS
    );
    
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json(errorResponse);
    return;
  }
  
  clientData.count++;
  next();
}

/**
 * Basic security headers middleware
 */
export function securityMiddleware(req: Request, res: Response, next: NextFunction) {
  // Basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Basic CSP
  const csp = [
    "default-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self'",
    "img-src 'self' data: https:",
    "connect-src 'self'",
    "font-src 'self'",
    "object-src 'none'",
    "media-src 'self'",
    "frame-src 'none'"
  ].join('; ');
  
  res.setHeader('Content-Security-Policy', csp);
  
  next();
}

/**
 * Input sanitization middleware
 */
export function sanitizationMiddleware(req: Request, res: Response, next: NextFunction) {
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  next();
}

/**
 * Recursively sanitize an object
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize key and value
      const cleanKey = sanitizeString(key);
      sanitized[cleanKey] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  return obj;
}

/**
 * Sanitize string input
 */
function sanitizeString(str: string): string {
  if (typeof str !== 'string') {
    return str;
  }
  
  return str
    // Remove potential XSS
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    // Remove potential SQL injection patterns
    .replace(/(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE){0,1}|INSERT( +INTO){0,1}|MERGE|SELECT|UPDATE|UNION( +ALL){0,1})\b)/gi, '')
    // Trim whitespace
    .trim();
}