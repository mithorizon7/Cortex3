// Official CORTEX v3.2 Micro-Guides Content Pack
// Organized by ID/slug for routing and content management

export interface MicroGuide {
  id: string;
  title: string;
  category: 'gate' | 'pillar' | 'context';
  pillar?: string;
  tags: string[];
  overview: string;
  body: string;
}

export const MICRO_GUIDES: Record<string, MicroGuide> = {
  // Gate-specific guides (Critical Requirements)
  gate_hitl: {
    id: 'gate.hitl',
    title: 'Human-in-the-Loop (HITL) — When and How to Use It',
    category: 'gate',
    tags: ['regulatory', 'safety', 'oversight'],
    overview: 'A human reviews, approves, or can intervene in AI-assisted decisions where stakes are high (financial exposure, safety, legal or brand risk). HITL is not a permanent brake; it is a temporary guardrail until you have evidence that automation is safe for specific tasks.',
    body: `**What it is:** A human reviews, approves, or can intervene in AI-assisted decisions where stakes are high (financial exposure, safety, legal or brand risk). HITL is not a permanent brake; it is a **temporary guardrail** until you have evidence that automation is safe for specific tasks.

**Why it matters:** Complex systems fail in unexpected ways. HITL prevents single‑point failures from harming customers or the organization while you learn how the system behaves. It also builds regulator and stakeholder confidence that you're balancing innovation with care.

**Where to apply:**
• Decisions that affect people's money, health, safety, or legal rights
• Situations with unclear or evolving rules
• New AI capabilities where you have limited real‑world evidence

**How to implement (lightweight):**
1. **Define checkpoints:** Identify specific steps where a person must review/approve (e.g., before sending customer‑facing messages or changing account status).
2. **Document criteria:** When is human review mandatory? Use simple rules (risk level, data sensitivity, exception flags).
3. **Design for intervention:** Provide a clear "stop/correct/escalate" path in the workflow; log every intervention to learn patterns.
4. **Measure & taper:** Track intervention rates and error types. As quality stabilizes and evidence grows, reduce HITL to spot‑checks or exception handling.

**Options by context:**
• **Regulated/high‑safety:** Keep HITL longer and document reviewer qualifications.
• **Low‑risk internal tasks:** Start with spot‑checks on samples; expand only if issues appear.
• **Vendor tools:** Ensure you can *insert* human review before actions are finalized (e.g., draft‑mode outputs).

**Pitfalls to avoid:**
• "Rubber‑stamp" reviews (HITL that no one meaningfully performs)
• No logging—losing the chance to learn from interventions
• Keeping HITL forever out of habit after evidence supports automation

**Quick checklist:** Decide where HITL applies; write short criteria; enable intervene/escalate; log and review monthly; set conditions for tapering.`
  },

  gate_assurance: {
    id: 'gate.assurance',
    title: 'AI Assurance — A Simple Cadence That Works',
    category: 'gate',
    tags: ['regulatory', 'monitoring', 'compliance'],
    overview: 'A small set of routine checks for high‑impact AI: fairness/privacy tests, model and data drift monitoring, and adversarial probing (red‑teaming). The goal is not perfection; it's early detection and a documented response.',
    body: `**What it is:** A small set of **routine checks** for high‑impact AI: fairness/privacy tests, model and data drift monitoring, and **adversarial probing** (red‑teaming). The goal is not perfection; it's **early detection** and a documented response.

**Why it matters:** AI systems change over time—inputs shift, behaviors drift, attackers adapt. A predictable cadence prevents the surprise failure nobody saw coming. In regulated settings, it also demonstrates reasonable care.

**How to implement in weeks:**
1. **Scope:** List the few AI systems that could materially affect customers or the business.
2. **Fairness & privacy:** Define a couple of **observable** checks (e.g., outcome differences across groups where appropriate; presence of sensitive data in logs).
3. **Drift monitoring:** Track a basic drift signal on inputs and outputs; alert on significant deviations.
4. **Red‑team:** Once per quarter, attempt **prompt‑injection/jailbreaks** and data exfiltration on critical systems; document results and fixes.
5. **Review:** Summarize findings and remediation in a short note; escalate trends at leadership reviews.

**Options by context:**
• **Heavily regulated:** Add third‑party or internal audit annually.
• **Low risk:** Scale the cadence by impact (e.g., semiannual checks).
• **Vendor services:** Ask for attestations, then **spot‑check** using your data and use‑cases.

**Pitfalls:**
• Running checks once and declaring victory
• No triage or owner for failed checks
• Over‑testing everything (focus attention on high‑impact systems)

**Quick checklist:** Identify high‑impact AI; set monthly drift checks; quarterly red‑teams; assign an owner; file a one‑page summary.`
  },

  gate_residency: {
    id: 'gate.residency',
    title: 'Data Residency & Retention — Practical Guardrails',
    category: 'gate',
    tags: ['data_governance', 'privacy', 'compliance'],
    overview: 'Rules that keep sensitive data in the right place (jurisdiction) and for the right time (retention). For AI, also decide how prompts, outputs, and logs are handled.',
    body: `**What it is:** Rules that keep sensitive data in the right **place** (jurisdiction) and for the right **time** (retention). For AI, also decide how prompts, outputs, and logs are handled.

**Why it matters:** Data flows through prompts, embeddings, caches, logs, and vendors. Residency/retention guardrails reduce legal and reputational risk and clarify vendor responsibilities.

**How to implement:**
1. **Classify sensitivity:** Decide which data is public, internal, confidential, or regulated (PII/PHI/PCI).
2. **Set residency:** For sensitive data, use in‑region processing where required; confirm vendor regions.
3. **Retention defaults:** Keep prompts/outputs/logs only as long as needed for troubleshooting and audits; set a default (e.g., 30 days) and purge automatically.
4. **Control vendor training:** Specify in contracts whether vendors can train on your inputs/outputs—use "no" by default for sensitive contexts.

**Options:**
• **Buy:** Prefer vendors with explicit region support and clear data‑use terms.
• **Build:** Keep sensitive logs segregated; anonymize and redact where feasible.
• **Hybrid:** Route only non‑sensitive fields to external APIs; process the rest in‑house.

**Pitfalls:**
• Assuming logs are harmless; they often contain sensitive content
• Retention set to "forever" by default
• Contracts with ambiguous data‑use rights

**Quick checklist:** Classify; set regional controls; configure retention; confirm vendor data‑use terms; audit quarterly.`
  },

  gate_latency: {
    id: 'gate.latency',
    title: 'Latency & Offline Readiness — Designing for Reality',
    category: 'gate',
    tags: ['performance', 'edge', 'availability'],
    overview: 'Setting performance expectations (e.g., p95 latency under 200ms) and designing a fallback for degraded networks or offline scenarios.',
    body: `**What it is:** Setting performance expectations (e.g., p95 latency under 200ms) and designing a fallback for degraded networks or offline scenarios.

**Why it matters:** In field operations, retail, manufacturing, or customer‑facing apps, delays or outages can break the experience or halt work. Designing for "graceful degradation" keeps you useful when networks or services hiccup.

**How to implement:**
1. **Define SLOs:** Pick a realistic p95 latency target and uptime goal for each critical flow.
2. **Fallback mode:** Decide what happens when the model or API is slow/unavailable—cache, simpler model, or rule‑based response.
3. **Test it:** Include latency faults in testing; verify the fallback works and is reversible.
4. **Monitor:** Track actual latency and fallback usage; alert when you exceed thresholds.

**Options:**
• **Low stakes:** Accept higher latency with clear messaging.
• **High stakes/edge:** Use smaller local models or cached responses for core tasks.

**Pitfalls:**
• Designing only for ideal networks
• No fallback defined, which forces downtime
• Failing to test real‑world latency patterns

**Quick checklist:** Set SLO; define fallback; test quarterly; monitor p95 and fallback rate.`
  },

  gate_scale: {
    id: 'gate.scale',
    title: 'Hardening for Scale — Before Prime Time',
    category: 'gate',
    tags: ['scale', 'performance', 'reliability'],
    overview: 'Basic preparation so your AI service holds up under traffic spikes: load tests, rate‑limit plans, and dual‑region or secondary options for critical paths.',
    body: `**What it is:** Basic preparation so your AI service holds up under traffic spikes: load tests, rate‑limit plans, and dual‑region or secondary options for critical paths.

**Why it matters:** Success brings traffic—and that's when brittle systems fail. A few simple steps prevent outages and protect customer trust.

**How to implement:**
1. **Load test:** Simulate realistic peak loads; measure latency/error curves.
2. **Rate‑limit & back‑pressure:** Agree on limits and throttling behavior; protect upstream systems.
3. **Secondary path:** For critical flows, define a backup (another region, provider, or cached result) and **test the switch**.
4. **Operational playbook:** Who scales up? Who flips to backup? Where do we communicate status?

**Pitfalls:**
• Treating a successful pilot as "ready for scale"
• No rate‑limits; upstream dependencies collapse under pressure
• Unpracticed failover

**Quick checklist:** Load test; set rate limits; test backup; write a one‑page playbook.`
  },

  gate_buildreadiness: {
    id: 'gate.buildreadiness',
    title: 'Build Carefully — Earn the Right to Go Heavy',
    category: 'gate',
    tags: ['readiness_building', 'strategy'],
    overview: 'If your internal pipelines, governance, and team are early, defer heavy fine‑tuning or pretraining. Start with off‑the‑shelf tools, APIs, and retrieval‑augmented generation (RAG).',
    body: `**What it is:** If your internal pipelines, governance, and team are early, **defer heavy fine‑tuning or pretraining**. Start with off‑the‑shelf tools, APIs, and **retrieval‑augmented generation (RAG)**. Consider **light fine‑tunes** only after evidence shows a gap that RAG can't close.

**Why it matters:** Heavy builds consume time and capital and can lag behind the frontier. Most organizations get 70–90% of the value via **Buy → API → RAG → Light FT** while they mature operations.

**How to implement:**
1. **Baseline with off‑the‑shelf** for quick wins and learning.
2. **RAG** to ground outputs in your content/data.
3. **Light FT** (e.g., adapters) when consistent, fixable gaps remain.
4. Invest in **MLOps, monitoring, and incident response** before heavy builds.

**Pitfalls:**
• Training a custom model without strong data advantage or readiness
• Skipping evaluation harnesses; you can't prove progress
• Building for prestige rather than outcomes

**Quick checklist:** Start Buy/API; add RAG; prove the gap; only then Light FT; upgrade ops in parallel.`
  },

  gate_procurement: {
    id: 'gate.procurement',
    title: 'Smart Procurement for AI — Clarity, Safety, Options',
    category: 'gate',
    tags: ['procurement', 'contracts'],
    overview: 'Align AI procurement with policy while keeping options open: clear evaluation criteria, safety requirements, data‑use terms, and portability.',
    body: `**What it is:** Align AI procurement with policy while keeping options open: clear evaluation criteria, safety requirements, data‑use terms, and portability.

**Why it matters:** Good procurement accelerates adoption without locking you in or creating compliance risk.

**How to implement:**
1. **State outcomes & safety:** Include success criteria and minimum safeguards (e.g., no training on inputs/outputs; regional processing if required).
2. **Evaluation basics:** Security posture, availability, cost predictability, support model.
3. **Portability:** Export formats, data retrieval SLAs, and right to maintain a secondary option.
4. **Pilot clauses:** Short, low‑risk pilots to test claims before committing.

**Pitfalls:**
• Over‑specifying tech and under‑specifying outcomes
• Vague data terms; unclear portability
• No path to small pilots

**Quick checklist:** Outcome‑based criteria; safety clauses; portability; pilot first.`
  },

  gate_edgeops: {
    id: 'gate.edgeops',
    title: 'OT/Edge — Safety and Stability at the Edge',
    category: 'gate',
    tags: ['edge', 'safety', 'operations'],
    overview: 'AI in operational technology (factories, vehicles, field devices) requires offline modes, change control, and safety interlocks.',
    body: `**What it is:** AI in operational technology (factories, vehicles, field devices) requires offline modes, change control, and safety interlocks.

**Why it matters:** Physical systems carry higher risk and stricter change‑management needs. Edge deployments need **predictable behavior** under constraints.

**How to implement:**
1. **Offline plan:** Cache models/data; define what happens without connectivity.
2. **Change control:** Test model updates in a staging environment that resembles the field.
3. **Safety interlocks:** Hard limits or human confirmation before critical actions.
4. **Monitoring & logs:** Collect minimal telemetry that's useful for diagnostics without risking privacy/security.

**Pitfalls:**
• Treating edge like the cloud
• Pushing untested models to field devices
• No rollback path

**Quick checklist:** Offline mode; staged rollout; interlocks; minimal, useful telemetry.`
  },

  // Pillar Deep Dive guides  
  pillar_C_deep: {
    id: 'pillar.C.deep',
    title: 'Clarity & Command — How Leaders Turn Direction into Outcomes',
    category: 'pillar',
    pillar: 'C',
    tags: ['leadership', 'strategy', 'governance'],
    overview: 'A good AI ambition is short, concrete, and tied to customers or operations. The second ingredient is an operating model that clarifies who enables (CoE) and who delivers (BUs).',
    body: `A good AI ambition is short, concrete, and tied to customers or operations. Think "reduce claim cycle time by 30%" vs. "be great at AI." Publish it and revisit it quarterly. The second ingredient is an **operating model** that clarifies **who enables** (CoE) and **who delivers** (BUs). The CoE sets standards, curates platforms, and provides guardrails. BUs pick use‑cases, own outcomes, and do the domain work.

During reviews, resist the temptation to admire demos. Ask: What changed for customers? For costs? For risk? Allocate a little more to what works; end or refactor what doesn't. Over time, include AI outcomes in the corporate scorecard and make leaders responsible for them. In regulated contexts, pair outcome reviews with **assurance evidence**.

This is not bureaucracy; it's management hygiene. Clear direction + clear owners + routine reallocation turns energy into results—and creates space for exploration where it matters.`
  },

  pillar_O_deep: {
    id: 'pillar.O.deep', 
    title: 'Operations & Data — From Prototype to Production',
    category: 'pillar',
    pillar: 'O',
    tags: ['operations', 'data_governance', 'monitoring'],
    overview: 'A simple lifecycle beats an elaborate one you never use. Start with: log, alert, review. Track latency, errors, cost, and a basic drift signal.',
    body: `A simple lifecycle beats an elaborate one you never use. Start with: log, alert, review. Track latency, errors, cost, and a basic drift signal. Fix obvious issues fast. Introduce a **use‑case intake** that forces a value hypothesis and a sanity check on data availability/quality.

On data, aim for **clarity over perfection**. Name owners for critical tables or content, publish a **catalogue entry** (what it is, who owns it, how to request access), and specify **retention** and **lineage**. Where stakes are high, insert **human checkpoints** until you can prove consistent quality.

Small, steady improvements here compound: fewer surprises, faster learning, and higher trust. When you're ready, automate evaluations and rollback, but don't wait for perfect pipelines to start measuring what matters.`
  },

  pillar_R_deep: {
    id: 'pillar.R.deep',
    title: 'Risk & Trust — Make Safety Routine, Not a Fire Drill',
    category: 'pillar',
    pillar: 'R',
    tags: ['safety', 'compliance', 'risk'],
    overview: 'Start with visibility: list your AI systems and owners. For the few that carry significant risk, set monthly checks (fairness, privacy, drift) and a quarterly red‑team.',
    body: `Start with visibility: list your AI systems and owners. For the few that carry significant risk, set **monthly checks** (fairness, privacy, drift) and a **quarterly red‑team**. You're not aiming for zero risk; you're building a habit of **finding and fixing**. Draft a **one‑page incident plan**—roles, severity levels, who communicates.

Treat safety as part of operations. When checks fail, the owner triages and remediates on a timeline. Leaders review trends and unblock fixes. In regulated environments, add **periodic assurance**—internal or third‑party—to validate your controls.

This approach is light enough to sustain and strong enough to prevent "unknown unknowns" from becoming headlines. It also educates your organization: people see issues surfaced and addressed calmly, which builds confidence to adopt AI where it makes sense.`
  },

  pillar_T_deep: {
    id: 'pillar.T.deep',
    title: 'Talent & Culture — Redesigning Work, Not Just Training People',
    category: 'pillar',
    pillar: 'T',
    tags: ['training', 'culture', 'adoption'],
    overview: 'Training is necessary but not sufficient. Choose a few job families and map their tasks. Where can AI draft, summarize, or retrieve? Where must a human judge?',
    body: `Training is necessary but not sufficient. Choose a **few job families** and map their tasks. Where can AI draft, summarize, or retrieve? Where must a human judge? Update **SOPs** to reflect the new flow, including approval points and escalation.

Provide **role‑specific micro‑training** with real examples and checklists. Encourage teams to publish short "wins and lessons" so good patterns spread. Align incentives to outcomes—faster cycles, better quality—not to raw usage stats.

This is change management in miniature: new tools, new roles, new habits. Keep it practical, celebrate progress, and remove blockers. The outcome is a workforce that uses AI **confidently and responsibly**, because the work itself has been reshaped to make that easy.`
  },

  pillar_E_deep: {
    id: 'pillar.E.deep',
    title: 'Ecosystem & Infrastructure — Scale Smart, Keep Options Open',
    category: 'pillar',
    pillar: 'E', 
    tags: ['infrastructure', 'finops', 'vendors'],
    overview: 'Track unit costs (e.g., per call/tokens) and watch quotas so teams aren't surprised. Consolidate on a small, supported set of services with clear terms.',
    body: `Track **unit costs** (e.g., per call/tokens) and watch **quotas** so teams aren't surprised. Consolidate on a small, supported set of services with clear terms. Write **portability** into contracts: export formats, data retrieval SLAs, and the right to keep a secondary option for critical paths.

Avoid one‑off integrations that will be brittle later. Prefer simple **APIs** and agreed schema standards. If your context allows, build a thin **abstraction layer** that lets you switch models or vendors for the same capability.

This isn't about picking the "perfect" stack. It's about knowing your costs, protecting your options, and enabling teams to move without being blocked by capacity or contractual traps.`
  },

  pillar_X_deep: {
    id: 'pillar.X.deep',
    title: 'Experimentation & Evolution — Learn Fast, Decide Faster',
    category: 'pillar',
    pillar: 'X',
    tags: ['experimentation', 'innovation', 'learning'],
    overview: 'Create a sandbox that's easy to access and safe by default (redaction, caps, curated data). Require every pilot to define a simple metric and a decision date at kickoff.',
    body: `Create a **sandbox** that's easy to access and safe by default (redaction, caps, curated data). Require every pilot to define a simple **metric** and a **decision date** at kickoff. Decisions are "scale", "refactor", or "retire"—and you publish them so people see that ending experiments is normal.

Run a lightweight **horizon scan** quarterly: what changed in models, policy, or competition? Which ideas are worth a small test, and which are noise?

The aim is not more experiments—it's **faster learning**. Sunset logic returns resources to the pool and keeps your portfolio focused on ideas with evidence.`
  }
};

// Helper functions for retrieving guides
export function getMicroGuideById(id: string): MicroGuide | undefined {
  return MICRO_GUIDES[id];
}

export function getMicroGuidesByCategory(category: MicroGuide['category']): MicroGuide[] {
  return Object.values(MICRO_GUIDES).filter(guide => guide.category === category);
}

export function getMicroGuidesByPillar(pillar: string): MicroGuide[] {
  return Object.values(MICRO_GUIDES).filter(guide => guide.pillar === pillar);
}

export function getMicroGuidesByTags(tags: string[]): MicroGuide[] {
  return Object.values(MICRO_GUIDES).filter(guide =>
    guide.tags.some(tag => tags.includes(tag))
  );
}