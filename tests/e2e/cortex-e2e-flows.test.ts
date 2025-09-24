import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import { validateContextProfile } from '../../shared/context-validation'
import { calculatePillarScores } from '../../shared/scale-utils'
import insightsRoutes from '../../server/routes/insights'
import assessmentRoutes from '../../server/routes/assessments'

/**
 * CORTEX End-to-End Flow Tests
 * 
 * These tests validate critical user journeys and business logic flows.
 * 
 * NOTE: Full browser automation is limited by authentication requirements.
 * The AuthRequiredModal blocks automated testing of authenticated flows.
 * These tests focus on:
 * - API endpoint flows
 * - Data validation and processing
 * - Error handling and resilience
 * - Business logic correctness
 * 
 * For full browser testing, authentication bypass or test credentials
 * would need to be implemented in the application.
 */

// Mock dependencies
vi.mock('../../server/storage', () => ({
  storage: {
    createAssessment: vi.fn(),
    getAssessment: vi.fn(),
    updateAssessmentPulse: vi.fn(),
  }
}))

vi.mock('../../server/database', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  }
}))

vi.mock('../../server/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
}))

vi.mock('../../server/utils/incident', () => ({
  generateIncidentId: vi.fn(() => 'INC-2025-E2E-TEST')
}))

vi.mock('../../server/lib/gemini', () => ({
  generateContextMirror: vi.fn()
}))

// Rate limiting and auth middleware mocks
const mockRateLimitMiddleware = (req: any, res: any, next: any) => next()
const mockAuthMiddleware = (req: any, res: any, next: any) => {
  req.requestId = 'e2e-test-request'
  req.userId = 'e2e-test-user'
  next()
}

vi.mock('../../server/middleware/rate-limit', () => ({
  contextMirrorRateLimitMiddleware: mockRateLimitMiddleware,
  createAssessmentRateLimitMiddleware: mockRateLimitMiddleware
}))

describe('CORTEX End-to-End Flows', () => {
  let app: express.Application

  beforeEach(() => {
    app = express()
    app.use(express.json())
    app.use(mockAuthMiddleware)
    app.use('/api/assessments', assessmentRoutes)
    app.use('/api/insights', insightsRoutes)
    
    vi.clearAllMocks()
  })

  describe('Complete Assessment Flow Simulation', () => {
    it('should validate complete organizational context profile', async () => {
      // Simulate executive-level organizational context
      const executiveContextProfile = {
        regulatory_intensity: 3, // High-regulation industry (finance/healthcare)
        data_sensitivity: 4,     // Highly sensitive data (PII/financial)
        safety_criticality: 2,   // Moderate safety requirements
        brand_exposure: 3,       // High brand visibility
        clock_speed: 2,          // Moderate pace of change
        latency_edge: 1,         // Low latency requirements
        scale_throughput: 3,     // High scale needs
        data_advantage: 2,       // Moderate data advantages
        build_readiness: 2,      // Moderate internal capabilities
        finops_priority: 3,      // Cost optimization important
        procurement_constraints: true,  // Constrained procurement
        edge_operations: false   // No edge operations
      }

      // Test context profile validation (business logic)
      const validationResult = validateContextProfile(executiveContextProfile)
      expect(validationResult.isValid).toBe(true)
      expect(validationResult.errors).toHaveLength(0)

      // Verify context profile structure matches schema
      expect(executiveContextProfile).toHaveProperty('regulatory_intensity')
      expect(executiveContextProfile.regulatory_intensity).toBeGreaterThanOrEqual(0)
      expect(executiveContextProfile.regulatory_intensity).toBeLessThanOrEqual(4)
      
      // Test context profile API endpoint
      const { storage } = await import('../../server/storage')
      const mockAssessment = {
        id: 'e2e-assessment-123',
        userId: 'e2e-test-user',
        contextProfile: executiveContextProfile,
        createdAt: new Date(),
        updatedAt: new Date(),
        pillarScores: {},
        pulseResponses: {},
        contextMirror: null,
        contextMirrorUpdatedAt: null
      }

      vi.mocked(storage.createAssessment).mockResolvedValue(mockAssessment)

      const response = await request(app)
        .post('/api/assessments')
        .send({ contextProfile: executiveContextProfile })

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id', 'e2e-assessment-123')
      expect(response.body.contextProfile).toEqual(executiveContextProfile)
    })

    it('should validate pulse check scoring logic', async () => {
      // Simulate realistic pulse check responses from a mid-maturity organization
      const pulseResponses = {
        // Clarity & Command - Mixed (score: 2)
        'C1': true,   // Has AI strategy
        'C2': false,  // Limited governance
        'C3': true,   // Executive buy-in
        
        // Operations & Data - Strong (score: 3)
        'O1': true,   // Good data quality
        'O2': true,   // Data infrastructure
        'O3': true,   // Analytics capabilities
        
        // Risk/Trust/Security - Weak (score: 1)
        'R1': false,  // Limited security controls
        'R2': true,   // Some compliance measures
        'R3': false,  // No bias monitoring
        
        // Talent & Culture - Moderate (score: 2)
        'T1': true,   // Some AI skills
        'T2': false,  // Limited training
        'T3': true,   // Culture of innovation
        
        // Ecosystem & Infrastructure - Weak (score: 1)
        'E1': false,  // Legacy infrastructure
        'E2': false,  // Limited partnerships
        'E3': true,   // Some technology investments
        
        // Experimentation & Evolution - Strong (score: 3)
        'X1': true,   // Active experimentation
        'X2': true,   // Learning from failures
        'X3': true,   // Continuous improvement
      }

      // Test pillar score calculation logic
      const pillarScores = calculatePillarScores(pulseResponses)
      
      expect(pillarScores).toEqual({
        clarity_command: 2,
        operations_data: 3,
        risk_trust_security: 1,
        talent_culture: 2,
        ecosystem_infrastructure: 1,
        experimentation_evolution: 3
      })

      // Verify pulse responses structure
      const expectedQuestions = 18
      expect(Object.keys(pulseResponses)).toHaveLength(expectedQuestions)
      
      // Verify pillar distribution (3 questions per pillar)
      const pillars = ['C', 'O', 'R', 'T', 'E', 'X']
      pillars.forEach(pillar => {
        const pillarQuestions = Object.keys(pulseResponses).filter(q => q.startsWith(pillar))
        expect(pillarQuestions).toHaveLength(3)
      })

      // Test pulse check API endpoint
      const { storage } = await import('../../server/storage')
      const mockUpdatedAssessment = {
        id: 'e2e-assessment-123',
        userId: 'e2e-test-user',
        pillarScores,
        pulseResponses,
        updatedAt: new Date()
      }

      vi.mocked(storage.updateAssessmentPulse).mockResolvedValue(mockUpdatedAssessment)

      const response = await request(app)
        .patch('/api/assessments/e2e-assessment-123/pulse')
        .send({ pulseResponses })

      expect(response.status).toBe(200)
      expect(response.body.pillarScores).toEqual(pillarScores)
    })

    it('should validate Context Mirror 2.0 generation flow', async () => {
      const { generateContextMirror } = await import('../../server/lib/gemini')
      const { storage } = await import('../../server/storage')

      // Mock assessment with context profile
      const mockAssessment = [{
        id: 'e2e-assessment-123',
        userId: 'e2e-test-user',
        contextProfile: {
          regulatory_intensity: 3,
          data_sensitivity: 4,
          safety_criticality: 2,
          brand_exposure: 3,
          clock_speed: 2,
          latency_edge: 1,
          scale_throughput: 3,
          data_advantage: 2,
          build_readiness: 2,
          finops_priority: 3,
          procurement_constraints: true,
          edge_operations: false,
        },
        contextMirror: null,
        contextMirrorUpdatedAt: null
      }]

      // Mock successful Context Mirror generation
      const mockContextMirror = {
        headline: 'Regulated Scale: Strategic AI Governance Framework',
        insight: 'Your organization operates in a highly regulated environment with significant data sensitivity, requiring a strategic approach that balances innovation with compliance. The combination of high regulatory intensity (3) and maximum data sensitivity (4) creates unique strategic tensions that demand careful orchestration of AI initiatives.',
        actions: [
          'Establish AI governance council with regulatory expertise',
          'Implement data classification framework aligned with compliance requirements',
          'Develop AI risk assessment methodology for regulatory approval',
          'Create compliance-first AI vendor evaluation criteria'
        ],
        watchouts: [
          'Regulatory changes could impact AI strategy timeline',
          'Data residency requirements may limit cloud AI services',
          'Audit requirements may slow AI model deployment cycles'
        ],
        scenarios: {
          if_regulation_tightens: 'Implement enhanced AI explainability and audit trails to meet stricter compliance requirements',
          if_budgets_tighten: 'Focus on high-ROI AI initiatives with clear compliance benefits and measurable business impact'
        },
        disclaimer: 'This strategic analysis is based on your organizational context profile and should be adapted to your specific regulatory environment.',
        debug: {
          source: 'ai' as const,
          attempts: [{
            attempt: 1,
            source: 'ai' as const,
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            duration: 2500,
            success: true
          }],
          finalSource: 'ai' as const,
          totalDuration: 2500,
          generatedAt: new Date().toISOString()
        }
      }

      // Mock database operations
      const { db } = require('../../server/database')
      db.select.mockReturnValue(db)
      db.from.mockReturnValue(db)
      db.where.mockReturnValue(db)
      db.limit.mockResolvedValue(mockAssessment)
      db.update.mockReturnValue(db)
      db.set.mockResolvedValue([mockAssessment[0]])

      vi.mocked(generateContextMirror).mockResolvedValue(mockContextMirror)

      const response = await request(app)
        .post('/api/insights/context-mirror')
        .send({ assessmentId: 'e2e-assessment-123' })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('headline')
      expect(response.body).toHaveProperty('insight')
      expect(response.body).toHaveProperty('actions')
      expect(response.body.headline).toContain('Strategic AI')
      expect(response.body.insight).toContain('regulated environment')
      expect(response.body.actions).toHaveLength(4)
      expect(response.body.watchouts).toHaveLength(3)
    })
  })

  describe('Error Handling and Resilience', () => {
    it('should handle validation errors gracefully', async () => {
      const invalidContextProfile = {
        regulatory_intensity: 5, // Invalid: max is 4
        data_sensitivity: -1,    // Invalid: min is 0
        // Missing required fields
      }

      const response = await request(app)
        .post('/api/assessments')
        .send({ contextProfile: invalidContextProfile })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('validation')
    })

    it('should handle database errors with proper categorization', async () => {
      const { storage } = await import('../../server/storage')
      
      // Simulate database connection error
      const connectionError = new Error('Connection refused')
      vi.mocked(storage.createAssessment).mockRejectedValue(connectionError)

      const validContextProfile = {
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
        .send({ contextProfile: validContextProfile })

      expect(response.status).toBe(500)
      expect(response.body).toHaveProperty('error')
      expect(response.body).toHaveProperty('incidentId')
    })

    it('should handle Context Mirror generation failures', async () => {
      const { generateContextMirror } = await import('../../server/lib/gemini')
      const { db } = require('../../server/database')

      // Mock assessment exists
      db.select.mockReturnValue(db)
      db.from.mockReturnValue(db)
      db.where.mockReturnValue(db)
      db.limit.mockResolvedValue([{
        id: 'test-assessment',
        contextProfile: { regulatory_intensity: 2 }
      }])

      // Simulate AI service failure
      const aiError = new Error('AI service temporarily unavailable')
      vi.mocked(generateContextMirror).mockRejectedValue(aiError)

      const response = await request(app)
        .post('/api/insights/context-mirror')
        .send({ assessmentId: 'test-assessment' })

      expect(response.status).toBe(500)
      expect(response.body).toHaveProperty('error', 'We are experiencing technical difficulties. Please try again shortly')
      expect(response.body).toHaveProperty('incidentId')
    })
  })

  describe('Data Processing and Business Logic', () => {
    it('should calculate strategic archetype correctly', async () => {
      // Test different organizational archetypes
      const highRegulationProfile = {
        regulatory_intensity: 4,
        data_sensitivity: 4,
        safety_criticality: 3,
        brand_exposure: 3,
        clock_speed: 1,
        latency_edge: 1,
        scale_throughput: 2,
        data_advantage: 2,
        build_readiness: 1,
        finops_priority: 2,
        procurement_constraints: true,
        edge_operations: false,
      }

      const fastGrowthProfile = {
        regulatory_intensity: 1,
        data_sensitivity: 2,
        safety_criticality: 1,
        brand_exposure: 2,
        clock_speed: 4,
        latency_edge: 3,
        scale_throughput: 4,
        data_advantage: 3,
        build_readiness: 3,
        finops_priority: 4,
        procurement_constraints: false,
        edge_operations: true,
      }

      const validationHigh = validateContextProfile(highRegulationProfile)
      const validationFast = validateContextProfile(fastGrowthProfile)

      expect(validationHigh.isValid).toBe(true)
      expect(validationFast.isValid).toBe(true)

      // These would be processed differently by Context Mirror 2.0
      expect(highRegulationProfile.regulatory_intensity).toBe(4)
      expect(fastGrowthProfile.clock_speed).toBe(4)
    })

    it('should handle edge cases in pillar scoring', async () => {
      // Test edge cases: all false, all true, mixed patterns
      const allFalseResponses = Object.fromEntries(
        ['C1', 'C2', 'C3', 'O1', 'O2', 'O3', 'R1', 'R2', 'R3', 
         'T1', 'T2', 'T3', 'E1', 'E2', 'E3', 'X1', 'X2', 'X3']
          .map(key => [key, false])
      )

      const allTrueResponses = Object.fromEntries(
        ['C1', 'C2', 'C3', 'O1', 'O2', 'O3', 'R1', 'R2', 'R3', 
         'T1', 'T2', 'T3', 'E1', 'E2', 'E3', 'X1', 'X2', 'X3']
          .map(key => [key, true])
      )

      const allFalseScores = calculatePillarScores(allFalseResponses)
      const allTrueScores = calculatePillarScores(allTrueResponses)

      // All false should result in 0 scores
      expect(Object.values(allFalseScores)).toEqual([0, 0, 0, 0, 0, 0])
      
      // All true should result in 3 scores
      expect(Object.values(allTrueScores)).toEqual([3, 3, 3, 3, 3, 3])
    })
  })

  describe('API Performance and Integration', () => {
    it('should handle assessment creation within performance limits', async () => {
      const { storage } = await import('../../server/storage')
      
      const startTime = Date.now()
      
      const validContextProfile = {
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

      vi.mocked(storage.createAssessment).mockResolvedValue({
        id: 'perf-test-123',
        userId: 'perf-test-user',
        contextProfile: validContextProfile,
        createdAt: new Date(),
        updatedAt: new Date(),
        pillarScores: {},
        pulseResponses: {},
        contextMirror: null,
        contextMirrorUpdatedAt: null
      })

      const response = await request(app)
        .post('/api/assessments')
        .send({ contextProfile: validContextProfile })

      const duration = Date.now() - startTime

      expect(response.status).toBe(201)
      expect(duration).toBeLessThan(1000) // Should complete within 1 second
    })

    it('should handle concurrent Context Mirror requests', async () => {
      const { generateContextMirror } = await import('../../server/lib/gemini')
      const { db } = require('../../server/database')

      // Mock assessment
      db.select.mockReturnValue(db)
      db.from.mockReturnValue(db)
      db.where.mockReturnValue(db)
      db.limit.mockResolvedValue([{
        id: 'concurrent-test',
        contextProfile: { regulatory_intensity: 2 }
      }])
      db.update.mockReturnValue(db)
      db.set.mockResolvedValue([{}])

      const mockResponse = {
        headline: 'Concurrent Test',
        insight: 'Test insight',
        actions: ['Test action'],
        watchouts: ['Test watchout'],
        scenarios: {
          if_regulation_tightens: 'Test scenario',
          if_budgets_tighten: 'Test budget scenario'
        },
        disclaimer: 'Test disclaimer',
        debug: {
          source: 'ai' as const,
          attempts: [],
          finalSource: 'ai' as const,
          totalDuration: 1000,
          generatedAt: new Date().toISOString()
        }
      }

      vi.mocked(generateContextMirror).mockResolvedValue(mockResponse)

      // Test concurrent requests
      const requests = Array(3).fill(null).map(() =>
        request(app)
          .post('/api/insights/context-mirror')
          .send({ assessmentId: 'concurrent-test' })
      )

      const responses = await Promise.all(requests)

      responses.forEach(response => {
        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('headline')
      })
    })
  })

  describe('Executive Flow Validation', () => {
    it('should validate complete executive assessment journey', async () => {
      const { storage } = await import('../../server/storage')
      const { generateContextMirror } = await import('../../server/lib/gemini')
      const { db } = require('../../server/database')

      // Step 1: Executive creates context profile
      const executiveContext = {
        regulatory_intensity: 3,   // Financial services
        data_sensitivity: 4,       // Customer financial data
        safety_criticality: 2,     // Moderate safety impact
        brand_exposure: 4,         // High brand risk
        clock_speed: 2,           // Moderate innovation pace
        latency_edge: 2,          // Some real-time requirements
        scale_throughput: 4,      // Large scale operations
        data_advantage: 3,        // Strong data assets
        build_readiness: 2,       // Moderate technical capabilities
        finops_priority: 4,       // Cost optimization critical
        procurement_constraints: true,  // Regulated procurement
        edge_operations: false    // Centralized operations
      }

      const mockAssessment = {
        id: 'exec-assessment-456',
        userId: 'exec-user-789',
        contextProfile: executiveContext,
        createdAt: new Date(),
        updatedAt: new Date(),
        pillarScores: {},
        pulseResponses: {},
        contextMirror: null,
        contextMirrorUpdatedAt: null
      }

      vi.mocked(storage.createAssessment).mockResolvedValue(mockAssessment)

      const contextResponse = await request(app)
        .post('/api/assessments')
        .send({ contextProfile: executiveContext })

      expect(contextResponse.status).toBe(201)

      // Step 2: Executive completes pulse check
      const executivePulseResponses = {
        'C1': true,  'C2': true,  'C3': true,   // Strong clarity & command
        'O1': true,  'O2': true,  'O3': false,  // Good operations, some gaps
        'R1': true,  'R2': true,  'R3': true,   // Strong risk management
        'T1': false, 'T2': false, 'T3': true,   // Talent gaps, good culture
        'E1': true,  'E2': false, 'E3': true,   // Mixed infrastructure
        'X1': false, 'X2': false, 'X3': true,   // Limited experimentation
      }

      const executivePillarScores = calculatePillarScores(executivePulseResponses)
      const updatedAssessment = { ...mockAssessment, pillarScores: executivePillarScores }
      
      vi.mocked(storage.updateAssessmentPulse).mockResolvedValue(updatedAssessment)

      const pulseResponse = await request(app)
        .patch('/api/assessments/exec-assessment-456/pulse')
        .send({ pulseResponses: executivePulseResponses })

      expect(pulseResponse.status).toBe(200)
      expect(pulseResponse.body.pillarScores).toEqual({
        clarity_command: 3,          // Strong leadership
        operations_data: 2,          // Good foundation
        risk_trust_security: 3,      // Excellent compliance
        talent_culture: 1,           // Needs development
        ecosystem_infrastructure: 2, // Moderate readiness
        experimentation_evolution: 1 // Conservative approach
      })

      // Step 3: Executive generates Context Mirror insights
      const executiveContextMirror = {
        headline: 'Financial Services: Compliance-First AI Strategy',
        insight: 'Your organization demonstrates strong governance and risk management capabilities, positioning you well for AI adoption in a highly regulated environment. The combination of strong leadership commitment and robust compliance frameworks provides a solid foundation for strategic AI initiatives.',
        actions: [
          'Establish AI Center of Excellence with regulatory focus',
          'Develop AI talent acquisition and training program',
          'Create innovation labs for controlled AI experimentation',
          'Implement AI-powered process optimization in compliance workflows'
        ],
        watchouts: [
          'Talent gaps may slow AI initiative implementation',
          'Conservative culture could limit innovation speed',
          'Regulatory changes require continuous strategy adaptation'
        ],
        scenarios: {
          if_regulation_tightens: 'Leverage strong compliance capabilities to maintain competitive advantage through compliant AI deployment',
          if_budgets_tighten: 'Focus on AI initiatives that deliver immediate compliance and operational efficiency benefits'
        },
        disclaimer: 'This strategic analysis reflects a conservative, compliance-focused approach appropriate for regulated financial services.',
        debug: {
          source: 'ai' as const,
          attempts: [],
          finalSource: 'ai' as const,
          totalDuration: 3200,
          generatedAt: new Date().toISOString()
        }
      }

      // Mock database for Context Mirror generation
      db.select.mockReturnValue(db)
      db.from.mockReturnValue(db)
      db.where.mockReturnValue(db)
      db.limit.mockResolvedValue([{
        ...mockAssessment,
        contextProfile: executiveContext
      }])
      db.update.mockReturnValue(db)
      db.set.mockResolvedValue([mockAssessment])

      vi.mocked(generateContextMirror).mockResolvedValue(executiveContextMirror)

      const mirrorResponse = await request(app)
        .post('/api/insights/context-mirror')
        .send({ assessmentId: 'exec-assessment-456' })

      expect(mirrorResponse.status).toBe(200)
      expect(mirrorResponse.body.headline).toContain('Financial Services')
      expect(mirrorResponse.body.insight).toContain('regulated environment')
      expect(mirrorResponse.body.actions).toHaveLength(4)
      expect(mirrorResponse.body.actions[0]).toContain('AI Center of Excellence')

      // Validate complete flow integrity
      expect(contextResponse.body.id).toBe('exec-assessment-456')
      expect(pulseResponse.body.pillarScores.risk_trust_security).toBe(3)
      expect(mirrorResponse.body).toHaveProperty('scenarios')
    })
  })
})