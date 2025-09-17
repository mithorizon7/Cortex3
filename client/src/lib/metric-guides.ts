// Metric-specific "How to measure" micro-guides (150-250 words each)
// Follows specification: Definition, Scope, How to get it, Quality note, Cadence

export interface MetricGuide {
  metricId: string;
  title: string;
  content: string;
}

export const METRIC_GUIDES: Record<string, MetricGuide> = {
  // C — Clarity & Command
  c_initiatives_ai_outcomes: {
    metricId: 'c_initiatives_ai_outcomes',
    title: '% strategic initiatives with explicit AI outcomes',
    content: `**Definition:** Count strategic initiatives (typically 10-50 per organization) that explicitly define AI success metrics in their charter.

**Scope:** Include all enterprise initiatives, transformation programs, and major projects. Count as "AI-explicit" only if outcomes specify measurable AI impact (cost savings, efficiency gains, etc.).

**How to get it:** Review initiative charters, quarterly business reviews, or strategy documentation. Simple tally: initiatives with AI outcomes / total strategic initiatives.

**Quality note:** Focus on meaningful measurement, not just "AI mentioned." Look for specific targets like "reduce processing time by 30% using AI" rather than vague "explore AI opportunities."

**Cadence:** Quarterly review aligns with most strategic planning cycles.`
  },

  c_reallocation_ai_driven: {
    metricId: 'c_reallocation_ai_driven',
    title: '% reallocation decisions driven by AI results',
    content: `**Definition:** Track quarterly budget reallocations, headcount changes, or resource shifts that cite AI performance data as primary justification.

**Scope:** Include significant resource moves (>$100K or >2 FTE equivalent). Count decisions where AI metrics directly influenced the choice.

**How to get it:** Review quarterly budget adjustments, resource allocation meetings, and leadership decision logs. Look for explicit references to AI performance.

**Quality note:** Focus on data-driven decisions, not hunches. The decision should reference specific AI metrics or outcomes.

**Cadence:** Quarterly tracking aligns with budget cycles.`
  },

  c_leadership_ai_agenda: {
    metricId: 'c_leadership_ai_agenda',
    title: '% leadership reviews with AI on the agenda',
    content: `**Definition:** Count formal leadership reviews (board, executive team, division reviews) where AI progress appears as dedicated agenda item.

**Scope:** Include board meetings, C-suite reviews, and division leadership meetings. Exclude casual mentions; require dedicated agenda time.

**How to get it:** Track meeting agendas for 3-6 months. Simple count: meetings with AI agenda item / total leadership meetings.

**Quality note:** Look for substantive AI discussion (15+ minutes), not just brief updates. Quality of discussion matters more than mere presence.

**Cadence:** Quarterly assessment of meeting patterns.`
  },

  // O — Operations & Data
  o_value_gate_pass: {
    metricId: 'o_value_gate_pass',
    title: '% AI use-cases passing the value gate',
    content: `**Definition:** Track use-cases that pass formal value screening (business case, technical feasibility, resource requirements) and get approved for development.

**Scope:** Count all AI use-cases that enter formal evaluation. Include both pilot and production proposals. Gate should assess value, feasibility, and fit.

**How to get it:** Maintain a simple log of use-cases evaluated vs. approved. Most organizations review 5-20 use-cases per quarter initially.

**Quality note:** Ensure the gate has real criteria, not rubber-stamp approval. Healthy pass rate is typically 30-60% as screening improves.

**Cadence:** Monthly tracking as use-case flow increases.`
  },

  o_latency_availability: {
    metricId: 'o_latency_availability',
    title: 'p95 latency or service availability of AI endpoints',
    content: `**Definition:** Measure 95th percentile response time for AI API calls or overall availability percentage for AI services over a month.

**Scope:** Include end-to-end latency from user request to AI response. For availability, count uptime of AI-dependent user features.

**How to get it:** Use application monitoring tools (APM), load balancers, or simple logging. Focus on user-facing performance, not internal processing time.

**Quality note:** Track real user impact, not just model inference time. Include network, authentication, and data pipeline delays.

**Cadence:** Monthly monitoring with weekly alerts for threshold breaches.`
  },

  o_drift_incidents: {
    metricId: 'o_drift_incidents',
    title: 'Drift incidents acknowledged and resolved',
    content: `**Definition:** Count instances where model performance degrades significantly (accuracy drop >5%, bias shift, data quality issues) and requires intervention.

**Scope:** Include prediction drift, data drift, and concept drift. Focus on issues that affect user experience or business outcomes.

**How to get it:** Monitor model performance metrics, user feedback, and business KPIs. Set thresholds for "significant" drift based on your risk tolerance.

**Quality note:** Track both detection speed and resolution time. Healthy organizations catch drift early through automated monitoring.

**Cadence:** Quarterly assessment of drift management effectiveness.`
  },

  // R — Risk, Trust, Security & Assurance
  r_mttr: {
    metricId: 'r_mttr',
    title: 'AI incidents mean time to resolve (MTTR)',
    content: `**Definition:** Track time from AI incident detection (bias, failure, security issue) to full resolution and normal operations.

**Scope:** Include model failures, bias incidents, data breaches, and performance degradations that affect users. Start timer at first alert or user report.

**How to get it:** Use incident management system or simple log. Track: incident start time, escalation points, and resolution confirmation.

**Quality note:** Focus on business impact resolution, not just technical fixes. Include communication, investigation, and prevention steps.

**Cadence:** Monthly MTTR calculation with quarterly trend analysis.`
  },

  r_hitl_coverage: {
    metricId: 'r_hitl_coverage',
    title: '% high-impact AI systems with Human-in-the-Loop (HITL) active',
    content: `**Definition:** Count high-impact AI systems (affect >100 users, handle sensitive data, or make significant decisions) that have active human oversight mechanisms.

**Scope:** Include credit decisions, medical recommendations, hiring tools, and content moderation. Human-in-the-Loop (HITL) means human review, approval, or exception handling.

**How to get it:** Inventory AI systems by impact level, then verify human oversight mechanisms are operational (not just designed).

**Quality note:** Focus on active oversight, not passive monitoring. Humans should have authority to intervene and clear escalation paths.

**Cadence:** Quarterly verification of Human-in-the-Loop (HITL) effectiveness.`
  },

  r_audit_pass_rate: {
    metricId: 'r_audit_pass_rate',
    title: 'Audit/assurance pass rate',
    content: `**Definition:** Track formal AI audits, assessments, or reviews that achieve satisfactory/passing results without major corrective actions.

**Scope:** Include internal audits, external reviews, regulatory assessments, and vendor security reviews of AI systems.

**How to get it:** Maintain audit log with results. Pass = no critical findings requiring immediate remediation. Minor recommendations are acceptable.

**Quality note:** Focus on substantive reviews, not checkbox exercises. Healthy pass rate improves over time as processes mature.

**Cadence:** Quarterly tracking of audit activities and outcomes.`
  },

  // T — Talent & Culture
  t_adoption: {
    metricId: 't_adoption',
    title: '% target roles actively using AI weekly',
    content: `**Definition:** Count employees in AI-target roles (analysts, developers, marketers, etc.) who actively use AI tools at least weekly for work tasks.

**Scope:** Define "target roles" based on your AI strategy. Focus on roles where AI provides clear value. "Active use" means meaningful work application, not experimentation.

**How to get it:** Use tool usage logs, surveys, or manager assessments. Track consistent usage patterns, not one-time trials.

**Quality note:** Measure productive usage that improves work outcomes. Avoid vanity metrics like "signed up for AI tool."

**Cadence:** Monthly pulse checks on adoption trends.`
  },

  t_training_coverage: {
    metricId: 't_training_coverage',
    title: '% target roles trained in last 12 months',
    content: `**Definition:** Track completion of role-appropriate AI training programs (technical training for developers, prompt engineering for analysts, etc.).

**Scope:** Include formal training, certifications, and structured learning programs. Match training content to role requirements.

**How to get it:** Use learning management systems, HR records, or department tracking. Count completion of core curriculum, not just enrollment.

**Quality note:** Focus on job-relevant training that builds practical skills. Generic "AI overview" sessions have limited value.

**Cadence:** Quarterly assessment of training completion and effectiveness.`
  },

  t_sop_redesign: {
    metricId: 't_sop_redesign',
    title: '% redesigned SOPs/tasks that embed AI + checkpoints',
    content: `**Definition:** Count standard operating procedures, workflows, or job tasks that have been formally updated to include AI tools with appropriate checkpoints.

**Scope:** Include customer service scripts, analysis workflows, content creation processes, etc. Must specify AI integration points and quality controls.

**How to get it:** Review process documentation, workflow systems, and procedure manuals. Look for explicit AI integration with checkpoint mechanisms.

**Quality note:** Focus on thoughtful integration, not just "use AI somewhere." Good SOPs specify when to use AI, when to escalate, and how to verify outputs.

**Cadence:** Quarterly review of process modernization efforts.`
  },

  // E — Ecosystem & Infrastructure
  e_unit_cost: {
    metricId: 'e_unit_cost',
    title: 'Unit cost of AI',
    content: `**Definition:** Track total AI costs (APIs, compute, storage, tools) divided by usage units (tokens, calls, requests) to get cost per unit with month-over-month trend.

**Scope:** Include all AI-related expenses: model APIs, cloud compute, data processing, tools, and infrastructure. Normalize by usage volume.

**How to get it:** Aggregate cloud bills, vendor invoices, and tool subscriptions. Divide by usage metrics from API logs or usage dashboards.

**Quality note:** Track total cost of ownership, not just model inference. Include data pipeline, storage, and tooling costs for complete picture.

**Cadence:** Monthly cost analysis with quarterly optimization reviews.`
  },

  e_quota_breach_rate: {
    metricId: 'e_quota_breach_rate',
    title: 'Quota/limit breach rate',
    content: `**Definition:** Count instances where AI services hit rate limits, quota caps, or license restrictions that block or delay user requests.

**Scope:** Include API rate limits, token quotas, concurrent user limits, and license restrictions. Focus on user-impacting breaches.

**How to get it:** Monitor API responses for 429 errors, quota warnings, and license limit notifications. Track both frequency and duration of limits.

**Quality note:** Some limits are protective (preventing runaway costs), others indicate capacity constraints. Focus on limits that impact user experience.

**Cadence:** Monthly monitoring with real-time alerting for critical breaches.`
  },

  e_dual_readiness: {
    metricId: 'e_dual_readiness',
    title: '% critical paths with dual vendor/region readiness tested',
    content: `**Definition:** Count critical AI dependencies (primary model APIs, data sources, infrastructure) that have tested backup options (alternate vendors, regions, or approaches).

**Scope:** Focus on AI components that would significantly impact business if unavailable. "Tested" means actual failover validation, not just contracts.

**How to get it:** Inventory critical AI dependencies, identify backup options, and track successful failover tests. Include vendor, regional, and technical alternatives.

**Quality note:** Regular testing is essential—backup options degrade without use. Focus on business continuity, not just technical redundancy.

**Cadence:** Quarterly testing with annual comprehensive review.`
  },

  // X — Experimentation & Evolution
  x_pilot_throughput: {
    metricId: 'x_pilot_throughput',
    title: 'Pilot throughput',
    content: `**Definition:** Track the flow from AI ideas through pilot execution to go/no-go decisions. Measure both volume and conversion rates across stages.

**Scope:** Include all AI experiments, pilot projects, and innovation initiatives. Track ideas generated, pilots launched, and decisions made.

**How to get it:** Maintain innovation pipeline tracking. Count: submitted ideas, approved pilots, completed pilots, and final decisions (scale/stop/pivot).

**Quality note:** Balance speed with quality. High throughput with low learning indicates rushed pilots. Aim for fast, decisive learning cycles.

**Cadence:** Quarterly assessment of innovation pipeline health.`
  },

  x_retirement_rate: {
    metricId: 'x_retirement_rate',
    title: '% pilots retired on schedule',
    content: `**Definition:** Track pilots that reach planned end dates and are properly shut down versus those that continue without clear justification or promotion decision.

**Scope:** Include all pilots with defined end dates. "Retired on schedule" means clean shutdown or clear promotion/scale decision by planned date.

**How to get it:** Track pilot timelines and end-state decisions. Count pilots that meet their planned conclusion versus those that drift indefinitely.

**Quality note:** Healthy organizations sunset pilots decisively. Avoiding hard decisions creates "zombie pilots" that consume resources without value.

**Cadence:** Quarterly review of pilot lifecycle management.`
  },

  x_time_to_learning: {
    metricId: 'x_time_to_learning',
    title: 'Time-to-learning',
    content: `**Definition:** Track time from pilot launch to clear go/no-go decision. Focus on speed of learning, not speed of development.

**Scope:** Include all AI pilots with clear learning objectives. Start timer at pilot kick-off, stop at final scale/stop/pivot decision.

**How to get it:** Maintain pilot timeline data. Calculate median time across completed pilots. Track both technical and business learning cycles.

**Quality note:** Optimize for learning speed, not feature development speed. Fast failure is often more valuable than slow success.

**Cadence:** Quarterly analysis of learning cycle efficiency.`
  }
};

// Get metric guide by ID
export function getMetricGuide(metricId: string): MetricGuide | undefined {
  return METRIC_GUIDES[metricId];
}

// Get all metric guides for a pillar
export function getMetricGuidesByPillar(pillar: string): MetricGuide[] {
  return Object.values(METRIC_GUIDES).filter(guide => 
    guide.metricId.startsWith(pillar.toLowerCase())
  );
}