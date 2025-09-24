import { describe, it, expect, beforeEach, vi } from 'vitest'
import { withDatabaseErrorHandling, DatabaseError } from '../../server/utils/database-errors'
import { executeWithRetry } from '../../server/utils/retry'

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

describe('Error Handling Utilities Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('withDatabaseErrorHandling Integration', () => {
    it('should handle successful database operations', async () => {
      const mockOperation = vi.fn().mockResolvedValue({ id: 'test-id', name: 'test' })
      
      const result = await withDatabaseErrorHandling(
        'test_operation',
        mockOperation
      )
      
      expect(result).toEqual({ id: 'test-id', name: 'test' })
      expect(mockOperation).toHaveBeenCalledTimes(1)
      // Database error handling doesn't pass context to the operation
      expect(mockOperation).toHaveBeenCalledWith()
    })

    it('should handle database errors with proper categorization', async () => {
      const connectionError = new Error('Connection refused')
      const mockOperation = vi.fn().mockRejectedValue(connectionError)
      
      await expect(withDatabaseErrorHandling('test_operation', mockOperation))
        .rejects.toThrow(DatabaseError)
      
      expect(mockOperation).toHaveBeenCalledTimes(1)
    })

    it('should use context information for logging without passing to operation', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success')
      const context = {
        functionArgs: { id: 'test-id' },
        userId: 'user-123',
        requestId: 'req-456'
      }
      
      const result = await withDatabaseErrorHandling('test_operation', mockOperation, context)
      
      expect(result).toBe('success')
      expect(mockOperation).toHaveBeenCalledTimes(1)
      // Context is used for logging, not passed to operation
      expect(mockOperation).toHaveBeenCalledWith()
    })

    it('should categorize database errors but not automatically retry', async () => {
      const networkError = new Error('ECONNRESET: connection reset by peer')
      const mockOperation = vi.fn().mockRejectedValue(networkError)
      
      await expect(withDatabaseErrorHandling('test_operation', mockOperation))
        .rejects.toThrow(DatabaseError)
      
      expect(mockOperation).toHaveBeenCalledTimes(1)
      // withDatabaseErrorHandling categorizes errors but doesn't retry
    })

    it('should not retry on non-retryable errors', async () => {
      const validationError = new Error('Validation failed: required field missing')
      const mockOperation = vi.fn().mockRejectedValue(validationError)
      
      await expect(withDatabaseErrorHandling('test_operation', mockOperation))
        .rejects.toThrow(DatabaseError)
      
      expect(mockOperation).toHaveBeenCalledTimes(1)
    })
  })

  describe('executeWithRetry Integration', () => {
    it('should execute operations with proper context', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success')
      
      const result = await executeWithRetry('test_operation', mockOperation)
      
      expect(result).toBe('success')
      expect(mockOperation).toHaveBeenCalledWith(expect.objectContaining({
        operation: 'test_operation',
        incidentId: 'INC-2025-TEST1234',
        attempt: 1,
        maxAttempts: 3
      }))
    })

    it('should retry retryable operations', async () => {
      const networkError = new Error('502 Bad Gateway')
      const mockOperation = vi.fn()
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue('success')
      
      const config = { baseDelay: 1, maxDelay: 10 }
      const result = await executeWithRetry('test_operation', mockOperation, config)
      
      expect(result).toBe('success')
      expect(mockOperation).toHaveBeenCalledTimes(2)
    })

    it('should not retry non-retryable operations', async () => {
      const validationError = new Error('Invalid input format')
      const mockOperation = vi.fn().mockRejectedValue(validationError)
      
      await expect(executeWithRetry('test_operation', mockOperation))
        .rejects.toThrow('Invalid input format')
      
      expect(mockOperation).toHaveBeenCalledTimes(1)
    })

    it('should respect maximum retry attempts', async () => {
      const networkError = new Error('Connection timed out')
      const mockOperation = vi.fn().mockRejectedValue(networkError)
      
      const config = { maxAttempts: 2, baseDelay: 1, maxDelay: 10 }
      await expect(executeWithRetry('test_operation', mockOperation, config))
        .rejects.toThrow('Connection timed out')
      
      expect(mockOperation).toHaveBeenCalledTimes(2)
    })
  })

  describe('Combined Error Handling and Retry Integration', () => {
    it('should work together in nested scenarios', async () => {
      // Simulate a database operation that uses retry internally
      const innerOperation = vi.fn()
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValue('inner_success')
      
      const databaseOperation = vi.fn().mockImplementation(async () => {
        return await executeWithRetry('inner_operation', innerOperation, { baseDelay: 1, maxDelay: 10 })
      })
      
      const result = await withDatabaseErrorHandling('outer_operation', databaseOperation)
      
      expect(result).toBe('inner_success')
      expect(databaseOperation).toHaveBeenCalledTimes(1)
      expect(innerOperation).toHaveBeenCalledTimes(2) // One failure, one success
    })

    it('should handle error propagation correctly', async () => {
      const databaseError = new Error('Connection refused')
      const innerOperation = vi.fn().mockRejectedValue(databaseError)
      
      const databaseOperation = vi.fn().mockImplementation(async () => {
        return await executeWithRetry('inner_operation', innerOperation, { 
          maxAttempts: 1, 
          baseDelay: 1, 
          maxDelay: 10 
        })
      })
      
      await expect(withDatabaseErrorHandling('outer_operation', databaseOperation))
        .rejects.toThrow(DatabaseError)
      
      expect(databaseOperation).toHaveBeenCalledTimes(1)
      expect(innerOperation).toHaveBeenCalledTimes(1)
    })

    it('should maintain proper logging context across operations', async () => {
      const { logger } = await import('../../server/logger')
      const loggerError = vi.mocked(logger.error)
      
      const networkError = new Error('Network failure')
      const failingOperation = vi.fn().mockRejectedValue(networkError)
      
      await expect(withDatabaseErrorHandling('test_operation', failingOperation, {
        functionArgs: { id: 'test-123' },
        userId: 'user-456'
      })).rejects.toThrow(DatabaseError)
      
      expect(loggerError).toHaveBeenCalledWith(
        'Database error: test_operation',
        expect.any(Error),
        expect.objectContaining({
          additionalContext: expect.objectContaining({
            operation: 'test_operation',
            userId: 'user-456'
          })
        })
      )
    })
  })
})