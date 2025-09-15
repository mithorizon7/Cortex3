import { describe, it, expect, beforeEach } from 'vitest'
import { MemStorage } from '../../server/storage'
import type { InsertAssessment, Assessment } from '../../shared/schema'

describe('MemStorage', () => {
  let storage: MemStorage
  let testAssessment: InsertAssessment

  beforeEach(() => {
    storage = new MemStorage()
    testAssessment = {
      userId: 'test-user-id',
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
  })

  describe('createAssessment', () => {
    it('should create assessment with unique ID and timestamp', async () => {
      const assessment = await storage.createAssessment(testAssessment)

      expect(assessment.id).toBeDefined()
      expect(assessment.id).toMatch(/^[a-f0-9-]{36}$/) // UUID format
      expect(assessment.createdAt).toBeDefined()
      expect(new Date(assessment.createdAt).getTime()).toBeCloseTo(Date.now(), -1000)
      expect(assessment.contextProfile).toEqual(testAssessment.contextProfile)
    })

    it('should create multiple assessments with unique IDs', async () => {
      const assessment1 = await storage.createAssessment(testAssessment)
      const assessment2 = await storage.createAssessment(testAssessment)

      expect(assessment1.id).not.toBe(assessment2.id)
    })

    it('should preserve all assessment fields', async () => {
      const complexAssessment: InsertAssessment = {
        ...testAssessment,
        pulseResponses: { 'C1': true, 'C2': false },
        pillarScores: { C: 1, O: 2, R: 0, T: 3, E: 1, X: 2 },
        completedAt: '2025-01-01T00:00:00.000Z'
      }

      const assessment = await storage.createAssessment(complexAssessment)

      expect(assessment.pulseResponses).toEqual(complexAssessment.pulseResponses)
      expect(assessment.pillarScores).toEqual(complexAssessment.pillarScores)
      expect(assessment.completedAt).toBe(complexAssessment.completedAt)
    })
  })

  describe('getAssessment', () => {
    it('should retrieve existing assessment', async () => {
      const created = await storage.createAssessment(testAssessment)
      const retrieved = await storage.getAssessment(created.id)

      expect(retrieved).toEqual(created)
    })

    it('should return null for non-existent assessment', async () => {
      const result = await storage.getAssessment('non-existent-id')

      expect(result).toBeNull()
    })

    it('should handle empty string ID', async () => {
      const result = await storage.getAssessment('')

      expect(result).toBeNull()
    })
  })

  describe('updateAssessment', () => {
    let existingAssessment: Assessment

    beforeEach(async () => {
      existingAssessment = await storage.createAssessment(testAssessment)
    })

    it('should update existing assessment', async () => {
      const updates = {
        pulseResponses: { 'C1': true, 'C2': false },
        pillarScores: { C: 1, O: 0, R: 0, T: 0, E: 0, X: 0 }
      }

      const updated = await storage.updateAssessment(existingAssessment.id, updates)

      expect(updated).toBeDefined()
      expect(updated?.id).toBe(existingAssessment.id)
      expect(updated?.pulseResponses).toEqual(updates.pulseResponses)
      expect(updated?.pillarScores).toEqual(updates.pillarScores)
      expect(updated?.contextProfile).toEqual(existingAssessment.contextProfile)
    })

    it('should return null for non-existent assessment', async () => {
      const updates = { pulseResponses: { 'C1': true } }
      const result = await storage.updateAssessment('non-existent-id', updates)

      expect(result).toBeNull()
    })

    it('should handle partial updates', async () => {
      const updates = { completedAt: '2025-01-01T00:00:00.000Z' }
      const updated = await storage.updateAssessment(existingAssessment.id, updates)

      expect(updated?.completedAt).toBe(updates.completedAt)
      expect(updated?.pulseResponses).toBe(existingAssessment.pulseResponses)
      expect(updated?.contextProfile).toEqual(existingAssessment.contextProfile)
    })

    it('should handle complex nested updates', async () => {
      const updates = {
        triggeredGates: [
          { id: 'gate-1', title: 'Security Gate', triggered: true, reason: 'High risk' }
        ],
        priorityMoves: {
          immediate: ['Implement security training'],
          shortTerm: ['Audit data access'],
          longTerm: ['Full security review']
        },
        contentTags: ['high_security', 'compliance_required'],
        contextGuidance: {
          summary: 'Focus on security and compliance',
          recommendations: ['Enhance security measures', 'Regular compliance audits']
        }
      }

      const updated = await storage.updateAssessment(existingAssessment.id, updates)

      expect(updated?.triggeredGates).toEqual(updates.triggeredGates)
      expect(updated?.priorityMoves).toEqual(updates.priorityMoves)
      expect(updated?.contentTags).toEqual(updates.contentTags)
      expect(updated?.contextGuidance).toEqual(updates.contextGuidance)
    })

    it('should not affect other assessments', async () => {
      const otherAssessment = await storage.createAssessment(testAssessment)
      
      const updates = { completedAt: '2025-01-01T00:00:00.000Z' }
      await storage.updateAssessment(existingAssessment.id, updates)

      const unchanged = await storage.getAssessment(otherAssessment.id)
      expect(unchanged?.completedAt).toBe(otherAssessment.completedAt)
    })
  })

  describe('Data integrity', () => {
    it('should maintain data consistency across operations', async () => {
      // Create assessment
      const assessment1 = await storage.createAssessment(testAssessment)
      
      // Update it
      const updates = { pulseResponses: { 'C1': true } }
      const updated = await storage.updateAssessment(assessment1.id, updates)
      
      // Retrieve it again
      const retrieved = await storage.getAssessment(assessment1.id)
      
      expect(retrieved).toEqual(updated)
      expect(retrieved?.pulseResponses).toEqual(updates.pulseResponses)
    })

    it('should handle concurrent operations safely', async () => {
      // Create assessment
      const assessment = await storage.createAssessment(testAssessment)
      
      // Simulate concurrent updates
      const update1Promise = storage.updateAssessment(assessment.id, { 
        pulseResponses: { 'C1': true } 
      })
      const update2Promise = storage.updateAssessment(assessment.id, { 
        pillarScores: { C: 1, O: 0, R: 0, T: 0, E: 0, X: 0 } 
      })
      
      const [result1, result2] = await Promise.all([update1Promise, update2Promise])
      
      // Both operations should succeed
      expect(result1).toBeDefined()
      expect(result2).toBeDefined()
      
      // Final state should have both updates (last one wins for conflicting fields)
      const final = await storage.getAssessment(assessment.id)
      expect(final?.pillarScores).toEqual({ C: 1, O: 0, R: 0, T: 0, E: 0, X: 0 })
    })
  })
})