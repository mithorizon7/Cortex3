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
   * Evaluate context gates (placeholder - implement full logic)
   * @private
   */
  private evaluateContextGates(contextProfile: any, pillarScores: any): any[] {
    // This would contain the full gate evaluation logic
    // For now, return empty array - implement based on business rules
    return [];
  }
  
  /**
   * Generate priority moves (placeholder - implement full logic)
   * @private
   */
  private generatePriorityMoves(contextProfile: any, pillarScores: any): any {
    // This would contain the full priority moves logic
    // For now, return empty object - implement based on business rules
    return {};
  }
  
  /**
   * Generate content tags (placeholder - implement full logic)
   * @private
   */
  private generateContentTags(contextProfile: any): string[] {
    // This would contain the full content tags logic
    // For now, return empty array - implement based on business rules
    return [];
  }
  
  /**
   * Generate context guidance (placeholder - implement full logic)
   * @private
   */
  private generateContextGuidance(pillarScores: any, contentTags: string[]): any {
    // This would contain the full context guidance logic
    // For now, return empty object - implement based on business rules
    return {};
  }
}

export const assessmentService = new AssessmentService();