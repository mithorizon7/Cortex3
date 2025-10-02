/**
 * Domain Introduction Content for CORTEX Assessment
 * Executive-level educational content before each Pulse domain
 */

export interface DomainIntroContent {
  code: string;
  title: string;
  why: string;
  principles: string[];
  signals: string[];
  terms: { term: string; definition: string }[];
  evidence: string[];
  contextNotes?: {
    condition: string;
    note: string;
    severity?: 'awareness' | 'critical'; // Default is 'awareness' if not specified
  }[];
}

export const DOMAIN_INTROS: Record<string, DomainIntroContent> = {
  'C': {
    code: 'C',
    title: 'Clarity & Command',
    why: 'Clear leadership direction turns scattered AI activity into business results. A short written ambition, a single accountable owner with budget authority, and a regular review cadence keep work aligned with outcomes. This avoids duplicated pilots, creates momentum, and ties effort to revenue, cost, and risk.',
    principles: [
      'Publish outcomes, not technologies (what will change for customers or operations)',
      'Name one senior owner; make CoE vs BU roles explicit',
      'Review on a set rhythm and reallocate toward what works',
      'Use common language for value, risk, and safeguards'
    ],
    signals: [
      'A one-page AI ambition linked to strategic objectives',
      'Clear ownership (who enables, who delivers)',
      'Quarterly review that results in fund/defund decisions',
      'Leaders can point to 1–2 measurable AI outcomes this year'
    ],
    terms: [
      { term: 'CoE', definition: 'Center of Excellence: small team that sets standards and enables others' },
      { term: 'BU', definition: 'Business Unit: business unit/function that owns outcomes and adoption' },
      { term: 'RACI', definition: 'Responsible, Accountable, Consulted, Informed: framework for clarifying who does what' },
      { term: 'Reallocation', definition: 'shifting budget/time based on evidence' }
    ],
    evidence: [
      'AI ambition doc',
      'Named executive owner',
      'RACI of CoE↔BU',
      'Last review notes showing funding decisions'
    ],
    contextNotes: [
      {
        condition: 'regulated >= 3',
        note: 'Your regulatory environment requires pairing outcome reviews with assurance evidence. Before answering C3, identify which compliance artifacts you\'ll track alongside business metrics.',
        severity: 'awareness'
      },
      {
        condition: 'regulated >= 4 && build_readiness <= 1',
        note: 'CRITICAL: Heavy regulation + limited technical capability is a challenging combination. Focus C1 on risk reduction first, growth second. Your AI ambition should explicitly address compliance as a primary outcome.',
        severity: 'critical'
      },
      {
        condition: 'clock_speed >= 4',
        note: 'Your fast-moving market demands rapid iteration. Consider whether C3\'s "set schedule" should be monthly or even bi-weekly rather than quarterly.',
        severity: 'awareness'
      },
      {
        condition: 'brand_exposure >= 4 && safety_criticality >= 3',
        note: 'High visibility + safety risks mean AI failures become headlines. Ensure C2\'s accountable leader has crisis communications authority and board-level backing.',
        severity: 'critical'
      },
      {
        condition: 'data_advantage >= 4 && clock_speed >= 3',
        note: 'Your competitive data advantage erodes quickly in fast markets. C1 should prioritize proprietary data leverage over generic AI capabilities.',
        severity: 'awareness'
      },
      {
        condition: 'finops_priority >= 4',
        note: 'Cost control is paramount for you. Ensure C3 reviews include cost-per-outcome metrics, not just raw AI spend. Consider setting hard budget caps in C1.',
        severity: 'awareness'
      },
      {
        condition: 'procurement_constraints == true',
        note: 'Public sector procurement rules affect your flexibility. C2 should clarify whether your AI owner has contracting authority or needs procurement partnership.',
        severity: 'awareness'
      }
    ]
  },
  'O': {
    code: 'O',
    title: 'Operations & Data',
    why: 'Dependable operations and governed data are the difference between a demo and a durable service. Monitoring, human checks where risk warrants, and a simple intake gate prevent silent failures, surprise costs, and reputational harm.',
    principles: [
      'Run a documented lifecycle: design → deploy → monitor → update → retire',
      'Track latency, errors, drift, and cost; alert on thresholds',
      'Add Human-in-the-Loop (HITL) review and quality assurance where consequences are high',
      'Keep a searchable data catalogue with owners and retention',
      'Screen new ideas with a lightweight value/feasibility gate'
    ],
    signals: [
      'Live dashboards and alerts for the AI you run or consume',
      'Named owners for key data and prompts/indices',
      'A simple two-page intake for new use-cases',
      'Post-incident notes and regular hygiene tasks'
    ],
    terms: [
      { term: 'Lifecycle', definition: 'repeatable steps to run and update AI in production' },
      { term: 'Drift', definition: 'performance changes as inputs or behaviors shift' },
      { term: 'HITL', definition: 'Human-in-the-Loop: human review and intervention for higher-risk actions' },
      { term: 'Catalogue/lineage', definition: 'what data is used, where it came from, who owns it' },
      { term: 'Value gate', definition: 'quick screen for benefit and feasibility' }
    ],
    evidence: [
      'Ops dashboard',
      'Alert rules',
      'Data catalogue entry',
      'Intake form/template',
      'Incident log'
    ],
    contextNotes: [
      {
        condition: 'sensitivity >= 3',
        note: 'Your sensitive data handling requires explicit controls. Before O2, verify: Which regions process your data? What are vendor retention policies? How do you audit data usage in prompts and responses?',
        severity: 'awareness'
      },
      {
        condition: 'sensitivity >= 4 && regulated >= 3',
        note: 'CRITICAL: Highly sensitive data in a regulated environment demands zero-trust architecture. O1 must include data lineage tracking, access logs, and regular compliance audits of AI data flows.',
        severity: 'critical'
      },
      {
        condition: 'latency_edge >= 4',
        note: 'Your extreme latency requirements (<200ms) may preclude cloud AI for critical paths. O1\'s monitoring must track 95th and 99th percentile (p95/p99) latencies, not just averages. Consider edge deployment strategies.',
        severity: 'critical'
      },
      {
        condition: 'scale_throughput >= 4 && finops_priority >= 3',
        note: 'High volume + cost sensitivity creates tension. O3\'s value screen should include unit economics modeling. Track cost-per-request religiously and set automated spend limits.',
        severity: 'awareness'
      },
      {
        condition: 'data_advantage >= 4',
        note: 'Your proprietary data is a competitive moat. O2 should emphasize data governance that prevents leakage while enabling rapid experimentation. Consider data clean rooms for partner collaboration.',
        severity: 'awareness'
      },
      {
        condition: 'edge_operations == true',
        note: 'Edge deployments need special consideration. O1 must account for intermittent connectivity, local model updates, and telemetry buffering. Plan for degraded-mode operations.',
        severity: 'awareness'
      },
      {
        condition: 'build_readiness <= 1 && scale_throughput >= 3',
        note: 'Limited technical maturity + high scale needs is risky. Start with managed services and gradual capability building. O3 should heavily favor buy-vs-build initially.',
        severity: 'critical'
      },
      {
        condition: 'safety_criticality >= 4',
        note: 'Life-critical operations require fail-safe defaults. O1 must include automatic rollback triggers, redundant decision paths, and mandatory human oversight for high-stakes decisions.',
        severity: 'critical'
      }
    ]
  },
  'R': {
    code: 'R',
    title: 'Risk, Trust & Security',
    why: 'Trust makes adoption sustainable. Stakeholders expect you to know what AI you run, the risks it carries, and how you\'ll respond when something goes wrong. Routine checks and a simple incident plan avoid avoidable harm and build credibility with customers, regulators, and boards.',
    principles: [
      'Maintain an AI inventory with owners and risk levels',
      'Schedule fairness, privacy, and performance checks for high-impact uses',
      'Red-team critical systems and test prompt/identity defenses',
      'Keep a one-page incident response plan with roles and communications',
      'Use internal or external assurance when required'
    ],
    signals: [
      'Inventory is current; owners know their role',
      'Evidence of recent checks and fixes',
      'A tested path to triage, escalate, and inform',
      'Summary of assurance or audit within the last 12 months'
    ],
    terms: [
      { term: 'Red-team', definition: 'adversarial testing (e.g., injection, jailbreak, exfiltration)' },
      { term: 'Incident response (IR)', definition: 'how you detect, decide, and communicate' },
      { term: 'Assurance', definition: 'internal audit or third-party review of controls' }
    ],
    evidence: [
      'Inventory register',
      'Last test report',
      'IR runbook',
      'Audit/assurance letter'
    ],
    contextNotes: [
      {
        condition: 'regulated >= 3 || safety >= 3',
        note: 'Your risk profile demands systematic safeguards. R2 should specify monthly fairness/privacy checks and quarterly security assessments. Keep human oversight until you have 6+ months of clean audit logs.',
        severity: 'awareness'
      },
      {
        condition: 'regulated >= 4 && brand_exposure >= 4',
        note: 'CRITICAL: Maximum regulatory + reputational exposure. R3\'s incident response must include regulatory notification procedures (typically within 72 hours) and pre-drafted stakeholder communications.',
        severity: 'critical'
      },
      {
        condition: 'sensitivity >= 4 && scale_throughput >= 3',
        note: 'Processing sensitive data at scale multiplies breach impact. R1 must include automated detection of personally identifiable information (PII), data minimization rules, and regular privacy impact assessments.',
        severity: 'critical'
      },
      {
        condition: 'safety_criticality >= 4',
        note: 'CRITICAL: Safety-critical systems require aerospace-grade reliability. R2 must include formal verification methods, redundant validation, and mandatory kill switches. Consider ISO 26262 or similar frameworks.',
        severity: 'critical'
      },
      {
        condition: 'clock_speed >= 4 && build_readiness >= 3',
        note: 'Fast innovation with strong capabilities needs dynamic risk management. R1 should use automated risk scoring that updates weekly, not annual assessments.',
        severity: 'awareness'
      },
      {
        condition: 'finops_priority >= 4 && regulated >= 3',
        note: 'Cost pressure in regulated environments creates compliance risk. R3 assurance budgets are non-negotiable—frame them as insurance premiums, not overhead.',
        severity: 'awareness'
      },
      {
        condition: 'procurement_constraints == true',
        note: 'Public sector transparency requirements affect incident response. R3 plans must balance disclosure obligations with security concerns. Pre-coordinate with legal/communications.',
        severity: 'awareness'
      },
      {
        condition: 'edge_operations == true && safety_criticality >= 3',
        note: 'Edge AI in safety contexts needs special attention. R2 must cover offline decision auditing, tamper detection, and secure model update channels.',
        severity: 'critical'
      },
      {
        condition: 'brand_exposure >= 4',
        note: 'Your high public profile makes you a target. R2 should explicitly test for adversarial prompts, data poisoning, and model extraction attacks. Consider bug bounty programs.',
        severity: 'awareness'
      }
    ]
  },
  'T': {
    code: 'T',
    title: 'Talent & Culture',
    why: 'Adoption is about work, not tools. People need role-specific skills and updated workflows that show when to use AI, when to verify, and how to escalate. Stories and incentives help good behaviors spread.',
    principles: [
      'Focus on a few job families first; redesign tasks with AI',
      'Provide role-based training tied to those redesigned tasks',
      'Share wins and lessons regularly',
      'Align incentives with safe, effective outcomes'
    ],
    signals: [
      'Before/after task maps for priority roles',
      'Short, relevant training and checklists',
      'Visible stories of what worked and what didn\'t',
      'Incentives that reward quality and reliability, not raw usage'
    ],
    terms: [
      { term: 'SOP', definition: 'Standard Operating Procedure: checklist/procedure for a task' },
      { term: 'Job family', definition: 'a group of similar roles (e.g., CX agents, analysts)' }
    ],
    evidence: [
      'Updated SOPs',
      'Training outline and completion',
      'Internal posts sharing lessons',
      'Recognition criteria'
    ],
    contextNotes: [
      {
        condition: 'build_readiness <= 1',
        note: 'Your current technical capacity suggests focusing on AI adoption over creation. T2 training should emphasize using vendor tools effectively rather than building custom solutions.',
        severity: 'awareness'
      },
      {
        condition: 'clock_speed >= 4 && build_readiness <= 2',
        note: 'CRITICAL: Fast market + limited AI talent is a dangerous gap. T1 must address "buy vs build vs partner" talent strategies. Consider acqui-hires or embedded vendor teams for speed.',
        severity: 'critical'
      },
      {
        condition: 'regulated >= 3 && safety_criticality >= 3',
        note: 'High-stakes environment requires specialized skills. T2 training must cover ethical AI, bias detection, and compliance requirements—not just tool usage.',
        severity: 'awareness'
      },
      {
        condition: 'scale_throughput >= 4',
        note: 'Massive scale requires different talent. T1 should prioritize MLOps engineers and reliability experts over data scientists. Think "AI operations" not "AI experiments."',
        severity: 'awareness'
      },
      {
        condition: 'finops_priority >= 4',
        note: 'Cost consciousness affects talent strategy. T3 incentives should reward efficiency gains and cost-per-outcome improvements, not just AI adoption rates.',
        severity: 'awareness'
      },
      {
        condition: 'data_advantage >= 3 && build_readiness >= 3',
        note: 'Your data assets + technical capability enable competitive advantage. T1 should include plans for retaining key AI talent—they\'re your moat builders.',
        severity: 'awareness'
      },
      {
        condition: 'brand_exposure >= 4 && build_readiness <= 2',
        note: 'High visibility with limited AI maturity creates reputation risk. T2 must include "when NOT to use AI" training to prevent public failures.',
        severity: 'critical'
      },
      {
        condition: 'edge_operations == true',
        note: 'Field operations have unique needs. T2 should cover offline AI usage, sync protocols, and how field teams escalate AI anomalies.',
        severity: 'awareness'
      },
      {
        condition: 'procurement_constraints == true',
        note: 'Public sector has distinct talent challenges. T1 may need to address pay scales, remote work policies, and partnerships with universities to access AI talent.',
        severity: 'awareness'
      }
    ]
  },
  'E': {
    code: 'E',
    title: 'Ecosystem & Infrastructure',
    why: 'Partners and platform choices determine speed, cost, flexibility—and how easily you can switch if needed. Elastic capacity keeps teams moving; portability and clear data terms protect your options.',
    principles: [
      'Track unit cost and watch quotas/limits',
      'Use a small, supported platform set with clear data-use terms',
      'Write portability/exit into contracts for critical paths',
      'Govern data exchange through secure, auditable APIs/clean rooms'
    ],
    signals: [
      'Basic FinOps view (cost per call/tokens; trend)',
      'Documented strategic partners and data agreements',
      'Export formats and secondary options identified for key services',
      'API standards and review process'
    ],
    terms: [
      { term: 'FinOps', definition: 'tracking and managing cloud/AI spend' },
      { term: 'API', definition: 'Application Programming Interface: how systems connect and exchange data' },
      { term: 'DPA', definition: 'Data Processing Agreement: contract terms for how vendors handle your data' },
      { term: 'Clean room', definition: 'controlled environment for data collaboration' },
      { term: 'Portability', definition: 'ability to export/switch with minimal disruption' }
    ],
    evidence: [
      'Cost dashboard',
      'Quota reports',
      'DPA/contract clauses',
      'API gateway policy'
    ],
    contextNotes: [
      {
        condition: 'clock_speed >= 3 || scale_throughput >= 3',
        note: 'Your pace and scale demands flexibility. E2 should map critical dependencies and maintain warm relationships with 2-3 alternative providers. Switching costs are real—plan for them.',
        severity: 'awareness'
      },
      {
        condition: 'sensitivity >= 3',
        note: 'Data sovereignty matters to you. E3 must verify: Where does each vendor store your data? Can you delete it? Do they train on your inputs? Get this in writing before contracting.',
        severity: 'awareness'
      },
      {
        condition: 'finops_priority >= 4 && scale_throughput >= 4',
        note: 'CRITICAL: Extreme scale + cost pressure requires sophisticated FinOps. E1 needs real-time cost monitoring, automatic throttling, and pre-negotiated volume discounts. One runaway process could blow your budget.',
        severity: 'critical'
      },
      {
        condition: 'regulated >= 4 && sensitivity >= 4',
        note: 'Maximum compliance burden for infrastructure. E2 contracts must include right-to-audit, data processing agreements, and sub-processor restrictions. Legal review is mandatory.',
        severity: 'critical'
      },
      {
        condition: 'latency_edge >= 4',
        note: 'Ultra-low latency eliminates most cloud options. E2 should focus on edge providers, local inference, and hybrid architectures. Network topology matters more than compute power.',
        severity: 'critical'
      },
      {
        condition: 'data_advantage >= 4 && clock_speed >= 3',
        note: 'Your proprietary data + fast market creates platform lock-in risk. E3 should mandate portable formats and regular data exports. Never let a vendor become your only copy.',
        severity: 'awareness'
      },
      {
        condition: 'build_readiness <= 2 && scale_throughput >= 3',
        note: 'Limited expertise + high scale needs managed services. E2 should prioritize providers with strong SLAs, 24/7 support, and gradual handoff options as you mature.',
        severity: 'awareness'
      },
      {
        condition: 'edge_operations == true',
        note: 'Edge infrastructure has unique needs. E1 must track bandwidth costs (often > compute), plan for intermittent connectivity, and consider local caching strategies.',
        severity: 'awareness'
      },
      {
        condition: 'procurement_constraints == true',
        note: 'Public procurement rules limit agility. E2 should use framework agreements and blanket purchase orders where possible. Build switching costs into vendor evaluations.',
        severity: 'awareness'
      },
      {
        condition: 'brand_exposure >= 4 && safety_criticality >= 3',
        note: 'High-profile safety-critical systems need bulletproof infrastructure. E2 must include disaster recovery, multi-region failover, and vendor liability coverage for AI failures.',
        severity: 'critical'
      }
    ]
  },
  'X': {
    code: 'X',
    title: 'Experimentation & Evolution',
    why: 'AI changes quickly. Disciplined experimentation—safe sandboxes, small budgets, clear success and sunset criteria—raises learning velocity and prevents "pilot purgatory."',
    principles: [
      'Provide a safe sandbox with representative data and caps',
      'Reserve a small slice of time/credits for exploration',
      'Every pilot has a metric and a decision date',
      'Run a light horizon scan to choose what to test next'
    ],
    signals: [
      'Documented on-ramp for pilots and what\'s allowed',
      'Portfolio view: ideas → pilots → decisions',
      'Pilots retired or scaled on schedule',
      'Brief quarterly note on trends to watch or ignore'
    ],
    terms: [
      { term: 'Sandbox', definition: 'a controlled place to try ideas safely' },
      { term: 'Sunset logic', definition: 'criteria to retire or redirect a pilot' },
      { term: 'Horizon scan', definition: 'periodic review of tech/policy/market shifts' }
    ],
    evidence: [
      'Sandbox guidelines',
      'Pilot register',
      'Decision log',
      'Horizon brief'
    ],
    contextNotes: [
      {
        condition: 'latency_edge >= 3',
        note: 'Your latency constraints affect experimentation. X3 pilots must test edge deployment, offline modes, and graceful degradation. Cloud-only POCs may mislead you.',
        severity: 'awareness'
      },
      {
        condition: 'clock_speed >= 4',
        note: 'Your market moves too fast for lengthy pilots. X3 should use 2-4 week sprints with automatic sunset unless explicitly extended. Speed of learning > perfection.',
        severity: 'critical'
      },
      {
        condition: 'regulated >= 4 && safety_criticality >= 3',
        note: 'CRITICAL: High regulation + safety means experiments can\'t be cavalier. X1 sandbox must have compliance controls, data isolation, and explicit boundaries on what\'s testable.',
        severity: 'critical'
      },
      {
        condition: 'finops_priority >= 4',
        note: 'Cost control extends to experiments. X2 should set hard spending limits per pilot and require ROI projections before moving to production.',
        severity: 'awareness'
      },
      {
        condition: 'data_advantage >= 4 && clock_speed >= 3',
        note: 'Your competitive data edge requires rapid testing. X1 should enable quick experiments on proprietary datasets while preventing data leakage to vendors.',
        severity: 'awareness'
      },
      {
        condition: 'build_readiness >= 4',
        note: 'Strong technical capabilities enable advanced experimentation. X2 could include custom model training, architecture search, or novel approach development.',
        severity: 'awareness'
      },
      {
        condition: 'scale_throughput >= 4 && finops_priority >= 3',
        note: 'High scale experiments get expensive fast. X3 must include cost kill-switches and extrapolation models before full-scale tests.',
        severity: 'awareness'
      },
      {
        condition: 'brand_exposure >= 4',
        note: 'Your visibility means failed experiments become news. X1 sandbox should be completely isolated from production, with clear "beta" labeling if customer-facing.',
        severity: 'awareness'
      },
      {
        condition: 'edge_operations == true',
        note: 'Field testing has unique challenges. X3 should account for deployment logistics, user training time, and rollback procedures for distributed experiments.',
        severity: 'awareness'
      },
      {
        condition: 'procurement_constraints == true',
        note: 'Procurement rules affect experimentation agility. X2 might need special innovation budget authority or pre-approved vendor lists for rapid testing.',
        severity: 'awareness'
      },
      {
        condition: 'build_readiness <= 1 && clock_speed >= 3',
        note: 'Limited capabilities in a fast market is risky. X1 experiments should focus exclusively on vendor tool evaluation, not custom development.',
        severity: 'critical'
      }
    ]
  }
};

export const FOOTER_COPY = {
  title: 'How to answer the next three items',
  instructions: [
    'Mark Yes only if it is fully true today and you could point to evidence.',
    'Mark No if it is not in place.',
    'Mark Unsure if you don\'t know. (This won\'t affect the score; we\'ll flag it as a follow-up.)'
  ]
};