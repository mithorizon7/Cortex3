import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  DatabaseError, 
  DatabaseErrorType, 
  detectDatabaseErrorType, 
  categorizeDatabaseError,
  withDatabaseErrorHandling
} from '../../server/utils/database-errors'
import { HTTP_STATUS } from '../../server/constants'

// Mock the logger
vi.mock('../../server/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
}))

describe('Database Error Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('DatabaseError class', () => {
    it('should create database error with all properties', () => {
      const originalError = new Error('Original error')
      const dbError = new DatabaseError(
        DatabaseErrorType.CONNECTION_ERROR,
        'Database connection failed',
        'Unable to connect to database',
        HTTP_STATUS.SERVICE_UNAVAILABLE,
        originalError
      )

      expect(dbError.name).toBe('DatabaseError')
      expect(dbError.type).toBe(DatabaseErrorType.CONNECTION_ERROR)
      expect(dbError.message).toBe('Database connection failed')
      expect(dbError.userMessage).toBe('Unable to connect to database')
      expect(dbError.statusCode).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE)
      expect(dbError.originalError).toBe(originalError)
    })

    it('should create database error without original error', () => {
      const dbError = new DatabaseError(
        DatabaseErrorType.NOT_FOUND,
        'Resource not found',
        'The requested resource was not found',
        HTTP_STATUS.NOT_FOUND
      )

      expect(dbError.originalError).toBeUndefined()
    })
  })

  describe('detectDatabaseErrorType', () => {
    it('should detect connection errors', () => {
      const connectionErrors = [
        { message: 'connection refused', code: '' },
        { message: 'Failed to connect to database', code: '' },
        { message: '', code: 'ECONNREFUSED' },
        { message: '', code: 'ENOTFOUND' },
        { message: '', code: 'ETIMEDOUT' }
      ]

      connectionErrors.forEach(error => {
        expect(detectDatabaseErrorType(error)).toBe(DatabaseErrorType.CONNECTION_ERROR)
      })
    })

    it('should detect timeout errors', () => {
      const timeoutErrors = [
        { message: 'operation timed out', code: '' },
        { message: 'Query timeout occurred', code: '' },
        { message: '', code: 'ETIMEOUT' }
      ]

      timeoutErrors.forEach(error => {
        expect(detectDatabaseErrorType(error)).toBe(DatabaseErrorType.TIMEOUT_ERROR)
      })
    })

    it('should detect constraint violations', () => {
      const constraintErrors = [
        { message: '', code: '23505' }, // unique_violation
        { message: '', code: '23503' }, // foreign_key_violation
        { message: '', code: '23502' }, // not_null_violation
        { message: '', code: '23514' }, // check_violation
        { message: 'unique constraint violation', code: '' },
        { message: 'foreign key constraint', code: '' },
        { message: 'violates unique constraint', code: '' }
      ]

      constraintErrors.forEach(error => {
        expect(detectDatabaseErrorType(error)).toBe(DatabaseErrorType.CONSTRAINT_VIOLATION)
      })
    })

    it('should detect transaction conflicts', () => {
      const transactionErrors = [
        { message: '', code: '40001' }, // serialization_failure
        { message: '', code: '40P01' }, // deadlock_detected
        { message: 'deadlock detected', code: '' },
        { message: 'serialization failure', code: '' }
      ]

      transactionErrors.forEach(error => {
        expect(detectDatabaseErrorType(error)).toBe(DatabaseErrorType.TRANSACTION_CONFLICT)
      })
    })

    it('should detect not found errors', () => {
      const notFoundError = { message: 'record not found', code: '' }
      expect(detectDatabaseErrorType(notFoundError)).toBe(DatabaseErrorType.NOT_FOUND)
    })

    it('should return unknown for unrecognized errors', () => {
      const unknownErrors = [
        { message: 'some random error', code: '' },
        { message: '', code: 'UNKNOWN_CODE' },
        { message: undefined, code: undefined }
      ]

      unknownErrors.forEach(error => {
        expect(detectDatabaseErrorType(error)).toBe(DatabaseErrorType.UNKNOWN)
      })
    })
  })

  describe('categorizeDatabaseError', () => {
    it('should categorize connection errors correctly', () => {
      const connectionError = new Error('Connection refused')
      connectionError.name = 'ECONNREFUSED'
      
      const dbError = categorizeDatabaseError(connectionError)
      
      expect(dbError.type).toBe(DatabaseErrorType.CONNECTION_ERROR)
      expect(dbError.statusCode).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE)
      expect(dbError.userMessage).toContain('Unable to connect to the database')
      expect(dbError.originalError).toBe(connectionError)
    })

    it('should categorize timeout errors correctly', () => {
      const timeoutError = new Error('Query timed out')
      
      const dbError = categorizeDatabaseError(timeoutError)
      
      expect(dbError.type).toBe(DatabaseErrorType.TIMEOUT_ERROR)
      expect(dbError.statusCode).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE)
      expect(dbError.userMessage).toContain('took too long to process')
    })

    it('should categorize constraint violations correctly', () => {
      const constraintError = new Error('Unique constraint violation')
      
      const dbError = categorizeDatabaseError(constraintError)
      
      expect(dbError.type).toBe(DatabaseErrorType.CONSTRAINT_VIOLATION)
      expect(dbError.statusCode).toBe(HTTP_STATUS.CONFLICT)
      expect(dbError.userMessage).toContain('conflicts with existing records')
    })

    it('should categorize transaction conflicts correctly', () => {
      const transactionError = new Error('Deadlock detected')
      
      const dbError = categorizeDatabaseError(transactionError)
      
      expect(dbError.type).toBe(DatabaseErrorType.TRANSACTION_CONFLICT)
      expect(dbError.statusCode).toBe(HTTP_STATUS.CONFLICT)
      expect(dbError.userMessage).toContain('conflict occurred')
    })

    it('should categorize not found errors correctly', () => {
      const notFoundError = new Error('Record not found')
      
      const dbError = categorizeDatabaseError(notFoundError)
      
      expect(dbError.type).toBe(DatabaseErrorType.NOT_FOUND)
      expect(dbError.statusCode).toBe(HTTP_STATUS.NOT_FOUND)
      expect(dbError.userMessage).toContain('was not found')
    })

    it('should categorize unknown errors correctly', () => {
      const unknownError = new Error('Some random database error')
      
      const dbError = categorizeDatabaseError(unknownError)
      
      expect(dbError.type).toBe(DatabaseErrorType.UNKNOWN)
      expect(dbError.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      expect(dbError.userMessage).toContain('try again later')
    })
  })

  describe('withDatabaseErrorHandling', () => {
    it('should execute function successfully without error handling', async () => {
      const mockFn = vi.fn().mockResolvedValue('success')
      
      const result = await withDatabaseErrorHandling('test-operation', mockFn)
      
      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should catch and categorize database errors', async () => {
      const originalError = new Error('Connection refused')
      const mockFn = vi.fn().mockRejectedValue(originalError)
      
      await expect(withDatabaseErrorHandling('test-operation', mockFn))
        .rejects.toBeInstanceOf(DatabaseError)
      
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should log appropriate level for service errors', async () => {
      const { logger } = await import('../../server/logger')
      const connectionError = new Error('Connection refused')
      const mockFn = vi.fn().mockRejectedValue(connectionError)
      
      await expect(withDatabaseErrorHandling('test-operation', mockFn))
        .rejects.toBeInstanceOf(DatabaseError)
      
      expect(logger.warn).toHaveBeenCalledWith(
        'Database service error: test-operation',
        expect.objectContaining({
          additionalContext: expect.objectContaining({
            operation: 'test-operation',
            type: DatabaseErrorType.CONNECTION_ERROR
          })
        })
      )
    })

    it('should log appropriate level for application errors', async () => {
      const { logger } = await import('../../server/logger')
      const constraintError = new Error('Unique constraint violation')
      const mockFn = vi.fn().mockRejectedValue(constraintError)
      
      await expect(withDatabaseErrorHandling('test-operation', mockFn))
        .rejects.toBeInstanceOf(DatabaseError)
      
      expect(logger.error).toHaveBeenCalledWith(
        'Database error: test-operation',
        expect.any(Error),
        expect.objectContaining({
          additionalContext: expect.objectContaining({
            operation: 'test-operation',
            type: DatabaseErrorType.CONSTRAINT_VIOLATION
          })
        })
      )
    })

    it('should include context information in logs', async () => {
      const { logger } = await import('../../server/logger')
      const error = new Error('Test error')
      const mockFn = vi.fn().mockRejectedValue(error)
      
      const context = {
        functionArgs: { id: 'test-id' },
        requestBody: { data: 'test' },
        userId: 'user-123',
        requestId: 'req-456'
      }
      
      await expect(withDatabaseErrorHandling('test-operation', mockFn, context))
        .rejects.toBeInstanceOf(DatabaseError)
      
      expect(logger.error).toHaveBeenCalledWith(
        'Database error: test-operation',
        expect.any(Error),
        expect.objectContaining({
          additionalContext: expect.objectContaining({
            userId: 'user-123',
            requestId: 'req-456',
            hasFunctionArgs: true,
            hasRequestBody: true
          })
        })
      )
    })

    it('should track operation duration', async () => {
      const { logger } = await import('../../server/logger')
      const error = new Error('Test error')
      const mockFn = vi.fn().mockRejectedValue(error)
      
      await expect(withDatabaseErrorHandling('test-operation', mockFn))
        .rejects.toBeInstanceOf(DatabaseError)
      
      expect(logger.error).toHaveBeenCalledWith(
        'Database error: test-operation',
        expect.any(Error),
        expect.objectContaining({
          additionalContext: expect.objectContaining({
            duration: expect.any(Number)
          })
        })
      )
    })
  })
})