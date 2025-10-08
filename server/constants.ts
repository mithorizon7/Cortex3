// Application Constants
export const APP_CONFIG = {
  // Server Configuration
  DEFAULT_PORT: 5000,
  REQUEST_TIMEOUT: 30000, // 30 seconds
  
  // Rate Limiting
  RATE_LIMIT: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: process.env.NODE_ENV === 'development' ? 10000 : 10000, // Anonymous users (by IP) - raised for MIT event
    maxAuthenticated: process.env.NODE_ENV === 'development' ? 1000 : 150, // Authenticated users (by userId)
    message: 'Too many requests, please try again later'
  },
  
  // Request Size Limits
  JSON_LIMIT: '10mb',
  URL_ENCODED_LIMIT: '10mb',
  
  // Security
  CORS: {
    origin: process.env.NODE_ENV === 'production' 
      ? [
          'https://cortexindex.com',
          'https://www.cortexindex.com',
          'https://horizoncortex.replit.app',
          'https://cortex3-790ee.firebaseapp.com',
          'https://cortex3-790ee.web.app'
        ]
      : ['http://localhost:3000', 'http://localhost:5000'],
    credentials: true,
    optionsSuccessStatus: 200
  }
} as const;

// Business Logic Constants
export const ASSESSMENT_CONFIG = {
  PILLAR_CODES: ['C', 'O', 'R', 'T', 'E', 'X'] as const,
  PILLAR_NAMES: {
    C: 'Clarity & Command',
    O: 'Operations & Data',
    R: 'Risk, Trust & Security',
    T: 'Talent & Culture',
    E: 'Ecosystem & Infrastructure',
    X: 'Experimentation & Evolution'
  },
  
  // Score ranges
  SCORE_RANGES: {
    MIN: 0,
    MAX: 3,
    WEAK_THRESHOLD: 2
  },
  
  // Context profile ranges
  CONTEXT_RANGES: {
    MIN: 0,
    MAX: 4,
    HIGH_THRESHOLD: 3
  }
} as const;

// Error Messages for Users (no technical details)
export const USER_ERROR_MESSAGES = {
  VALIDATION_ERROR: 'Please check your input and try again',
  NOT_FOUND: 'The requested information could not be found',
  SERVER_ERROR: 'We are experiencing technical difficulties. Please try again shortly',
  NETWORK_ERROR: 'Connection problem. Please check your internet connection',
  TIMEOUT_ERROR: 'Request timed out. Please try again',
  RATE_LIMIT_ERROR: 'Too many requests. Please wait a moment before trying again'
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;