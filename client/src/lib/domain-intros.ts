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
        note: 'Pair outcome reviews with basic assurance evidence before scale.'
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
        note: 'Confirm data residency/retention and vendor data-use terms for prompts, logs, and indices.'
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
        note: 'Use Human-in-the-Loop (HITL) until evidence supports automation; run checks on a fixed cadence.'
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
        note: 'Emphasize adoption and workflow design before heavy building or tuning.'
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
        condition: 'clock_speed >= 3 || scale >= 3',
        note: 'Favor choices that balance reliability and the ability to pivot quickly.'
      },
      {
        condition: 'sensitivity >= 3',
        note: 'Confirm data residency/retention and vendor data-use terms for prompts, logs, and indices.'
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
        note: 'Include offline/latency tests in pilots; define fallback behavior.'
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