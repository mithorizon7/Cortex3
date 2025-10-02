import type { PillarScores, ContextProfile } from '@shared/schema';
import { CORTEX_PILLARS } from '@/lib/cortex';

// Enhanced types for executive insights
export interface ExecutiveInsight {
  type: string;
  title: string;
  description: string;
  action: string;
  reasoning: string; // "because" explanation
  businessImpact: string;
  urgency: 'high' | 'medium' | 'low';
}

export interface ActionPriority {
  title: string;
  description: string;
  reasoning: string;
  timeframe: string;
  urgency: 'high' | 'medium' | 'low';
}

// Insight type library with sophisticated rules
const INSIGHT_LIBRARY = {
  foundations_critical: {
    title: 'Critical: Build AI Strategic Foundations',
    description: 'Your organization lacks fundamental AI capabilities required for any successful AI initiative.',
    action: 'Establish data governance, AI strategy, and basic infrastructure before pursuing AI projects.',
    businessImpact: 'Without foundations, AI projects face 80% higher failure rates and significant compliance risks.',
    urgency: 'high' as const
  },
  foundations_weak: {
    title: 'Strengthen AI Strategic Foundations',
    description: 'Basic AI capabilities exist but need reinforcement before scaling initiatives.',
    action: 'Invest in data quality, governance frameworks, and talent development.',
    businessImpact: 'Strong foundations reduce project risk and accelerate time-to-value.',
    urgency: 'high' as const
  },
  systematic_development: {
    title: 'Systematize AI Development Practices',
    description: 'You have foundational capabilities but lack systematic approaches to scale effectively.',
    action: 'Establish AI governance committee, standardize development processes, and expand pilot programs.',
    businessImpact: 'Systematic practices enable consistent AI outcomes and reduce operational overhead.',
    urgency: 'medium' as const
  },
  optimization_focus: {
    title: 'Optimize AI Operations for Scale',
    description: 'Strong AI foundations position you to focus on optimization and competitive differentiation.',
    action: 'Enhance monitoring capabilities, expand successful use cases, and drive strategic advantage.',
    businessImpact: 'Optimized AI operations can deliver 25-40% additional value from existing investments.',
    urgency: 'medium' as const
  },
  maturity_leadership: {
    title: 'Lead Through AI Innovation',
    description: 'Advanced AI maturity enables industry leadership and competitive moats.',
    action: 'Focus on breakthrough applications, ecosystem partnerships, and market differentiation.',
    businessImpact: 'AI leadership can create sustainable competitive advantages and new revenue streams.',
    urgency: 'low' as const
  },
  compliance_critical: {
    title: 'Critical Compliance Gaps Require Immediate Action',
    description: 'Your risk profile demands specific safeguards before expanding AI initiatives.',
    action: 'Implement required governance controls and compliance measures immediately.',
    businessImpact: 'Non-compliance can result in regulatory penalties, operational shutdowns, and reputation damage.',
    urgency: 'high' as const
  },
  compliance_moderate: {
    title: 'Address Compliance Requirements',
    description: 'Your operational context requires enhanced governance and risk management.',
    action: 'Establish oversight processes and compliance monitoring for AI systems.',
    businessImpact: 'Proactive compliance reduces regulatory risk and builds stakeholder trust.',
    urgency: 'medium' as const
  },
  data_debt_blocking: {
    title: 'Data Infrastructure Debt Blocks AI Scale',
    description: 'Poor data foundations limit AI effectiveness and create operational risks.',
    action: 'Prioritize data quality, integration, and governance before expanding AI use cases.',
    businessImpact: 'Data debt can reduce AI project success rates by 60% and increase costs significantly.',
    urgency: 'high' as const
  },
  talent_constraint: {
    title: 'Talent Constraints Limit AI Potential',
    description: 'Skills gaps in critical areas prevent effective AI adoption and scaling.',
    action: 'Invest in upskilling programs, strategic hiring, and external partnerships.',
    businessImpact: 'Talent constraints can delay AI initiatives by 6-12 months and reduce ROI.',
    urgency: 'medium' as const
  },
  culture_resistance: {
    title: 'Cultural Readiness Requires Leadership Attention',
    description: 'Organizational culture may resist or underutilize AI capabilities.',
    action: 'Develop change management programs and demonstrate quick wins to build confidence.',
    businessImpact: 'Poor cultural readiness can cause AI initiatives to fail despite technical success.',
    urgency: 'medium' as const
  },
  experiment_without_ops: {
    title: 'Strong Experimentation Needs Operational Backbone',
    description: 'High experimentation capability requires operational maturity to capture value.',
    action: 'Build production deployment pipelines and monitoring before expanding pilots.',
    businessImpact: 'Without operational backbone, innovative pilots fail to deliver business value.',
    urgency: 'medium' as const
  },
  security_gaps: {
    title: 'Security Posture Requires Immediate Strengthening',
    description: 'AI security vulnerabilities expose organization to significant risks.',
    action: 'Implement AI security controls, monitoring, and incident response capabilities.',
    businessImpact: 'AI security breaches can cause 5-10x more damage than traditional cybersecurity incidents.',
    urgency: 'high' as const
  },
  ecosystem_isolation: {
    title: 'Ecosystem Integration Critical for Success',
    description: 'Limited external partnerships constrain AI capabilities and innovation speed.',
    action: 'Build strategic partnerships with AI vendors, research institutions, and industry networks.',
    businessImpact: 'Ecosystem partnerships can accelerate AI development by 40-60% and reduce costs.',
    urgency: 'low' as const
  }
};

// Priority action library
const PRIORITY_LIBRARY = {
  build_foundations: {
    title: 'Build AI Strategic Foundations',
    description: 'Establish data governance, AI strategy, and basic infrastructure',
    timeframe: '60-90 days',
    urgency: 'high' as const
  },
  address_compliance: {
    title: 'Address Critical Compliance Requirements',
    description: 'Implement required governance controls and oversight processes',
    timeframe: '30-60 days',
    urgency: 'high' as const
  },
  strengthen_weakest: {
    title: 'Strengthen {domain}',
    description: 'Focus improvement efforts on your biggest capability gap',
    timeframe: '90 days',
    urgency: 'medium' as const
  },
  systematize_practices: {
    title: 'Systematize AI Development Practices',
    description: 'Establish governance, standardize processes, expand pilots',
    timeframe: '90 days',
    urgency: 'medium' as const
  },
  resolve_data_debt: {
    title: 'Resolve Critical Data Infrastructure Debt',
    description: 'Improve data quality, integration, and governance',
    timeframe: '90-120 days',
    urgency: 'high' as const
  },
  develop_talent: {
    title: 'Develop AI Talent and Capabilities',
    description: 'Upskilling, strategic hiring, and external partnerships',
    timeframe: '90-180 days',
    urgency: 'medium' as const
  },
  optimize_operations: {
    title: 'Optimize AI Operations for Scale',
    description: 'Enhance monitoring, expand use cases, drive efficiency',
    timeframe: '60-90 days',
    urgency: 'medium' as const
  }
};

// Context analysis functions
function analyzeMaturityDistribution(pillarScores: PillarScores | null | undefined) {
  if (!pillarScores || typeof pillarScores !== 'object') {
    return {
      avgScore: 0,
      minScore: 0,
      maxScore: 0,
      variance: 0,
      isUnbalanced: false,
      hasStrengths: false,
      hasWeaknesses: true
    };
  }
  
  const scores = Object.values(pillarScores);
  if (scores.length === 0) {
    return {
      avgScore: 0,
      minScore: 0,
      maxScore: 0,
      variance: 0,
      isUnbalanced: false,
      hasStrengths: false,
      hasWeaknesses: true
    };
  }
  
  const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
  
  return {
    avgScore,
    minScore,
    maxScore,
    variance,
    isUnbalanced: variance > 0.8, // High variance indicates imbalanced development
    hasStrengths: maxScore >= 2.5,
    hasWeaknesses: minScore <= 1.0
  };
}

function identifyWeakestDomains(pillarScores: PillarScores | null | undefined, count: number = 2) {
  if (!pillarScores || typeof pillarScores !== 'object') {
    return [];
  }
  
  return Object.entries(pillarScores)
    .sort(([,a], [,b]) => a - b)
    .slice(0, count)
    .map(([pillar, score]) => ({
      pillar,
      score,
      name: CORTEX_PILLARS[pillar.toUpperCase() as keyof typeof CORTEX_PILLARS]?.name || pillar
    }));
}

function analyzeContextFlags(contextProfile: ContextProfile | null | undefined) {
  if (!contextProfile) {
    return {
      highRegulation: false,
      highDataSensitivity: false,
      highSafetyCriticality: false,
      lowBuildReadiness: false,
      fastPaced: false,
      hasEdgeOperations: false,
      hasProcurementConstraints: false
    };
  }
  
  return {
    highRegulation: contextProfile.regulatory_intensity >= 3,
    highDataSensitivity: contextProfile.data_sensitivity >= 3,
    highSafetyCriticality: contextProfile.safety_criticality >= 3,
    lowBuildReadiness: contextProfile.build_readiness <= 1,
    fastPaced: contextProfile.clock_speed >= 3,
    hasEdgeOperations: contextProfile.edge_operations,
    hasProcurementConstraints: contextProfile.procurement_constraints
  };
}

// Main insight generation function
export function generateEnhancedExecutiveInsights(
  pillarScores: PillarScores | null | undefined, 
  gates: any[], 
  contextProfile: ContextProfile | null | undefined
): { insights: ExecutiveInsight[], priorities: ActionPriority[] } {
  
  const insights: ExecutiveInsight[] = [];
  const priorities: ActionPriority[] = [];
  
  // Guard against null/undefined pillarScores
  if (!pillarScores || typeof pillarScores !== 'object') {
    return { insights: [], priorities: [] };
  }
  
  // Analyze the assessment data
  const maturity = analyzeMaturityDistribution(pillarScores);
  const weakestDomains = identifyWeakestDomains(pillarScores, 2);
  const contextFlags = analyzeContextFlags(contextProfile);
  
  // Priority 1: Critical gates always take precedence
  if (gates.length > 0) {
    const gateInsight = gates.length >= 3 ? INSIGHT_LIBRARY.compliance_critical : INSIGHT_LIBRARY.compliance_moderate;
    insights.push({
      type: 'compliance',
      ...gateInsight,
      reasoning: `because your organizational context triggered ${gates.length} critical requirement${gates.length > 1 ? 's' : ''} that must be addressed`
    });
    
    priorities.push({
      ...PRIORITY_LIBRARY.address_compliance,
      reasoning: `${gates.length} critical requirements identified based on your risk profile`
    });
  }
  
  // Priority 2: Foundation vs Development vs Optimization
  if (maturity.avgScore < 1.0) {
    insights.push({
      type: 'foundation',
      ...INSIGHT_LIBRARY.foundations_critical,
      reasoning: `because your average maturity score of ${maturity.avgScore.toFixed(1)} indicates fundamental capabilities are missing`
    });
    priorities.push({
      ...PRIORITY_LIBRARY.build_foundations,
      reasoning: `foundational capabilities are required before any AI initiative can succeed`
    });
  } else if (maturity.avgScore < 1.5) {
    insights.push({
      type: 'foundation',
      ...INSIGHT_LIBRARY.foundations_weak,
      reasoning: `because while basic capabilities exist (average score ${maturity.avgScore.toFixed(1)}), they need strengthening`
    });
    priorities.push({
      ...PRIORITY_LIBRARY.build_foundations,
      reasoning: `current capabilities need reinforcement before scaling initiatives`
    });
  } else if (maturity.avgScore < 2.5) {
    insights.push({
      type: 'development',
      ...INSIGHT_LIBRARY.systematic_development,
      reasoning: `because you have solid foundations (average score ${maturity.avgScore.toFixed(1)}) but need systematic approaches to scale`
    });
    priorities.push({
      ...PRIORITY_LIBRARY.systematize_practices,
      reasoning: `systematic practices will enable consistent and scalable AI outcomes`
    });
  } else if (maturity.avgScore < 3.0) {
    insights.push({
      type: 'optimization',
      ...INSIGHT_LIBRARY.optimization_focus,
      reasoning: `because strong capabilities (average score ${maturity.avgScore.toFixed(1)}) enable focus on optimization and competitive advantage`
    });
    priorities.push({
      ...PRIORITY_LIBRARY.optimize_operations,
      reasoning: `your strong foundation enables focus on operational excellence and scale`
    });
  } else {
    insights.push({
      type: 'leadership',
      ...INSIGHT_LIBRARY.maturity_leadership,
      reasoning: `because advanced capabilities (average score ${maturity.avgScore.toFixed(1)}) position you for industry leadership`
    });
  }
  
  // Priority 3: Domain-specific insights based on weakest areas and context
  const weakest = weakestDomains[0];
  if (weakest.score <= 1.0) {
    // Special handling for critical weak areas
    if (weakest.pillar === 'O' && maturity.avgScore > 1.5) {
      insights.push({
        type: 'data_debt',
        ...INSIGHT_LIBRARY.data_debt_blocking,
        reasoning: `because Operations & Data scored only ${weakest.score} while other areas are stronger, creating a bottleneck`
      });
      priorities.push({
        ...PRIORITY_LIBRARY.resolve_data_debt,
        reasoning: `data infrastructure gaps are blocking progress in other domains`
      });
    } else if (weakest.pillar === 'T') {
      insights.push({
        type: 'talent',
        ...INSIGHT_LIBRARY.talent_constraint,
        reasoning: `because Talent & Culture scored only ${weakest.score}, limiting your ability to execute AI initiatives`
      });
      priorities.push({
        ...PRIORITY_LIBRARY.develop_talent,
        reasoning: `talent constraints are the primary limiting factor for AI success`
      });
    } else if (weakest.pillar === 'R' && (contextFlags.highRegulation || contextFlags.highDataSensitivity)) {
      insights.push({
        type: 'security',
        ...INSIGHT_LIBRARY.security_gaps,
        reasoning: `because Risk/Trust scored only ${weakest.score} in a high-risk environment`
      });
    } else {
      // Generic weakest domain insight
      const priority = {
        ...PRIORITY_LIBRARY.strengthen_weakest,
        title: PRIORITY_LIBRARY.strengthen_weakest.title.replace('{domain}', weakest.name),
        reasoning: `${weakest.name} scored lowest at ${weakest.score}, representing your biggest improvement opportunity`
      };
      priorities.push(priority);
    }
  }
  
  // Additional context-specific insights
  if (maturity.isUnbalanced && insights.length < 3) {
    const spreadValue = (maturity.maxScore - maturity.minScore).toFixed(1);
    if (maturity.variance > 1.2) {
      insights.push({
        type: 'imbalance',
        title: 'Address Significant Capability Imbalances',
        description: 'Large gaps between your strongest and weakest domains create operational risks.',
        action: `Focus on strengthening ${weakest.name} to reduce the ${spreadValue}-point gap with your strongest areas.`,
        reasoning: `because there's a ${spreadValue}-point spread between your strongest and weakest domains`,
        businessImpact: 'Capability imbalances can create bottlenecks that limit overall AI effectiveness.',
        urgency: 'medium' as const
      });
    }
  }
  
  // Return top 3 insights and priorities
  return {
    insights: insights.slice(0, 3),
    priorities: priorities.slice(0, 3)
  };
}

// Helper function to format insights for display
export function formatInsightForExecutive(insight: ExecutiveInsight): string {
  return `**${insight.title}**: ${insight.description} ${insight.reasoning}. *${insight.action}*`;
}

// Helper function to get business impact summary
export function getBusinessImpactSummary(insights: ExecutiveInsight[]): string {
  const highUrgencyCount = insights.filter(i => i.urgency === 'high').length;
  if (highUrgencyCount >= 2) {
    return 'Multiple high-priority issues require immediate executive attention to prevent AI initiative failure.';
  } else if (highUrgencyCount === 1) {
    return 'One critical issue requires immediate attention, while other areas support strategic development.';
  } else {
    return 'No critical blockers identified - focus on systematic capability development and optimization.';
  }
}