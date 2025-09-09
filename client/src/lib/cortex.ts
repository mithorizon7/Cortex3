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
  { key: 'regulatory_intensity', label: 'Regulatory Intensity', description: 'Level of regulatory oversight and compliance requirements', type: 'slider' as const },
  { key: 'data_sensitivity', label: 'Data Sensitivity', description: 'Sensitivity level of data handled', type: 'slider' as const },
  { key: 'safety_criticality', label: 'Safety Criticality', description: 'Potential impact of AI failures on safety', type: 'slider' as const },
  { key: 'brand_exposure', label: 'Brand Exposure', description: 'Public visibility and reputational risk', type: 'slider' as const },
  { key: 'clock_speed', label: 'Market Clock Speed', description: 'Pace of change in your market/technology', type: 'slider' as const },
  { key: 'latency_edge', label: 'Latency/Edge Needs', description: 'Requirements for low-latency or edge computing', type: 'slider' as const },
  { key: 'scale_throughput', label: 'Scale/Throughput', description: 'Volume and scale requirements', type: 'slider' as const },
  { key: 'data_advantage', label: 'Proprietary Data Advantage', description: 'Uniqueness and value of your data assets', type: 'slider' as const },
  { key: 'build_readiness', label: 'Build Readiness', description: 'Organizational capability for building AI systems', type: 'slider' as const },
  { key: 'finops_priority', label: 'FinOps Priority', description: 'Importance of cost optimization and financial operations', type: 'slider' as const },
  { key: 'procurement_constraints', label: 'Procurement Constraints', description: 'Significant procurement or vendor restrictions', type: 'boolean' as const },
  { key: 'edge_operations', label: 'Edge Operations', description: 'Operations at network edge or remote locations', type: 'boolean' as const },
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
