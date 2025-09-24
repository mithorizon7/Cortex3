import { describe, it, expect, vi, beforeEach } from 'vitest'
import { executeWithRetry, EXTERNAL_API_RETRY_CONFIG, DATABASE_RETRY_CONFIG } from '../../server/utils/retry'

// Mock the logger
vi.mock('../../server/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
}))

// Mock generateIncidentId
vi.mock('../../server/utils/incident', () => ({
  generateIncidentId: vi.fn(() => 'INC-2025-TEST1234')
}))

describe('Retry Utility (Simplified)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('executeWithRetry', () => {
    it('should succeed on first attempt when operation succeeds', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success')
      
      const result = await executeWithRetry('test-operation', mockOperation)
      
      expect(result).toBe('success')
      expect(mockOperation).toHaveBeenCalledTimes(1)
    })

    it('should not retry on non-retryable errors', async () => {
      const validationError = new Error('Validation failed: missing required field')
      const mockOperation = vi.fn().mockRejectedValue(validationError)

      await expect(executeWithRetry('test-operation', mockOperation)).rejects.toThrow('Validation failed')
      expect(mockOperation).toHaveBeenCalledTimes(1)
    })

    it('should identify retryable error patterns correctly', async () => {
      const retryableErrors = [
        new Error('Network error occurred'),
        new Error('Connection timed out'),
        new Error('ECONNRESET'),
        new Error('429 Too Many Requests'),
        new Error('500 Internal Server Error'),
        new Error('502 Bad Gateway'),
        new Error('503 Service Unavailable'),
        new Error('504 Gateway Timeout')
      ]
      
      for (const error of retryableErrors) {
        const mockOperation = vi.fn()
          .mockRejectedValueOnce(error)
          .mockResolvedValue('success')
        
        const config = { baseDelay: 1, maxDelay: 10 }
        const result = await executeWithRetry('test-operation', mockOperation, config)
        expect(result).toBe('success')
        expect(mockOperation).toHaveBeenCalledTimes(2) // Should have retried
        
        vi.clearAllMocks()
      }
    })

    it('should not retry non-retryable error patterns', async () => {
      const nonRetryableErrors = [
        new Error('Validation failed'),
        new Error('401 Unauthorized'),
        new Error('403 Forbidden'),
        new Error('404 Not Found'),
        new Error('400 Bad Request')
      ]
      
      for (const error of nonRetryableErrors) {
        const mockOperation = vi.fn().mockRejectedValue(error)
        
        await expect(executeWithRetry('test-operation', mockOperation)).rejects.toThrow()
        expect(mockOperation).toHaveBeenCalledTimes(1) // Should not have retried
        
        vi.clearAllMocks()
      }
    })
  })

  describe('Predefined Configurations', () => {
    it('should have appropriate API retry configuration', () => {
      expect(EXTERNAL_API_RETRY_CONFIG.maxAttempts).toBe(3)
      expect(EXTERNAL_API_RETRY_CONFIG.baseDelay).toBe(2000)
      expect(EXTERNAL_API_RETRY_CONFIG.maxDelay).toBe(30000)
      expect(EXTERNAL_API_RETRY_CONFIG.jitterFactor).toBe(0.2)
    })

    it('should have appropriate database retry configuration', () => {
      expect(DATABASE_RETRY_CONFIG.maxAttempts).toBe(2)
      expect(DATABASE_RETRY_CONFIG.baseDelay).toBe(500)
      expect(DATABASE_RETRY_CONFIG.maxDelay).toBe(5000)
      expect(DATABASE_RETRY_CONFIG.jitterFactor).toBe(0.1)
    })
  })
})