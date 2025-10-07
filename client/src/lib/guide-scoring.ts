/**
 * Smart Guide Scoring System for CORTEX Assessment
 * Intelligently selects and prioritizes implementation guides based on:
 * - Pillar gaps (weak domains get priority)
 * - Context relevance (organizational characteristics)
 * - Pulse response targeting (specific weak answers)
 */

import type { PillarScores, ContextProfile, PulseResponses } from '@shared/schema';
import { MICRO_GUIDES, type MicroGuide } from './micro-guides';

// Enhanced guide metadata for smart selection
export interface EnhancedGuideMetadata {
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeToImplement: '1-day' | '1-week' | '1-month' | '3-months';
  urgency: 'critical' | 'high' | 'medium' | 'low';
  targetsPulseQuestions?: string[]; // IDs of specific pulse questions this guide addresses
  prerequisites?: string[]; // Other guide IDs that should come first
  contextTriggers?: {
    dimension: string;  // e.g., 'regulatory_intensity'
    operator: '>=' | '<=' | '==' | '>';
    threshold: number;  
    boost: number;      // Score boost when condition is met
  }[];
  baseRelevance: number; // Base score for this guide (0-1)
}

// Map of guide IDs to enhanced metadata
export const GUIDE_METADATA: Record<string, EnhancedGuideMetadata> = {
  // Critical gate guides
  'gate_hitl': {
    difficulty: 'intermediate',
    timeToImplement: '1-week',
    urgency: 'critical',
    targetsPulseQuestions: ['O1', 'R2'], // Human oversight questions
    baseRelevance: 0.75,
    contextTriggers: [
      { dimension: 'regulatory_intensity', operator: '>=', threshold: 3, boost: 0.25 },
      { dimension: 'safety_criticality', operator: '>=', threshold: 3, boost: 0.30 }
    ]
  },
  
  'gate_assurance': {
    difficulty: 'advanced',
    timeToImplement: '1-month',
    urgency: 'high',
    targetsPulseQuestions: ['R1', 'R3'], // Monitoring and compliance questions
    baseRelevance: 0.70,
    contextTriggers: [
      { dimension: 'regulatory_intensity', operator: '>=', threshold: 3, boost: 0.20 },
      { dimension: 'brand_exposure', operator: '>=', threshold: 3, boost: 0.15 }
    ]
  },
  
  // Clarity & Command guides
  'pillar_C_deep': {
    difficulty: 'beginner',
    timeToImplement: '1-week',
    urgency: 'high',
    targetsPulseQuestions: ['C1', 'C2', 'C3'], // Leadership and governance questions
    baseRelevance: 0.65,
    contextTriggers: [
      { dimension: 'build_readiness', operator: '<=', threshold: 1, boost: 0.20 },
      { dimension: 'ai_maturity', operator: '<=', threshold: 1, boost: 0.15 }
    ]
  },
  
  // Operations guides
  'pillar_O_deep': {
    difficulty: 'intermediate',
    timeToImplement: '1-month',
    urgency: 'high',
    targetsPulseQuestions: ['O1', 'O2', 'O3'],
    baseRelevance: 0.68,
    contextTriggers: [
      { dimension: 'scale_throughput', operator: '>=', threshold: 3, boost: 0.20 },
      { dimension: 'data_advantage', operator: '>=', threshold: 3, boost: 0.15 }
    ]
  },
  
  'pillar_O_data_quality': {
    difficulty: 'intermediate',
    timeToImplement: '1-month',
    urgency: 'critical',
    targetsPulseQuestions: ['O2'], // Data quality specific
    baseRelevance: 0.72,
    contextTriggers: [
      { dimension: 'data_sensitivity', operator: '>=', threshold: 3, boost: 0.25 },
      { dimension: 'scale_throughput', operator: '>=', threshold: 3, boost: 0.15 }
    ]
  },
  
  // Risk & Trust guides
  'pillar_R_deep': {
    difficulty: 'intermediate',
    timeToImplement: '1-month',
    urgency: 'high',
    targetsPulseQuestions: ['R1', 'R2', 'R3'],
    baseRelevance: 0.70,
    contextTriggers: [
      { dimension: 'regulatory_intensity', operator: '>=', threshold: 3, boost: 0.30 },
      { dimension: 'safety_criticality', operator: '>=', threshold: 3, boost: 0.25 }
    ]
  },
  
  'pillar_R_bias_testing': {
    difficulty: 'advanced',
    timeToImplement: '1-month',
    urgency: 'medium',
    targetsPulseQuestions: ['R2'], // Bias and fairness specific
    prerequisites: ['pillar_R_deep'],
    baseRelevance: 0.60,
    contextTriggers: [
      { dimension: 'brand_exposure', operator: '>=', threshold: 3, boost: 0.20 },
      { dimension: 'regulatory_intensity', operator: '>=', threshold: 3, boost: 0.15 }
    ]
  },
  
  // Talent & Culture guides
  'pillar_T_deep': {
    difficulty: 'beginner',
    timeToImplement: '3-months',
    urgency: 'medium',
    targetsPulseQuestions: ['T1', 'T2', 'T3'],
    baseRelevance: 0.62,
    contextTriggers: [
      { dimension: 'build_readiness', operator: '<=', threshold: 1, boost: 0.25 },
      { dimension: 'ai_maturity', operator: '<=', threshold: 1, boost: 0.20 }
    ]
  },
  
  'pillar_T_change_management': {
    difficulty: 'intermediate',
    timeToImplement: '3-months',
    urgency: 'medium',
    targetsPulseQuestions: ['T2', 'T3'], // Change and adoption specific
    baseRelevance: 0.58,
    contextTriggers: [
      { dimension: 'clock_speed', operator: '>=', threshold: 3, boost: 0.15 },
      { dimension: 'competitive_speed', operator: '>=', threshold: 3, boost: 0.15 }
    ]
  },
  
  // Ecosystem & Infrastructure guides
  'pillar_E_deep': {
    difficulty: 'advanced',
    timeToImplement: '3-months',
    urgency: 'medium',
    targetsPulseQuestions: ['E1', 'E2', 'E3'],
    baseRelevance: 0.65,
    contextTriggers: [
      { dimension: 'scale_throughput', operator: '>=', threshold: 3, boost: 0.25 },
      { dimension: 'edge_operations', operator: '==', threshold: 1, boost: 0.20 }
    ]
  },
  
  'pillar_E_cost_optimization': {
    difficulty: 'intermediate',
    timeToImplement: '1-month',
    urgency: 'high',
    targetsPulseQuestions: ['E3'], // Cost control specific
    baseRelevance: 0.63,
    contextTriggers: [
      { dimension: 'finops_priority', operator: '>=', threshold: 3, boost: 0.30 },
      { dimension: 'scale_throughput', operator: '>=', threshold: 3, boost: 0.15 }
    ]
  },
  
  // Experimentation guides
  'pillar_X_deep': {
    difficulty: 'beginner',
    timeToImplement: '1-week',
    urgency: 'medium',
    targetsPulseQuestions: ['X1', 'X2', 'X3'],
    baseRelevance: 0.60,
    contextTriggers: [
      { dimension: 'competitive_speed', operator: '>=', threshold: 3, boost: 0.20 },
      { dimension: 'clock_speed', operator: '>=', threshold: 3, boost: 0.15 }
    ]
  },
  
  'pillar_X_pilot_management': {
    difficulty: 'intermediate',
    timeToImplement: '1-month',
    urgency: 'medium',
    targetsPulseQuestions: ['X2'], // Pilot process specific
    baseRelevance: 0.58,
    contextTriggers: [
      { dimension: 'ai_maturity', operator: '>=', threshold: 2, boost: 0.15 },
      { dimension: 'data_advantage', operator: '>=', threshold: 3, boost: 0.20 }
    ]
  },
  
  // Data governance gates
  'gate_data_governance': {
    difficulty: 'advanced',
    timeToImplement: '3-months',
    urgency: 'critical',
    targetsPulseQuestions: ['O2', 'R1'], // Data and privacy
    baseRelevance: 0.72,
    contextTriggers: [
      { dimension: 'data_sensitivity', operator: '>=', threshold: 3, boost: 0.30 },
      { dimension: 'regulatory_intensity', operator: '>=', threshold: 3, boost: 0.25 }
    ]
  },
  
  'gate_model_monitoring': {
    difficulty: 'intermediate',
    timeToImplement: '1-month',
    urgency: 'high',
    targetsPulseQuestions: ['O1', 'R1'], // Monitoring and drift
    baseRelevance: 0.68,
    contextTriggers: [
      { dimension: 'scale_throughput', operator: '>=', threshold: 3, boost: 0.20 },
      { dimension: 'safety_criticality', operator: '>=', threshold: 3, boost: 0.25 }
    ]
  },
  
  // Context-specific guides
  'context_regulated': {
    difficulty: 'advanced',
    timeToImplement: '3-months',
    urgency: 'critical',
    baseRelevance: 0.50,
    contextTriggers: [
      { dimension: 'regulatory_intensity', operator: '>=', threshold: 3, boost: 0.40 }
    ]
  },
  
  'context_startup': {
    difficulty: 'beginner',
    timeToImplement: '1-week',
    urgency: 'high',
    baseRelevance: 0.45,
    contextTriggers: [
      { dimension: 'build_readiness', operator: '<=', threshold: 1, boost: 0.30 },
      { dimension: 'ai_maturity', operator: '<=', threshold: 1, boost: 0.25 }
    ]
  },
  
  'context_enterprise': {
    difficulty: 'advanced',
    timeToImplement: '3-months',
    urgency: 'medium',
    baseRelevance: 0.45,
    contextTriggers: [
      { dimension: 'scale_throughput', operator: '>=', threshold: 3, boost: 0.25 },
      { dimension: 'build_readiness', operator: '>=', threshold: 3, boost: 0.20 }
    ]
  },
  
  'gate_roi_measurement': {
    difficulty: 'intermediate',
    timeToImplement: '1-month',
    urgency: 'high',
    targetsPulseQuestions: ['C3'], // ROI and metrics
    baseRelevance: 0.65,
    contextTriggers: [
      { dimension: 'finops_priority', operator: '>=', threshold: 3, boost: 0.25 },
      { dimension: 'ai_maturity', operator: '>=', threshold: 2, boost: 0.15 }
    ]
  },
  
  'gate_vendor_selection': {
    difficulty: 'intermediate',
    timeToImplement: '1-month',
    urgency: 'medium',
    targetsPulseQuestions: ['E2'], // Vendor management
    baseRelevance: 0.60,
    contextTriggers: [
      { dimension: 'build_readiness', operator: '<=', threshold: 2, boost: 0.20 },
      { dimension: 'procurement_constraints', operator: '==', threshold: 1, boost: 0.25 }
    ]
  },
  
  'context_board_governance': {
    difficulty: 'advanced',
    timeToImplement: '3-months',
    urgency: 'high',
    targetsPulseQuestions: ['C1'], // Board-level governance
    baseRelevance: 0.55,
    contextTriggers: [
      { dimension: 'brand_exposure', operator: '>=', threshold: 3, boost: 0.25 },
      { dimension: 'regulatory_intensity', operator: '>=', threshold: 3, boost: 0.20 }
    ]
  },
  
  'pillar_x_usecase_triage': {
    difficulty: 'beginner',
    timeToImplement: '1-week',
    urgency: 'high',
    targetsPulseQuestions: ['X1', 'X2'], // Use case selection
    baseRelevance: 0.62,
    contextTriggers: [
      { dimension: 'ai_maturity', operator: '<=', threshold: 1, boost: 0.25 }
    ]
  },
  
  'pillar_r_security_redteaming': {
    difficulty: 'advanced',
    timeToImplement: '1-month',
    urgency: 'medium',
    targetsPulseQuestions: ['R3'], // Security testing
    prerequisites: ['pillar_R_deep'],
    baseRelevance: 0.58,
    contextTriggers: [
      { dimension: 'safety_criticality', operator: '>=', threshold: 3, boost: 0.30 },
      { dimension: 'brand_exposure', operator: '>=', threshold: 3, boost: 0.20 }
    ]
  },
  
  'gate_llm_privacy': {
    difficulty: 'advanced',
    timeToImplement: '1-month',
    urgency: 'critical',
    targetsPulseQuestions: ['R1', 'O2'], // Privacy and data protection
    baseRelevance: 0.70,
    contextTriggers: [
      { dimension: 'data_sensitivity', operator: '>=', threshold: 3, boost: 0.35 },
      { dimension: 'regulatory_intensity', operator: '>=', threshold: 3, boost: 0.25 }
    ]
  },
  
  'gate_contractual_controls': {
    difficulty: 'intermediate',
    timeToImplement: '1-month',
    urgency: 'high',
    targetsPulseQuestions: ['E2', 'R1'], // Vendor and legal controls
    baseRelevance: 0.62,
    contextTriggers: [
      { dimension: 'procurement_constraints', operator: '==', threshold: 1, boost: 0.30 },
      { dimension: 'regulatory_intensity', operator: '>=', threshold: 3, boost: 0.20 }
    ]
  },
  
  'pillar_e_usage_governance': {
    difficulty: 'intermediate',
    timeToImplement: '1-month',
    urgency: 'high',
    targetsPulseQuestions: ['E3'], // Usage and cost governance
    baseRelevance: 0.64,
    contextTriggers: [
      { dimension: 'finops_priority', operator: '>=', threshold: 3, boost: 0.30 },
      { dimension: 'scale_throughput', operator: '>=', threshold: 3, boost: 0.20 }
    ]
  }
};

// Scoring algorithm for guides
export interface GuideScore {
  guide: MicroGuide;
  metadata: EnhancedGuideMetadata;
  score: number;
  reasons: string[];
  gapBoost: number;
  contextBoost: number;
  pulseBoost: number;
}

export function calculateGuideScore(
  guide: MicroGuide,
  pillarScore: number,
  contextProfile: ContextProfile,
  pulseResponses: PulseResponses,
  pillar: string
): GuideScore | null {
  // Get metadata for this guide
  const guideKey = Object.keys(MICRO_GUIDES).find(key => MICRO_GUIDES[key].id === guide.id);
  const metadata = guideKey ? GUIDE_METADATA[guideKey] : null;
  
  if (!metadata) {
    return null; // Skip guides without metadata
  }
  
  let score = metadata.baseRelevance;
  const reasons: string[] = [];
  
  // Gap boost (40% weight) - Bigger boost for weaker pillars
  const gapBoost = (3 - pillarScore) * 0.4;
  score += gapBoost;
  if (gapBoost > 0.3) {
    reasons.push(`addresses weak ${pillar} domain (${pillarScore.toFixed(1)}/3)`);
  }
  
  // Context boost (35% weight) - Match organizational characteristics
  let contextBoost = 0;
  if (metadata.contextTriggers) {
    metadata.contextTriggers.forEach(trigger => {
      const profileValue = (contextProfile as any)[trigger.dimension];
      if (profileValue !== undefined) {
        let conditionMet = false;
        
        switch (trigger.operator) {
          case '>=':
            conditionMet = profileValue >= trigger.threshold;
            break;
          case '<=':
            conditionMet = profileValue <= trigger.threshold;
            break;
          case '==':
            conditionMet = profileValue === trigger.threshold;
            break;
          case '>':
            conditionMet = profileValue > trigger.threshold;
            break;
        }
        
        if (conditionMet) {
          contextBoost += trigger.boost * 0.35;
          score += trigger.boost * 0.35;
          
          // Add reason for significant boosts
          if (trigger.boost >= 0.2) {
            const dimensionName = trigger.dimension.replace(/_/g, ' ');
            reasons.push(`matches your ${dimensionName}`);
          }
        }
      }
    });
  }
  
  // Pulse response targeting (25% weight) - Target specific weak answers
  let pulseBoost = 0;
  if (metadata.targetsPulseQuestions && pulseResponses) {
    metadata.targetsPulseQuestions.forEach(questionId => {
      const responseKey = questionId.toLowerCase();
      const response = (pulseResponses as any)[responseKey];
      
      if (response !== undefined) {
        // Boost based on weakness level
        if (response === 0) { // "No"
          pulseBoost += 0.25;
          reasons.push(`directly addresses "${questionId}" gap`);
        } else if (response === 0.25) { // "Started"
          pulseBoost += 0.15;
          reasons.push(`builds on "${questionId}" progress`);
        } else if (response === 0.5) { // "Mostly"
          pulseBoost += 0.05;
        }
      }
    });
    score += pulseBoost * 0.25;
  }
  
  // Urgency modifier
  if (metadata.urgency === 'critical') {
    score += 0.1;
    if (!reasons.includes('critical priority')) {
      reasons.push('critical priority');
    }
  } else if (metadata.urgency === 'high') {
    score += 0.05;
  }
  
  return {
    guide,
    metadata,
    score,
    reasons,
    gapBoost,
    contextBoost,
    pulseBoost
  };
}

// Get smart guide recommendations for a pillar
export function getSmartGuidesForPillar(
  pillar: string,
  pillarScore: number,
  contextProfile: ContextProfile,
  pulseResponses: PulseResponses,
  limit: number = 5
): GuideScore[] {
  // Get all guides for this pillar
  const pillarGuides = Object.values(MICRO_GUIDES).filter(guide => 
    guide.pillar === pillar || guide.category === 'gate' || guide.category === 'context'
  );
  
  // Score all guides
  const scoredGuides: GuideScore[] = [];
  pillarGuides.forEach(guide => {
    const guideScore = calculateGuideScore(guide, pillarScore, contextProfile, pulseResponses, pillar);
    if (guideScore) {
      scoredGuides.push(guideScore);
    }
  });
  
  // Sort by score (highest first) and handle prerequisites
  scoredGuides.sort((a, b) => b.score - a.score);
  
  // Ensure prerequisites come before dependent guides
  const finalOrder: GuideScore[] = [];
  const added = new Set<string>();
  
  scoredGuides.forEach(guideScore => {
    // Add prerequisites first if they're in the list
    if (guideScore.metadata.prerequisites) {
      guideScore.metadata.prerequisites.forEach(prereqId => {
        const prereq = scoredGuides.find(g => g.guide.id.includes(prereqId));
        if (prereq && !added.has(prereq.guide.id)) {
          finalOrder.push(prereq);
          added.add(prereq.guide.id);
        }
      });
    }
    
    // Add the guide itself
    if (!added.has(guideScore.guide.id)) {
      finalOrder.push(guideScore);
      added.add(guideScore.guide.id);
    }
  });
  
  return finalOrder.slice(0, limit);
}

// Generate explanation for why a guide was selected
export function generateGuideExplanation(guideScore: GuideScore): string {
  if (guideScore.reasons.length === 0) {
    return 'Foundational guide for this domain';
  }
  
  // Format reasons into a readable sentence
  if (guideScore.reasons.length === 1) {
    return `Selected because it ${guideScore.reasons[0]}`;
  } else if (guideScore.reasons.length === 2) {
    return `Selected because it ${guideScore.reasons[0]} and ${guideScore.reasons[1]}`;
  } else {
    const lastReason = guideScore.reasons[guideScore.reasons.length - 1];
    const otherReasons = guideScore.reasons.slice(0, -1).join(', ');
    return `Selected because it ${otherReasons}, and ${lastReason}`;
  }
}