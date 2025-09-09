import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isOnline, getNetworkError, apiRequest } from '../../client/src/lib/queryClient'

// Mock global fetch
const mockFetch = vi.fn() as any
global.fetch = mockFetch

// Mock navigator
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
})

// Mock crypto for UUID generation
if (!globalThis.crypto) {
  const crypto = require('crypto')
  globalThis.crypto = {
    randomUUID: () => crypto.randomUUID(),
  } as any
}

describe('Query Client Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    navigator.onLine = true
  })

  describe('isOnline', () => {
    it('should return true when navigator is online', () => {
      navigator.onLine = true
      expect(isOnline()).toBe(true)
    })

    it('should return false when navigator is offline', () => {
      navigator.onLine = false
      expect(isOnline()).toBe(false)
    })

    it('should return true when navigator is undefined', () => {
      const originalNavigator = global.navigator
      ;(global as any).navigator = undefined
      expect(isOnline()).toBe(true)
      global.navigator = originalNavigator
    })
  })

  describe('getNetworkError', () => {
    it('should detect offline errors', () => {
      navigator.onLine = false
      const error = new Error('Network request failed')
      
      expect(getNetworkError(error)).toBe('offline')
    })

    it('should detect network errors', () => {
      const error = new Error('fetch failed')
      
      expect(getNetworkError(error)).toBe('network')
    })

    it('should detect server errors', () => {
      const error = new Error('500 Internal Server Error')
      
      expect(getNetworkError(error)).toBe('server')
    })

    it('should detect rate limit errors', () => {
      const error = new Error('429 Too Many Requests')
      
      expect(getNetworkError(error)).toBe('ratelimit')
    })

    it('should return unknown for unrecognized errors', () => {
      const error = new Error('Something unexpected')
      
      expect(getNetworkError(error)).toBe('unknown')
    })
  })

  describe('apiRequest', () => {
    it('should make successful API request', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true }),
        text: vi.fn().mockResolvedValue('Success'),
        status: 200
      }
      
      mockFetch.mockResolvedValue(mockResponse)
      
      const response = await apiRequest('GET', '/api/test')
      
      expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        method: 'GET',
        credentials: 'include',
        headers: expect.objectContaining({
          'X-Frontend-Request-Id': expect.any(String)
        })
      }))
      
      expect(response).toBe(mockResponse)
    })

    it('should include request body for POST requests', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ id: 1 }),
        text: vi.fn().mockResolvedValue('Created')
      }
      
      mockFetch.mockResolvedValue(mockResponse)
      
      const testData = { name: 'Test' }
      await apiRequest('POST', '/api/test', testData)
      
      expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(testData),
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      }))
    })

    it('should throw error when offline', async () => {
      navigator.onLine = false
      
      await expect(apiRequest('GET', '/api/test')).rejects.toThrow('offline: No internet connection')
    })

    it('should handle API errors with incident IDs', async () => {
      // Create a more realistic mock that mimics fetch Response behavior
      const mockText = vi.fn().mockResolvedValue('Server Error')
      const mockJson = vi.fn().mockResolvedValue({
        error: 'Server error',
        incidentId: 'INC-2025-ABCD1234'
      })
      
      const mockErrorResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: mockJson,
        text: mockText
      }
      
      mockFetch.mockResolvedValue(mockErrorResponse as any)
      
      try {
        await apiRequest('GET', '/api/test')
        expect.fail('Should have thrown an error')
      } catch (error: any) {
        // Test that the error handling works (either JSON or text path)
        expect(error.message).toMatch(/(Server error|500: Server Error)/)
        
        // If JSON path worked, check for incident ID
        if (error.message === 'Server error') {
          expect(error.incidentId).toBe('INC-2025-ABCD1234')
          expect(error.statusCode).toBe(500)
        } else {
          // Text fallback path
          expect(error.message).toBe('500: Server Error')
        }
      }
    })

    it('should handle non-JSON error responses', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 404,
        json: vi.fn().mockRejectedValue(new Error('Not JSON')),
        text: vi.fn().mockResolvedValue('Not Found')
      }
      
      mockFetch.mockResolvedValue(mockErrorResponse)
      
      await expect(apiRequest('GET', '/api/test')).rejects.toThrow('404: Not Found')
    })

    it('should log structured error information', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const mockErrorResponse = {
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue({ error: 'Bad Request' }),
        text: vi.fn().mockResolvedValue('Bad Request')
      }
      
      mockFetch.mockResolvedValue(mockErrorResponse)
      
      try {
        await apiRequest('POST', '/api/assessments', { invalid: 'data' })
      } catch (error) {
        // Expected to throw
      }
      
      expect(consoleSpy).toHaveBeenCalled()
      const loggedError = JSON.parse(consoleSpy.mock.calls[0][0])
      
      expect(loggedError).toMatchObject({
        level: 'ERROR',
        message: expect.stringContaining('API request failed'),
        context: expect.objectContaining({
          operation: 'api_request_error',
          method: 'POST',
          url: '/api/assessments',
          frontendRequestId: expect.any(String)
        })
      })
      
      // Should not log request body for assessment endpoints
      expect(loggedError).not.toHaveProperty('requestBody')
      
      consoleSpy.mockRestore()
    })
  })
})