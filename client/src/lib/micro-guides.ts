// Official CORTEX v3.2 Micro-Guides Content Pack - Clean Version
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

**Why it matters:** Complex systems fail in unexpected ways. HITL prevents single-point failures from harming customers or the organization while you learn how the system behaves. It also builds regulator and stakeholder confidence that you are balancing innovation with care.

**Where to apply:**
• Decisions that affect people's money, health, safety, or legal rights
• Situations with unclear or evolving rules
• New AI capabilities where you have limited real-world evidence

**How to implement (lightweight):**
1. **Define checkpoints:** Identify specific steps where a person must review/approve (e.g., before sending customer-facing messages or changing account status).
2. **Document criteria:** When is human review mandatory? Use simple rules (risk level, data sensitivity, exception flags).
3. **Design for intervention:** Provide a clear "stop/correct/escalate" path in the workflow; log every intervention to learn patterns.
4. **Measure & taper:** Track intervention rates and error types. As quality stabilizes and evidence grows, reduce HITL to spot-checks or exception handling.

**Options by context:**
• **Regulated/high-safety:** Keep HITL longer and document reviewer qualifications.
• **Low-risk internal tasks:** Start with spot-checks on samples; expand only if issues appear.
• **Vendor tools:** Ensure you can *insert* human review before actions are finalized (e.g., draft-mode outputs).

**Pitfalls to avoid:**
• "Rubber-stamp" reviews (HITL that no one meaningfully performs)
• No logging—losing the chance to learn from interventions
• Keeping HITL forever out of habit after evidence supports automation

**Quick checklist:** Decide where HITL applies; write short criteria; enable intervene/escalate; log and review monthly; set conditions for tapering.`
  },

  gate_assurance: {
    id: 'gate.assurance',
    title: 'AI Assurance — A Simple Cadence That Works',
    category: 'gate',
    tags: ['regulatory', 'monitoring', 'compliance'],
    overview: 'A small set of routine checks for high-impact AI: fairness/privacy tests, model and data drift monitoring, and adversarial probing (red-teaming). The goal is not perfection; it is early detection and a documented response.',
    body: `**What it is:** A small set of **routine checks** for high-impact AI: fairness/privacy tests, model and data drift monitoring, and **adversarial probing** (red-teaming). The goal is not perfection; it is **early detection** and a documented response.

**Why it matters:** AI systems change over time—inputs shift, behaviors drift, attackers adapt. A predictable cadence prevents the surprise failure nobody saw coming. In regulated settings, it also demonstrates reasonable care.

**How to implement in weeks:**
1. **Scope:** List the few AI systems that could materially affect customers or the business.
2. **Fairness & privacy:** Define a couple of **observable** checks (e.g., outcome differences across groups where appropriate; presence of sensitive data in logs).
3. **Drift monitoring:** Track a basic drift signal on inputs and outputs; alert on significant deviations.
4. **Red-team:** Once per quarter, attempt **prompt-injection/jailbreaks** and data exfiltration on critical systems; document results and fixes.
5. **Review:** Summarize findings and remediation in a short note; escalate trends at leadership reviews.

**Options by context:**
• **Heavily regulated:** Add third-party or internal audit annually.
• **Low risk:** Scale the cadence by impact (e.g., semiannual checks).
• **Vendor services:** Ask for attestations, then **spot-check** using your data and use-cases.

**Pitfalls:**
• Running checks once and declaring victory
• No triage or owner for failed checks
• Over-testing everything (focus attention on high-impact systems)

**Quick checklist:** Identify high-impact AI; set monthly drift checks; quarterly red-teams; assign an owner; file a one-page summary.`
  },

  // Pillar Deep Dive guides
  pillar_C_deep: {
    id: 'pillar.C.deep',
    title: 'Clarity & Command — How Leaders Turn Direction into Outcomes',
    category: 'pillar',
    pillar: 'C',
    tags: ['leadership', 'strategy', 'governance'],
    overview: 'A good AI ambition is short, concrete, and tied to customers or operations. The second ingredient is an operating model that clarifies who enables (CoE) and who delivers (BUs).',
    body: `A good AI ambition is short, concrete, and tied to customers or operations. Think "reduce claim cycle time by 30%" vs. "be great at AI." Publish it and revisit it quarterly. The second ingredient is an **operating model** that clarifies **who enables** (CoE) and **who delivers** (BUs). The CoE sets standards, curates platforms, and provides guardrails. BUs pick use-cases, own outcomes, and do the domain work.

During reviews, resist the temptation to admire demos. Ask: What changed for customers? For costs? For risk? Allocate a little more to what works; end or refactor what does not. Over time, include AI outcomes in the corporate scorecard and make leaders responsible for them. In regulated contexts, pair outcome reviews with **assurance evidence**.

This is not bureaucracy; it is management hygiene. Clear direction + clear owners + routine reallocation turns energy into results—and creates space for exploration where it matters.`
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