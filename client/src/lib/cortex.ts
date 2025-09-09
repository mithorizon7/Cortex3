import { ContextProfile, PillarScores, Gate } from "@shared/schema";

export const CORTEX_PILLARS = {
  C: { name: "Clarity & Command", icon: "bullseye", description: "Leadership owns a value-anchored AI ambition and operating model" },
  O: { name: "Operations & Data", icon: "cogs", description: "Reliable, monitored AI in production with governed data" },
  R: { name: "Risk, Trust & Security", icon: "shield-alt", description: "Demonstrable safety, fairness, privacy, and security" },
  T: { name: "Talent & Culture", icon: "users", description: "Skills, incentives, and job redesign for AI adoption" },
  E: { name: "Ecosystem & Infrastructure", icon: "network-wired", description: "Partners and platform capacity that scale economically" },
  X: { name: "Experimentation & Evolution", icon: "flask", description: "Safe, disciplined learning cycles with clear success/sunset criteria" }
};

export const PULSE_QUESTIONS = [
  { id: 'C1', pillar: 'C', text: 'Top leadership has approved a written AI ambition with measurable business outcomes.' },
  { id: 'C2', pillar: 'C', text: 'One senior leader owns AI success and CoE↔BU roles are clear.' },
  { id: 'C3', pillar: 'C', text: 'AI progress is reviewed on a set cadence and leads to resource reallocation (fund/defund) decisions.' },
  
  { id: 'O1', pillar: 'O', text: 'All AI solutions you operate or consume follow a documented lifecycle with performance logging and HITL/QA where needed.' },
  { id: 'O2', pillar: 'O', text: 'Key data/prompts have documented owners, lineage, and quality standards in an accessible catalogue.' },
  { id: 'O3', pillar: 'O', text: 'Every new AI idea—build or buy—clears a standardized value/feasibility gate before major spend.' },
  
  { id: 'R1', pillar: 'R', text: 'A living inventory lists each AI system/service with risk level and named risk owner.' },
  { id: 'R2', pillar: 'R', text: 'High-impact AI undergoes scheduled fairness/privacy/drift checks and periodic security red-teaming.' },
  { id: 'R3', pillar: 'R', text: 'AI controls have been reviewed (internal or external) in ≤12 months, and an incident response & communication plan exists.' },
  
  { id: 'T1', pillar: 'T', text: 'There\'s a written plan to attract, develop, and retain the AI skills strategy requires.' },
  { id: 'T2', pillar: 'T', text: 'Most AI-touching roles completed role-appropriate training and tasks have been redesigned to use AI safely/productively.' },
  { id: 'T3', pillar: 'T', text: 'AI wins, failures, and lessons are shared company-wide on a regular rhythm with incentives to adopt.' },
  
  { id: 'E1', pillar: 'E', text: 'Compute/licence/API capacity scales to demand and is cost-monitored (FinOps) so projects aren\'t delayed or derailed by spend.' },
  { id: 'E2', pillar: 'E', text: 'You maintain strategic model/tool/data partners and documented exit/portability plans to avoid lock-in.' },
  { id: 'E3', pillar: 'E', text: 'Data exchange with external parties occurs only via governed, auditable, interoperable mechanisms (secure APIs, clean rooms).' },
  
  { id: 'X1', pillar: 'X', text: 'Business teams have a safe sandbox with representative data and a structured practice of external scanning.' },
  { id: 'X2', pillar: 'X', text: 'A defined slice of budget/time/credits is reserved each year for exploratory/high-uncertainty AI work.' },
  { id: 'X3', pillar: 'X', text: 'All AI pilots include success and sunset criteria; non-performers are consistently retired or redirected on schedule.' },
];

export const CONTEXT_ITEMS = [
  { 
    key: 'regulatory_intensity', 
    label: 'Regulatory Intensity', 
    description: 'How heavily regulated is your industry or business unit?', 
    type: 'slider' as const,
    anchors: ['No regulatory oversight', 'Industry guidance and best practices', 'Some specific rules and requirements', 'Regular audits and prescriptive requirements', 'Heavily regulated with multiple regimes'],
    labels: ['None', 'Guidance', 'Some Rules', 'Audited', 'Heavily Regulated']
  },
  { 
    key: 'data_sensitivity', 
    label: 'Data Sensitivity & Residency', 
    description: 'What level of data sensitivity and residency requirements do you have?', 
    type: 'slider' as const,
    anchors: ['Public information only', 'Internal business data', 'Confidential company information', 'Personal data and trade secrets', 'Healthcare/payment data with regional processing requirements'],
    labels: ['Public', 'Internal', 'Confidential', 'PII/Trade Secrets', 'PHI/PCI + Regional']
  },
  { 
    key: 'safety_criticality', 
    label: 'Safety/Mission Criticality', 
    description: 'How critical is system reliability and safety in your operations?', 
    type: 'slider' as const,
    anchors: ['Minimal harm from system failures', 'User inconvenience or minor disruptions', 'Costly business mistakes and financial impact', 'Serious legal, financial, or operational consequences', 'Physical safety risks or systemic threats'],
    labels: ['Low Harm', 'Inconvenience', 'Costly Mistakes', 'Serious Impact', 'Physical Safety']
  },
  { 
    key: 'brand_exposure', 
    label: 'Brand/PR Exposure', 
    description: 'What level of public scrutiny and brand risk does your organization face?', 
    type: 'slider' as const,
    anchors: ['High tolerance for AI experimentation', 'Minor brand impact from AI issues', 'Meaningful reputational consequences possible', 'Major brand damage from AI failures', 'Existential threat to organization if AI goes wrong'],
    labels: ['Tolerant', 'Minor Risk', 'Meaningful Risk', 'Major Risk', 'Existential Risk']
  },
  { 
    key: 'clock_speed', 
    label: 'Market/Tech Clock-Speed', 
    description: 'How fast does your market or technology environment change?', 
    type: 'slider' as const,
    anchors: ['Changes measured in years', 'Quarterly business cycles', 'Monthly technology updates', 'Weekly competitive moves', 'Frontier pace with constant innovation'],
    labels: ['Annual', 'Quarterly', 'Monthly', 'Weekly', 'Frontier Pace']
  },
  { 
    key: 'latency_edge', 
    label: 'Latency/Edge Dependence', 
    description: 'How sensitive are your operations to response time and connectivity?', 
    type: 'slider' as const,
    anchors: ['Multi-second response times acceptable', 'Sub-second response required', 'Under 500ms latency needed', 'Under 200ms for critical operations', 'Offline capability or air-gapped requirements'],
    labels: ['Seconds OK', '<1s', '<500ms', '<200ms', 'Offline/Edge']
  },
  { 
    key: 'scale_throughput', 
    label: 'Scale/Throughput Requirements', 
    description: 'What scale of operations and throughput do you need to support?', 
    type: 'slider' as const,
    anchors: ['Small internal team usage', 'Department-wide deployment', 'Enterprise-scale across organization', 'High-traffic external systems', 'Hyperscale with millions of interactions'],
    labels: ['Small Internal', 'Department', 'Enterprise', 'High-Traffic', 'Hyperscale']
  },
  { 
    key: 'data_advantage', 
    label: 'Proprietary Data Advantage', 
    description: 'How much competitive advantage do you have from your data assets?', 
    type: 'slider' as const,
    anchors: ['No significant data advantage', 'Small competitive benefit from data', 'Moderate advantage from unique datasets', 'Strong competitive moat from proprietary data', 'Large advantage with clear rights and fresh, labeled data'],
    labels: ['None', 'Small', 'Moderate', 'Strong', 'Large & Clear']
  },
  { 
    key: 'build_readiness', 
    label: 'Build Readiness', 
    description: 'What is your current capability to build and maintain AI systems internally?', 
    type: 'slider' as const,
    anchors: ['No internal AI development capability', 'Early pilots and proof-of-concepts', 'Basic infrastructure and processes in place', 'Mature Center of Excellence with MLOps and governance', 'Industrialized AI development and deployment'],
    labels: ['None', 'Early Pilots', 'Basics in Place', 'Mature CoE', 'Industrialized']
  },
  { 
    key: 'finops_priority', 
    label: 'FinOps Priority', 
    description: 'How important is cost optimization and financial controls for AI initiatives?', 
    type: 'slider' as const,
    anchors: ['Cost is not a primary concern', 'Moderate attention to cost efficiency', 'Balanced focus on value and cost', 'High priority on cost optimization', 'Strict per-unit budgets and cost controls required'],
    labels: ['Low', 'Med-Low', 'Medium', 'High', 'Strict Budgets']
  },
  { 
    key: 'procurement_constraints', 
    label: 'Procurement Constraints', 
    description: 'Do you have public RFP requirements or mandatory vendor selection processes?', 
    type: 'boolean' as const 
  },
  { 
    key: 'edge_operations', 
    label: 'Edge Operations', 
    description: 'Do you operate OT/SCADA systems, field robots, or remote vehicles?', 
    type: 'boolean' as const 
  },
];

export const MATURITY_STAGES = [
  { level: 0, name: 'Nascent', description: 'Ad hoc, minimal capability, no consistent practices', color: '#64748b' },
  { level: 1, name: 'Emerging', description: 'Early structures exist; partial coverage and inconsistent execution', color: '#ef4444' },
  { level: 2, name: 'Integrated', description: 'Documented practices, clear ownership, reliable execution at scale', color: '#3b82f6' },
  { level: 3, name: 'Leading', description: 'Institutionalized capabilities, continuous improvement, and measurable business impact', color: '#10b981' },
];

// Equal-area ring calculations for honeycomb radar
export function calculateRingRadius(stage: number, maxRadius: number = 60): number {
  if (stage === 0) return 0;
  return maxRadius * Math.sqrt(stage / 3);
}

// Generate hexagon points for radar chart
export function generateHexagonPoints(centerX: number, centerY: number, radius: number): string {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 - Math.PI / 2; // Start from top
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  return points.join(' ');
}

// Calculate pillar positions for hexagon
export function getPillarPosition(pillarIndex: number, radius: number, centerX: number = 200, centerY: number = 200) {
  const angle = (pillarIndex * Math.PI) / 3 - Math.PI / 2; // Start from top
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle)
  };
}

export function getStageColor(stage: number): string {
  return MATURITY_STAGES[stage]?.color || '#64748b';
}

export function getPriorityLevel(pillarScores: PillarScores, contextProfile: ContextProfile): { pillar: string; priority: number }[] {
  const priorities = Object.entries(pillarScores)
    .map(([pillar, score]) => ({ pillar, score }))
    .sort((a, b) => a.score - b.score); // Lowest scores first (highest priority)
  
  return priorities.map((item, index) => ({
    pillar: item.pillar,
    priority: item.score <= 1 ? index + 1 : 0 // Only assign priority to emerging/nascent stages
  }));
}
