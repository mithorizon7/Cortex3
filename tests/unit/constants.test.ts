import { describe, it, expect } from 'vitest'
import { APP_CONFIG, ASSESSMENT_CONFIG, USER_ERROR_MESSAGES, HTTP_STATUS } from '../../server/constants'

describe('Constants', () => {
  describe('APP_CONFIG', () => {
    it('should have proper default port', () => {
      expect(APP_CONFIG.DEFAULT_PORT).toBe(5000)
    })

    it('should have reasonable rate limit settings', () => {
      expect(APP_CONFIG.RATE_LIMIT.windowMs).toBeGreaterThan(0)
      expect(APP_CONFIG.RATE_LIMIT.max).toBeGreaterThan(0)
    })

    it('should have proper CORS configuration', () => {
      expect(APP_CONFIG.CORS).toBeDefined()
      expect(Array.isArray(APP_CONFIG.CORS.origin)).toBe(true)
    })
  })

  describe('ASSESSMENT_CONFIG', () => {
    it('should have correct pillar codes', () => {
      const expectedPillars = ['C', 'O', 'R', 'T', 'E', 'X']
      expect(ASSESSMENT_CONFIG.PILLAR_CODES).toEqual(expectedPillars)
    })

    it('should have pillar names for all codes', () => {
      ASSESSMENT_CONFIG.PILLAR_CODES.forEach(code => {
        expect(ASSESSMENT_CONFIG.PILLAR_NAMES[code]).toBeDefined()
        expect(typeof ASSESSMENT_CONFIG.PILLAR_NAMES[code]).toBe('string')
        expect(ASSESSMENT_CONFIG.PILLAR_NAMES[code].length).toBeGreaterThan(0)
      })
    })

    it('should have valid score ranges', () => {
      expect(ASSESSMENT_CONFIG.SCORE_RANGES.MIN).toBe(0)
      expect(ASSESSMENT_CONFIG.SCORE_RANGES.MAX).toBe(3)
      expect(ASSESSMENT_CONFIG.SCORE_RANGES.WEAK_THRESHOLD).toBeLessThanOrEqual(ASSESSMENT_CONFIG.SCORE_RANGES.MAX)
    })
  })

  describe('USER_ERROR_MESSAGES', () => {
    it('should provide user-friendly error messages', () => {
      Object.values(USER_ERROR_MESSAGES).forEach(message => {
        expect(typeof message).toBe('string')
        expect(message.length).toBeGreaterThan(0)
        // Should not contain technical terms
        expect(message.toLowerCase()).not.toMatch(/(stack|trace|500|404|400)/)
      })
    })
  })

  describe('HTTP_STATUS', () => {
    it('should have standard HTTP status codes', () => {
      expect(HTTP_STATUS.OK).toBe(200)
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400)
      expect(HTTP_STATUS.NOT_FOUND).toBe(404)
      expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500)
    })
  })
})