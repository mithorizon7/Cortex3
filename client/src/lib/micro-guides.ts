export interface MicroGuide {
  id: string;
  title: string;
  category: 'gate' | 'pillar' | 'context';
  pillar?: string;
  tags: string[];
  overview: string;
  whyNeeded: string;
  steps: Array<{
    order: number;
    title: string;
    description: string;
    timeframe: string;
    complexity: 'low' | 'medium' | 'high';
    resources?: string[];
    dependencies?: string[];
  }>;
  examples?: Array<{
    scenario: string;
    approach: string;
    outcome: string;
  }>;
  risks?: Array<{
    risk: string;
    mitigation: string;
  }>;
  metrics?: Array<{
    name: string;
    description: string;
    target: string;
  }>;
}

export const MICRO_GUIDES: Record<string, MicroGuide> = {
  // Gate-specific guides
  g1_regulatory: {
    id: 'g1_regulatory',
    title: 'AI Governance for Regulated Industries',
    category: 'gate',
    tags: ['regulatory', 'compliance', 'governance'],
    overview: 'Establish comprehensive AI governance framework to meet regulatory requirements and maintain social license to operate.',
    whyNeeded: 'High regulatory intensity requires proactive compliance measures. Failure to implement proper governance can result in fines, operational restrictions, and reputational damage.',
    steps: [
      {
        order: 1,
        title: 'Establish AI Governance Committee',
        description: 'Create cross-functional committee with legal, compliance, technology, and business representation',
        timeframe: '2-4 weeks',
        complexity: 'medium',
        resources: ['Legal counsel', 'Compliance officer', 'CTO/technology lead'],
        dependencies: ['Executive sponsorship']
      },
      {
        order: 2,
        title: 'Develop AI Risk Framework',
        description: 'Create systematic approach to identify, assess, and mitigate AI-related risks',
        timeframe: '6-8 weeks',
        complexity: 'high',
        resources: ['Risk management consultant', 'Data scientist', 'Legal expert'],
        dependencies: ['Governance committee establishment']
      },
      {
        order: 3,
        title: 'Implement Documentation Requirements',
        description: 'Create templates and processes for AI system documentation and impact assessments',
        timeframe: '4-6 weeks',
        complexity: 'medium',
        resources: ['Technical writer', 'Compliance specialist'],
        dependencies: ['Risk framework completion']
      }
    ],
    examples: [
      {
        scenario: 'Financial Services Company',
        approach: 'Established AI Ethics Board with external advisors, implemented model risk management framework aligned with OCC guidance',
        outcome: 'Successful regulatory examination, reduced time-to-market for AI products by 40%'
      },
      {
        scenario: 'Healthcare Organization',
        approach: 'Created HIPAA-compliant AI governance with medical affairs oversight, implemented bias testing protocols',
        outcome: 'FDA breakthrough device designation, maintained 100% compliance during audit'
      }
    ],
    risks: [
      {
        risk: 'Regulatory changes outpace governance updates',
        mitigation: 'Establish monitoring system for regulatory developments, quarterly governance review cycles'
      },
      {
        risk: 'Governance becomes bureaucratic bottleneck',
        mitigation: 'Implement risk-based approval processes, delegate authority for low-risk applications'
      }
    ],
    metrics: [
      {
        name: 'Compliance Coverage',
        description: 'Percentage of AI systems with completed risk assessments',
        target: '100%'
      },
      {
        name: 'Review Cycle Time',
        description: 'Average time from AI proposal to governance approval',
        target: '<14 days for standard risk'
      }
    ]
  },

  g2_data_protection: {
    id: 'g2_data_protection',
    title: 'Data Protection and Privacy Controls',
    category: 'gate',
    tags: ['data_governance', 'privacy', 'security'],
    overview: 'Implement comprehensive data protection measures for AI systems handling sensitive information.',
    whyNeeded: 'High data sensitivity requires robust protection mechanisms. Data breaches can result in significant fines, legal liability, and loss of customer trust.',
    steps: [
      {
        order: 1,
        title: 'Data Classification and Inventory',
        description: 'Classify all data assets by sensitivity level and create comprehensive inventory',
        timeframe: '4-6 weeks',
        complexity: 'medium',
        resources: ['Data governance team', 'Information security specialist'],
        dependencies: []
      },
      {
        order: 2,
        title: 'Privacy-Preserving Techniques',
        description: 'Implement differential privacy, federated learning, or synthetic data generation',
        timeframe: '8-12 weeks',
        complexity: 'high',
        resources: ['Privacy engineer', 'ML specialist', 'Security architect'],
        dependencies: ['Data classification complete']
      },
      {
        order: 3,
        title: 'Access Control Implementation',
        description: 'Deploy role-based access controls with principle of least privilege',
        timeframe: '3-4 weeks',
        complexity: 'medium',
        resources: ['Identity management team', 'Security engineer'],
        dependencies: ['Data inventory complete']
      }
    ],
    examples: [
      {
        scenario: 'E-commerce Platform',
        approach: 'Implemented federated learning for recommendation systems, synthetic data for testing',
        outcome: 'Reduced privacy risk exposure by 85%, maintained model accuracy within 2%'
      }
    ],
    risks: [
      {
        risk: 'Performance degradation from privacy measures',
        mitigation: 'Benchmark privacy-utility tradeoffs, implement adaptive privacy budgets'
      }
    ],
    metrics: [
      {
        name: 'Data Exposure Incidents',
        description: 'Number of privacy incidents involving AI systems',
        target: '0 per quarter'
      }
    ]
  },

  // Pillar-specific guides
  clarity_strategy: {
    id: 'clarity_strategy',
    title: 'AI Strategy Development',
    category: 'pillar',
    pillar: 'C',
    tags: ['strategy', 'leadership', 'governance'],
    overview: 'Develop clear, measurable AI strategy aligned with business objectives.',
    whyNeeded: 'Without clear strategy, AI initiatives become fragmented pilots that consume resources without delivering business value.',
    steps: [
      {
        order: 1,
        title: 'Define AI Ambition',
        description: 'Articulate specific, measurable outcomes AI will deliver for the business',
        timeframe: '2-3 weeks',
        complexity: 'medium',
        resources: ['Strategy consultant', 'Business leaders', 'AI subject matter expert']
      },
      {
        order: 2,
        title: 'Assess AI Readiness',
        description: 'Evaluate current capabilities across data, technology, and people dimensions',
        timeframe: '3-4 weeks',
        complexity: 'medium',
        resources: ['Assessment team', 'Technical architect', 'HR business partner']
      },
      {
        order: 3,
        title: 'Prioritize Use Cases',
        description: 'Use value vs. feasibility matrix to select initial AI applications',
        timeframe: '2-3 weeks',
        complexity: 'low',
        resources: ['Business analysts', 'Data scientists', 'Product managers']
      }
    ],
    metrics: [
      {
        name: 'Strategy Alignment',
        description: 'Percentage of AI projects aligned to strategic priorities',
        target: '90%'
      }
    ]
  },

  operations_monitoring: {
    id: 'operations_monitoring',
    title: 'AI Operations and Monitoring',
    category: 'pillar',
    pillar: 'O',
    tags: ['monitoring', 'operations', 'reliability'],
    overview: 'Establish robust monitoring and operational processes for AI systems in production.',
    whyNeeded: 'AI systems require specialized monitoring for model drift, bias, and performance degradation that traditional monitoring cannot detect.',
    steps: [
      {
        order: 1,
        title: 'Implement Model Monitoring',
        description: 'Deploy automated monitoring for data drift, concept drift, and prediction quality',
        timeframe: '6-8 weeks',
        complexity: 'high',
        resources: ['MLOps engineer', 'Data scientist', 'Platform engineer']
      },
      {
        order: 2,
        title: 'Create Alerting Framework',
        description: 'Define thresholds and escalation procedures for different types of model degradation',
        timeframe: '2-3 weeks',
        complexity: 'medium',
        resources: ['Operations team', 'Data science team', 'SRE']
      },
      {
        order: 3,
        title: 'Establish Retraining Pipeline',
        description: 'Automate model retraining and deployment when drift is detected',
        timeframe: '4-6 weeks',
        complexity: 'high',
        resources: ['MLOps engineer', 'DevOps engineer', 'Data engineer']
      }
    ],
    metrics: [
      {
        name: 'Model Performance SLA',
        description: 'Percentage of models meeting performance thresholds',
        target: '95%'
      }
    ]
  }
};

export function getMicroGuidesByTags(tags: string[]): MicroGuide[] {
  return Object.values(MICRO_GUIDES).filter(guide =>
    guide.tags.some(tag => tags.includes(tag))
  );
}

export function getMicroGuidesByPillar(pillar: string): MicroGuide[] {
  return Object.values(MICRO_GUIDES).filter(guide =>
    guide.pillar === pillar
  );
}

export function getMicroGuidesByCategory(category: MicroGuide['category']): MicroGuide[] {
  return Object.values(MICRO_GUIDES).filter(guide =>
    guide.category === category
  );
}