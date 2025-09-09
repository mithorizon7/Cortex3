import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import assessmentRoutes from '../../server/routes/assessments'
import { storage } from '../../server/storage'

// Mock dependencies
vi.mock('../../server/storage', () => ({
  storage: {
    createAssessment: vi.fn(),
    getAssessment: vi.fn(),
    updateAssessment: vi.fn(),
  }
}))

vi.mock('../../server/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
}))

// Mock middleware that adds requestId and userId
const mockMiddleware = (req: any, res: any, next: any) => {
  req.requestId = 'test-request-id'
  req.userId = 'test-user-id'
  next()
}

describe('Assessment Routes Integration', () => {
  let app: express.Application

  beforeEach(() => {
    app = express()
    app.use(express.json())
    app.use(mockMiddleware)
    app.use('/api/assessments', assessmentRoutes)
    
    vi.clearAllMocks()
  })

  describe('POST /api/assessments', () => {
    it('should create assessment with valid data', async () => {
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

      const response = await request(app)
        .post('/api/assessments')
        .send({ contextProfile })

      expect(response.status).toBe(201)
      expect(response.body).toEqual(mockAssessment)
    })

    it('should return 400 for invalid context profile', async () => {
      const invalidContextProfile = {
        regulatory_intensity: 10, // Invalid: max is 4
      }

      const response = await request(app)
        .post('/api/assessments')
        .send({ contextProfile: invalidContextProfile })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
      expect(response.body).toHaveProperty('incidentId')
      expect(response.body.error).toBe('Please check your input and try again')
    })

    it('should handle server errors gracefully', async () => {
      vi.mocked(storage.createAssessment).mockRejectedValue(new Error('Database error'))

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

      const response = await request(app)
        .post('/api/assessments')
        .send({ contextProfile })

      expect(response.status).toBe(500)
      expect(response.body).toHaveProperty('error')
      expect(response.body).toHaveProperty('incidentId')
      expect(response.body.error).toBe('We are experiencing technical difficulties. Please try again shortly')
    })
  })

  describe('GET /api/assessments/:id', () => {
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

      const response = await request(app)
        .get('/api/assessments/test-id')

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockAssessment)
    })

    it('should return 404 if assessment not found', async () => {
      vi.mocked(storage.getAssessment).mockResolvedValue(null)

      const response = await request(app)
        .get('/api/assessments/non-existent')

      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('error')
      expect(response.body).toHaveProperty('incidentId')
      expect(response.body.error).toBe('The requested information could not be found')
    })
  })

  describe('PATCH /api/assessments/:id/pulse', () => {
    it('should update pulse responses successfully', async () => {
      const pulseResponses = {
        'C1': true,
        'C2': false,
        'C3': true,
      }

      const mockAssessment = {
        id: 'test-id',
        contextProfile: {},
        pulseResponses,
        pillarScores: { 'C': 2, 'O': 0, 'R': 0, 'T': 0, 'E': 0, 'X': 0 },
        triggeredGates: null,
        priorityMoves: null,
        contentTags: null,
        contextGuidance: null,
        completedAt: null,
        createdAt: '2025-01-01T00:00:00.000Z'
      }

      vi.mocked(storage.updateAssessment).mockResolvedValue(mockAssessment)

      const response = await request(app)
        .patch('/api/assessments/test-id/pulse')
        .send({ pulseResponses })

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockAssessment)
    })

    it('should return 404 if assessment not found', async () => {
      vi.mocked(storage.updateAssessment).mockResolvedValue(null)

      const response = await request(app)
        .patch('/api/assessments/non-existent/pulse')
        .send({ pulseResponses: {} })

      expect(response.status).toBe(404)
    })
  })

  describe('PATCH /api/assessments/:id/complete', () => {
    it('should complete assessment successfully', async () => {
      const completedAssessment = {
        id: 'test-id',
        contextProfile: {},
        pulseResponses: { 'C1': true },
        pillarScores: { 'C': 1, 'O': 0, 'R': 0, 'T': 0, 'E': 0, 'X': 0 },
        triggeredGates: [],
        priorityMoves: {},
        contentTags: [],
        contextGuidance: {},
        completedAt: '2025-01-01T00:00:00.000Z',
        createdAt: '2025-01-01T00:00:00.000Z'
      }

      // Mock the service call chain
      vi.mocked(storage.getAssessment).mockResolvedValue({
        ...completedAssessment,
        completedAt: null
      })
      vi.mocked(storage.updateAssessment).mockResolvedValue(completedAssessment)

      const response = await request(app)
        .patch('/api/assessments/test-id/complete')

      expect(response.status).toBe(200)
      expect(response.body).toEqual(completedAssessment)
    })

    it('should return 404 if assessment not found', async () => {
      vi.mocked(storage.getAssessment).mockResolvedValue(null)

      const response = await request(app)
        .patch('/api/assessments/non-existent/complete')

      expect(response.status).toBe(404)
    })
  })
})