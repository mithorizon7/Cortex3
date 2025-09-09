import type { ContextProfile } from "@shared/schema";

// Metric definition interface
export interface Metric {
  id: string;
  pillar: string;
  name: string;
  definition: string;
  unit: string;
  unitHint: string;
  tags: string[];
  howToMeasure: string;
  isDefault?: boolean;
}

// Value overlay data for assessments
export interface ValueOverlay {
  [pillar: string]: {
    metric_id: string;
    name: string;
    baseline: number | null;
    target: number | null;
    unit: string;
    cadence: 'monthly' | 'quarterly';
  };
}

// Complete metric catalog
export const METRIC_CATALOG: Metric[] = [
  // C — Clarity & Command
  {
    id: 'c_initiatives_ai_outcomes',
    pillar: 'C',
    name: '% strategic initiatives with explicit AI outcomes',
    definition: 'Share of enterprise initiatives that name a measurable AI impact (e.g., cycle-time reduction, cost-to-serve, risk reduction).',
    unit: '%',
    unitHint: 'percentage',
    tags: ['strategic', 'leadership'],
    howToMeasure: `**Definition:** Share of enterprise initiatives that name a measurable AI impact (e.g., cycle-time reduction, cost-to-serve, risk reduction).

**How to measure:** Count initiatives in your plan; count those with explicit AI outcome metrics; divide. Review quarterly.

**Why it helps:** Keeps AI tied to strategy and makes reallocation easier.`,
    isDefault: true
  },
  {
    id: 'c_reallocation_ai_driven',
    pillar: 'C',
    name: '% reallocation decisions driven by AI results',
    definition: 'Budget/resource decisions per quarter based on AI performance data',
    unit: '%',
    unitHint: 'percentage',
    tags: ['financial', 'decisions'],
    howToMeasure: `**Definition:** Track quarterly budget reallocations, headcount changes, or resource shifts that cite AI performance data as primary justification.

**Scope:** Include significant resource moves (>$100K or >2 FTE equivalent). Count decisions where AI metrics directly influenced the choice.

**How to get it:** Review quarterly budget adjustments, resource allocation meetings, and leadership decision logs. Look for explicit references to AI performance.

**Quality note:** Focus on data-driven decisions, not hunches. The decision should reference specific AI metrics or outcomes.

**Cadence:** Quarterly tracking aligns with budget cycles.`
  },
  {
    id: 'c_leadership_ai_agenda',
    pillar: 'C',
    name: '% leadership reviews with AI on the agenda',
    definition: 'Executive review meetings that include AI progress as agenda item',
    unit: '%',
    unitHint: 'percentage',
    tags: ['governance', 'leadership'],
    howToMeasure: `**Definition:** Count formal leadership reviews (board, executive team, division reviews) where AI progress appears as dedicated agenda item.

**Scope:** Include board meetings, C-suite reviews, and division leadership meetings. Exclude casual mentions; require dedicated agenda time.

**How to get it:** Track meeting agendas for 3-6 months. Simple count: meetings with AI agenda item / total leadership meetings.

**Quality note:** Look for substantive AI discussion (15+ minutes), not just brief updates. Quality of discussion matters more than mere presence.

**Cadence:** Quarterly assessment of meeting patterns.`
  },

  // O — Operations & Data  
  {
    id: 'o_value_gate_pass',
    pillar: 'O',
    name: '% AI use-cases passing the value gate',
    definition: 'Share of proposed use-cases that clear a basic value/feasibility screen.',
    unit: '%',
    unitHint: 'percentage',
    tags: ['screening', 'value'],
    howToMeasure: `**Definition:** Share of proposed use-cases that clear a basic value/feasibility screen.

**How to measure:** Track proposals and approvals in a simple register.

**Why it helps:** Encourages disciplined selection; reduces zombie pilots.`,
    isDefault: true
  },
  {
    id: 'o_latency_availability',
    pillar: 'O',
    name: 'p95 latency or service availability of AI endpoints',
    definition: 'End-to-end performance of AI services',
    unit: 'ms/%',
    unitHint: 'milliseconds or percentage',
    tags: ['performance', 'technical'],
    howToMeasure: `**Definition:** Measure 95th percentile response time for AI API calls or overall availability percentage for AI services over a month.

**Scope:** Include end-to-end latency from user request to AI response. For availability, count uptime of AI-dependent user features.

**How to get it:** Use application monitoring tools (APM), load balancers, or simple logging. Focus on user-facing performance, not internal processing time.

**Quality note:** Track real user impact, not just model inference time. Include network, authentication, and data pipeline delays.

**Cadence:** Monthly monitoring with weekly alerts for threshold breaches.`
  },
  {
    id: 'o_drift_incidents',
    pillar: 'O',
    name: 'Drift incidents acknowledged and resolved',
    definition: 'Model drift issues identified and addressed per quarter',
    unit: 'count',
    unitHint: 'number per quarter',
    tags: ['quality', 'monitoring'],
    howToMeasure: `**Definition:** Count instances where model performance degrades significantly (accuracy drop >5%, bias shift, data quality issues) and requires intervention.

**Scope:** Include prediction drift, data drift, and concept drift. Focus on issues that affect user experience or business outcomes.

**How to get it:** Monitor model performance metrics, user feedback, and business KPIs. Set thresholds for "significant" drift based on your risk tolerance.

**Quality note:** Track both detection speed and resolution time. Healthy organizations catch drift early through automated monitoring.

**Cadence:** Quarterly assessment of drift management effectiveness.`
  },

  // R — Risk, Trust, Security & Assurance
  {
    id: 'r_mttr',
    pillar: 'R',
    name: 'AI incidents mean time to resolve (MTTR)',
    definition: 'Average time from detection to resolution for AI-related incidents.',
    unit: 'hours',
    unitHint: 'hours or days',
    tags: ['incident', 'response'],
    howToMeasure: `**Definition:** Average time from detection to resolution for AI-related incidents.

**How to measure:** Timestamp incidents, resolution, and severity; calculate the mean monthly.

**Why it helps:** Focuses teams on fast, calm recovery and learning.`,
    isDefault: true
  },
  {
    id: 'r_hitl_coverage',
    pillar: 'R',
    name: '% high-impact AI systems with HITL active',
    definition: 'Critical AI systems with human-in-the-loop oversight',
    unit: '%',
    unitHint: 'percentage',
    tags: ['oversight', 'safety'],
    howToMeasure: `**Definition:** Count high-impact AI systems (affect >100 users, handle sensitive data, or make significant decisions) that have active human oversight mechanisms.

**Scope:** Include credit decisions, medical recommendations, hiring tools, and content moderation. HITL means human review, approval, or exception handling.

**How to get it:** Inventory AI systems by impact level, then verify human oversight mechanisms are operational (not just designed).

**Quality note:** Focus on active oversight, not passive monitoring. Humans should have authority to intervene and clear escalation paths.

**Cadence:** Quarterly verification of HITL effectiveness.`
  },
  {
    id: 'r_audit_pass_rate',
    pillar: 'R',
    name: 'Audit/assurance pass rate',
    definition: 'Internal/external AI reviews passed in last 12 months',
    unit: '%',
    unitHint: 'percentage',
    tags: ['compliance', 'assurance'],
    howToMeasure: `**Definition:** Track formal AI audits, assessments, or reviews that achieve satisfactory/passing results without major corrective actions.

**Scope:** Include internal audits, external reviews, regulatory assessments, and vendor security reviews of AI systems.

**How to get it:** Maintain audit log with results. Pass = no critical findings requiring immediate remediation. Minor recommendations are acceptable.

**Quality note:** Focus on substantive reviews, not checkbox exercises. Healthy pass rate improves over time as processes mature.

**Cadence:** Quarterly tracking of audit activities and outcomes.`
  },

  // T — Talent & Culture
  {
    id: 't_adoption',
    pillar: 'T',
    name: '% target roles actively using AI weekly',
    definition: 'Adoption rate in roles you expect to benefit from AI.',
    unit: '%',
    unitHint: 'percentage',
    tags: ['adoption', 'usage'],
    howToMeasure: `**Definition:** Adoption rate in roles you expect to benefit from AI.

**How to measure:** Survey or system logs; count active users vs. target population.

**Why it helps:** Tracks real usage, not just training completions.`,
    isDefault: true
  },
  {
    id: 't_training_coverage',
    pillar: 'T',
    name: '% target roles trained in last 12 months',
    definition: 'Role-based AI training completion rates',
    unit: '%',
    unitHint: 'percentage',
    tags: ['training', 'skills'],
    howToMeasure: `**Definition:** Track completion of role-appropriate AI training programs (technical training for developers, prompt engineering for analysts, etc.).

**Scope:** Include formal training, certifications, and structured learning programs. Match training content to role requirements.

**How to get it:** Use learning management systems, HR records, or department tracking. Count completion of core curriculum, not just enrollment.

**Quality note:** Focus on job-relevant training that builds practical skills. Generic "AI overview" sessions have limited value.

**Cadence:** Quarterly assessment of training completion and effectiveness.`
  },
  {
    id: 't_sop_redesign',
    pillar: 'T',
    name: '% redesigned SOPs/tasks that embed AI + checkpoints',
    definition: 'Work processes updated to integrate AI with quality controls',
    unit: '%',
    unitHint: 'percentage',
    tags: ['process', 'integration'],
    howToMeasure: `**Definition:** Count standard operating procedures, workflows, or job tasks that have been formally updated to include AI tools with appropriate checkpoints.

**Scope:** Include customer service scripts, analysis workflows, content creation processes, etc. Must specify AI integration points and quality controls.

**How to get it:** Review process documentation, workflow systems, and procedure manuals. Look for explicit AI integration with checkpoint mechanisms.

**Quality note:** Focus on thoughtful integration, not just "use AI somewhere." Good SOPs specify when to use AI, when to escalate, and how to verify outputs.

**Cadence:** Quarterly review of process modernization efforts.`
  },

  // E — Ecosystem & Infrastructure
  {
    id: 'e_unit_cost',
    pillar: 'E',
    name: 'Unit cost of AI',
    definition: 'Average cost per unit of AI work.',
    unit: '$/call',
    unitHint: 'dollars per unit',
    tags: ['cost', 'finops'],
    howToMeasure: `**Definition:** Average cost per unit of AI work.

**How to measure:** Divide total spend by total units for a period; trend month-to-month.

**Why it helps:** Prevents budget surprises; enables smart scaling.`,
    isDefault: true
  },
  {
    id: 'e_quota_breach_rate',
    pillar: 'E',
    name: 'Quota/limit breach rate',
    definition: 'Rate limits or license caps hit per month',
    unit: 'count',
    unitHint: 'number per month',
    tags: ['limits', 'capacity'],
    howToMeasure: `**Definition:** Count instances where AI services hit rate limits, quota caps, or license restrictions that block or delay user requests.

**Scope:** Include API rate limits, token quotas, concurrent user limits, and license restrictions. Focus on user-impacting breaches.

**How to get it:** Monitor API responses for 429 errors, quota warnings, and license limit notifications. Track both frequency and duration of limits.

**Quality note:** Some limits are protective (preventing runaway costs), others indicate capacity constraints. Focus on limits that impact user experience.

**Cadence:** Monthly monitoring with real-time alerting for critical breaches.`
  },
  {
    id: 'e_dual_readiness',
    pillar: 'E',
    name: '% critical paths with dual vendor/region readiness tested',
    definition: 'Critical AI dependencies with verified backup options',
    unit: '%',
    unitHint: 'percentage',
    tags: ['resilience', 'redundancy'],
    howToMeasure: `**Definition:** Count critical AI dependencies (primary model APIs, data sources, infrastructure) that have tested backup options (alternate vendors, regions, or approaches).

**Scope:** Focus on AI components that would significantly impact business if unavailable. "Tested" means actual failover validation, not just contracts.

**How to get it:** Inventory critical AI dependencies, identify backup options, and track successful failover tests. Include vendor, regional, and technical alternatives.

**Quality note:** Regular testing is essential—backup options degrade without use. Focus on business continuity, not just technical redundancy.

**Cadence:** Quarterly testing with annual comprehensive review.`
  },

  // X — Experimentation & Evolution
  {
    id: 'x_pilot_throughput',
    pillar: 'X',
    name: 'Pilot throughput',
    definition: 'Ideas → pilots → decisions per quarter.',
    unit: 'count',
    unitHint: 'number per quarter',
    tags: ['innovation', 'velocity'],
    howToMeasure: `**Definition:** Ideas → pilots → decisions per quarter.

**How to measure:** Maintain a simple pipeline and count stage transitions.

**Why it helps:** Shows learning velocity and portfolio discipline.`,
    isDefault: true
  },
  {
    id: 'x_retirement_rate',
    pillar: 'X',
    name: '% pilots retired on schedule',
    definition: 'Sunset logic honored for completed pilots',
    unit: '%',
    unitHint: 'percentage',
    tags: ['discipline', 'sunset'],
    howToMeasure: `**Definition:** Track pilots that reach planned end dates and are properly shut down versus those that continue without clear justification or promotion decision.

**Scope:** Include all pilots with defined end dates. "Retired on schedule" means clean shutdown or clear promotion/scale decision by planned date.

**How to get it:** Track pilot timelines and end-state decisions. Count pilots that meet their planned conclusion versus those that drift indefinitely.

**Quality note:** Healthy organizations sunset pilots decisively. Avoiding hard decisions creates "zombie pilots" that consume resources without value.

**Cadence:** Quarterly review of pilot lifecycle management.`
  },
  {
    id: 'x_time_to_learning',
    pillar: 'X',
    name: 'Time-to-learning',
    definition: 'Median days from pilot start to decision',
    unit: 'days',
    unitHint: 'days',
    tags: ['speed', 'learning'],
    howToMeasure: `**Definition:** Track time from pilot launch to clear go/no-go decision. Focus on speed of learning, not speed of development.

**Scope:** Include all AI pilots with clear learning objectives. Start timer at pilot kick-off, stop at final scale/stop/pivot decision.

**How to get it:** Maintain pilot timeline data. Calculate median time across completed pilots. Track both technical and business learning cycles.

**Quality note:** Optimize for learning speed, not feature development speed. Fast failure is often more valuable than slow success.

**Cadence:** Quarterly analysis of learning cycle efficiency.`
  }
];

// Context-aware default selection logic
export function getContextAwareDefaults(contextProfile: ContextProfile): { [pillar: string]: string } {
  const defaults: { [pillar: string]: string } = {
    C: 'c_initiatives_ai_outcomes',
    O: 'o_value_gate_pass', 
    R: 'r_mttr',
    T: 't_adoption',
    E: 'e_unit_cost',
    X: 'x_pilot_throughput'
  };

  // Apply context-aware adjustments
  if (contextProfile.regulatory_intensity >= 3 || contextProfile.safety_criticality >= 3) {
    defaults.R = 'r_mttr'; // Keep AI incidents MTTR as priority
  }

  if (contextProfile.clock_speed >= 3) {
    defaults.X = 'x_pilot_throughput'; // Emphasize innovation speed
  }

  if (contextProfile.scale_throughput >= 3 || contextProfile.latency_edge >= 3) {
    defaults.O = 'o_latency_availability'; // Focus on performance
  }

  if (contextProfile.data_sensitivity >= 3) {
    // Keep existing default but note audit pass rate as important alternate
  }

  if (contextProfile.build_readiness <= 1) {
    defaults.T = 't_adoption'; // Focus on adoption for early-stage organizations
  }

  if (contextProfile.finops_priority >= 3) {
    defaults.E = 'e_unit_cost'; // Emphasize cost management
  }

  return defaults;
}

// Get context explanation for why a metric was selected
export function getMetricContextExplanation(metricId: string, contextProfile: ContextProfile): string | null {
  const explanations: { [key: string]: (profile: ContextProfile) => string | null } = {
    r_mttr: (profile) => {
      const factors = [];
      if (profile.regulatory_intensity >= 3) factors.push('high regulatory intensity');
      if (profile.safety_criticality >= 3) factors.push('high safety criticality');
      return factors.length > 0 ? `Selected due to ${factors.join(' and ')}` : null;
    },
    o_latency_availability: (profile) => {
      const factors = [];
      if (profile.scale_throughput >= 3) factors.push('high scale requirements');
      if (profile.latency_edge >= 3) factors.push('latency-sensitive operations');
      return factors.length > 0 ? `Selected due to ${factors.join(' and ')}` : null;
    },
    x_pilot_throughput: (profile) => {
      return profile.clock_speed >= 3 ? 'Selected due to high clock speed requirements' : null;
    },
    e_unit_cost: (profile) => {
      return profile.finops_priority >= 3 ? 'Selected due to high FinOps priority' : null;
    },
    t_adoption: (profile) => {
      return profile.build_readiness <= 1 ? 'Selected due to early-stage AI readiness' : null;
    }
  };

  return explanations[metricId]?.(contextProfile) || null;
}

// Get metric by ID
export function getMetricById(metricId: string): Metric | undefined {
  return METRIC_CATALOG.find(m => m.id === metricId);
}

// Get metrics by pillar
export function getMetricsByPillar(pillar: string): Metric[] {
  return METRIC_CATALOG.filter(m => m.pillar === pillar);
}

// Get default metric for pillar
export function getDefaultMetricForPillar(pillar: string): Metric | undefined {
  return METRIC_CATALOG.find(m => m.pillar === pillar && m.isDefault);
}

// Initialize value overlay with defaults
export function initializeValueOverlay(contextProfile: ContextProfile): ValueOverlay {
  const defaults = getContextAwareDefaults(contextProfile);
  const overlay: ValueOverlay = {};

  Object.entries(defaults).forEach(([pillar, metricId]) => {
    const metric = getMetricById(metricId);
    if (metric) {
      overlay[pillar] = {
        metric_id: metricId,
        name: metric.name,
        baseline: null,
        target: null,
        unit: metric.unit,
        cadence: pillar === 'X' ? 'quarterly' : 'monthly' // Default cadence based on pillar
      };
    }
  });

  return overlay;
}