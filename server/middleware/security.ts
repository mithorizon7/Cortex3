import { Request, Response, NextFunction } from 'express';
import { APP_CONFIG, USER_ERROR_MESSAGES, HTTP_STATUS } from '../constants';
import { generateIncidentId, createUserError } from '../utils/incident';
import { logger } from '../logger';
import { storage } from '../storage';

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
  // Only apply restrictive headers in production
  if (process.env.NODE_ENV === 'production') {
    // Basic security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Firebase auth uses popups, not frames, so we can keep X-Frame-Options restrictive
    // But allow specific frame sources for potential Firebase iframe fallbacks
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    
    // Get Firebase project ID from environment
    const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'cortex3-790ee';
    
    // Secure Firebase-compatible CSP for production with violation reporting
    const csp = [
      "default-src 'self'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "script-src 'self' https://apis.google.com https://www.gstatic.com",
      "img-src 'self' data: https://lh3.googleusercontent.com https://firebasestorage.googleapis.com",
      "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebaseinstallations.googleapis.com https://accounts.google.com https://firebase.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "object-src 'none'",
      "media-src 'self'",
      `frame-src 'self' https://${firebaseProjectId}.firebaseapp.com https://accounts.google.com`,
      "report-uri /api/csp-violation-report"
    ].join('; ');
    
    res.setHeader('Content-Security-Policy', csp);
  } else {
    // Development: minimal security headers to not interfere with dev tools
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
  
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
 * Authentication middleware - ensures user is authenticated
 */
export function requireAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  // Check if user is authenticated (not anonymous)
  const userId = req.userId;
  
  if (!userId || userId === 'anonymous') {
    const incidentId = generateIncidentId();
    
    logger.warn('Authentication required - unauthorized access attempt', {
      additionalContext: {
        path: req.path,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        incidentId
      }
    });
    
    const errorResponse = createUserError(
      'Authentication required. Please sign in and try again.',
      incidentId,
      HTTP_STATUS.UNAUTHORIZED
    );
    
    res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse);
    return;
  }
  
  // User is authenticated, proceed
  next();
}

/**
 * Admin authentication middleware - ensures user is authenticated and has admin or super_admin role
 */
export async function requireAdminMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // First check if user is authenticated
    const userId = req.userId;
    
    if (!userId || userId === 'anonymous') {
      const incidentId = generateIncidentId();
      
      logger.warn('Admin access denied - authentication required', {
        additionalContext: {
          path: req.path,
          method: req.method,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          incidentId
        }
      });
      
      const errorResponse = createUserError(
        'Authentication required. Please sign in and try again.',
        incidentId,
        HTTP_STATUS.UNAUTHORIZED
      );
      
      res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse);
      return;
    }
    
    // Fetch user profile to check role
    const user = await storage.getUser(userId);
    
    if (!user) {
      const incidentId = generateIncidentId();
      
      logger.warn('Admin access denied - user profile not found', {
        additionalContext: {
          userId,
          path: req.path,
          method: req.method,
          ip: req.ip,
          incidentId
        }
      });
      
      const errorResponse = createUserError(
        'User profile not found. Please contact support.',
        incidentId,
        HTTP_STATUS.FORBIDDEN
      );
      
      res.status(HTTP_STATUS.FORBIDDEN).json(errorResponse);
      return;
    }
    
    // Check if user has admin or super_admin role
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      const incidentId = generateIncidentId();
      
      logger.warn('Admin access denied - insufficient privileges', {
        additionalContext: {
          userId,
          userRole: user.role,
          path: req.path,
          method: req.method,
          ip: req.ip,
          incidentId
        }
      });
      
      const errorResponse = createUserError(
        'Admin privileges required to access this resource.',
        incidentId,
        HTTP_STATUS.FORBIDDEN
      );
      
      res.status(HTTP_STATUS.FORBIDDEN).json(errorResponse);
      return;
    }
    
    // User has admin privileges, proceed
    logger.debug('Admin access granted', {
      additionalContext: {
        userId,
        userRole: user.role,
        path: req.path
      }
    });
    
    next();
  } catch (error) {
    const incidentId = generateIncidentId();
    
    logger.error('Error checking admin privileges', error instanceof Error ? error : new Error(String(error)), {
      additionalContext: {
        userId: req.userId,
        path: req.path,
        incidentId
      }
    });
    
    const errorResponse = createUserError(
      'Unable to verify admin privileges. Please try again.',
      incidentId,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
}

/**
 * Super admin authentication middleware - ensures user is authenticated and has super_admin role
 */
export async function requireSuperAdminMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // First check if user is authenticated
    const userId = req.userId;
    
    if (!userId || userId === 'anonymous') {
      const incidentId = generateIncidentId();
      
      logger.warn('Super admin access denied - authentication required', {
        additionalContext: {
          path: req.path,
          method: req.method,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          incidentId
        }
      });
      
      const errorResponse = createUserError(
        'Authentication required. Please sign in and try again.',
        incidentId,
        HTTP_STATUS.UNAUTHORIZED
      );
      
      res.status(HTTP_STATUS.UNAUTHORIZED).json(errorResponse);
      return;
    }
    
    // Fetch user profile to check role
    const user = await storage.getUser(userId);
    
    if (!user) {
      const incidentId = generateIncidentId();
      
      logger.warn('Super admin access denied - user profile not found', {
        additionalContext: {
          userId,
          path: req.path,
          method: req.method,
          ip: req.ip,
          incidentId
        }
      });
      
      const errorResponse = createUserError(
        'User profile not found. Please contact support.',
        incidentId,
        HTTP_STATUS.FORBIDDEN
      );
      
      res.status(HTTP_STATUS.FORBIDDEN).json(errorResponse);
      return;
    }
    
    // Check if user has super_admin role
    if (user.role !== 'super_admin') {
      const incidentId = generateIncidentId();
      
      logger.warn('Super admin access denied - insufficient privileges', {
        additionalContext: {
          userId,
          userRole: user.role,
          path: req.path,
          method: req.method,
          ip: req.ip,
          incidentId
        }
      });
      
      const errorResponse = createUserError(
        'Super admin privileges required to access this resource.',
        incidentId,
        HTTP_STATUS.FORBIDDEN
      );
      
      res.status(HTTP_STATUS.FORBIDDEN).json(errorResponse);
      return;
    }
    
    // User has super admin privileges, proceed
    logger.debug('Super admin access granted', {
      additionalContext: {
        userId,
        userRole: user.role,
        path: req.path
      }
    });
    
    next();
  } catch (error) {
    const incidentId = generateIncidentId();
    
    logger.error('Error checking super admin privileges', error instanceof Error ? error : new Error(String(error)), {
      additionalContext: {
        userId: req.userId,
        path: req.path,
        incidentId
      }
    });
    
    const errorResponse = createUserError(
      'Unable to verify super admin privileges. Please try again.',
      incidentId,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
}

/**
 * Situation Assessment specific rate limiting middleware
 * Stricter limits for expensive LLM operations
 */
const situationAssessmentRequests = new Map<string, { count: number; resetTime: number }>();

export function situationAssessmentRateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const userId = req.userId || 'anonymous';
  const now = Date.now();
  // 10 minutes window with max 5 requests per user (stricter than general rate limit)
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const maxRequests = process.env.NODE_ENV === 'development' ? 20 : 5; // Higher limit in development
  
  const userKey = `situationassessment:${userId}`;
  const userData = situationAssessmentRequests.get(userKey);
  
  if (!userData || now > userData.resetTime) {
    situationAssessmentRequests.set(userKey, {
      count: 1,
      resetTime: now + windowMs
    });
    next();
    return;
  }
  
  if (userData.count >= maxRequests) {
    const incidentId = generateIncidentId();
    
    logger.warn('Situation Assessment rate limit exceeded', {
      additionalContext: {
        userId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        count: userData.count,
        maxRequests,
        incidentId
      }
    });
    
    const errorResponse = createUserError(
      'Too many Situation Assessment requests. Please wait before requesting another analysis.',
      incidentId,
      HTTP_STATUS.TOO_MANY_REQUESTS
    );
    
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json(errorResponse);
    return;
  }
  
  userData.count++;
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