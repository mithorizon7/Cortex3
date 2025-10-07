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
  async createAssessment(data: { contextProfile: unknown; userId?: string }): Promise<Assessment> {
    // Validate context profile
    const validatedProfile = contextProfileSchema.parse(data.contextProfile);
    
    const assessment = await storage.createAssessment({
      userId: data.userId || 'anonymous',
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
  async getAssessment(id: string, userId?: string): Promise<Assessment | null> {
    const assessment = await storage.getAssessment(id, userId);
    
    if (!assessment) {
      logger.warn('Assessment not found', {
        additionalContext: { assessmentId: id, hasUserFilter: !!userId }
      });
      return null;
    }
    
    return assessment;
  }
  
  /**
   * Get all assessments for a user
   */
  async getUserAssessments(userId: string): Promise<Assessment[]> {
    const assessments = await storage.getUserAssessments(userId);
    
    logger.debug('User assessments retrieved', {
      additionalContext: { 
        userId, 
        assessmentCount: assessments.length,
        operation: 'get_user_assessments'
      }
    });
    
    return assessments;
  }
  
  /**
   * Update assessment data (e.g., value overlay, pulse responses, pillar scores)
   */
  async updateAssessmentData(assessmentId: string, data: any, userId?: string): Promise<Assessment | null> {
    const updateData: any = {};
    
    // Handle value overlay updates
    if (data.valueOverlay) {
      updateData.valueOverlay = data.valueOverlay;
    }
    
    // Handle pulse responses updates
    if (data.pulseResponses) {
      updateData.pulseResponses = data.pulseResponses;
    }
    
    // Handle pillar scores updates (allow empty objects for partial assessments)
    if (data.pillarScores !== undefined) {
      updateData.pillarScores = data.pillarScores;
    }
    
    // Handle other fields
    if (data.triggeredGates) {
      updateData.triggeredGates = data.triggeredGates;
    }
    
    if (data.priorityMoves) {
      updateData.priorityMoves = data.priorityMoves;
    }
    
    if (data.contentTags) {
      updateData.contentTags = data.contentTags;
    }
    
    if (data.contextGuidance) {
      updateData.contextGuidance = data.contextGuidance;
    }
    
    if (data.completedAt) {
      updateData.completedAt = data.completedAt;
    }
    
    const assessment = await storage.updateAssessment(assessmentId, updateData, userId);
    
    if (!assessment) {
      logger.warn('Cannot update assessment data - assessment not found or access denied', {
        additionalContext: { assessmentId, hasUserFilter: !!userId }
      });
      return null;
    }
    
    logger.info('Assessment data updated', {
      additionalContext: {
        assessmentId,
        updateKeys: Object.keys(updateData),
        operation: 'update_assessment_data'
      }
    });
    
    return assessment;
  }

  async updatePulseResponses(
    assessmentId: string, 
    pulseResponses: unknown,
    userId?: string
  ): Promise<Assessment | null> {
    // Validate pulse responses (now supports numeric values: 0, 0.25, 0.5, 1)
    const validatedResponses = pulseResponsesSchema.parse(pulseResponses);
    
    // Get existing assessment to merge responses
    const existingAssessment = await storage.getAssessment(assessmentId, userId);
    if (!existingAssessment) {
      logger.warn('Cannot update pulse - assessment not found or access denied', {
        additionalContext: { assessmentId, hasUserFilter: !!userId }
      });
      return null;
    }
    
    // Merge new responses with existing ones (accumulative)
    const mergedResponses = {
      ...(existingAssessment.pulseResponses || {}),
      ...validatedResponses
    };
    
    // Log raw responses for debugging
    logger.debug('Processing pulse responses', {
      additionalContext: {
        assessmentId,
        newResponseCount: Object.keys(validatedResponses).length,
        newResponseKeys: Object.keys(validatedResponses),
        existingResponseCount: Object.keys(existingAssessment.pulseResponses || {}).length,
        totalResponseCount: Object.keys(mergedResponses).length,
        sampleValues: Object.entries(validatedResponses).slice(0, 3).map(([k, v]) => ({ [k]: v })),
        operation: 'pulse_response_validation'
      }
    });
    
    // Calculate pillar scores (sum of numeric responses) and confidence gaps (deprecated, returns zeros)
    const pillarScores = this.calculatePillarScores(mergedResponses);
    const confidenceGaps = this.calculateConfidenceGaps(mergedResponses);
    
    // Log calculated scores for debugging
    logger.debug('Calculated pillar scores', {
      additionalContext: {
        assessmentId,
        pillarScores,
        scoredPillars: Object.keys(pillarScores),
        operation: 'pillar_score_calculation'
      }
    });
    
    const assessment = await storage.updateAssessment(assessmentId, {
      pulseResponses: mergedResponses,
      pillarScores,
      confidenceGaps,
    }, userId);
    
    if (!assessment) {
      logger.warn('Cannot update pulse - assessment not found or access denied', {
        additionalContext: { assessmentId, hasUserFilter: !!userId }
      });
      return null;
    }
    
    logger.info('Pulse responses updated', {
      additionalContext: {
        assessmentId,
        pillarScores,
        confidenceGaps,
        operation: 'update_pulse'
      }
    });
    
    return assessment;
  }
  
  /**
   * Complete assessment and generate final results
   */
  async completeAssessment(assessmentId: string, userId?: string): Promise<Assessment | null> {
    const assessment = await this.getAssessment(assessmentId, userId);
    
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
    
    // Generate smart guides for each pillar
    const smartGuides = this.generateSmartGuides(
      assessment.pillarScores,
      assessment.contextProfile,
      assessment.pulseResponses
    );
    
    // Include smart guides in contextGuidance
    const contextGuidance = {
      ...this.generateContextGuidance(assessment.pillarScores, contentTags),
      smartGuides
    };
    
    const completed = await storage.updateAssessment(assessmentId, {
      triggeredGates,
      priorityMoves,
      contentTags,
      contextGuidance,
      completedAt: new Date().toISOString(),
    }, userId);
    
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
   * Calculate pillar scores from pulse responses (sum of numeric values: 0, 0.25, 0.5, 1)
   * Only includes pillars that have at least one response (prevents showing 0 for unanswered domains)
   * @private
   */
  private calculatePillarScores(responses: Record<string, number | boolean | null>): Record<string, number> {
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
      // Check if any question in this pillar has been answered
      const hasResponses = questions.some(q => responses[q] !== undefined);
      
      logger.debug(`Pillar ${pillar} scoring check`, {
        additionalContext: {
          pillar,
          questions,
          hasResponses,
          questionValues: questions.map(q => ({ [q]: responses[q] })),
          operation: 'pillar_scoring_check'
        }
      });
      
      if (!hasResponses) {
        // Skip pillars with no responses - don't set them to 0
        logger.debug(`Skipping pillar ${pillar} - no responses`);
        continue;
      }
      
      let total = 0;
      for (const q of questions) {
        const val = responses[q];
        if (typeof val === 'number') {
          total += val;
          logger.debug(`Adding numeric value for ${q}`, {
            additionalContext: {
              question: q,
              value: val,
              runningTotal: total
            }
          });
        }
        // Legacy support: treat true as 1, false/null as 0
        else if (val === true) {
          total += 1;
          logger.debug(`Adding legacy boolean for ${q}`, {
            additionalContext: {
              question: q,
              value: 1,
              runningTotal: total
            }
          });
        } else {
          logger.debug(`Skipping value for ${q}`, {
            additionalContext: {
              question: q,
              value: val,
              type: typeof val
            }
          });
        }
      }
      scores[pillar] = total;
      logger.debug(`Final pillar ${pillar} score: ${total}`);
    }

    logger.info('Final calculated scores', {
      additionalContext: {
        scores,
        scoredPillars: Object.keys(scores),
        operation: 'final_pillar_scores'
      }
    });

    return scores;
  }

  /**
   * Calculate confidence gaps from pulse responses (deprecated - returns zeros for new 4-option system)
   * @private
   * @deprecated No longer used with 4-option scoring system (No/Started/Mostly/Yes)
   */
  private calculateConfidenceGaps(responses: Record<string, number | boolean | null>): Record<string, number> {
    // Return all zeros since "Unsure" option has been removed
    return {
      C: 0,
      O: 0,
      R: 0,
      T: 0,
      E: 0,
      X: 0,
    };
  }
  
  /**
   * Evaluate context gates based on CORTEX CCP specification
   * @private
   */
  private evaluateContextGates(contextProfile: any, pillarScores: any): any[] {
    const gates: any[] = [];
    const p = contextProfile;

    // G1 - Human-in-the-Loop (HITL) required
    if ((p.regulatory_intensity >= 3) || (p.safety_criticality >= 3)) {
      const explain: any = {};
      if (p.regulatory_intensity >= 3) explain.regulatory_intensity = p.regulatory_intensity;
      if (p.safety_criticality >= 3) explain.safety_criticality = p.safety_criticality;
      
      gates.push({
        id: 'require_hitl',
        pillar: 'O',
        title: 'Human Review Required',
        reason: 'Your AI can\'t fly solo when mistakes could hurt people or break regulations. Keep a human in charge of high-stakes decisions—it protects your customers and your reputation. Start with manual approval for critical actions, then gradually automate the safe stuff.',
        explain,
        status: 'unmet',
        actions: ['Set up human approval for risky AI decisions', 'Define which decisions need oversight', 'Create escalation rules']
      });
    }

    // G2 - Assurance cadence  
    if (p.regulatory_intensity >= 3) {
      gates.push({
        id: 'assurance_cadence',
        pillar: 'R',
        title: 'Regular AI Check-ups Needed',
        reason: 'Regulators are watching your industry closely. Monthly checks catch AI bias and drift before they become headlines. Annual audits prove you\'re doing things right. Think of it like financial auditing—boring but essential for trust.',
        explain: { regulatory_intensity: p.regulatory_intensity },
        status: 'unmet',
        actions: ['Schedule monthly AI performance reviews', 'Plan annual compliance audits', 'Document all review findings']
      });
    }

    // G3 - Data residency & retention
    if (p.data_sensitivity >= 3) {
      gates.push({
        id: 'data_residency',
        pillar: 'R',
        title: 'Lock Down Sensitive Data',
        reason: 'You handle sensitive data that can\'t leave your control. Keep it in your region, delete it quickly, and never let AI models memorize it. This isn\'t paranoia—it\'s what keeps you out of breach notifications and regulatory fines.',
        explain: { data_sensitivity: p.data_sensitivity },
        status: 'unmet',
        actions: ['Keep data in your region only', 'Auto-delete after 30 days', 'Block data from leaving your systems']
      });
    }

    // G4 - Latency fallback
    if (p.latency_edge >= 3) {
      gates.push({
        id: 'latency_fallback',
        pillar: 'O',
        title: 'Speed Matters—Build Backup Plans',
        reason: 'Your users won\'t wait. When AI is slow or offline, you need instant fallbacks. Set a 200ms speed limit and have simpler backup models ready. Better to give a good-enough answer fast than a perfect answer never.',
        explain: { latency_edge: p.latency_edge },
        status: 'unmet',
        actions: ['Set 200ms response time target', 'Build faster backup models', 'Test what happens when AI fails']
      });
    }

    // G5 - Scale hardening
    if (p.scale_throughput >= 3) {
      gates.push({
        id: 'scale_hardening',
        pillar: 'O',
        title: 'Prepare for the Flood',
        reason: 'You\'re expecting massive traffic. AI at scale breaks differently—costs explode, systems crash, users revolt. Test with 10x your expected load, set spending limits, and have multiple providers ready. Success shouldn\'t kill your business.',
        explain: { scale_throughput: p.scale_throughput },
        status: 'unmet',
        actions: ['Stress test with 10x expected traffic', 'Set cost limits and rate caps', 'Line up backup AI providers']
      });
    }

    // G6 - Build readiness gate
    if (p.build_readiness <= 1) {
      gates.push({
        id: 'build_readiness',
        pillar: 'T',
        title: 'Buy First, Build Later',
        reason: 'You\'re not ready to build custom AI yet—and that\'s okay. Start with off-the-shelf AI tools to learn what works. Building too early wastes money and talent. Get some wins with existing solutions first, then consider custom work.',
        explain: { build_readiness: p.build_readiness },
        status: 'unmet',
        actions: ['Start with vendor AI solutions', 'Build internal AI expertise gradually', 'Focus on using AI, not building it']
      });
    }

    // G7 - Procurement constraints
    if (p.procurement_constraints) {
      gates.push({
        id: 'procurement_compliance',
        pillar: 'C',
        title: 'Navigate Procurement Rules',
        reason: 'Your procurement process has rules—follow them or face delays. AI purchases trigger new questions about fairness, transparency, and vendor lock-in. Start the paperwork early and involve procurement from day one. Budget 3-6 extra months.',
        explain: { procurement_constraints: p.procurement_constraints },
        status: 'unmet',
        actions: ['Start procurement process early', 'Document AI fairness requirements', 'Add 3-6 months to timeline']
      });
    }

    // G8 - Edge operations
    if (p.edge_operations) {
      gates.push({
        id: 'edge_ops',
        pillar: 'E',
        title: 'AI at the Edge Needs Special Care',
        reason: 'Your AI runs in factories, vehicles, or remote sites. It must work offline, survive harsh conditions, and update without breaking operations. Design for intermittent connectivity and train field teams before deployment—downtime here means real-world problems.',
        explain: { edge_operations: p.edge_operations },
        status: 'unmet',
        actions: ['Design AI to work offline', 'Plan safe remote updates', 'Train field teams on AI tools']
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
    
    // Sample moves library with base scores, tags, descriptions, and playbooks
    const movesLibrary = [
      // Risk & Trust moves
      {
        id: 'incident_runbook',
        pillar: 'R',
        title: 'Publish AI incident response runbook',
        baseScore: 0.70,
        tags: ['regulatory', 'brand_risk'],
        description: 'Create a documented process for handling AI system failures, model drift, or unexpected outputs that could impact users or brand reputation.',
        playbook: [
          { type: 'template', label: 'Incident Response Template', url: '#' },
          { type: 'guide', label: 'Tabletop Exercise Guide', url: '#' }
        ]
      },
      {
        id: 'privacy_controls',
        pillar: 'R',
        title: 'Implement privacy and data governance controls',
        baseScore: 0.65,
        tags: ['data_governance', 'regulatory'],
        description: 'Establish policies and technical controls for handling sensitive data in AI systems, including data minimization, consent management, and audit trails.',
        playbook: [
          { type: 'checklist', label: 'Privacy Assessment Checklist', url: '#' },
          { type: 'template', label: 'Data Governance Policy', url: '#' }
        ]
      },
      
      // Operations moves
      {
        id: 'monitoring_dashboard',
        pillar: 'O',
        title: 'Deploy AI monitoring and observability dashboard',
        baseScore: 0.60,
        tags: ['scale', 'edge'],
        description: 'Set up real-time monitoring for model performance, latency, accuracy drift, and resource utilization across your AI systems.',
        playbook: [
          { type: 'guide', label: 'Metrics Selection Guide', url: '#' },
          { type: 'template', label: 'Dashboard Template', url: '#' }
        ]
      },
      {
        id: 'human_oversight',
        pillar: 'O', 
        title: 'Establish human oversight protocols',
        baseScore: 0.68,
        tags: ['safety', 'regulatory'],
        description: 'Define when and how humans review AI decisions, especially for high-stakes applications or regulated environments.',
        playbook: [
          { type: 'framework', label: 'Human-in-Loop Framework', url: '#' },
          { type: 'guide', label: 'Escalation Procedures', url: '#' }
        ]
      },
      
      // Clarity & Command moves
      {
        id: 'ai_governance',
        pillar: 'C',
        title: 'Establish AI governance framework',
        baseScore: 0.72,
        tags: ['regulatory', 'readiness_building'],
        description: 'Create clear decision rights, approval processes, and accountability structures for AI initiatives across the organization.',
        playbook: [
          { type: 'template', label: 'Governance Charter', url: '#' },
          { type: 'guide', label: 'Stakeholder Mapping', url: '#' }
        ]
      },
      
      // Talent & Culture moves
      {
        id: 'skills_development',
        pillar: 'T',
        title: 'Launch AI skills development program',
        baseScore: 0.63,
        tags: ['readiness_building'],
        description: 'Build internal AI literacy and capabilities through structured training, hands-on projects, and knowledge sharing.',
        playbook: [
          { type: 'guide', label: 'Skills Assessment Tool', url: '#' },
          { type: 'template', label: 'Training Curriculum', url: '#' }
        ]
      },
      
      // Ecosystem & Infrastructure moves
      {
        id: 'mlops_platform',
        pillar: 'E',
        title: 'Deploy MLOps platform and tooling',
        baseScore: 0.66,
        tags: ['scale', 'readiness_building', 'cost_control'],
        description: 'Implement infrastructure for versioning models, automating deployments, and managing the ML lifecycle at scale.',
        playbook: [
          { type: 'guide', label: 'Tool Selection Guide', url: '#' },
          { type: 'checklist', label: 'Platform Readiness', url: '#' }
        ]
      },
      {
        id: 'edge_deployment',
        pillar: 'E',
        title: 'Implement edge AI deployment capabilities',
        baseScore: 0.64,
        tags: ['edge', 'agility'],
        description: 'Enable AI models to run on edge devices for lower latency, offline operation, or data residency requirements.',
        playbook: [
          { type: 'guide', label: 'Edge Architecture Patterns', url: '#' },
          { type: 'template', label: 'Deployment Checklist', url: '#' }
        ]
      },
      
      // Experimentation moves
      {
        id: 'rapid_prototyping',
        pillar: 'X',
        title: 'Set up rapid AI prototyping environment',
        baseScore: 0.61,
        tags: ['agility', 'data_advantage'],
        description: 'Create a sandbox environment where teams can quickly test AI concepts with production-like data and infrastructure.',
        playbook: [
          { type: 'template', label: 'Sandbox Setup Guide', url: '#' },
          { type: 'guide', label: 'Experiment Tracking', url: '#' }
        ]
      }
    ];
    
    // Helper to generate contextual "why it matters" explanations
    const getWhyItMatters = (tags: string[], profileBoost: number): string => {
      const reasons: string[] = [];
      
      if (tags.includes('regulatory') && p.regulatory_intensity >= 3) {
        reasons.push('your high regulatory requirements');
      }
      if (tags.includes('safety') && p.safety_criticality >= 3) {
        reasons.push('your safety-critical applications');
      }
      if (tags.includes('brand_risk') && p.brand_exposure >= 3) {
        reasons.push('your high brand exposure');
      }
      if (tags.includes('data_governance') && p.data_sensitivity >= 3) {
        reasons.push('your sensitive data requirements');
      }
      if (tags.includes('edge') && (p.edge_operations || p.latency_edge >= 3)) {
        reasons.push('your edge/latency needs');
      }
      if (tags.includes('scale') && p.scale_throughput >= 3) {
        reasons.push('your high-scale environment');
      }
      if (tags.includes('data_advantage') && p.data_advantage >= 3) {
        reasons.push('your strong data assets');
      }
      if (tags.includes('readiness_building') && p.build_readiness <= 1) {
        reasons.push('your current readiness gaps');
      }
      if (tags.includes('cost_control') && p.finops_priority >= 3) {
        reasons.push('your cost management priorities');
      }
      if (tags.includes('agility') && p.competitive_speed >= 3) {
        reasons.push('your need for competitive speed');
      }
      
      if (reasons.length === 0) {
        return 'This foundational capability will strengthen your AI readiness across multiple domains.';
      }
      
      return `Prioritized based on ${reasons.join(', ')}.`;
    };
    
    // Calculate priority for each move
    const prioritizedMoves = movesLibrary.map(move => {
      const pillarScore = pillarScores[move.pillar] || 0;
      const gapBoost = 0.02 * (3 - pillarScore); // Bigger boost for weaker pillars
      const profileBoost = getProfileBoosts(move.tags);
      const priority = move.baseScore + gapBoost + profileBoost;
      
      return {
        id: move.id,
        pillar: move.pillar,
        title: move.title,
        description: move.description,
        playbook: move.playbook,
        priority,
        rank: 0, // Will be set after sorting
        explain: {
          gapBoost,
          profileBoost,
          pillarScore,
          triggeringDimensions: move.tags.filter(tag => getProfileBoosts([tag]) > 0)
        },
        whyItMatters: getWhyItMatters(move.tags, profileBoost)
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
  
  /**
   * Generate smart guide recommendations for each pillar based on gaps, context, and pulse responses
   * @private
   */
  private generateSmartGuides(
    pillarScores: any,
    contextProfile: any,
    pulseResponses: any
  ): any {
    const smartGuides: Record<string, any[]> = {};
    const pillars = ['C', 'O', 'R', 'T', 'E', 'X'];
    
    // For each pillar, generate smart guide recommendations
    pillars.forEach(pillar => {
      const score = pillarScores[pillar] || 0;
      const guides: any[] = [];
      
      // Calculate guide relevance scores based on:
      // 1. Gap analysis (weaker pillars get priority guides)
      // 2. Context relevance (match to org characteristics)  
      // 3. Pulse response targeting (specific weak answers)
      
      // Map guide IDs to recommendations with scoring
      const guideRecommendations = this.scoreGuidesForPillar(
        pillar,
        score,
        contextProfile,
        pulseResponses
      );
      
      // Add top 3-5 guides per pillar
      guideRecommendations.slice(0, 5).forEach((rec, index) => {
        guides.push({
          id: rec.id,
          title: rec.title,
          priority: index === 0 ? 'primary' : index <= 2 ? 'secondary' : 'additional',
          score: rec.score,
          reasons: rec.reasons,
          difficulty: rec.difficulty,
          timeToImplement: rec.timeToImplement,
          urgency: rec.urgency
        });
      });
      
      smartGuides[pillar] = guides;
    });
    
    return smartGuides;
  }
  
  /**
   * Score and rank guides for a specific pillar
   * @private
   */
  private scoreGuidesForPillar(
    pillar: string,
    pillarScore: number,
    contextProfile: any,
    pulseResponses: any
  ): any[] {
    const guides: any[] = [];
    const p = contextProfile;
    const pr = pulseResponses || {};
    
    // Define guide library with metadata for smart selection
    const guideLibrary = this.getGuideLibrary();
    
    // Score each relevant guide
    guideLibrary.forEach(guide => {
      // Only include guides relevant to this pillar
      if (guide.pillars && !guide.pillars.includes(pillar)) {
        return;
      }
      
      let score = guide.baseRelevance || 0.5;
      const reasons: string[] = [];
      
      // Gap boost (40% weight) - bigger boost for weaker pillars
      const gapBoost = (3 - pillarScore) * 0.4;
      score += gapBoost;
      if (gapBoost > 0.3) {
        reasons.push(`addresses weak ${pillar} domain (${pillarScore.toFixed(1)}/3)`);
      }
      
      // Context boost (35% weight) - match organizational characteristics
      let contextBoost = 0;
      
      // High regulatory/compliance needs
      if ((p.regulatory_intensity >= 3 || p.safety_criticality >= 3) && 
          guide.tags?.includes('regulatory')) {
        contextBoost += 0.25;
        reasons.push('critical for regulatory compliance');
      }
      
      // High data sensitivity
      if (p.data_sensitivity >= 3 && guide.tags?.includes('data_governance')) {
        contextBoost += 0.20;
        reasons.push('essential for data protection');
      }
      
      // Low readiness
      if (p.build_readiness <= 1 && guide.tags?.includes('foundational')) {
        contextBoost += 0.25;
        reasons.push('builds foundational capabilities');
      }
      
      // High scale needs
      if (p.scale_throughput >= 3 && guide.tags?.includes('scale')) {
        contextBoost += 0.20;
        reasons.push('supports high-scale operations');
      }
      
      // Edge operations
      if (p.edge_operations && guide.tags?.includes('edge')) {
        contextBoost += 0.20;
        reasons.push('enables edge deployment');
      }
      
      score += contextBoost * 0.35;
      
      // Pulse response targeting (25% weight)
      let pulseBoost = 0;
      if (guide.targetsPulseQuestions) {
        guide.targetsPulseQuestions.forEach((qId: string) => {
          const response = pr[qId];
          if (response !== undefined) {
            if (response === 0) { // "No"
              pulseBoost += 0.25;
              reasons.push(`directly addresses "${qId}" gap`);
            } else if (response === 0.25) { // "Started"
              pulseBoost += 0.15;
              reasons.push(`builds on "${qId}" progress`);
            } else if (response === 0.5) { // "Mostly"
              pulseBoost += 0.05;
            }
          }
        });
      }
      score += pulseBoost * 0.25;
      
      // Add urgency modifier
      if (guide.urgency === 'critical') {
        score += 0.1;
        if (!reasons.includes('critical priority')) {
          reasons.push('critical priority');
        }
      } else if (guide.urgency === 'high') {
        score += 0.05;
      }
      
      guides.push({
        id: guide.id,
        title: guide.title,
        score,
        reasons,
        difficulty: guide.difficulty || 'intermediate',
        timeToImplement: guide.timeToImplement || '1-month',
        urgency: guide.urgency || 'medium',
        tags: guide.tags || []
      });
    });
    
    // Sort by score (highest first)
    guides.sort((a, b) => b.score - a.score);
    
    return guides;
  }
  
  /**
   * Get the guide library with metadata for scoring
   * @private
   */
  private getGuideLibrary(): any[] {
    return [
      // Critical gate guides
      {
        id: 'gate.hitl',
        title: 'Human-in-the-Loop Framework',
        pillars: ['O', 'R'],
        tags: ['regulatory', 'safety', 'oversight'],
        targetsPulseQuestions: ['O1', 'R2'],
        baseRelevance: 0.75,
        difficulty: 'intermediate',
        timeToImplement: '1-week',
        urgency: 'critical'
      },
      {
        id: 'gate.assurance',
        title: 'AI Assurance Cadence',
        pillars: ['R', 'O'],
        tags: ['regulatory', 'monitoring', 'compliance'],
        targetsPulseQuestions: ['R1', 'R3'],
        baseRelevance: 0.70,
        difficulty: 'advanced',
        timeToImplement: '1-month',
        urgency: 'high'
      },
      
      // Clarity & Command
      {
        id: 'pillar.C.deep',
        title: 'Clarity & Command Deep Dive',
        pillars: ['C'],
        tags: ['leadership', 'strategy', 'foundational'],
        targetsPulseQuestions: ['C1', 'C2', 'C3'],
        baseRelevance: 0.65,
        difficulty: 'beginner',
        timeToImplement: '1-week',
        urgency: 'high'
      },
      
      // Operations & Data
      {
        id: 'pillar.O.deep',
        title: 'Operations & Data Engine Room',
        pillars: ['O'],
        tags: ['data', 'operations', 'mlops', 'scale'],
        targetsPulseQuestions: ['O1', 'O2', 'O3'],
        baseRelevance: 0.68,
        difficulty: 'intermediate',
        timeToImplement: '1-month',
        urgency: 'high'
      },
      {
        id: 'pillar.O.data_quality',
        title: 'Data Quality Gates',
        pillars: ['O'],
        tags: ['data_governance', 'scale'],
        targetsPulseQuestions: ['O2'],
        baseRelevance: 0.72,
        difficulty: 'intermediate',
        timeToImplement: '1-month',
        urgency: 'critical'
      },
      
      // Risk & Trust
      {
        id: 'pillar.R.deep',
        title: 'Risk & Trust Foundation',
        pillars: ['R'],
        tags: ['regulatory', 'safety', 'compliance'],
        targetsPulseQuestions: ['R1', 'R2', 'R3'],
        baseRelevance: 0.70,
        difficulty: 'intermediate',
        timeToImplement: '1-month',
        urgency: 'high'
      },
      {
        id: 'pillar.R.bias_testing',
        title: 'Bias Testing Framework',
        pillars: ['R'],
        tags: ['regulatory', 'compliance'],
        targetsPulseQuestions: ['R2'],
        baseRelevance: 0.60,
        difficulty: 'advanced',
        timeToImplement: '1-month',
        urgency: 'medium'
      },
      
      // Talent & Culture
      {
        id: 'pillar.T.deep',
        title: 'Talent & Culture Transformation',
        pillars: ['T'],
        tags: ['foundational', 'leadership'],
        targetsPulseQuestions: ['T1', 'T2', 'T3'],
        baseRelevance: 0.62,
        difficulty: 'beginner',
        timeToImplement: '3-months',
        urgency: 'medium'
      },
      {
        id: 'pillar.T.change_management',
        title: 'AI Change Management',
        pillars: ['T'],
        tags: ['leadership'],
        targetsPulseQuestions: ['T2', 'T3'],
        baseRelevance: 0.58,
        difficulty: 'intermediate',
        timeToImplement: '3-months',
        urgency: 'medium'
      },
      
      // Ecosystem & Infrastructure
      {
        id: 'pillar.E.deep',
        title: 'Ecosystem & Infrastructure Setup',
        pillars: ['E'],
        tags: ['scale', 'edge', 'infrastructure'],
        targetsPulseQuestions: ['E1', 'E2', 'E3'],
        baseRelevance: 0.65,
        difficulty: 'advanced',
        timeToImplement: '3-months',
        urgency: 'medium'
      },
      {
        id: 'pillar.E.cost_optimization',
        title: 'Cost Optimization Framework',
        pillars: ['E'],
        tags: ['scale', 'cost_control'],
        targetsPulseQuestions: ['E3'],
        baseRelevance: 0.63,
        difficulty: 'intermediate',
        timeToImplement: '1-month',
        urgency: 'high'
      },
      
      // Experimentation & Evolution
      {
        id: 'pillar.X.deep',
        title: 'Experimentation Framework',
        pillars: ['X'],
        tags: ['agility', 'innovation'],
        targetsPulseQuestions: ['X1', 'X2', 'X3'],
        baseRelevance: 0.60,
        difficulty: 'beginner',
        timeToImplement: '1-week',
        urgency: 'medium'
      },
      {
        id: 'pillar.X.pilot_management',
        title: 'Pilot Management Process',
        pillars: ['X'],
        tags: ['agility'],
        targetsPulseQuestions: ['X2'],
        baseRelevance: 0.58,
        difficulty: 'intermediate',
        timeToImplement: '1-month',
        urgency: 'medium'
      },
      
      // Additional key guides
      {
        id: 'gate.data_governance',
        title: 'Data Governance Framework',
        pillars: ['O', 'R'],
        tags: ['data_governance', 'regulatory'],
        targetsPulseQuestions: ['O2', 'R1'],
        baseRelevance: 0.72,
        difficulty: 'advanced',
        timeToImplement: '3-months',
        urgency: 'critical'
      },
      {
        id: 'gate.model_monitoring',
        title: 'Model Monitoring Setup',
        pillars: ['O', 'R'],
        tags: ['monitoring', 'scale', 'safety'],
        targetsPulseQuestions: ['O1', 'R1'],
        baseRelevance: 0.68,
        difficulty: 'intermediate',
        timeToImplement: '1-month',
        urgency: 'high'
      },
      {
        id: 'gate.roi_measurement',
        title: 'ROI Measurement Framework',
        pillars: ['C', 'E'],
        tags: ['cost_control', 'leadership'],
        targetsPulseQuestions: ['C3'],
        baseRelevance: 0.65,
        difficulty: 'intermediate',
        timeToImplement: '1-month',
        urgency: 'high'
      }
    ];
  }
}

export const assessmentService = new AssessmentService();