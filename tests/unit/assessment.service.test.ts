import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AssessmentService } from '../../server/services/assessment.service'
import { storage } from '../../server/storage'

// Mock the storage module
vi.mock('../../server/storage', () => ({
  storage: {
    createAssessment: vi.fn(),
    getAssessment: vi.fn(),
    updateAssessment: vi.fn(),
  }
}))

// Mock the logger
vi.mock('../../server/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
}))

describe('AssessmentService', () => {
  let assessmentService: AssessmentService

  beforeEach(() => {
    assessmentService = new AssessmentService()
    vi.clearAllMocks()
  })

  describe('createAssessment', () => {
    it('should create assessment with valid context profile', async () => {
      const contextProfile = {
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

      const mockAssessment = {
        id: 'test-id',
        contextProfile,
        pulseResponses: null,
        pillarScores: null,
        triggeredGates: null,
        priorityMoves: null,
        contentTags: null,
        contextGuidance: null,
        completedAt: null,
        createdAt: '2025-01-01T00:00:00.000Z'
      }

      vi.mocked(storage.createAssessment).mockResolvedValue(mockAssessment)

      const result = await assessmentService.createAssessment({
        contextProfile
      })

      expect(storage.createAssessment).toHaveBeenCalledWith({
        contextProfile,
        pulseResponses: null,
        pillarScores: null,
        triggeredGates: null,
        priorityMoves: null,
        contentTags: null,
        contextGuidance: null,
        completedAt: null,
      })

      expect(result).toEqual(mockAssessment)
    })

    it('should throw validation error for invalid context profile', async () => {
      const invalidContextProfile = {
        regulatory_intensity: 10, // Invalid: max is 4
        data_sensitivity: 2,
        // Missing required fields
      }

      await expect(
        assessmentService.createAssessment({
          contextProfile: invalidContextProfile
        })
      ).rejects.toThrow()
    })
  })

  describe('getAssessment', () => {
    it('should return assessment if found', async () => {
      const mockAssessment = {
        id: 'test-id',
        contextProfile: {},
        pulseResponses: null,
        pillarScores: null,
        triggeredGates: null,
        priorityMoves: null,
        contentTags: null,
        contextGuidance: null,
        completedAt: null,
        createdAt: '2025-01-01T00:00:00.000Z'
      }

      vi.mocked(storage.getAssessment).mockResolvedValue(mockAssessment)

      const result = await assessmentService.getAssessment('test-id')

      expect(storage.getAssessment).toHaveBeenCalledWith('test-id')
      expect(result).toEqual(mockAssessment)
    })

    it('should return null if assessment not found', async () => {
      vi.mocked(storage.getAssessment).mockResolvedValue(null)

      const result = await assessmentService.getAssessment('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('updatePulseResponses', () => {
    it('should update pulse responses and calculate pillar scores', async () => {
      const pulseResponses = {
        'C1': true,
        'C2': false,
        'C3': true,
        'O1': true,
        'O2': true,
        'O3': false,
        'R1': false,
        'R2': false,
        'R3': false,
        'T1': true,
        'T2': true,
        'T3': true,
        'E1': false,
        'E2': true,
        'E3': false,
        'X1': true,
        'X2': false,
        'X3': true,
      }

      const expectedPillarScores = {
        'C': 2, // C1=true, C2=false, C3=true
        'O': 2, // O1=true, O2=true, O3=false
        'R': 0, // R1=false, R2=false, R3=false
        'T': 3, // T1=true, T2=true, T3=true
        'E': 1, // E1=false, E2=true, E3=false
        'X': 2, // X1=true, X2=false, X3=true
      }

      const mockAssessment = {
        id: 'test-id',
        contextProfile: {},
        pulseResponses,
        pillarScores: expectedPillarScores,
        triggeredGates: null,
        priorityMoves: null,
        contentTags: null,
        contextGuidance: null,
        completedAt: null,
        createdAt: '2025-01-01T00:00:00.000Z'
      }

      vi.mocked(storage.updateAssessment).mockResolvedValue(mockAssessment)

      const result = await assessmentService.updatePulseResponses('test-id', pulseResponses)

      expect(storage.updateAssessment).toHaveBeenCalledWith('test-id', {
        pulseResponses,
        pillarScores: expectedPillarScores,
      })

      expect(result).toEqual(mockAssessment)
    })

    it('should return null if assessment not found', async () => {
      vi.mocked(storage.updateAssessment).mockResolvedValue(null)

      const result = await assessmentService.updatePulseResponses('non-existent', {})

      expect(result).toBeNull()
    })

    it('should throw validation error for invalid pulse responses', async () => {
      const invalidPulseResponses = {
        'invalid_key': 'not_a_boolean',
      }

      await expect(
        assessmentService.updatePulseResponses('test-id', invalidPulseResponses)
      ).rejects.toThrow()
    })
  })

  describe('completeAssessment', () => {
    it('should complete assessment with final results', async () => {
      const mockAssessment = {
        id: 'test-id',
        contextProfile: {},
        pulseResponses: { 'C1': true },
        pillarScores: { 'C': 1, 'O': 2, 'R': 0, 'T': 3, 'E': 1, 'X': 2 },
        triggeredGates: null,
        priorityMoves: null,
        contentTags: null,
        contextGuidance: null,
        completedAt: null,
        createdAt: '2025-01-01T00:00:00.000Z'
      }

      const completedAssessment = {
        ...mockAssessment,
        triggeredGates: [],
        priorityMoves: {},
        contentTags: [],
        contextGuidance: {},
        completedAt: expect.any(String)
      }

      vi.mocked(storage.getAssessment).mockResolvedValue(mockAssessment)
      vi.mocked(storage.updateAssessment).mockResolvedValue(completedAssessment)

      const result = await assessmentService.completeAssessment('test-id')

      expect(result).toEqual(completedAssessment)
      expect(result?.completedAt).toBeDefined()
    })

    it('should return null if assessment not found', async () => {
      vi.mocked(storage.getAssessment).mockResolvedValue(null)

      const result = await assessmentService.completeAssessment('non-existent')

      expect(result).toBeNull()
    })

    it('should throw error if assessment has no pillar scores', async () => {
      const mockAssessment = {
        id: 'test-id',
        contextProfile: {},
        pulseResponses: null,
        pillarScores: null,
        triggeredGates: null,
        priorityMoves: null,
        contentTags: null,
        contextGuidance: null,
        completedAt: null,
        createdAt: '2025-01-01T00:00:00.000Z'
      }

      vi.mocked(storage.getAssessment).mockResolvedValue(mockAssessment)

      await expect(
        assessmentService.completeAssessment('test-id')
      ).rejects.toThrow('Assessment must have pulse responses before completion')
    })
  })
})