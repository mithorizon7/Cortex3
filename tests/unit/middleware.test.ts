import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import { requestContextMiddleware, errorHandlerMiddleware } from '../../server/middleware'
import { corsMiddleware, rateLimitMiddleware, securityMiddleware, sanitizationMiddleware } from '../../server/middleware/security'

// Mock the logger
vi.mock('../../server/logger', () => ({
  logger: {
    setContext: vi.fn(),
    clearContext: vi.fn(),
    logRequest: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  generateRequestId: () => 'test-request-id'
}))

describe('Middleware', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: NextFunction
  let headersSent: Record<string, any>

  beforeEach(() => {
    headersSent = {}
    
    mockReq = {
      ip: '127.0.0.1',
      headers: {},
      path: '/test',
      method: 'GET',
      body: {},
      query: {},
      get: vi.fn((headerName: string) => {
        if (headerName === 'User-Agent') return 'test-user-agent'
        return undefined
      })
    } as any
    
    mockRes = {
      setHeader: vi.fn((name, value) => {
        headersSent[name] = value
      }),
      json: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
      sendStatus: vi.fn().mockReturnThis(),
      on: vi.fn(),
      statusCode: 200,
    } as any
    
    mockNext = vi.fn()
    
    vi.clearAllMocks()
  })

  describe('requestContextMiddleware', () => {
    it('should add request ID and user ID to request', () => {
      requestContextMiddleware(mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockReq.requestId).toBeDefined()
      expect(mockReq.userId).toBeDefined()
      expect(mockReq.startTime).toBeDefined()
      expect(mockNext).toHaveBeenCalled()
    })

    it('should use provided user ID from header', () => {
      // Temporarily set NODE_ENV to development for this test
      const originalNodeEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      mockReq.headers!['x-user-id'] = 'custom-user'
      
      requestContextMiddleware(mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockReq.userId).toBe('custom-user')
      
      // Restore original NODE_ENV
      process.env.NODE_ENV = originalNodeEnv
    })

    it('should default to anonymous user', () => {
      requestContextMiddleware(mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockReq.userId).toBe('anonymous')
    })
  })

  describe('errorHandlerMiddleware', () => {
    it('should handle errors with proper status codes', () => {
      const error = new Error('Test error')
      
      errorHandlerMiddleware(error, mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.any(String),
        incidentId: expect.any(String),
        timestamp: expect.any(String),
        statusCode: 500
      }))
    })

    it('should use custom status from error', () => {
      const error = new Error('Not found') as any
      error.status = 404
      
      errorHandlerMiddleware(error, mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockRes.status).toHaveBeenCalledWith(404)
    })

    it('should sanitize error messages for different status codes', () => {
      const validationError = new Error('Validation failed') as any
      validationError.status = 400
      
      errorHandlerMiddleware(validationError, mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Please check your input and try again'
      }))
    })
  })

  describe('corsMiddleware', () => {
    it('should set CORS headers for allowed origins', () => {
      mockReq.headers!.origin = 'http://localhost:3000'
      
      corsMiddleware(mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://localhost:3000')
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', expect.any(String))
      expect(mockNext).toHaveBeenCalled()
    })

    it('should handle OPTIONS requests', () => {
      mockReq.method = 'OPTIONS'
      
      corsMiddleware(mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockRes.sendStatus).toHaveBeenCalledWith(200)
    })
  })

  describe('rateLimitMiddleware', () => {
    it('should allow requests within limit', () => {
      rateLimitMiddleware(mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockNext).toHaveBeenCalled()
      expect(mockRes.status).not.toHaveBeenCalled()
    })

    it('should block requests exceeding limit', () => {
      // Make requests within the same request object to simulate same IP
      for (let i = 0; i < 101; i++) {
        rateLimitMiddleware(mockReq as Request, mockRes as Response, mockNext)
      }
      
      // Should eventually hit rate limit and return 429
      expect(mockRes.status).toHaveBeenCalledWith(429)
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('Too many requests'),
        incidentId: expect.any(String)
      }))
    })
  })

  describe('securityMiddleware', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
    })

    it('should set minimal headers in development', () => {
      securityMiddleware(mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff')
      expect(mockNext).toHaveBeenCalled()
    })

    it('should set comprehensive headers in production', () => {
      process.env.NODE_ENV = 'production'
      
      securityMiddleware(mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff')
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY')
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Security-Policy', expect.any(String))
      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('sanitizationMiddleware', () => {
    it('should sanitize request body', () => {
      mockReq.body = {
        name: '<script>alert("xss")</script>John',
        description: 'DROP TABLE users;'
      }
      
      sanitizationMiddleware(mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockReq.body.name).not.toContain('<script>')
      expect(mockReq.body.description).not.toContain('DROP TABLE')
      expect(mockNext).toHaveBeenCalled()
    })

    it('should sanitize query parameters', () => {
      mockReq.query = {
        search: '<img src=x onerror=alert(1)>',
        filter: 'SELECT * FROM users'
      }
      
      sanitizationMiddleware(mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockReq.query.search).not.toContain('<img')
      expect(mockReq.query.filter).not.toContain('SELECT')
      expect(mockNext).toHaveBeenCalled()
    })

    it('should handle nested objects', () => {
      mockReq.body = {
        user: {
          name: '<script>bad</script>',
          profile: {
            bio: 'DELETE FROM users'
          }
        }
      }
      
      sanitizationMiddleware(mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockReq.body.user.name).not.toContain('<script>')
      expect(mockReq.body.user.profile.bio).not.toContain('DELETE')
    })

    it('should handle arrays', () => {
      mockReq.body = {
        tags: ['<script>alert(1)</script>', 'normal tag', 'DROP TABLE']
      }
      
      sanitizationMiddleware(mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockReq.body.tags[0]).not.toContain('<script>')
      expect(mockReq.body.tags[2]).not.toContain('DROP')
    })
  })
})