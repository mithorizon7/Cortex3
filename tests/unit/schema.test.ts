import { describe, it, expect } from 'vitest'
import { 
  contextProfileSchema, 
  pulseResponsesSchema, 
  pillarScoresSchema,
  insertAssessmentSchema 
} from '../../shared/schema'

describe('Schema Validation', () => {
  describe('contextProfileSchema', () => {
    it('should validate valid context profile', () => {
      const validProfile = {
        regulatory_intensity: 2,
        data_sensitivity: 3,
        safety_criticality: 1,
        brand_exposure: 2,
        clock_speed: 3,
        latency_edge: 1,
        scale_throughput: 2,
        data_advantage: 2,
        build_readiness: 3,
        finops_priority: 2,
        procurement_constraints: false,
        edge_operations: true,
      }

      const result = contextProfileSchema.safeParse(validProfile)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validProfile)
      }
    })

    it('should reject profile with out-of-range values', () => {
      const invalidProfile = {
        regulatory_intensity: 10, // Max is 4
        data_sensitivity: -1, // Min is 0
        safety_criticality: 1,
        brand_exposure: 2,
        clock_speed: 3,
        latency_edge: 1,
        scale_throughput: 2,
        data_advantage: 2,
        build_readiness: 3,
        finops_priority: 2,
        procurement_constraints: false,
        edge_operations: true,
      }

      const result = contextProfileSchema.safeParse(invalidProfile)
      expect(result.success).toBe(false)
    })

    it('should reject profile with missing required fields', () => {
      const incompleteProfile = {
        regulatory_intensity: 2,
        // Missing other required fields
      }

      const result = contextProfileSchema.safeParse(incompleteProfile)
      expect(result.success).toBe(false)
    })

    it('should reject profile with wrong data types', () => {
      const invalidTypeProfile = {
        regulatory_intensity: '2', // Should be number
        data_sensitivity: 3,
        safety_criticality: 1,
        brand_exposure: 2,
        clock_speed: 3,
        latency_edge: 1,
        scale_throughput: 2,
        data_advantage: 2,
        build_readiness: 3,
        finops_priority: 2,
        procurement_constraints: 'false', // Should be boolean
        edge_operations: true,
      }

      const result = contextProfileSchema.safeParse(invalidTypeProfile)
      expect(result.success).toBe(false)
    })
  })

  describe('pulseResponsesSchema', () => {
    it('should validate valid pulse responses', () => {
      const validResponses = {
        'C1': true,
        'C2': false,
        'O1': true,
        'R1': false,
      }

      const result = pulseResponsesSchema.safeParse(validResponses)
      expect(result.success).toBe(true)
    })

    it('should reject non-boolean values', () => {
      const invalidResponses = {
        'C1': 'yes', // Should be boolean
        'C2': false,
      }

      const result = pulseResponsesSchema.safeParse(invalidResponses)
      expect(result.success).toBe(false)
    })

    it('should allow empty responses object', () => {
      const result = pulseResponsesSchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })

  describe('pillarScoresSchema', () => {
    it('should validate valid pillar scores', () => {
      const validScores = {
        C: 2,
        O: 1,
        R: 0,
        T: 3,
        E: 1,
        X: 2,
      }

      const result = pillarScoresSchema.safeParse(validScores)
      expect(result.success).toBe(true)
    })

    it('should reject scores out of range', () => {
      const invalidScores = {
        C: 5, // Max is 3
        O: -1, // Min is 0
        R: 0,
        T: 3,
        E: 1,
        X: 2,
      }

      const result = pillarScoresSchema.safeParse(invalidScores)
      expect(result.success).toBe(false)
    })

    it('should reject missing pillar scores', () => {
      const incompleteScores = {
        C: 2,
        O: 1,
        // Missing other pillars
      }

      const result = pillarScoresSchema.safeParse(incompleteScores)
      expect(result.success).toBe(false)
    })
  })

  describe('insertAssessmentSchema', () => {
    it('should validate valid assessment data for insertion', () => {
      const validData = {
        contextProfile: {
          regulatory_intensity: 2,
          data_sensitivity: 3,
          safety_criticality: 1,
          brand_exposure: 2,
          clock_speed: 3,
          latency_edge: 1,
          scale_throughput: 2,
          data_advantage: 2,
          build_readiness: 3,
          finops_priority: 2,
          procurement_constraints: false,
          edge_operations: true,
        },
        pulseResponses: null,
        pillarScores: null,
        triggeredGates: null,
        priorityMoves: null,
        contentTags: null,
        contextGuidance: null,
        completedAt: null,
      }

      const result = insertAssessmentSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should not allow id or createdAt in insert data', () => {
      const dataWithForbiddenFields = {
        id: 'some-id', // Should be omitted
        createdAt: '2025-01-01T00:00:00.000Z', // Should be omitted
        contextProfile: {},
        pulseResponses: null,
        pillarScores: null,
        triggeredGates: null,
        priorityMoves: null,
        contentTags: null,
        contextGuidance: null,
        completedAt: null,
      }

      // Schema should omit these fields, so parsing should succeed
      // but the result shouldn't contain id or createdAt
      const result = insertAssessmentSchema.safeParse(dataWithForbiddenFields)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).not.toHaveProperty('id')
        expect(result.data).not.toHaveProperty('createdAt')
      }
    })
  })
})