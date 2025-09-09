import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import { corsMiddleware, rateLimitMiddleware, securityMiddleware, sanitizationMiddleware } from '../../server/middleware/security'

describe('Security Middleware Integration', () => {
  let app: express.Application

  beforeEach(() => {
    app = express()
    vi.clearAllMocks()
  })

  describe('CORS Integration', () => {
    it('should handle CORS preflight requests', async () => {
      app.use(corsMiddleware)
      app.get('/test', (req, res) => res.json({ success: true }))

      const response = await request(app)
        .options('/test')
        .set('Origin', 'http://localhost:3000')

      expect(response.status).toBe(200)
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000')
      expect(response.headers['access-control-allow-methods']).toContain('GET')
    })

    it('should reject unauthorized origins', async () => {
      app.use(corsMiddleware)
      app.get('/test', (req, res) => res.json({ success: true }))

      const response = await request(app)
        .get('/test')
        .set('Origin', 'https://malicious-site.com')

      // Should not have CORS headers for unauthorized origin
      expect(response.headers['access-control-allow-origin']).toBeUndefined()
    })
  })

  describe('Rate Limiting Integration', () => {
    it('should allow requests within rate limit', async () => {
      app.use(rateLimitMiddleware)
      app.get('/test', (req, res) => res.json({ success: true }))

      const response = await request(app).get('/test')
      expect(response.status).toBe(200)
    })

    it('should block excessive requests from same IP', async () => {
      app.use(rateLimitMiddleware)
      app.get('/test', (req, res) => res.json({ success: true }))

      // Make sequential requests to trigger rate limit
      const responses = []
      for (let i = 0; i < 102; i++) {
        const response = await request(app).get('/test')
        responses.push(response)
        
        // Once we hit rate limit, we can stop
        if (response.status === 429) break
      }
      
      // Should have some successful responses
      const successResponses = responses.filter(r => r.status === 200)
      expect(successResponses.length).toBeGreaterThan(50)

      // Should have rate limited responses
      const rateLimitedResponses = responses.filter(r => r.status === 429)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
      
      // Rate limited responses should include incident ID
      if (rateLimitedResponses.length > 0) {
        expect(rateLimitedResponses[0].body).toHaveProperty('incidentId')
        expect(rateLimitedResponses[0].body.error).toContain('Too many requests')
      }
    }, 30000)
  })

  describe('Input Sanitization Integration', () => {
    it('should sanitize malicious input in request body', async () => {
      app.use(express.json())
      app.use(sanitizationMiddleware)
      app.post('/test', (req, res) => res.json({ received: req.body }))

      const maliciousInput = {
        name: '<script>alert("XSS")</script>John',
        bio: 'DROP TABLE users; --',
        profile: {
          description: '<img src=x onerror=alert(1)>',
          interests: ['<iframe src="evil.com"></iframe>', 'hiking']
        }
      }

      const response = await request(app)
        .post('/test')
        .send(maliciousInput)

      expect(response.status).toBe(200)
      expect(response.body.received.name).not.toContain('<script>')
      expect(response.body.received.bio).not.toContain('DROP TABLE')
      expect(response.body.received.profile.description).not.toContain('<img')
      expect(response.body.received.profile.interests[0]).not.toContain('<iframe>')
      expect(response.body.received.profile.interests[1]).toBe('hiking') // Clean input unchanged
    })

    it('should sanitize query parameters', async () => {
      app.use(sanitizationMiddleware)
      app.get('/test', (req, res) => res.json({ query: req.query }))

      const response = await request(app)
        .get('/test')
        .query({
          search: '<script>alert("XSS")</script>',
          filter: 'SELECT * FROM users',
          safe: 'normal-text'
        })

      expect(response.status).toBe(200)
      expect(response.body.query.search).not.toContain('<script>')
      expect(response.body.query.filter).not.toContain('SELECT')
      expect(response.body.query.safe).toBe('normal-text')
    })
  })

  describe('Security Headers Integration', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production'
    })

    afterEach(() => {
      process.env.NODE_ENV = 'test'
    })

    it('should set security headers in production', async () => {
      app.use(securityMiddleware)
      app.get('/test', (req, res) => res.json({ success: true }))

      const response = await request(app).get('/test')

      expect(response.headers['x-content-type-options']).toBe('nosniff')
      expect(response.headers['x-frame-options']).toBe('DENY')
      expect(response.headers['x-xss-protection']).toBe('1; mode=block')
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
      expect(response.headers['content-security-policy']).toContain("default-src 'self'")
    })

    it('should set minimal headers in development', async () => {
      process.env.NODE_ENV = 'development'
      
      app.use(securityMiddleware)
      app.get('/test', (req, res) => res.json({ success: true }))

      const response = await request(app).get('/test')

      expect(response.headers['x-content-type-options']).toBe('nosniff')
      expect(response.headers['content-security-policy']).toBeUndefined()
    })
  })

  describe('Combined Security Middleware', () => {
    it('should work together without conflicts', async () => {
      // Simple test without rate limiting to avoid issues
      const combinedApp = express()
      combinedApp.use(corsMiddleware)
      combinedApp.use(securityMiddleware)
      combinedApp.use(express.json())
      combinedApp.use(sanitizationMiddleware)
      
      combinedApp.post('/api/test', (req, res) => {
        res.json({
          body: req.body,
          headers: {
            origin: req.headers.origin
          }
        })
      })

      const response = await request(combinedApp)
        .post('/api/test')
        .set('Origin', 'http://localhost:3000')
        .send({
          message: '<script>alert("test")</script>Hello',
          data: { value: 'SELECT * FROM sensitive' }
        })

      expect(response.status).toBe(200)
      
      // CORS should work
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000')
      
      // Security headers should be set (in development, only minimal headers)
      expect(response.headers['x-content-type-options']).toBe('nosniff')
      
      // Input should be sanitized
      expect(response.body.body.message).not.toContain('<script>')
      expect(response.body.body.data.value).not.toContain('SELECT')
    })
  })
})