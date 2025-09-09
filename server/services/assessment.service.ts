import { storage } from "../storage";
import { contextProfileSchema, pulseResponsesSchema, type ContextProfile, type Assessment, type InsertAssessment } from "@shared/schema";
import { logger } from "../logger";
import { ASSESSMENT_CONFIG } from "../constants";

/**
 * Assessment Service - Business logic separated from HTTP handling
 */
export class AssessmentService {
  
  /**
   * Create a new assessment with context profile
   */
  async createAssessment(data: { contextProfile: unknown }): Promise<Assessment> {
    // Validate context profile
    const validatedProfile = contextProfileSchema.parse(data.contextProfile);
    
    const assessment = await storage.createAssessment({
      contextProfile: validatedProfile,
      pulseResponses: null,
      pillarScores: null,
      triggeredGates: null,
      priorityMoves: null,
      contentTags: null,
      contextGuidance: null,
      completedAt: null,
    });
    
    logger.info('Assessment created', {
      additionalContext: {
        assessmentId: assessment.id,
        operation: 'create_assessment'
      }
    });
    
    return assessment;
  }
  
  /**
   * Get assessment by ID
   */
  async getAssessment(id: string): Promise<Assessment | null> {
    const assessment = await storage.getAssessment(id);
    
    if (!assessment) {
      logger.warn('Assessment not found', {
        additionalContext: { assessmentId: id }
      });
      return null;
    }
    
    return assessment;
  }
  
  /**
   * Update assessment with pulse responses
   */
  async updatePulseResponses(
    assessmentId: string, 
    pulseResponses: unknown
  ): Promise<Assessment | null> {
    // Validate pulse responses
    const validatedResponses = pulseResponsesSchema.parse(pulseResponses);
    
    // Calculate pillar scores
    const pillarScores = this.calculatePillarScores(validatedResponses);
    
    const assessment = await storage.updateAssessment(assessmentId, {
      pulseResponses: validatedResponses,
      pillarScores,
    });
    
    if (!assessment) {
      logger.warn('Cannot update pulse - assessment not found', {
        additionalContext: { assessmentId }
      });
      return null;
    }
    
    logger.info('Pulse responses updated', {
      additionalContext: {
        assessmentId,
        pillarScores,
        operation: 'update_pulse'
      }
    });
    
    return assessment;
  }
  
  /**
   * Complete assessment and generate final results
   */
  async completeAssessment(assessmentId: string): Promise<Assessment | null> {
    const assessment = await this.getAssessment(assessmentId);
    
    if (!assessment) {
      return null;
    }
    
    if (!assessment.pillarScores) {
      throw new Error('Assessment must have pulse responses before completion');
    }
    
    // Generate final assessment results
    const triggeredGates = this.evaluateContextGates(
      assessment.contextProfile,
      assessment.pillarScores
    );
    
    const priorityMoves = this.generatePriorityMoves(
      assessment.contextProfile,
      assessment.pillarScores
    );
    
    const contentTags = this.generateContentTags(assessment.contextProfile);
    const contextGuidance = this.generateContextGuidance(
      assessment.pillarScores,
      contentTags
    );
    
    const completed = await storage.updateAssessment(assessmentId, {
      triggeredGates,
      priorityMoves,
      contentTags,
      contextGuidance,
      completedAt: new Date().toISOString(),
    });
    
    if (!completed) {
      throw new Error('Failed to save completed assessment');
    }
    
    logger.info('Assessment completed', {
      additionalContext: {
        assessmentId,
        gateCount: triggeredGates?.length || 0,
        operation: 'complete_assessment'
      }
    });
    
    return completed;
  }
  
  /**
   * Calculate pillar scores from pulse responses
   * @private
   */
  private calculatePillarScores(responses: Record<string, boolean>): Record<string, number> {
    const pillarQuestions = {
      C: ['C1', 'C2', 'C3'],
      O: ['O1', 'O2', 'O3'],
      R: ['R1', 'R2', 'R3'],
      T: ['T1', 'T2', 'T3'],
      E: ['E1', 'E2', 'E3'],
      X: ['X1', 'X2', 'X3'],
    };

    const scores: Record<string, number> = {};
    
    for (const [pillar, questions] of Object.entries(pillarQuestions)) {
      const yesCount = questions.filter(q => responses[q] === true).length;
      scores[pillar] = yesCount;
    }

    return scores;
  }
  
  /**
   * Evaluate context gates based on CORTEX CCP specification
   * @private
   */
  private evaluateContextGates(contextProfile: any, pillarScores: any): any[] {
    const gates: any[] = [];
    const p = contextProfile;

    // G1 - HITL required
    if ((p.regulatory_intensity >= 3) || (p.safety_criticality >= 3)) {
      gates.push({
        id: 'require_hitl',
        pillar: 'O',
        title: 'Human-in-the-Loop required for high-impact decisions',
        reason: 'High safety/regulation',
        explain: { 
          regulatory_intensity: p.regulatory_intensity, 
          safety_criticality: p.safety_criticality 
        },
        status: 'unmet',
        howTo: ['Implement human oversight for critical AI decisions', 'Establish approval workflows']
      });
    }

    // G2 - Assurance cadence  
    if (p.regulatory_intensity >= 3) {
      gates.push({
        id: 'assurance_cadence',
        pillar: 'R',
        title: 'Regular AI assurance and review cadence required',
        reason: 'High regulatory intensity',
        explain: { regulatory_intensity: p.regulatory_intensity },
        status: 'unmet',
        howTo: ['Monthly fairness/privacy/drift reviews', 'Annual internal/external audits']
      });
    }

    // G3 - Data residency & retention
    if (p.data_sensitivity >= 3) {
      gates.push({
        id: 'data_residency',
        pillar: 'R',
        title: 'Data residency and retention controls required',
        reason: 'High data sensitivity',
        explain: { data_sensitivity: p.data_sensitivity },
        status: 'unmet',
        howTo: ['Implement regional data processing', 'Set retention caps (e.g., 30 days)']
      });
    }

    // G4 - Latency fallback
    if (p.latency_edge >= 3) {
      gates.push({
        id: 'latency_fallback',
        pillar: 'O',
        title: 'Latency SLO and failover required',
        reason: 'High latency/edge requirements',
        explain: { latency_edge: p.latency_edge },
        status: 'unmet',
        howTo: ['Implement p95 SLO (≤200ms)', 'Test failover scenarios']
      });
    }

    // G5 - Scale hardening
    if (p.scale_throughput >= 3) {
      gates.push({
        id: 'scale_hardening',
        pillar: 'O',
        title: 'Scale hardening and load testing required',
        reason: 'High scale/throughput requirements',
        explain: { scale_throughput: p.scale_throughput },
        status: 'unmet',
        howTo: ['Conduct load tests', 'Plan rate limiting', 'Prepare dual-region readiness']
      });
    }

    // G6 - Build readiness gate
    if (p.build_readiness <= 1) {
      gates.push({
        id: 'build_readiness',
        pillar: 'T',
        title: 'Build readiness upgrade required before heavy development',
        reason: 'Low build readiness',
        explain: { build_readiness: p.build_readiness },
        status: 'unmet',
        howTo: ['Establish MLOps capabilities', 'Implement governance framework']
      });
    }

    // G7 - Procurement constraints
    if (p.procurement_constraints) {
      gates.push({
        id: 'procurement_compliance',
        pillar: 'C',
        title: 'Procurement compliance procedures required',
        reason: 'Procurement constraints active',
        explain: { procurement_constraints: p.procurement_constraints },
        status: 'unmet',
        howTo: ['Use public procurement templates', 'Adjust timeline estimates']
      });
    }

    // G8 - Edge operations
    if (p.edge_operations) {
      gates.push({
        id: 'edge_ops',
        pillar: 'E',
        title: 'Edge operations security patterns required',
        reason: 'Edge operations environment',
        explain: { edge_operations: p.edge_operations },
        status: 'unmet',
        howTo: ['Implement OT security patterns', 'Plan offline modes', 'Design field ops change management']
      });
    }

    return gates;
  }
  
  /**
   * Generate priority moves based on CORTEX Priority Engine
   * @private
   */
  private generatePriorityMoves(contextProfile: any, pillarScores: any): any {
    const p = contextProfile;
    const moves: any[] = [];
    
    // Define weight boosts based on profile dimensions
    const getProfileBoosts = (tags: string[]): number => {
      let boost = 0;
      
      // High regulation/safety affects R, O pillars (+0.08)
      if ((p.regulatory_intensity >= 3 || p.safety_criticality >= 3) && 
          (tags.includes('regulatory') || tags.includes('safety'))) {
        boost += 0.08;
      }
      
      // High data sensitivity affects R, O pillars (+0.06)
      if (p.data_sensitivity >= 3 && tags.includes('data_governance')) {
        boost += 0.06;
      }
      
      // High brand exposure affects R, C pillars (+0.05)
      if (p.brand_exposure >= 3 && tags.includes('brand_risk')) {
        boost += 0.05;
      }
      
      // High clock speed affects X, E pillars (+0.07)
      if (p.clock_speed >= 3 && tags.includes('agility')) {
        boost += 0.07;
      }
      
      // High latency/edge affects O, E pillars (+0.06)
      if (p.latency_edge >= 3 && tags.includes('edge')) {
        boost += 0.06;
      }
      
      // High scale affects O, E pillars (+0.06)
      if (p.scale_throughput >= 3 && tags.includes('scale')) {
        boost += 0.06;
      }
      
      // Strong data advantage affects O, X pillars (+0.07)
      if (p.data_advantage >= 3 && tags.includes('data_advantage')) {
        boost += 0.07;
      }
      
      // Low build readiness affects C, T pillars (+0.07)
      if (p.build_readiness <= 1 && tags.includes('readiness_building')) {
        boost += 0.07;
      }
      
      // High finops priority affects E pillar (+0.05)
      if (p.finops_priority >= 3 && tags.includes('cost_control')) {
        boost += 0.05;
      }
      
      return boost;
    };
    
    // Sample moves library with base scores and tags
    const movesLibrary = [
      // Risk & Trust moves
      {
        id: 'incident_runbook',
        pillar: 'R',
        title: 'Publish AI incident response runbook',
        baseScore: 0.70,
        tags: ['regulatory', 'brand_risk']
      },
      {
        id: 'privacy_controls',
        pillar: 'R',
        title: 'Implement privacy and data governance controls',
        baseScore: 0.65,
        tags: ['data_governance', 'regulatory']
      },
      
      // Operations moves
      {
        id: 'monitoring_dashboard',
        pillar: 'O',
        title: 'Deploy AI monitoring and observability dashboard',
        baseScore: 0.60,
        tags: ['scale', 'edge']
      },
      {
        id: 'human_oversight',
        pillar: 'O', 
        title: 'Establish human oversight protocols',
        baseScore: 0.68,
        tags: ['safety', 'regulatory']
      },
      
      // Clarity & Command moves
      {
        id: 'ai_governance',
        pillar: 'C',
        title: 'Establish AI governance framework',
        baseScore: 0.72,
        tags: ['regulatory', 'readiness_building']
      },
      
      // Talent & Culture moves
      {
        id: 'skills_development',
        pillar: 'T',
        title: 'Launch AI skills development program',
        baseScore: 0.63,
        tags: ['readiness_building']
      },
      
      // Ecosystem & Infrastructure moves
      {
        id: 'mlops_platform',
        pillar: 'E',
        title: 'Deploy MLOps platform and tooling',
        baseScore: 0.66,
        tags: ['scale', 'readiness_building', 'cost_control']
      },
      {
        id: 'edge_deployment',
        pillar: 'E',
        title: 'Implement edge AI deployment capabilities',
        baseScore: 0.64,
        tags: ['edge', 'agility']
      },
      
      // Experimentation moves
      {
        id: 'rapid_prototyping',
        pillar: 'X',
        title: 'Set up rapid AI prototyping environment',
        baseScore: 0.61,
        tags: ['agility', 'data_advantage']
      }
    ];
    
    // Calculate priority for each move
    const prioritizedMoves = movesLibrary.map(move => {
      const pillarScore = pillarScores[move.pillar] || 0;
      const gapBoost = 0.02 * (3 - pillarScore); // Bigger boost for weaker pillars
      const profileBoost = getProfileBoosts(move.tags);
      const priority = move.baseScore + gapBoost + profileBoost;
      
      return {
        ...move,
        priority,
        rank: 0, // Will be set after sorting
        explain: {
          gapBoost,
          profileBoost,
          pillarScore,
          triggeringDimensions: move.tags.filter(tag => getProfileBoosts([tag]) > 0)
        },
        whyItMatters: `Priority boost of +${profileBoost.toFixed(2)} due to your organization's context`
      };
    });
    
    // Sort by priority and assign ranks
    const sortedMoves = prioritizedMoves
      .sort((a, b) => b.priority - a.priority)
      .map((move, index) => ({ ...move, rank: index + 1 }));
    
    return {
      moves: sortedMoves.slice(0, 6), // Return top 6 moves
      totalEvaluated: movesLibrary.length
    };
  }
  
  /**
   * Generate content tags for routing based on CORTEX CCP specification
   * @private
   */
  private generateContentTags(contextProfile: any): string[] {
    const tags: string[] = [];
    const p = contextProfile;
    
    // Regulatory context
    if (p.regulatory_intensity >= 3) {
      tags.push('regulated');
    }
    
    // Safety context
    if (p.safety_criticality >= 3) {
      tags.push('high_safety');
    }
    
    // Data sensitivity context
    if (p.data_sensitivity >= 3) {
      tags.push('high_sensitivity');
    }
    
    // Edge operations context
    if (p.edge_operations || p.latency_edge >= 3) {
      tags.push('edge');
    }
    
    // Scale context
    if (p.scale_throughput >= 3) {
      tags.push('hyperscale');
    }
    
    // Data advantage context
    if (p.data_advantage >= 3) {
      tags.push('data_advantage');
    }
    
    // Build readiness context
    if (p.build_readiness <= 1) {
      tags.push('low_readiness');
    }
    
    // FinOps context
    if (p.finops_priority >= 3) {
      tags.push('finops_strict');
    }
    
    // Procurement context
    if (p.procurement_constraints) {
      tags.push('public_procurement');
    }
    
    // Functional focus tags
    if (p.functional_focus && p.functional_focus.includes('Ops')) {
      tags.push('ops_first');
    }
    
    // Industry/sector labels
    if (p.labels) {
      p.labels.forEach((label: string) => {
        tags.push(label.toLowerCase().replace(/\s+/g, '_'));
      });
    }
    
    return tags;
  }
  
  /**
   * Generate context-specific guidance based on pillar scores and content tags
   * @private
   */
  private generateContextGuidance(pillarScores: any, contentTags: string[]): any {
    const guidance: any = {
      recommendations: [],
      decideWeights: {
        Differentiation: 2,
        Economics: 2, 
        Compliance: 1,
        Implementation: 2,
        Data: 2,
        Evolution: 2
      },
      keyFocus: [],
      riskMitigations: []
    };
    
    // Adjust DECIDE weights based on content tags
    if (contentTags.includes('regulated') || contentTags.includes('high_safety')) {
      guidance.decideWeights.Compliance = 3;
      guidance.keyFocus.push('Regulatory compliance is critical - prioritize governance and controls');
    }
    
    if (contentTags.includes('hyperscale') || contentTags.includes('edge')) {
      guidance.decideWeights.Economics = 3;
      guidance.decideWeights.Evolution = 3;
      guidance.keyFocus.push('Scale and performance optimization are key success factors');
    }
    
    if (contentTags.includes('data_advantage')) {
      guidance.decideWeights.Differentiation = 3;
      guidance.decideWeights.Data = 3;
      guidance.keyFocus.push('Leverage your proprietary data as a competitive advantage');
    }
    
    if (contentTags.includes('low_readiness')) {
      guidance.decideWeights.Implementation = 1;
      guidance.keyFocus.push('Focus on building foundational capabilities before scaling');
      guidance.recommendations.push('Consider Buy → RAG → Light Fine-tuning progression');
    }
    
    // Generate specific recommendations based on weak pillars
    Object.entries(pillarScores).forEach(([pillar, score]) => {
      if (typeof score === 'number' && score < 2) { // Weak pillar
        switch (pillar) {
          case 'C':
            guidance.recommendations.push('Establish clear AI strategy and governance structure');
            break;
          case 'O':
            guidance.recommendations.push('Implement operational monitoring and human oversight');
            break;
          case 'R':
            guidance.recommendations.push('Strengthen risk management and compliance controls');
            break;
          case 'T':
            guidance.recommendations.push('Invest in AI skills development and change management');
            break;
          case 'E':
            guidance.recommendations.push('Build robust AI infrastructure and ecosystem capabilities');
            break;
          case 'X':
            guidance.recommendations.push('Create systematic approach to AI experimentation and learning');
            break;
        }
      }
    });
    
    // Add risk mitigations based on context
    if (contentTags.includes('regulated')) {
      guidance.riskMitigations.push('Implement comprehensive audit trails and documentation');
    }
    
    if (contentTags.includes('high_safety')) {
      guidance.riskMitigations.push('Establish rigorous testing and validation procedures');
    }
    
    if (contentTags.includes('edge')) {
      guidance.riskMitigations.push('Plan for offline scenarios and network connectivity issues');
    }
    
    return guidance;
  }
}

export const assessmentService = new AssessmentService();