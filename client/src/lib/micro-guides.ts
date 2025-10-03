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
    overview: 'A human reviews, approves, or can intervene in AI-assisted decisions where stakes are high (financial exposure, safety, legal or brand risk). Human-in-the-Loop (HITL) is not a permanent brake; it is a temporary guardrail until you have evidence that automation is safe for specific tasks.',
    body: `**What it is:** A human reviews, approves, or can intervene in AI-assisted decisions where stakes are high (financial exposure, safety, legal or brand risk). Human-in-the-Loop (HITL) is not a permanent brake; it is a **temporary guardrail** until you have evidence that automation is safe for specific tasks.

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
• **Regulated/high-safety:** Keep Human-in-the-Loop (HITL) longer and document reviewer qualifications.
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
  },

  // Operations & Data guides
  pillar_O_deep: {
    id: 'pillar.O.deep',
    title: 'Operations & Data — Building the Engine Room for AI',
    category: 'pillar',
    pillar: 'O',
    tags: ['data', 'operations', 'mlops'],
    overview: 'Strong AI operations start with data quality gates, clear use-case screening, and basic MLOps practices that prevent technical debt from accumulating.',
    body: `**What it is:** The operational foundation that turns AI experiments into reliable services. This covers data pipelines, model deployment, performance monitoring, and the governance processes that keep everything running smoothly.

**Why it matters:** Without operational discipline, AI becomes a collection of science projects that never deliver consistent value. Good operations multiply the impact of every model you build while reducing the cost and risk of running them at scale.

**How to implement:**
1. **Data quality gates:** Define 5-7 key quality metrics for your critical data sources. Monitor completeness, freshness, accuracy, and consistency. Block model training when quality drops below thresholds.
2. **Use-case screening:** Create a simple scoring matrix (value, feasibility, risk). Require business sponsors for every pilot. Kill projects that do not clear the bar within 90 days.
3. **Basic MLOps:** Start with version control for models and data. Add automated testing for model performance. Build rollback capabilities before you need them.
4. **Performance tracking:** Monitor inference latency, throughput, and error rates in production. Set SLAs that match business needs, not technical ideals.
5. **Cost allocation:** Track compute, storage, and API costs by use-case. Make costs visible to business owners monthly.

**Options by context:**
• **High-scale operations:** Invest in feature stores and model registries early.
• **Regulated industries:** Add audit trails and explainability from day one.
• **Startups:** Use managed services; focus on iteration speed over infrastructure.

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
    body: `**What it is:** A pragmatic approach to data quality that focuses on metrics that directly impact AI performance, not academic perfection. Think "good enough for reliable predictions" not "perfect in every dimension."

**Why it matters:** Poor data quality is the silent killer of AI initiatives. Models trained on bad data make bad decisions, erode trust, and create hidden liabilities. But over-engineering data quality wastes resources on marginal improvements.

**How to implement:**
1. **Profile your data:** Run basic statistics on all training data. Look for missing values, outliers, and class imbalances. Document what "normal" looks like.
2. **Set quality thresholds:** Define minimums for completeness (e.g., <5% missing), consistency (e.g., format compliance >95%), and balance (e.g., no class <10% of total).
3. **Automate monitoring:** Build simple checks that run before model training and in production pipelines. Alert when quality degrades.
4. **Create feedback loops:** Capture production predictions and outcomes. Use them to identify quality issues your static checks miss.
5. **Document lineage:** Know where data comes from, how it is transformed, and where it is used. This makes debugging 10x faster.

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

**Why it matters:** Biased AI can violate regulations, harm vulnerable populations, and create legal liability. Even unintentional bias can damage your brand and limit market opportunities. Proactive testing helps you fix problems before they hurt people.

**How to implement:**
1. **Define fairness:** Decide what fairness means for your use case. Equal outcomes? Equal opportunity? Equal treatment? Document your choice and rationale.
2. **Identify protected groups:** List the dimensions that matter (age, gender, race, geography, customer segment). Not everything needs testing—focus on legal requirements and business impact.
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
    body: `**What it is:** The human side of AI transformation—building skills, changing mindsets, and redesigning work to take advantage of AI capabilities. This is about making AI tools productive for real people doing real work.

**Why it matters:** Technology alone does not create value—people using technology effectively does. Organizations that nail the talent and culture piece see 3-5x higher ROI on their AI investments. Those that do not end up with expensive tools gathering dust.

**How to implement:**
1. **Skills mapping:** Identify which roles will use AI and what they need to know. Create three tiers: AI builders (engineers), AI users (analysts), and AI consumers (everyone else).
2. **Practical training:** Skip generic "AI 101" courses. Build role-specific training that shows people how AI helps them today. Include hands-on exercises with real tools and data.
3. **Champion network:** Recruit early adopters as champions. Give them early access, extra training, and a platform to share successes. They will pull others along.
4. **Process redesign:** Do not just bolt AI onto existing workflows. Redesign processes to leverage AI strengths while preserving human judgment where it matters.
5. **Adoption tracking:** Measure actual usage, not training completion. Track who is using AI tools, how often, and whether it is improving their outcomes.

**Options by context:**
• **Technical teams:** Focus on MLOps, responsible AI practices, and platform skills.
• **Business teams:** Emphasize prompt engineering, output validation, and use-case identification.
• **Leadership:** Concentrate on strategy, governance, and cultural change management.

**Pitfalls:**
• Training everyone on everything instead of targeted skill building
• Ignoring middle management resistance to change
• Measuring activity (training hours) instead of outcomes (productivity gains)

**Quick checklist:** Map skills by role; create practical training; build champion network; redesign key processes; track real usage.`
  },

  pillar_T_change_management: {
    id: 'pillar.T.change_management',
    title: 'AI Change Management — Overcoming the Resistance',
    category: 'pillar',
    pillar: 'T',
    tags: ['change', 'adoption', 'culture'],
    overview: 'Most AI initiatives fail due to human factors, not technology. Address fears directly, show early wins, and make adoption easier than resistance.',
    body: `**What it is:** A structured approach to helping people adopt AI tools and new ways of working. This means addressing emotional responses (fear, skepticism), practical barriers (skills, access), and organizational inertia.

**Why it matters:** Studies show 70% of AI projects fail to achieve their goals, mostly due to adoption challenges. People fear job loss, feel overwhelmed by new technology, or simply prefer familiar ways of working. Without deliberate change management, even the best technology fails.

**How to implement:**
1. **Address fears explicitly:** Hold town halls to discuss how AI will and will not change jobs. Be honest about impacts while emphasizing opportunities for growth.
2. **Start with volunteers:** Do not force adoption. Let eager early adopters go first, generate success stories, and create pull from peers.
3. **Make it stupidly easy:** Remove every friction point. Single sign-on, integrated workflows, great documentation, responsive support. If it is harder than the old way, people will not switch.
4. **Celebrate small wins:** Publicize every success, no matter how minor. "Sarah saved 2 hours this week using AI for report generation" is powerful social proof.
5. **Adjust incentives:** Reward AI adoption and knowledge sharing. If bonuses and promotions still flow to people doing things the old way, behavior will not change.

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
    body: `**What it is:** The technical foundation that powers your AI capabilities—compute resources, data platforms, model serving infrastructure, and the vendor ecosystem that extends your capabilities. This is the plumbing that needs to "just work."

**Why it matters:** Bad infrastructure creates compounding problems: slow development, reliability issues, security vulnerabilities, and exploding costs. Good infrastructure is invisible—it enables teams to focus on solving business problems instead of fighting tools.

**How to implement:**
1. **Platform strategy:** Choose build vs. buy vs. partner for each layer. Most organizations should buy commodity layers (compute, storage) and build differentiation layers (feature engineering, model optimization).
2. **Cost architecture:** Understand unit economics from day one. What does each prediction cost? How does cost scale with volume? Build cost controls before you get the bill shock.
3. **Vendor management:** Maintain competitive tension. Never depend on a single provider for critical capabilities. Negotiate enterprise agreements with volume commits and escape clauses.
4. **Development environment:** Give teams self-service access to appropriate resources. Include cost visibility, security guardrails, and collaboration features.
5. **Scaling readiness:** Design for 10x current volume. This doesn't mean building for it now, but ensuring your architecture can grow without rewrites.

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
    body: `**What it is:** Systematic management of AI-related costs including compute, storage, API calls, and human resources. The goal is sustainable unit economics, not just lower bills.

**Why it matters:** AI can be expensive—really expensive. Teams have accidentally spent $100K+ in a weekend. Without cost controls, you'll either blow budgets or throttle innovation. Smart cost management enables more experimentation within constraints.

**How to implement:**
1. **Cost visibility:** Tag all resources by project, team, and use-case. Create dashboards showing daily burn rates and monthly trends. Alert on anomalies.
2. **Model optimization:** Right-size models for each use-case. GPT-4 for complex reasoning, GPT-3.5 for simple tasks, fine-tuned small models for repetitive work.
3. **Caching strategy:** Cache common queries, especially for deterministic operations. A good cache can cut costs by 50-80% for many use-cases.
4. **Batch processing:** Aggregate requests when latency permits. Batch inference is often 70% cheaper than real-time.
5. **Kill switches:** Implement automatic shutoffs when costs exceed thresholds. Better to fail closed than receive a bankruptcy-inducing bill.

**Options by context:**
• **High-volume B2C:** Focus on unit economics and marginal cost.
• **Enterprise B2B:** Optimize for value delivery within budget constraints.
• **R&D/experimentation:** Set clear budgets with hard stops.

**Pitfalls:**
• Optimizing too early before understanding value delivery
• Penny-wise, pound-foolish decisions that hurt user experience
• No cost attribution leading to tragedy of the commons

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

**Why it matters:** AI is moving too fast for waterfall planning. Organizations need to experiment constantly, but without discipline, experimentation becomes expensive chaos. Good experiment management generates learning velocity while controlling risk and cost.

**How to implement:**
1. **Portfolio approach:** Run multiple small bets instead of one big bet. Aim for 10-20 experiments quarterly with 90-day learning cycles.
2. **Clear stage-gates:** Define phases (ideation → prototype → pilot → scale) with specific exit criteria. Kill projects that do not advance within their timeframe.
3. **Learning objectives:** Every experiment needs a hypothesis and success metrics defined upfront. "Let's try AI" is not a hypothesis.
4. **Fast feedback loops:** Measure results weekly, pivot monthly, kill or scale quarterly. Speed of learning matters more than perfection.
5. **Knowledge capture:** Document what worked, what did not work, and why. Share learnings broadly. Failed experiments that generate insights are valuable.

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

**Why it matters:** Organizations often have dozens of "pilots" that are really zombie projects—neither succeeding nor failing, just consuming resources. Good pilot management creates a healthy pipeline of innovations while preventing resource drain.

**How to implement:**
1. **90-day timebox:** Every pilot gets 90 days maximum to prove value. Extensions require executive approval and clear rationale. This forces focus and prevents drift.
2. **Success criteria upfront:** Define quantitative success metrics before starting. "20% reduction in processing time" not "improve efficiency." No moving goalposts.
3. **Minimum viable scope:** Strip pilots to essentials. Test the core hypothesis with minimum features, users, and investment. You're validating an idea, not building production systems.
4. **Weekly scorecards:** Track progress, blockers, and burn rate weekly. Surface problems early when they're fixable. No surprises at the 90-day mark.
5. **Binary decisions:** At 90 days, make a clear decision: scale, pivot, or kill. No "let's continue exploring." Document the rationale and share learnings.

**Options by context:**
• **Customer-facing pilots:** Include user feedback metrics and safety controls.
• **Internal efficiency:** Focus on time savings and quality improvements.
• **Revenue generation:** Emphasize unit economics and scalability.

**Pitfalls:**
• Scope creep that turns pilots into full implementations
• No clear owner or sponsor
• Success criteria that cannot actually be measured

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

**Why it matters:** AI systems can inadvertently memorize and expose sensitive data. Poor data governance leads to privacy breaches, regulatory fines, and loss of customer trust. It's much harder to fix governance after AI systems are deployed.

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
    overview: 'Models degrade over time as the world changes. Implement monitoring that detects drift, degradation, and anomalies before they impact users.',
    body: `**What it is:** Continuous observation of model behavior in production to detect when performance degrades, inputs drift from training distributions, or unexpected behaviors emerge.

**Why it matters:** A model that was 95% accurate at launch might be 60% accurate six months later. Without monitoring, you do not know when models fail until customers complain or regulators investigate.

**How to implement:**
1. **Baseline metrics:** Capture accuracy, precision, recall, and business KPIs at deployment. This is your "model birth certificate"—the standard for comparison.
2. **Input drift detection:** Monitor statistical properties of incoming data. Alert when distributions shift significantly from training data. Use simple metrics like KL divergence or PSI.
3. **Output monitoring:** Track prediction distributions, confidence scores, and error rates. Sudden changes often indicate problems even when inputs look normal.
4. **Business impact tracking:** Connect model metrics to business outcomes. A 5% accuracy drop might not matter, but a 5% revenue drop definitely does.
5. **Automated alerts:** Set thresholds for automatic notifications. Page on-call engineers for critical issues, email stakeholders for trends.

**Options by context:**
• **Real-time systems:** Focus on latency and error rates with minute-level granularity.
• **Batch processes:** Emphasize data quality and completeness checks.
• **High-stakes decisions:** Add human review triggers when confidence drops.

**Pitfalls:**
• Monitoring everything equally instead of focusing on critical metrics
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
• **Healthcare:** Emphasize FDA guidance and clinical validation.
• **Insurance:** Address actuarial standards and discrimination concerns.

**Pitfalls:**
• Compliance paralysis that stops all innovation
• Documentation for documentation's sake
• Assuming one-size-fits-all compliance across jurisdictions

**Quick checklist:** Map regulatory requirements; document models thoroughly; build in explainability; maintain audit trails; establish independent validation.`
  },

  context_startup: {
    id: 'context.startup',
    title: 'AI for Startups — Speed Over Sophistication',
    category: 'context',
    tags: ['startup', 'agility', 'growth'],
    overview: 'Startups should use AI to create unfair advantages, not to play catch-up. Focus on differentiation, iteration speed, and capital efficiency.',
    body: `**What it is:** A lean approach to AI that prioritizes learning speed and customer value over technical sophistication. This means using existing tools, iterating rapidly, and focusing AI on your core differentiation.

**Why it matters:** Startups have advantages (speed, focus) and constraints (capital, talent). AI should amplify advantages while respecting constraints. The goal is finding product-market fit, not building perfect infrastructure.

**How to implement:**
1. **Buy, do not build:** Use OpenAI, Anthropic, or Cohere APIs instead of training models. Use Hugging Face models instead of creating architectures. Save engineering for your secret sauce.
2. **Start with prompts:** Most problems can be solved with good prompt engineering before you need fine-tuning or custom models. This is 100x faster and cheaper.
3. **Focus on the wedge:** Use AI to nail one use-case exceptionally well rather than being mediocre at many. Depth beats breadth for creating differentiation.
4. **Rapid experimentation:** Ship AI features behind feature flags. Test with small user cohorts. Iterate daily based on feedback. Speed of learning is your advantage.
5. **Unit economics first:** Know your CAC and LTV implications before scaling. AI can be expensive—make sure it drives enough value to justify costs.

**Options by context:**
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
    body: `**What it is:** A comprehensive approach to deploying AI across complex organizations with multiple business units, legacy systems, and stakeholder groups. This requires platforms that scale, governance that doesn't suffocate, and change management that actually works.

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
• Central planning that ignores business unit needs
• Governance that becomes bureaucracy
• Transformation fatigue from too many initiatives

**Quick checklist:** Build platform capabilities; implement federated model; launch lighthouse projects; establish governance board; develop talent strategy.`
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