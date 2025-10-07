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
    overview: 'A human reviews, approves, or can intervene in AI-assisted decisions where stakes are high (financial exposure, safety, legal or brand risk). In some cases Human-in-the-Loop (HITL) is a good idea long term, in others it may be a temporary guardrail until you have sufficient evidence relative to the risk that automation is safe enough for specific tasks.',
    body: `**What it is:** A human reviews, approves, or can intervene in AI-assisted decisions where stakes are high (financial exposure, safety, legal or brand risk). In some cases Human-in-the-Loop (HITL) is a good idea long term, in others it may be a **temporary guardrail** until you have sufficient evidence relative to the risk that automation is safe enough for specific tasks.

**Why it matters:** Complex systems fail in unexpected ways. Human-in-the-Loop (HITL) prevents single-point failures from harming customers or the organization while you learn how the system behaves. It also builds regulator and stakeholder confidence that you are balancing innovation with care.

**Where to apply:**
• Decisions that affect people's money, health, safety, or legal rights
• Situations with unclear or evolving rules
• New AI capabilities where you have limited real-world evidence

**How to implement (lightweight):**
1. **Define checkpoints:** Identify specific steps where a person must review/approve (e.g., before sending customer-facing messages or changing account status).
2. **Document criteria:** When is human review mandatory? Use simple rules (risk level, data sensitivity, exception flags).
3. **Design for intervention:** Provide a clear "stop/correct/escalate" path in the workflow; log every intervention to learn patterns.
4. **Measure & taper:** Track intervention rates and error types. As quality stabilizes and evidence grows, reduce Human-in-the-Loop (HITL) to spot-checks or exception handling.

**Options by context:**
• **Regulated/high-safety:** Keep Human-in-the-Loop (HITL) longer, or even permanently in certain cases, and document reviewer qualifications.
• **Low-risk internal tasks:** Start with spot-checks on samples; expand only if issues appear.
• **Vendor tools:** Ensure you can *insert* human review before actions are finalized (e.g., draft-mode outputs).

**Pitfalls to avoid:**
• "Rubber-stamp" reviews (Human-in-the-Loop that no one meaningfully performs)
• No logging—losing the chance to learn from interventions
• Keeping Human-in-the-Loop (HITL) forever out of habit after evidence supports automation

**Quick checklist:** Decide where Human-in-the-Loop (HITL) applies; write short criteria; enable intervene/escalate; log and review monthly; set conditions for tapering.`
  },

  gate_assurance: {
    id: 'gate.assurance',
    title: 'AI Assurance — A Simple Cadence That Works',
    category: 'gate',
    tags: ['regulatory', 'monitoring', 'compliance'],
    overview: 'A small set of routine checks for high-impact AI: fairness/privacy tests, model and data drift monitoring, and adversarial probing (red-teaming). The goal is not perfection; it is early detection and a documented response.',
    body: `**What it is:** A small set of **routine checks** for high-impact AI: fairness/privacy tests, model and data drift monitoring, and **adversarial probing** (red-teaming). The goal is not perfection; it is **early detection** and a documented response.

**Why it matters:** AI systems change over time. Inputs shift, behaviors drift, attackers adapt. A predictable cadence AI assurance can help prevent the surprise failure nobody saw coming. In regulated settings, it also demonstrates reasonable care.

**How to implement in weeks:**
1. **Scope:** List the AI systems that could materially affect customers or the business.
2. **Fairness & privacy:** Define a couple of **observable** checks (e.g., outcome differences across groups where appropriate; presence of sensitive data in logs).
3. **Drift monitoring:** Track a basic drift signal on inputs and outputs; alert on significant deviations.
4. **Red-team:** At a scheduled cadence, for instance once per quarter, attempt **prompt-injection/jailbreaks** and data exfiltration on critical systems; document results and fixes.
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

During reviews, resist the temptation to just admire impressive demos. They might be helpful, but you need to know more first. Ask: What changed for customers? For costs? For risk? Allocate a little more to what works and end or refactor what does not. Over time include AI outcomes in the corporate scorecard and make leaders responsible for them. In regulated contexts pair outcome reviews with **assurance evidence**.

This is not bureaucracy, it's management hygiene. Clear direction + clear owners + routine reallocation turns energy into results and creates space for exploration where it matters.`
  },

  // Operations & Data guides
  pillar_O_deep: {
    id: 'pillar.O.deep',
    title: 'Operations & Data — Building the Engine Room for AI',
    category: 'pillar',
    pillar: 'O',
    tags: ['data', 'operations', 'mlops'],
    overview: 'Strong AI operations start with data quality gates, clear use-case screening, and basic MLOps practices that prevent technical debt from accumulating.',
    body: `**What it is:** The operational foundation that turns AI experiments into reliable services. This covers data pipelines, model deployment, performance monitoring, and the lightweight governance (who decides, when, and with what evidence) that keep everything running smoothly. MLOps = model + data versioning, testing, deploy/rollback.

**When this applies:** Multiple pilots, inconsistent results; rising API/compute costs; "works in dev, fails in prod"; compliance asking for logs; customer-visible latency/errors.

**Why it matters:** Without operational discipline AI can become a collection of science projects that never deliver consistent value. Good operations multiply the impact of every model you build while reducing the cost and risk of running them at scale.

**How to implement:**
1. **Data quality gates (owner: Data Lead):** Define 5-7 key quality metrics for your critical data sources. Monitor completeness, freshness, accuracy, and consistency. Block model training or risky inference when quality drops below thresholds and alert the product owner.
2. **Use-case screening (owner: Product):** Create a simple scoring matrix **(value, feasibility, risk)**. Require business sponsors for every pilot. Kill projects that do not clear the bar within a certain time period.
3. **Basic MLOps (Owner:Eng):** Start with version control for models and data. Add automated testing for model performance. Build rollback capabilities **before** you need them.
4. **Performance tracking (Owner: Eng):** Monitor inference latency, throughput, and error rates in production. Set SLAs that match business needs, not technical ideals.
5. **Cost allocation (Finance + Eng):** Track compute, storage, and API costs by use-case. Show cost per 1k requests on the same dashboard as performance.

**Options by context:**
• **High-scale operations:** Add a model registry and a feature store (central, reusable input features) early.
• **Regulated industries:** Add audit trails and explainability from day one.
• **Startups:** Prefer managed services. Focus on iteration speed over custom infrastructure.

**Pitfalls:**
• Building Netflix-scale infrastructure for prototype-scale problems
• Ignoring data drift until models fail in production
• Separating MLOps from existing DevOps practices

**Quick checklist:** Define data quality metrics; implement use-case scoring; version everything; monitor production performance; track costs by project.`
  },

  pillar_O_data_quality: {
    id: 'pillar.O.data_quality',
    title: 'Data Quality for AI — The 20% That Delivers 80%',
    category: 'pillar',
    pillar: 'O',
    tags: ['data', 'quality', 'governance'],
    overview: 'Focus on the critical few data quality measures that actually predict model success: completeness, consistency, and drift detection.',
    body: `**What it is:** A pragmatic approach to data quality that focuses on metrics that directly impact AI performance, not academic perfection. Think "good enough for reliable predictions" not "perfect in every dimension." Focus on the few metrics that most affect AI: **completeness** (required fields present), **consistency** (formats/business rules match), and **drift** (inputs or labels shift over time).

**When this applies (and to whom):**
• **AI users / integrators (LLM API, RAG on your docs):** Use this to keep inputs clean and retrieval trustworthy. Apply automatic quality checks or filters (gates) before indexing and before inference.  
• **AI creators (training/fine-tuning models):** Apply the full set-data profiling, thresholds, versioning, and drift monitoring across the whole pipeline.  
• **Analytics-only or early-stage teams:** Start "lite" on your top 3-5 datasets to get AI-ready without over-engineering.  

**Triggers:** "Works in sandbox, fails in prod," rising rework, inconsistent answers, unexplained cost spikes, compliance asking for provenance.

**Why it matters:** Poor data quality is the silent killer of AI initiatives. Models trained on bad data make bad decisions, erode trust, and create hidden liabilities. But over-engineering data quality wastes resources on marginal improvements.

**How to implement (choose the level that fits your maturity)**
1. **Profile your data**  
   - *Lite:* Run a quick scan of your key datasets. Look for missing values, odd formats, or duplicates. Capture a snapshot of what "normal" looks like.  
   - *Full:* Check for label noise, data leakage, and duplicates. Add dataset versioning so you can trace which data produced which model.

2. **Set quality thresholds**  
   - *Lite:* Define simple, clear rules-fewer than 5 % missing values, at least 95 % format compliance, and if using RAG, aim for over 80 % retrieval accuracy on a small test set.  
   - *Full:* Add class balance (no class smaller than 10 %), zero leakage tolerance, and minimum sample sizes per class or feature group.

3. **Automate monitoring and gates**  
   - *Lite:* Add lightweight checks before you index data or run inference. If a threshold fails, stop the run and alert the data owner.  
   - *Full:* Add pre-training and pre-inference gates plus production monitors that flag population or embedding drift. Keep breadcrumbs (page- or table-level logs) for quick debugging.

4. **Create feedback loops**  
   - *Lite:* Review a small slice of predictions (1-5 %), have humans check them, and feed fixes back to source owners.  
   - *Full:* Capture outcomes continuously, schedule re-label reviews, and target fixes where errors cluster.

5. **Document lineage (provenance)**  
   - *Lite:* Record each dataset's source, last refresh, and key transformations.  
   - *Full:* Maintain full end-to-end lineage-from raw source through transformations and model versions-so audits and debugging take hours, not days.


**Options by context:**
• **Customer data:** Focus on PII handling and consent tracking.
• **Sensor/IoT data:** Emphasize anomaly detection and gap filling.
• **Text/documents:** Invest in schema validation and encoding consistency.

**Pitfalls:**
• Trying to fix all quality issues instead of the ones that matter
• Manual quality checks that do not scale
• Quality metrics that do not connect to business outcomes

**Quick checklist:** Profile baseline quality; set practical thresholds; automate monitoring; build feedback loops; maintain lineage records.`
  },

  // Risk, Trust & Security guides
  pillar_R_deep: {
    id: 'pillar.R.deep',
    title: 'Risk & Trust — Building Confidence Through Control',
    category: 'pillar',
    pillar: 'R',
    tags: ['risk', 'security', 'trust'],
    overview: 'Effective AI risk management balances innovation speed with thoughtful controls. Focus on incident response, bias testing, and privacy protection as your foundation.',
    body: `**What it is:** The practices and controls that prevent AI from creating unacceptable risks to your customers, employees, and organization. This is not about eliminating all risk—it is about understanding, monitoring, and managing risk intelligently.

**Why it matters:** AI failures are highly visible and can destroy trust instantly. A customer harmed by biased decisions or a data breach involving AI systems can trigger regulatory action, lawsuits, and lasting reputation damage. Good risk management enables faster innovation by creating clear boundaries.

**How to implement:**
1. **Risk registry:** List your AI systems and score their potential impact (financial, safety, reputation, regulatory). Focus controls on high-impact systems first.
2. **Incident response plan:** Define what constitutes an AI incident. Create escalation paths, response teams, and communication templates before you need them.
3. **Bias testing:** Run fairness checks on high-impact models quarterly. Look for disparate impact across protected groups. Document your testing methodology.
4. **Privacy controls:** Implement data minimization, purpose limitation, and retention policies. Know what PII your models can access and why.
5. **Security basics:** Protect models from extraction, training data from poisoning, and prompts from injection. Start with the OWASP Top 10 for LLMs.

**Options by context:**
• **Financial services:** Add model validation and ongoing monitoring requirements.
• **Healthcare:** Emphasize clinical validation and patient safety protocols.
• **B2B SaaS:** Focus on data isolation and customer-specific controls.

**Pitfalls:**
• Analysis paralysis—spending months on risk frameworks without implementing controls
• Checkbox compliance that misses real risks
• Risk controls that make innovation impossible

**Quick checklist:** Create risk registry; draft incident response plan; implement quarterly bias testing; enforce privacy controls; address security basics.`
  },

  pillar_R_bias_testing: {
    id: 'pillar.R.bias_testing',
    title: 'Bias Testing — Practical Fairness Checks That Work',
    category: 'pillar',
    pillar: 'R',
    tags: ['bias', 'fairness', 'testing'],
    overview: 'Regular bias testing does not require a PhD in ethics. Start with simple disparate impact analysis and expand based on your risk profile.',
    body: `**What it is:** Systematic testing to ensure AI systems do not create unfair outcomes for different groups. This means checking if your models perform equally well across demographics, geographies, or other relevant segments.

**Why it matters:** Biased AI can limit your market opportunities, violate regulations, potentially harm users, and create legal liability. Even unintentional bias can damage your brand and limit potential income streams. Proactive testing helps you fix problems before they hurt people.

**How to implement:**
1. **Define fairness:** Decide what fairness means for your use case. Equal outcomes? Equal opportunity? Equal treatment? Document your choice and rationale.
2. **Identify protected groups:** List the dimensions that matter (age, gender, race, geography, customer segment). Not everything needs testing. Focus on legal requirements and business impact.
3. **Measure disparate impact:** Calculate performance metrics by group. Look for differences >20% as a red flag (the 4/5ths rule from employment law is a useful starting point).
4. **Test pre- and post-deployment:** Check for bias in training data, model outputs, and real-world outcomes. Bias can emerge at any stage.
5. **Document everything:** Keep records of what you tested, when, and what you found. This demonstrates good faith effort to regulators.

**Options by context:**
• **Hiring/lending:** Follow established legal frameworks (EEOC, FCRA).
• **Healthcare:** Test across conditions, demographics, and care settings.
• **Marketing:** Focus on representation and stereotype reinforcement.

**Pitfalls:**
• Testing for every possible bias instead of the ones that matter
• One-time testing without ongoing monitoring
• Perfect fairness paralysis—some trade-offs are inevitable

**Quick checklist:** Define fairness criteria; identify key groups; measure disparate impact; test throughout lifecycle; maintain documentation.`
  },

  // Talent & Culture guides
  pillar_T_deep: {
    id: 'pillar.T.deep',
    title: 'Talent & Culture — Building AI-Ready Teams',
    category: 'pillar',
    pillar: 'T',
    tags: ['talent', 'culture', 'training'],
    overview: 'Successful AI transformation requires both technical skills and cultural change. Focus on practical training, role evolution, and removing adoption barriers.',
    body: `**What it is:** The human side of AI transformation involves building skills, changing mindsets, and redesigning work to take advantage of AI capabilities. This is about making AI tools productive for real people doing real work.

**Why it matters:** Technology alone does not create value. People using technology effectively does. Organizations that nail the talent and culture piece see much higher ROI on their AI investments. Those that do not end up with expensive tools gathering dust.

**How to implement:**
1. **Skills mapping:** Identify which roles will use AI and what they need to know. Create three tiers:
   • **Platform & Model Builders** (ML/DS eng, data/platform eng, SRE/security): Build and run the data/model platform, guardrails, deployment, monitoring.  
   • **Solution Makers (Integrators)** (analysts, ops, PMs, citizen devs, app eng): Compose RAG/agent workflows, prompts, and automations that ship.  
   • **Business Practitioners (Frontline Users)** (sales, support, finance, HR, legal, etc.): Use copilots in daily work, validate outputs, follow usage guardrails.  
   *Overlay tracks:* **Leaders** (strategy/governance) and **Stewards** (Legal/Risk/Privacy/RAI) span all tiers.
2. **Practical training:** Get beyond just a simple "Intro to AI" course. Include hands-on exercises with real tools and data and build role-specific training that shows people how AI helps them today. With the current pace of change new practices will constantly be getting discovered at the ground level. Once everyone has a foundational level of ability leverage and reward your power-users as trainers. Incentivise sharing.
3. **Champion network:** Recruit early adopters as champions. Give them early access, extra training, and a platform to share successes. They will pull others along.
4. **Process redesign:** Do not just be content with bolting AI onto existing workflows. As your workforce gains more experience, redesign processes to leverage AI strengths while preserving human judgment where it matters.
5. **Adoption tracking:** Measure actual usage, not training completion. Track who is using AI tools, how often, and how it is improving their outcomes.

**Options by context:**
• **Technical teams:** Focus on MLOps, responsible AI practices, and platform skills.
• **Business teams:** Emphasize prompt engineering, output validation, and use-case identification.
• **Leadership:** Concentrate on strategy, governance, and cultural change management.

**Pitfalls:**
• Training everyone on everything instead of more targeted skill building
• Ignoring middle management resistance to change
• Measuring activity (training hours) instead of outcomes (productivity gains, which are often hard to measure at the task level)

**Quick checklist:** Map skills by role; create practical training; build champion network; redesign key processes; track real usage.`
  },

  pillar_T_change_management: {
    id: 'pillar.T.change_management',
    title: 'AI Change Management — Overcoming the Resistance',
    category: 'pillar',
    pillar: 'T',
    tags: ['change', 'adoption', 'culture'],
    overview: 'Many AI initiatives fail due to human factors, not technology. Address fears directly, show early wins, and make adoption easier than resistance.',
    body: `**What it is:** A structured approach to helping people adopt AI tools and new ways of working. This means addressing emotional responses (fear, skepticism), practical barriers (skills, access), and organizational inertia.

**Why it matters:** Studies show that many AI projects fail to achieve their goals due to adoption challenges. People fear job loss, feel overwhelmed by what seems like learning a challenging new technology, or simply prefer familiar ways of working. Without deliberate change management even the best technology fails.

**How to implement:**
1. **Address fears explicitly:** Hold town halls to discuss how AI will and will not change jobs. Be honest about impacts while emphasizing opportunities for growth.
2. **Start with volunteers:** Don't necessarily force adoption. Let eager early adopters go first, generate success stories, and create pull from peers. This can be the long term strategy or an onrampt to eventually requiring AI use.
3. **Make it stupidly easy:** Remove every friction point. Single sign-on, integrated workflows, great documentation, responsive support. If it is harder than the old way, people will not switch.
4. **Celebrate small wins:** Publicize every success, no matter how minor. "Sarah saved 2 hours this week using AI for report generation" is powerful social proof.
5. **Adjust incentives:** Many of the workers who are getting the largest productivity gains out of AI use still worry about "getting caught." Reward AI adoption and knowledge sharing. If bonuses and promotions still flow primarily to people doing things the old way, behavior will not change.

**Options by context:**
• **Unionized workforce:** Engage labor representatives early and formally.
• **Creative industries:** Emphasize AI as a tool for enhancement, not replacement.
• **Regulated sectors:** Focus on compliance benefits and risk reduction.

**Pitfalls:**
• Assuming rational arguments overcome emotional resistance
• Big-bang deployments instead of gradual rollouts
• Ignoring middle managers who can kill adoption silently

**Quick checklist:** Address fears openly; recruit volunteers first; eliminate friction; publicize wins; align incentives.`
  },

  // Ecosystem & Infrastructure guides
  pillar_E_deep: {
    id: 'pillar.E.deep',
    title: 'Ecosystem & Infrastructure — Building Your AI Platform',
    category: 'pillar',
    pillar: 'E',
    tags: ['infrastructure', 'platform', 'ecosystem'],
    overview: 'Your AI infrastructure should be boringly reliable, surprisingly affordable, and infinitely extensible. Focus on platform basics before chasing advanced capabilities.',
    body: `**What it is:** The technical foundation that powers your AI capabilities includes compute resources, data platforms, model serving infrastructure, and the vendor ecosystem that extends your capabilities. This is the plumbing that needs to "just work."

**Why it matters:** Bad infrastructure creates compounding problems: slow development, reliability issues, security vulnerabilities, and exploding costs. Good infrastructure is invisible. It enables teams to focus on solving business problems instead of fighting tools.

Build vs Buy vs Partner — simple decision rules
**Build when**  
• It is **differentiation** (your moat): proprietary retrieval, domain-specific evals/safety, custom data pipelines.  
• You need **hard constraints**: latency/sovereignty/security that off-the-shelf can't meet.  
• **Unit economics** win at scale (For example if Total Cost of Ownership (TCO) over 12-24 months beats SaaS by ≥30%).  
• You can staff and **operate it** (on-call, upgrades, audits) without starving product teams.

**Buy when**  
• It is **commodity** (compute, storage, general observability, generic vector DB/model hosting).  
• **Time-to-value** matters more than perfect fit (quarter-level outcomes).  
• You need certifications (SOC2/ISO/PII handling) and vendor takes audit burden.  
• You want **elastic capacity** and predictable pricing to de-risk demand spikes.

**Partner when**  
• There's a **capability gap** or steep learning curve; you need speed plus knowledge transfer.  
• You're co-developing a feature you'll later own (**option to insource** in the contract).  
• There's a clear **co-sell or ecosystem** benefit (distribution, integrations).

**Practical pattern: "Rent → Hybrid → Own"**  
Start by **buying** to ship value quickly; add a **thin abstraction layer** and portability tests; **graduate** high-leverage pieces to in-house when the ROI is proven.

---

**How to implement:**
1. **Platform strategy:** Choose build vs. buy vs. partner for each layer.
2. **Cost architecture:** Understand unit economics from day one. What does each prediction cost? How does cost scale with volume? Build cost controls before you get the bill shock.
3. **Vendor management:** Maintain competitive tension. Never depend entirely on a single provider for critical capabilities. Negotiate enterprise agreements with volume commits and escape clauses.
4. **Development environment:** Give teams self-service access to appropriate resources. Include cost visibility, security guardrails, and collaboration features.
5. **Scaling readiness:** Design for 10x current volume. This doesn't mean you have to build for it now, but it ensures that your architecture can grow without rewrites.

**Options by context:**
• **Enterprises:** Focus on integration with existing systems and governance.
• **Startups:** Optimize for iteration speed and capital efficiency.
• **Regulated industries:** Prioritize audit trails and data residency.

**Pitfalls:**
• Building Google-scale infrastructure for startup-scale problems
• Vendor lock-in with no escape plan
• Infrastructure that only ML engineers can use

**Quick checklist:** Define platform strategy; architect for cost; manage vendor relationships; enable self-service; design for scale.`
  },

  pillar_E_cost_optimization: {
    id: 'pillar.E.cost_optimization',
    title: 'AI Cost Optimization — Controlling the Burn',
    category: 'pillar',
    pillar: 'E',
    tags: ['cost', 'optimization', 'finops'],
    overview: 'AI costs can spiral quickly. Implement cost controls, optimize model selection, and track unit economics before you get the shocking bill.',
    body: `**What it is:** Systematic management of AI-related costs including tokens (API), compute (GPU/CPU), storage (incl. embeddings + logs), and egress. Many "surprise bills," for instance are embeddings+egress, not just inference. The goal is sustainable unit economics, not just lower bills.

**Why it matters:** AI can be expensive, potentially really expensive, and not always intentionally. Teams have accidentally spent $100K+ in a weekend. Without cost controls, you risk either blow budgets or throttling innovation. Smart cost management enables more experimentation within constraints.

**How to implement:**
1. **Cost visibility:** Tag all resources by project, team, and use-case. Create dashboards showing daily burn rates and monthly trends. Alert on anomalies.
2. **Model optimization:** Right-size models for each use-case. A frontier model for complex reasoning, a smaller, faster, model for simple tasks, fine-tuned small models for repetitive work. This should be driven by an eval harness (task-level accuracy/quality vs cost), not gut feel. Otherwise people drop to a cheaper model and quietly tank outcomes.
3. **Caching strategy:** Cache common queries, especially for deterministic operations. A good cache can cut costs by 50-80% for many use-cases.
4. **Batch processing:** Aggregate requests when latency permits. Batch inference is often 70% cheaper than real-time.
5. **Kill switches:** Implement automatic shutoffs when costs exceed thresholds. Better yet, build out graceful degradation order: switch to smaller model → reduce context window → turn off non-critical tools → queue/batch → finally hard stop. A controlled downgrade is often better than a blackout.

**Options by context:**
• **High-volume B2C:** Focus on unit economics and marginal cost.
• **Enterprise B2B:** Optimize for value delivery within budget constraints.
• **R&D/experimentation:** Set clear budgets with hard stops.

**Pitfalls:**
• Optimizing too early before understanding value delivery
• Penny-wise, pound-foolish cost cuts that degrade user experience and increase downstream cost
• No cost attribution. There's no owner for the bill, so shared budgets get drained

**Quick checklist:** Implement cost tagging; optimize model selection; design caching strategy; batch where possible; install kill switches.`
  },

  // Experimentation & Evolution guides
  pillar_X_deep: {
    id: 'pillar.X.deep',
    title: 'Experimentation & Evolution — Learning Fast Without Breaking Things',
    category: 'pillar',
    pillar: 'X',
    tags: ['innovation', 'experimentation', 'learning'],
    overview: 'Successful AI organizations run many small experiments, fail fast, and scale winners. Build a portfolio approach with clear stage-gates and learning objectives.',
    body: `**What it is:** The systematic approach to testing AI ideas, learning from results, and evolving capabilities over time. This includes pilot management, portfolio governance, and the feedback loops that drive continuous improvement.

**Why it matters:** AI is moving too fast for waterfall planning. Organizations need to experiment constantly, but without discipline experimentation becomes expensive chaos. Good experiment management generates learning velocity while controlling risk and cost.

**How to implement:**
1. **Portfolio approach:** Be constantly running multiple small bets instead of one big bet. You could, for instancae, aim for 10-20 experiments quarterly with 90-day learning cycles.
2. **Clear stage-gates:** Define phases (ideation → prototype → pilot → scale) with specific exit criteria. Kill projects that do not advance within their timeframe.
3. **Learning objectives:** Every experiment needs a hypothesis and success metrics defined upfront.
4. **Fast feedback loops:** Measure results weekly, pivot quickly, kill or scale rapidly. Speed of learning matters more than perfection.
5. **Knowledge capture:** Document what worked, what did not work, and **why**. Share learnings broadly. Failed experiments that generate insights are valuable and often show what future technology improvements or breakthroughs will unlock those capabilities.

**Options by context:**
• **Innovation leaders:** Run more aggressive experiments at the edge.
• **Fast followers:** Focus on proven use-cases with local adaptation.
• **Regulated industries:** Add compliance checkpoints without killing speed.

**Pitfalls:**
• Innovation theater—lots of activity, no outcomes
• Pilot purgatory—experiments that never end or scale
• Learning hoarding—insights that do not spread

**Quick checklist:** Build portfolio pipeline; define stage-gates; set learning objectives; accelerate feedback loops; capture and share knowledge.`
  },

  pillar_X_pilot_management: {
    id: 'pillar.X.pilot_management',
    title: 'Pilot Management — From Ideas to Impact in 90 Days',
    category: 'pillar',
    pillar: 'X',
    tags: ['pilots', 'innovation', 'portfolio'],
    overview: 'Most pilots fail because they lack clear objectives, success criteria, and end dates. Fix these three things and your success rate triples.',
    body: `**What it is:** A disciplined approach to running AI pilots that generates maximum learning with minimum investment. This means clear scoping, rapid execution, and decisive go/no-go decisions.

**Why it matters:** Organizations often have dozens of "pilots" that are really zombie projects that neither succeeding nor fully fail, just keep consuming resources. Good pilot management creates a healthy pipeline of innovations while preventing resource drain.

**How to implement:**
1. **90-day timebox (you pick the duration):** Every pilot gets 90 days maximum to prove value. Extensions require executive approval and clear rationale. This forces focus and prevents drift.
2. **Success criteria upfront:** Define success metrics before starting. "20% reduction in processing time" not "improve efficiency." No moving goalposts. But be open to suprises you weren't expecting upfront.
3. **Minimum viable scope:** Strip pilots to essentials. Test the core hypothesis with minimum features, users, and investment. You're validating an idea first, not building production systems yet.
4. **Weekly scorecards:** Track progress, blockers, and burn rate weekly. Surface problems early when they're fixable. No surprises at the 90-day mark.
5. **Binary decisions:** At 90 days, make a clear decision: scale, pivot, or kill. Document the rationale and share learnings.

**Options by context:**
• **Customer-facing pilots:** Include user feedback metrics and safety controls.
• **Internal efficiency:** Focus on time savings and quality improvements.
• **Revenue generation:** Emphasize unit economics and scalability.

**Pitfalls:**
• Scope creep that turns pilots into full implementations unintentionally
• No clear owner or sponsor
• Success criteria that cannot actually be measured or achieved

**Quick checklist:** Set 90-day limit; define success metrics; minimize scope; track weekly; force binary decisions.`
  },

  // Additional Gate guides
  gate_data_governance: {
    id: 'gate.data_governance',
    title: 'Data Governance for AI — The Essentials',
    category: 'gate',
    tags: ['data', 'governance', 'compliance'],
    overview: 'AI amplifies data governance gaps. Implement data classification, lineage tracking, and purpose limitation before problems compound.',
    body: `**What it is:** The policies and controls that ensure data is used appropriately for AI training and inference. This covers data classification, access controls, lineage tracking, and compliance with privacy regulations.

**Scope:** This gate is primarily for orgs *building or hosting their own models* or operating their own retrieval/indexing pipelines. If you use *enterprise LLMs or APIs*, your prompts are not used to train provider models by default; governance here still matters for logging, retention, access, and licensing.

**Why it matters:** AI systems can inadvertently expose sensitive data. Poor data governance leads to privacy breaches, regulatory fines, and loss of customer trust. It's much harder to fix governance after AI systems are deployed.

**How to implement:**
1. **Data classification:** Tag all data sources with sensitivity levels (public, internal, confidential, restricted). Map which AI systems can access each level.
2. **Purpose limitation:** Document why each AI system needs specific data. Enforce the principle of least privilege—models only get data essential for their function.
3. **Lineage tracking:** Know the path from raw data to model predictions. This enables debugging, compliance reporting, and impact analysis when data issues arise.
4. **Retention policies:** Define how long training data, model artifacts, and predictions are retained. Automate deletion when retention periods expire.
5. **Access audit:** Review who can access training data and models quarterly. Revoke unnecessary permissions. Log all access for forensics.

**Options by context:**
• **GDPR compliance:** Add consent management and right-to-erasure workflows.
• **HIPAA/healthcare:** Implement de-identification and minimum necessary standards.
• **Financial services:** Include transaction monitoring and suspicious activity reporting.
• **Vendor LLMs:** Put the basics in writing—DPA in place, data pinned to approved regions, an explicit "no training on our data" clause, easy export so you can exit cleanly, and deletion SLAs so data is removed on your timeline.

**Myth:** “Anything typed into ChatGPT gets memorized.”
**Reality:** Enterprise/API usage is **not used for training by default**; consumer products **can** use content for training unless you opt out. Retention/logging ≠ training.

**Pitfalls:**
• Governance theater that does not actually control data flow
• Over-classification that makes all data restricted
• Manual processes that cannot scale with AI velocity

**Quick checklist:** Classify data assets; enforce purpose limitation; track lineage; automate retention; audit access quarterly.`
  },

  gate_model_monitoring: {
    id: 'gate.model_monitoring',
    title: 'Model Monitoring — Catching Drift Before It Hurts',
    category: 'gate',
    tags: ['monitoring', 'operations', 'quality'],
    overview: 'Nothing stays the same. Models degrade over time as the world changes. Implement monitoring that detects drift, degradation, and anomalies before they impact users.',
    body: `**What it is:** Continuous observation of model behavior in production to detect when performance degrades, inputs drift from training distributions, or unexpected behaviors emerge.

**Why it matters:** A model that was 95% accurate at launch might be 60% accurate six months later. Without monitoring, you do not know when models fail until customers complain or regulators investigate.

**How to implement:**
1. **Baseline metrics:** Capture accuracy, precision, recall, and business KPIs at deployment. This is your "model birth certificate" and will be your standard for comparison.
2. **Input drift detection:** Monitor statistical properties of incoming data. Alert when distributions shift significantly from training data. Use simple metrics like KL divergence or PSI.
3. **Output monitoring:** Track prediction distributions, confidence scores, and error rates. Sudden changes often indicate problems even when inputs look normal.
4. **Business impact tracking:** Connect model metrics to business outcomes. A 5% accuracy drop might not matter, but a 5% revenue drop definitely does.
5. **Automated alerts:** Set thresholds for automatic notifications. Page on-call engineers for critical issues, email stakeholders for trends.

**Options by context:**
• **Real-time systems:** Focus on latency and error rates with minute-level granularity.
• **Batch processes:** Emphasize data quality and completeness checks.
• **High-stakes decisions:** Add human review triggers when confidence drops.

**Pitfalls:**
• Monitoring everything equally instead of focusing most on critical metrics
• Alert fatigue from too many false positives
• No clear owner for responding to alerts

**Quick checklist:** Establish baselines; detect input drift; monitor outputs; track business impact; automate critical alerts.`
  },

  // Context-specific guides
  context_regulated: {
    id: 'context.regulated',
    title: 'AI in Regulated Industries — Compliance Without Paralysis',
    category: 'context',
    tags: ['regulatory', 'compliance', 'governance'],
    overview: 'Regulated industries can innovate with AI. The key is building compliance into the development process, not bolting it on afterward.',
    body: `**What it is:** An approach to AI development that satisfies regulatory requirements while maintaining innovation velocity. This means embedding compliance checkpoints, documentation practices, and oversight mechanisms throughout the AI lifecycle.

**Why it matters:** Regulators are paying attention to AI. Financial services, healthcare, and other regulated industries face specific requirements for fairness, explainability, and safety. Non-compliance brings fines, sanctions, and competitive disadvantage.

**How to implement:**
1. **Regulatory mapping:** Identify which regulations apply to your AI use-cases (GDPR, CCPA, FCRA, etc.). Create a compliance matrix showing requirements and your controls.
2. **Model documentation:** Maintain model cards for high-impact systems. Document training data, performance metrics, limitations, and intended use. This becomes your regulatory evidence.
3. **Explainability by design:** Choose interpretable models where possible. For black-box models, implement explanation methods (SHAP, LIME) and validate they make sense to stakeholders.
4. **Audit readiness:** Keep immutable logs of model versions, training runs, and production decisions. Automate evidence collection for regulatory reviews.
5. **Three lines of defense:** Establish independent validation (second line) and audit (third line) functions separate from model development (first line).

**Options by context:**
• **Banking:** Focus on SR 11-7 compliance and fair lending requirements.
• **Healthcare:** Emphasize FDA guidance and clinical validation (if US based).
• **Insurance:** Address actuarial standards and discrimination concerns.

**Pitfalls:**
• Compliance paralysis that stops all innovation
• Documentation for documentation's sake
• Assuming one-size-fits-all compliance across jurisdictions. For instance, Europe.

**Quick checklist:** Map regulatory requirements; document models thoroughly; build in explainability; maintain audit trails; establish independent validation.`
  },

  context_startup: {
    id: 'context.startup',
    title: 'AI for Startups — Speed Over Sophistication',
    category: 'context',
    tags: ['startup', 'agility', 'growth'],
    overview: 'Startups can use AI to create unfair advantages instead of playing catch-up. Focus on differentiation, iteration speed, and capital efficiency.',
    body: `**What it is:** A lean approach to AI that prioritizes learning speed and customer value over technical sophistication. This means using existing tools, iterating rapidly, and focusing AI on your core differentiation.

**Why it matters:** Startups have advantages (speed, focus) and constraints (capital, talent). AI should amplify advantages while respecting constraints. The goal is finding product-market fit, not building perfect infrastructure.

**How to implement:**
1. **Buy over build:** Use API's from labs like OpenAI, Anthropic, or Cohere instead of training models. Use Hugging Face models instead of creating architectures. Save engineering for your secret sauce.
2. **Start with prompts:** Most problems can be solved with good prompt engineering before you need fine-tuning or custom models. This can be 100x faster and cheaper.
3. **Focus on the wedge:** Use AI to nail one use-case exceptionally well rather than being mediocre at many. Depth beats breadth for creating differentiation. The frontier models are very good at lots of things. Use their intelligence to power something incredibly good a one thing.
4. **Rapid experimentation:** Ship AI features behind feature flags. Test with small user cohorts. Iterate daily based on feedback. Speed of learning is your advantage.
5. **Unit economics first:** Know your Customer Acquisition Cost (CAC) and Lifetime Value (LTV) implications before scaling. Make sure your AI drives enough value to justify costs.

**Suggestions by context:**
• **B2B SaaS:** Focus on workflow automation and insight generation.
• **B2C apps:** Emphasize personalization and user experience.
• **Marketplaces:** Use AI for matching, pricing, and trust.

**Pitfalls:**
• Building infrastructure instead of product
• AI for AI's sake instead of customer value
• Premature optimization before product-market fit

**Quick checklist:** Use existing APIs; start with prompts; focus on one wedge; ship daily experiments; validate unit economics.`
  },

  context_enterprise: {
    id: 'context.enterprise',
    title: 'Enterprise AI Transformation — Systematic Scale',
    category: 'context',
    tags: ['enterprise', 'transformation', 'scale'],
    overview: 'Enterprises need systematic approaches that work across business units. Focus on platforms, governance, and change management at scale.',
    body: `**What it is:** A comprehensive approach to deploying AI across complex organizations with multiple business units, legacy systems, and stakeholder groups. This requires platforms that scale, governance that does not suffocate, and change management that actually works.

**Why it matters:** Enterprises have unique advantages (data, resources, customer relationships) and challenges (complexity, inertia, risk aversion). Success requires leveraging advantages while managing challenges systematically.

**How to implement:**
1. **Platform, not projects:** Build shared capabilities (data platform, MLOps, governance) that all business units can leverage. This creates economies of scale and consistent standards.
2. **Federated model:** Central team provides platform and governance; business units own use-cases and outcomes. This balances standardization with agility.
3. **Lighthouse projects:** Pick 2-3 high-visibility projects that demonstrate value. Success here creates pull for broader adoption. Failure here kills momentum.
4. **Governance board:** Establish cross-functional governance including IT, legal, risk, and business leaders. Meet monthly to review portfolio and remove blockers.
5. **Talent strategy:** Build, buy, and borrow talent strategically. Create career paths for AI roles. Partner with universities for pipeline development.

**Options by context:**
• **Global enterprises:** Address data residency and multi-jurisdiction compliance.
• **Conglomerates:** Allow variation while enforcing minimum standards.
• **Digital natives:** Focus on competitive differentiation and scale.

**Pitfalls:**
• Central planning that ignores business unit needs and constrains innovation
• Governance that becomes bureaucracy
• Transformation fatigue from too many initiatives

**Quick checklist:** Build platform capabilities; implement federated model; launch lighthouse projects; establish governance board; develop talent strategy.`
  },

  // Additional critical executive guides
  gate_roi_measurement: {
    id: 'gate.roi_measurement',
    title: 'AI ROI Measurement — Proving Value Beyond the Hype',
    category: 'gate',
    tags: ['roi', 'value', 'measurement'],
    overview: 'Most AI ROI calculations are fantasy. Focus on measurable business outcomes, true cost accounting, and honest attribution of value.',
    body: `**What it is:** A disciplined approach to measuring the actual return on AI investments, accounting for all costs (direct and hidden) and attributing value accurately to AI versus other factors.

**Why it matters:** Without rigorous ROI measurement, you cannot distinguish valuable AI investments from expensive science projects. Boards and investors demand proof of value, not promises of potential.

**How to implement:**
1. **Define success metrics upfront:** Before any AI project, document the specific business metrics it will improve (revenue per customer, processing time, error rate). No fuzzy "improve efficiency" goals.
2. **True cost accounting:** Include all costs: licenses, compute, storage, integration, training, change management, and opportunity cost of talent. Many projects cost 2-3x the initial estimate.
3. **Control group comparison:** Where possible, run AI and non-AI processes in parallel. Measure the delta. This provides clean attribution of value to AI.
4. **Time-to-value tracking:** Measure not just eventual ROI but how long it takes to achieve positive returns. Some projects could have positive ROI eventually but negative NPV due to slow realization.
5. **Portfolio view:** Keep perspective. For example, you might xxpect 30% of AI projects to fail, 50% to break even, and 20% to deliver outsized returns. Manage a portfolio, not individual bets.

**Options by context:**
• **Cost reduction focus:** Emphasize efficiency metrics and headcount avoidance.
• **Revenue growth focus:** Track customer acquisition, retention, and lifetime value.
• **Risk reduction focus:** Quantify prevented losses and compliance savings.

**Pitfalls:**
• Attributing all improvement to AI when multiple factors contribute
• Ignoring hidden costs like technical debt and maintenance
• ROI theater—manipulating metrics to show success

**Quick checklist:** Define metrics upfront; account for true costs; use control groups; track time-to-value; manage portfolio returns.`
  },

  gate_vendor_selection: {
    id: 'gate.vendor_selection',
    title: 'AI Vendor Selection — Beyond the Demo Magic',
    category: 'gate',
    tags: ['vendor', 'procurement', 'selection'],
    overview: 'Choose AI vendors based on production readiness, not demo impressiveness. Focus on integration complexity, total cost, and vendor stability.',
    body: `**What it is:** A systematic process for evaluating and selecting AI vendors that goes beyond feature checklists to assess real implementation risk, total cost of ownership, and long-term viability.

**Why it matters:** Bad vendor choices create technical debt, vendor lock-in, and integration nightmares that can take years to unwind. The switching costs for AI systems can in some cases be extremely high once data and workflows are embedded.

**How to implement:**
1. **Proof of concept requirements:** Demand a POC with your data, your use case, and your constraints if possible. Many impressive demos fail with real-world complexity.
2. **Integration assessment:** How many APIs, data formats, and authentication methods are involved? Each integration point is a failure point. Simpler is better when possible.
3. **Total cost modeling:** Try modelling costs at 10x current volume. Include API calls, data transfer, support, and professional services. Many AI vendors have surprising cost cliffs.
4. **Reference customer diligence:** Talk to customers at your scale, in your industry, with your use case. Ask about surprises, hidden costs, and what they wish they knew before signing.
5. **Escape clause negotiation:** Include performance SLAs, cost caps, and data portability requirements. Plan your divorce before the marriage.

**Options by context:**
• **Regulated industries:** Prioritize vendors with compliance certifications and audit trails.
• **High-scale operations:** Focus on latency, throughput, and cost-per-transaction.
• **Innovation focus:** Accept more vendor risk for cutting-edge capabilities.

**Pitfalls:**
• Choosing based on features rather than production readiness
• Underestimating integration and change management costs
• No backup plan when vendors fail or get acquired

**Quick checklist:** Require real POCs; assess integration complexity; model total costs; check references thoroughly; negotiate escape clauses.`
  },

  context_board_governance: {
    id: 'context.board_governance',
    title: 'AI Governance for Boards — What Directors Must Know',
    category: 'context',
    tags: ['governance', 'board', 'leadership'],
    overview: 'Board directors need to understand AI risks and opportunities without becoming technologists. Focus on strategic questions, risk oversight, and competitive positioning.',
    body: `**What it is:** A framework for board-level oversight of AI initiatives that balances innovation encouragement with appropriate risk management, focusing on strategic rather than technical considerations.

**Why it matters:** AI creates both existential opportunities and existential risks. Boards that do not engage with AI governance may face regulatory penalties, competitive obsolescence, or catastrophic failures. Directors have a fiduciary duty to understand AI's impact on the business.

**How to implement:**
1. **AI literacy baseline:** Ensure all directors understand AI basics: what it can do, what it cannot do, and how it creates value. Bring in experts for board education sessions periodically.
2. **Strategic positioning:** Where does AI create competitive advantage versus competitive parity? Which capabilities should we build, buy, or borrow? How fast are competitors moving?
3. **Risk framework:** Understand the company's AI risk appetite and controls. Review high-impact AI systems quarterly. Ensure incident response plans exist and are tested.
4. **Investment governance:** Review AI portfolio performance against strategic objectives. Are we investing enough? Too much? In the right areas? Challenge management on ROI.
5. **Talent and culture:** Does the company have the talent to execute its AI strategy? Is the culture ready for AI-driven change? Review talent metrics and culture assessments.

**Questions boards should ask:**
• How does our AI maturity compare to competitors?
• What would happen if our AI systems failed for 24 hours?
• Are we complying with emerging AI regulations?
• How are we addressing AI bias and fairness?
• What is our AI investment returning?

**Red flags for boards:**
• No clear AI strategy tied to business strategy
• No board member with technology expertise
• Management cannot explain AI risks in business terms

**Quick checklist:** Establish AI literacy; review competitive position; implement risk oversight; govern investments; monitor talent readiness.`
  },

  // Additional high-leverage guides
  pillar_x_usecase_triage: {
    id: 'pillar.x.usecase_triage',
    title: 'Use-Case Triage & Portfolio Scoring — What to Do Before Pilots',
    pillar: 'X',
    category: 'pillar',
    tags: ['portfolio', 'scoring', 'triage', 'prioritization'],
    overview: 'Score candidate AI use cases on value, feasibility, risk, and data readiness. Output a prioritized backlog before committing resources to pilots.',
    body: `**What it is:** A systematic approach to evaluating and prioritizing potential AI use cases before investing in pilots. This creates a scored, prioritized backlog based on value potential, technical feasibility, risk profile, and data readiness—ensuring you work on the right things first.

**Why it matters:** It is possible to waste resources on AI pilots that should never have started. Be careful not to choose use cases based on excitement rather than evidence, feasibility rather than value, or politics rather than portfolio strategy. Proper triage prevents expensive failures and accelerates time-to-value. Here we will give an example of one way to do it. Adapt to your use case and needs.

**How to implement:**
1. **Value scoring (suggested 40% weight):** Quantify potential annual value in dollars. Consider revenue impact, cost reduction, risk mitigation, and customer satisfaction. No fuzzy "strategic value"—demand numbers.
2. **Feasibility assessment (suggested 30% weight):** Rate technical complexity, data availability, integration requirements, and skills gaps. Simple = 5, Moonshot = 1. Be brutally honest about current capabilities.
3. **Risk evaluation (suggested 20% weight):** Assess regulatory exposure, reputation risk, operational disruption, and failure impact. Low risk = 5, Existential = 1. Include both implementation and operational risks.
4. **Data readiness check (suggested 10% weight):** Score data quality, volume, accessibility, and governance. Ready now = 5, Major work needed = 1. Poor data kills more AI projects than any other factor.
5. **Portfolio balancing:** (Example) Build a portfolio with 70% low-risk quick wins, 20% medium-term value drivers, and 10% transformational bets. Balance across business units and time horizons.

**Scoring framework:**
• Total score = (Value × 0.4) + (Feasibility × 0.3) + (5 - Risk × 0.2) + (Data × 0.1)
• Scores > 4.0: Priority 1 - Start immediately
• Scores 3.0-4.0: Priority 2 - Start within quarter
• Scores 2.0-3.0: Priority 3 - Revisit next quarter
• Scores < 2.0: Reject or fundamentally rethink

**Options by context:**
• **B2B companies:** Weight customer retention and upsell value higher
• **Regulated industries:** Increase risk weighting to 30%
• **Startups:** Focus on feasibility and speed-to-market

**Pitfalls:**
• Gaming the scoring to justify pet projects
• Ignoring portfolio balance in favor of individual scores
• Not revisiting scores as capabilities mature
• Analysis paralysis—spending months scoring instead of starting

**Quick checklist:** Score value quantitatively; assess feasibility honestly; evaluate risks comprehensively; check data readiness; balance portfolio strategically.`
  },

  pillar_r_security_redteaming: {
    id: 'pillar.r.security_redteaming',
    title: 'GenAI Security & Red-Teaming — Beyond Basic Testing',
    pillar: 'R',
    category: 'pillar',
    tags: ['security', 'red-teaming', 'prompt-injection', 'jailbreaking'],
    overview: 'Run systematic red-team exercises against GenAI systems. Test for prompt injection, data exfiltration, and jailbreaking. Document findings and track mitigations.',
    body: `**What it is:** A structured program for adversarial testing of generative AI systems, simulating real attacks to identify vulnerabilities before malicious actors do. This includes prompt injection tests, data exfiltration attempts, jailbreaking drills, and tabletop exercises for incident response.

**Why it matters:** GenAI systems have unique attack surfaces that traditional security testing misses. A single successful prompt injection can expose customer data, bypass business logic, or damage your brand. Regular red-teaming is the only way to understand your real security posture.

**Who this is for:**
• AI Builders/Hosts: Full program (model, data, orchestration, serving).
• API Integrators / RAG App Teams: Red-team your prompts, retrieval, tool use, auth/roles, and data exfiltration paths-even if the base model is vendor-hosted.
• Chat Product Consumers: Emphasize usage policy, PII hygiene, and tenant/admin settings (retention, region, no-train); vendor owns model-level red-team.

**How to implement:**
1. **Prompt injection testing:** Test direct injections ("ignore previous instructions"), indirect injections (malicious content in documents), and multi-step attacks. Document successful bypasses and implement input sanitization.
2. **Data exfiltration drills:** Attempt to extract training data, system prompts, and user information through targeted queries. Test both direct requests and side-channel approaches.
3. **Jailbreaking exercises:** Try to make the system produce harmful, biased, or inappropriate content. Use known techniques plus novel approaches. Track success rates across model versions.
4. **Tabletop exercises:** Run quarterly scenarios: "What if our chatbot starts insulting customers?" Plan detection, response, and communication. Document playbooks for each scenario.
5. **Finding tracking:** Log all successful attacks with reproducibility steps, impact assessment, and mitigation status. Review monthly with security and product teams.

**Red-team playbook structure:**
• **Phase 1 - Reconnaissance:** Understand system boundaries, prompts, and guardrails
• **Phase 2 - Exploitation:** Execute targeted attacks across vulnerability categories
• **Phase 3 - Documentation:** Record successful attacks with full reproduction steps
• **Phase 4 - Mitigation:** Implement fixes and verify effectiveness
• **Phase 5 - Monitoring:** Deploy detection for attack patterns

**Options by context:**
• **Customer-facing systems:** Focus on brand damage and data exposure scenarios
• **Internal tools:** Emphasize intellectual property and process manipulation
• **Regulated environments:** Include compliance violation scenarios

**Pitfalls:**
• Testing only known attacks instead of thinking creatively
• Not involving actual attackers or security researchers
• Fixing symptoms rather than root causes
• Assuming model updates maintain security posture

**Quick checklist:** Test prompt injections systematically; attempt data exfiltration; run jailbreaking drills; conduct tabletop exercises; track and mitigate all findings.`
  },

  gate_llm_privacy: {
    id: 'gate.llm_privacy',
    title: 'LLM Privacy Controls (PII/PHI) — Data Protection at Scale',
    category: 'gate',
    tags: ['privacy', 'PII', 'PHI', 'data-protection', 'compliance'],
    overview: 'Implement comprehensive privacy controls for LLM systems handling PII/PHI. Focus on data minimization, masking, retention policies, and approved endpoints.',
    body: `**What it is:** A comprehensive framework for protecting personally identifiable information (PII) and protected health information (PHI) in LLM-based systems through technical controls, process guardrails, and compliance mechanisms.

**Why it matters:** One LLM prompt containing PII can violate GDPR, HIPAA, or CCPA, potentially resulting in millions in fines. Beyond compliance, privacy breaches can destroy customer trust. LLMs present unique challenges: they remember training data, generate synthetic PII, and can inadvertently expose sensitive information.

**Scope:** This gate applies fully to orgs **building/hosting models or RAG indices**. If you use **enterprise LLMs/APIs**, prompts/responses are typically **not used for provider training by default**; privacy still matters for **logging/retention, access, residency, and licensing** in your own systems and vendor settings.

**Who this is for:**
• **AI Builders/Hosts:** Full program—classification, masking, retention, endpoints, DPAs.
• **API Integrators / RAG App Teams:** Govern your **logs, indices, connectors, and admin controls** (retention, regions, no-train); redaction **before** calls; contracts that reflect your privacy posture.
• **Chat Product Consumers:** Emphasize **usage policy**, **workspace/tenant controls**, and **data controls** (e.g., disable training/adjust retention) offered by the vendor.

**How to implement:**
1. **Data minimization architecture:** Process PII only when absolutely necessary. Use synthetic data for development. Implement data clean rooms for sensitive operations. Default to aggregate rather than individual data.
2. **Masking and redaction pipeline:** Deploy real-time PII detection and masking before data reaches LLMs. Use entity recognition, pattern matching, and context-aware redaction. Maintain audit logs of all redactions.
3. **Retention and purging policies:** Define clear retention periods for prompts, responses, and fine-tuning data. Implement automated purging with cryptographic proof of deletion. Honor right-to-be-forgotten requests.
4. **Approved endpoint management:** Whitelist specific LLM endpoints for different data classifications. Route PII-free data to standard endpoints, PII to privacy-preserving endpoints, PHI to HIPAA-compliant infrastructure.
5. **Differential privacy techniques:** Add calibrated noise to queries and responses. Implement k-anonymity for aggregate queries. Use secure multi-party computation for sensitive operations.

**Technical implementation stack:**
• **Detection layer:** Microsoft Presidio, Google DLP API, or AWS Macie
• **Masking engine:** Format-preserving encryption or tokenization
• **Audit system:** Immutable logs with tamper detection
• **Access controls:** Attribute-based access with purpose limitation

**Options by context:**
• **Regulated healthcare:** HIPAA-compliant infrastructure with BAA agreements
• **Financial services:** PCI DSS compliance with transaction data isolation
• **European operations:** GDPR-compliant with data residency controls
• **Non-regulated:** Focus on customer trust and competitive advantage

**Pitfalls:**
• Assuming LLM providers handle privacy (they do not)
• Redacting so much that the system becomes useless
• Not testing redaction with adversarial inputs
• Forgetting about PII in logs and debugging tools

**Quick checklist:** Minimize data collection; implement masking pipeline; enforce retention policies; manage approved endpoints; apply differential privacy techniques.`
  },

  gate_contractual_controls: {
    id: 'gate.contractual_controls',
    title: 'Contractual Controls for AI Vendors — Beyond Standard Terms',
    category: 'gate',
    tags: ['contracts', 'vendor-management', 'legal', 'procurement'],
    overview: 'Structure AI vendor contracts to protect your interests. Cover data usage, retention, model ownership, audit rights, indemnification, and meaningful SLAs.',
    body: `**What it is:** A framework for negotiating and structuring contracts with AI vendors that goes beyond standard software agreements to address unique AI risks around data usage, model ownership, liability, and performance guarantees.

**Why it matters:** AI vendor contracts can have hidden risks. Your data might train their next model. Their model errors could affect your business. Their acquisition could hand your competitive advantage to rivals. Standard contracts might not provide sufficient protection against AI-specific risks. Below are some suggested upgrades to consider negotiating for when possible.

**How to implement:**
1. **Data usage and ownership clauses:** Explicitly prohibit using your data for model training without consent. Require data isolation from other customers. Clarify ownership of derived insights and fine-tuned models. Include data destruction requirements upon termination.
2. **Model performance guarantees:** Define specific performance metrics (accuracy, latency, availability) with penalties for degradation. Include provisions for model drift and required notification of model updates. Specify rollback rights if performance drops.
3. **Audit and transparency rights:** Secure rights to audit data handling, model performance, and security practices. Require disclosure of model limitations, training data sources, and known biases. Include third-party audit requirements for high-risk use cases.
4. **Liability and indemnification:** Expand indemnification to cover AI-specific risks: biased outputs, hallucinations, IP infringement from training data. Exclude liability caps for data breaches and willful misconduct. Require adequate insurance coverage.
5. **Exit and portability provisions:** Ensure data portability in standard formats. Require knowledge transfer for custom models. Include source code escrow for critical systems. Define clear transition assistance obligations.

**Key contractual provisions checklist:**
• **Data rights:** Your data remains yours, no training without permission
• **Performance SLAs:** Specific metrics with meaningful penalties
• **Change control:** Approval required for model updates affecting you
• **Audit rights:** Annual audits plus for-cause investigations
• **IP clarity:** Who owns fine-tuned models and generated content
• **Liability allocation:** Vendor liable for model errors and biases
• **Termination rights:** Exit for performance, breach, or change of control
• **Data return:** Complete data return/destruction within 30 days

**Negotiation tactics:**
• Start with your paper, not theirs
• Make data usage rights a deal-breaker
• Tie payment to performance metrics
• Require cyber insurance proof
• Include competitor acquisition triggers

**Options by context:**
• **Mission-critical systems:** Require source code escrow and on-premise options
• **Regulated industries:** Include regulatory compliance warranties
• **Startups vendors:** Focus on acquisition and bankruptcy scenarios

**Pitfalls:**
• Accepting "standard" AI terms (no such thing exists)
• Not involving legal counsel experienced in AI
• Focusing on price over protective terms
• Assuming cloud terms cover AI risks

**Quick checklist:** Control data usage; guarantee performance; secure audit rights; allocate liability properly; ensure clean exits.`
  },

  pillar_e_usage_governance: {
    id: 'pillar.e.usage_governance',
    title: 'Usage Governance & Quotas for LLMs — FinOps for AI',
    pillar: 'E',
    category: 'pillar',
    tags: ['finops', 'usage-governance', 'cost-control', 'quotas'],
    overview: 'Implement organization-level controls that enable safe experimentation and predictable spend. Set rate limits, budget guardrails, and cost attribution. Track cost per successful task and budget variance.',
    body: `**What it is:** A systematic approach to managing and optimizing LLM consumption across the organization through usage policies, quota management, cost attribution, and continuous optimization—essentially FinOps for AI operations.

**Scope & intent:** Designed for organizations moving from pilots to broader adoption. The goal is to **enable more experimentation safely and keep spend predictable**, not to block usage.

**Why it matters:** Unmonitored usage can create **surprise spend**. Rare but plausible events (runaway jobs, loops, misuse) can spike costs. Lightweight guardrails prevent surprises without slowing teams down, and make value and costs visible to leaders. This will include an array of approaches to consider based on your specific use case.

**How to implement:**
1. **Hierarchical quota system:** Set org caps, department allocations, and user/app limits. **Alert at 60% and 80%**; **soft-throttle or gracefully degrade at 90%** (smaller models, shorter context, queue). **Optional hard stop** for non-critical workloads, with an **exception path** for critical work.
2. **Rate limiting and throttling:** Use an API gateway with per-user/app/endpoint limits. Default **tight limits in dev** and **managed limits in prod**; apply exponential backoff and **queuing before rejection**.
3. **Cost attribution and tagging:** Tag every call with user, department, project, and purpose. Calculate fully loaded costs (API, compute, storage, support). **Avoid logging PII** in cost traces; **sample** where possible. Send **weekly cost reports** by dimension.
4. **Usage optimization program:** **Optimize before restricting**—prompt budgets, retrieval top-k caps, caching for common requests, batch where latency permits, and **model routing** by task complexity.
5. **Success-based metrics:** Track **cost per successful outcome** and **quality**, not just calls. Monitor task completion rates, retries, and user satisfaction. Calculate **ROI by use case** to justify continued investment.

**Technical implementation:**
• **Gateway layer:** Kong, Apigee, or AWS API Gateway for rate limiting  
• **Monitoring:** Datadog, New Relic, or custom dashboards for usage tracking  
• **Cost management:** Cloud cost tools + simple allocation (tags/labels, budgets)  
• **Optimization:** Prompt/context budgets, caching, routing, and batch/micro-batch

**Key metrics to track:**
• **Cost per 1k requests** (and per task type) • **Budget variance** by department (target < 10%)  
• **Usage efficiency** (successful/total calls) • **Model mix** (% routed to smaller/cheaper models)  
• **Cache hit rate** • **Avg context tokens** (p50/p95) • **Retries per request** • **GPU/utilization (if self-hosted)**

**When this applies (triggers):**
• > 50 active users or > $X/month spend • New high-volume use case  
• Model/routing changes • Budget variance > 10% month-over-month

**Options by context:**
• **Large enterprises:** Department-level budgets and **chargeback/showback**; dashboards in BI tools leaders already use  
• **Startups:** Stricter quotas with a **fast-lane exception** process; buy most layers, focus on optimization  
• **Regulated industries:** Complete audit trails (who, what, why), purpose documentation, and retention controls

**Pitfalls:**
• Quotas so tight that teams **stop experimenting**  
• Ignoring **hidden costs** (retries, storage, egress, embeddings) in budgets  
• Chasing lowest price while **harming quality/CSAT**  
• Process overhead that **slows delivery**; no fast-lane exceptions

**Controls ladder:** Visibility → Alerts → Soft throttle → Graceful degrade → Hard stop (non-critical) → Exception path

**Quick checklist:** Hierarchical quotas in place: Rate limits by user/app/endpoint: Cost tagging + weekly reports: Optimization levers (prompt budgets, caching, routing, batching); Success-based metrics live`
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