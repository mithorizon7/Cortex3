import { describe, it, expect } from 'vitest'
import { generateIncidentId, sanitizeErrorForUser, createUserError } from '../../server/utils/incident'

describe('Incident Utils', () => {
  describe('generateIncidentId', () => {
    it('should generate incident ID with correct format', () => {
      const incidentId = generateIncidentId()
      const currentYear = new Date().getFullYear()
      const expectedPattern = new RegExp(`^INC-${currentYear}-[A-F0-9]{8}$`)
      
      expect(incidentId).toMatch(expectedPattern)
    })

    it('should generate unique incident IDs', () => {
      const id1 = generateIncidentId()
      const id2 = generateIncidentId()
      
      expect(id1).not.toBe(id2)
    })
  })

  describe('sanitizeErrorForUser', () => {
    it('should sanitize validation errors', () => {
      const error = new Error('Validation failed: missing required field')
      const result = sanitizeErrorForUser(error)
      
      expect(result).toBe('Invalid input provided')
    })

    it('should sanitize network errors', () => {
      const error = new Error('Network request failed')
      const result = sanitizeErrorForUser(error)
      
      expect(result).toBe('Network connection error')
    })

    it('should sanitize timeout errors', () => {
      const error = new Error('Request timeout occurred')
      const result = sanitizeErrorForUser(error)
      
      expect(result).toBe('Request timed out')
    })

    it('should provide generic message for unknown errors', () => {
      const error = new Error('Some internal database constraint violation')
      const result = sanitizeErrorForUser(error)
      
      expect(result).toBe('An unexpected error occurred')
    })

    it('should handle non-Error objects', () => {
      const result = sanitizeErrorForUser('string error')
      
      expect(result).toBe('An unexpected error occurred')
    })
  })

  describe('createUserError', () => {
    it('should create user error with incident ID', () => {
      const message = 'Test error message'
      const incidentId = 'INC-2025-ABCD1234'
      const statusCode = 500
      
      const userError = createUserError(message, incidentId, statusCode)
      
      expect(userError).toEqual({
        error: message,
        incidentId,
        timestamp: expect.any(String),
        statusCode
      })
      
      // Validate timestamp format (ISO string)
      expect(new Date(userError.timestamp)).toBeInstanceOf(Date)
    })

    it('should default to 500 status code', () => {
      const userError = createUserError('test', 'INC-123')
      
      expect(userError.statusCode).toBe(500)
    })
  })
})