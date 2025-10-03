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
  { id: 'C1', pillar: 'C', text: 'A short, written AI ambition exists and names the business outcomes it aims to move.' },
  { id: 'C2', pillar: 'C', text: 'A single senior leader is accountable for AI outcomes, and responsibilities between the central enablement team and business units are defined.' },
  { id: 'C3', pillar: 'C', text: 'AI work is reviewed on a set schedule and those reviews lead to resource shifts (fund, pause, stop, or scale).' },
  
  { id: 'O1', pillar: 'O', text: 'AI solutions you run or consume follow a repeatable operating process that tracks quality, reliability, and cost, with human review where stakes are high.' },
  { id: 'O2', pillar: 'O', text: 'The key data and prompts these solutions rely on have named owners, usage rules, and quality expectations that are easy to find.' },
  { id: 'O3', pillar: 'O', text: 'New AI ideas—build or buy—pass a simple value and feasibility screen before major spend or effort.' },
  
  { id: 'R1', pillar: 'R', text: 'You keep an up‑to‑date list of AI systems and vendor services, with risk level and a named risk owner for each.' },
  { id: 'R2', pillar: 'R', text: 'Higher‑impact uses are checked on a schedule for fairness, privacy, and quality, and your critical systems are periodically security‑tested.' },
  { id: 'R3', pillar: 'R', text: 'Your AI controls have had a recent independent review (internal or external), and you have a short incident response and communications plan.' },
  
  { id: 'T1', pillar: 'T', text: 'A written plan exists to attract, develop, and retain the AI‑related skills your strategy requires.' },
  { id: 'T2', pillar: 'T', text: 'People in AI‑touching roles have had role‑appropriate training in the last year, and key workflows were updated to use AI safely and productively.' },
  { id: 'T3', pillar: 'T', text: 'Wins, failures, and lessons from AI use are shared on a regular rhythm, and incentives support safe, effective adoption.' },
  
  { id: 'E1', pillar: 'E', text: 'Capacity and licences scale with demand, and you have clear visibility into unit costs and quotas so projects are not delayed or surprised by spend.' },
  { id: 'E2', pillar: 'E', text: 'You have strategic model/tool/data partners, and for critical paths you know how you would export, switch, or run a secondary option.' },
  { id: 'E3', pillar: 'E', text: 'Data you exchange with external parties uses governed, auditable routes (for example, approved APIs or clean‑room arrangements).' },
  
  { id: 'X1', pillar: 'X', text: "Teams can experiment safely in a defined space, and you maintain a simple practice for scanning what's changing outside (tech, policy, competitors)." },
  { id: 'X2', pillar: 'X', text: 'A small, protected slice of time, budget, or credits is reserved for exploratory or high‑uncertainty work each year.' },
  { id: 'X3', pillar: 'X', text: "Every pilot has clear success and stop criteria with a decision date, and pilots that don't meet the mark are retired or redirected on time." },
];

// Conversational Context Profile - Executive-friendly flow
export const CONTEXT_SCREENS = [
  {
    id: 1,
    title: "Your Industry Environment",
    subtitle: "Let's understand your operating context",
    questions: ['regulatory_intensity', 'safety_criticality', 'brand_exposure']
  },
  {
    id: 2, 
    title: "Data & Operations",
    subtitle: "Tell us about your data and operational requirements",
    questions: ['data_sensitivity', 'latency_edge', 'scale_throughput']
  },
  {
    id: 3,
    title: "Capabilities & Strategy", 
    subtitle: "Help us understand your competitive position and strategic maturity",
    questions: ['data_advantage', 'build_readiness', 'clock_speed', 'finops_priority']
  },
  {
    id: 4,
    title: "Operational Constraints",
    subtitle: "Just a couple quick questions about special requirements",
    questions: ['procurement_constraints', 'edge_operations']
  }
];

export const CONTEXT_ITEMS = [
  { 
    key: 'regulatory_intensity', 
    label: 'How regulated is your industry?', 
    description: 'This helps us understand compliance requirements that will affect your AI strategy.', 
    type: 'slider' as const,
    anchors: ['No regulatory oversight', 'Industry guidance and best practices', 'Some specific rules and requirements', 'Regular audits and prescriptive requirements', 'Heavily regulated with multiple regimes'],
    labels: ['None', 'Guidance', 'Some Rules', 'Audited', 'Heavily Regulated'],
    examples: ['Software/Tech', 'Professional Services', 'Manufacturing', 'Banking/Insurance', 'Healthcare/Pharma']
  },
  { 
    key: 'data_sensitivity', 
    label: 'What kind of data do you work with?', 
    description: 'This determines privacy and security requirements for your AI systems.', 
    type: 'slider' as const,
    anchors: ['Public information only', 'Internal business data', 'Confidential company information', 'Personal data and trade secrets', 'Healthcare/payment data with regional processing requirements'],
    labels: ['Public', 'Internal', 'Confidential', 'PII/Trade Secrets', 'PHI/PCI + Regional'],
    examples: ['Marketing content', 'Sales reports', 'Strategic plans', 'Customer records', 'Medical/payment data']
  },
  { 
    key: 'safety_criticality', 
    label: 'How critical is system reliability?', 
    description: 'This affects how much human oversight and testing your AI systems will need.', 
    type: 'slider' as const,
    anchors: ['Minimal harm from system failures', 'User inconvenience or minor disruptions', 'Costly business mistakes and financial impact', 'Serious legal, financial, or operational consequences', 'Physical safety risks or systemic threats'],
    labels: ['Low Harm', 'Inconvenience', 'Costly Mistakes', 'Serious Impact', 'Physical Safety'],
    examples: ['Internal tools', 'Customer support', 'Financial decisions', 'Medical diagnoses', 'Transportation/industrial']
  },
  { 
    key: 'brand_exposure', 
    label: 'How much public scrutiny do you face?', 
    description: 'This determines how carefully we need to manage AI-related reputation risks.', 
    type: 'slider' as const,
    anchors: ['High tolerance for AI experimentation', 'Minor brand impact from AI issues', 'Meaningful reputational consequences possible', 'Major brand damage from AI failures', 'Existential threat to organization if AI goes wrong'],
    labels: ['Tolerant', 'Minor Risk', 'Meaningful Risk', 'Major Risk', 'Existential Risk'],
    examples: ['B2B software', 'Regional business', 'Known brand', 'Public company', 'Global household name']
  },
  { 
    key: 'clock_speed', 
    label: 'How fast does your market change?', 
    description: 'This affects how quickly you need to deploy and iterate on AI solutions.', 
    type: 'slider' as const,
    anchors: ['Changes measured in years', 'Quarterly business cycles', 'Monthly technology updates', 'Weekly competitive moves', 'Frontier pace with constant innovation'],
    labels: ['Annual', 'Quarterly', 'Monthly', 'Weekly', 'Frontier Pace'],
    examples: ['Utilities/Government', 'Traditional retail', 'SaaS/Tech', 'Social media/Gaming', 'Crypto/AI research']
  },
  { 
    key: 'latency_edge', 
    label: 'How fast must your systems respond?', 
    description: 'This determines whether your AI can run in the cloud or needs edge deployment.', 
    type: 'slider' as const,
    anchors: ['Multi-second response times acceptable', 'Sub-second response required', 'Under 500ms latency needed', 'Under 200ms for critical operations', 'Offline capability or air-gapped requirements'],
    labels: ['Seconds OK', '<1s', '<500ms', '<200ms', 'Offline/Edge'],
    examples: ['Batch analysis', 'User interfaces', 'Real-time dashboards', 'Trading/gaming', 'Manufacturing/autonomous systems']
  },
  { 
    key: 'scale_throughput', 
    label: 'What scale of operations do you run?', 
    description: 'This affects infrastructure requirements and cost considerations for AI deployment.', 
    type: 'slider' as const,
    anchors: ['Small internal team usage', 'Department-wide deployment', 'Enterprise-scale across organization', 'High-traffic external systems', 'Hyperscale with millions of interactions'],
    labels: ['Small Internal', 'Department', 'Enterprise', 'High-Traffic', 'Hyperscale'],
    examples: ['Team of 10-50', '100-1000 employees', '1000+ employees', 'Consumer app', 'Global platform']
  },
  { 
    key: 'data_advantage', 
    label: 'Do you have unique data assets?', 
    description: 'This determines whether you should build custom AI models or use off-the-shelf solutions.', 
    type: 'slider' as const,
    anchors: ['No significant data advantage', 'Small competitive benefit from data', 'Moderate advantage from unique datasets', 'Strong competitive moat from proprietary data', 'Large advantage with clear rights and fresh, labeled data'],
    labels: ['None', 'Small', 'Moderate', 'Strong', 'Large & Clear'],
    examples: ['Standard industry data', 'Some customer insights', 'Proprietary transaction data', 'Unique behavioral data', 'Exclusive data partnerships']
  },
  { 
    key: 'build_readiness', 
    label: 'What\'s your AI development capability?', 
    description: 'This determines whether you should build internally, partner, or buy AI solutions.', 
    type: 'slider' as const,
    anchors: ['No internal AI development capability', 'Early pilots and proof-of-concepts', 'Basic infrastructure and processes in place', 'Mature Center of Excellence with MLOps and governance', 'Industrialized AI development and deployment'],
    labels: ['None', 'Early Pilots', 'Basics in Place', 'Mature CoE', 'Industrialized'],
    examples: ['All buy decisions', 'First AI experiments', 'Some data science team', 'AI Center of Excellence', 'AI-first organization']
  },
  { 
    key: 'finops_priority', 
    label: 'How important is cost control?', 
    description: 'This affects which AI solutions we recommend and how we structure deployment.', 
    type: 'slider' as const,
    anchors: ['Cost is not a primary concern', 'Moderate attention to cost efficiency', 'Balanced focus on value and cost', 'High priority on cost optimization', 'Strict per-unit budgets and cost controls required'],
    labels: ['Low', 'Med-Low', 'Medium', 'High', 'Strict Budgets'],
    examples: ['Value over cost', 'Cost-conscious', 'Balanced approach', 'Budget-focused', 'Every dollar matters']
  },
  { 
    key: 'procurement_constraints', 
    label: 'Do you have procurement requirements?', 
    description: 'Answer YES if you deal with government RFPs, security clearances, multi-layered approval processes, or mandatory vendor certifications.', 
    type: 'boolean' as const
  },
  { 
    key: 'edge_operations', 
    label: 'Do you operate industrial systems?', 
    description: 'Answer YES if you run manufacturing equipment, field operations with intermittent connectivity, SCADA systems, or autonomous vehicles that can\'t rely on constant internet access.', 
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
  // Use floor to get the base stage for fractional scores (e.g., 1.5 -> stage 1)
  const stageIndex = Math.floor(stage);
  return MATURITY_STAGES[stageIndex]?.color || '#64748b';
}

export function getPriorityLevel(pillarScores: PillarScores, contextProfile: ContextProfile): { pillar: string; priority: number }[] {
  // Guard against null/undefined pillarScores
  if (!pillarScores) {
    return [];
  }
  
  const priorities = Object.entries(pillarScores)
    .map(([pillar, score]) => ({ pillar, score }))
    .sort((a, b) => a.score - b.score); // Lowest scores first (highest priority)
  
  return priorities.map((item, index) => ({
    pillar: item.pillar,
    priority: item.score <= 1 ? index + 1 : 0 // Only assign priority to emerging/nascent stages
  }));
}