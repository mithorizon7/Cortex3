import type { OptionCard, MisconceptionQuestion } from "./schema";

// Seven Lenses definitions for reference
export const LENS_DEFINITIONS = {
  speed: "Speed-to-Value: 0=months+; 2=weeks; 4=days",
  control: "Customization & Control: 0=out-of-box; 4=deeply tailored workflows/models",
  dataLeverage: "Data Leverage: 0=doesn't use your data; 4=strong use of proprietary knowledge/data",
  riskLoad: "Risk & Compliance Load: 0=minimal extra controls; 4=heavy assurance & governance",
  opsBurden: "Operational Burden: 0=near zero ops; 4=dedicated team/process",
  portability: "Portability & Lock-in: 0=hard to switch; 4=easy to swap/migrate",
  costShape: "Cost Shape: 0=large fixed/CapEx; 4=primarily variable, throttleable OpEx",
} as const;

export const LENS_LABELS = {
  speed: "Speed-to-Value",
  control: "Customization & Control",
  dataLeverage: "Data Leverage",
  riskLoad: "Risk & Compliance Load",
  opsBurden: "Operational Burden",
  portability: "Portability & Lock-in",
  costShape: "Cost Shape",
} as const;

// Option Cards Data
export const OPTION_CARDS: OptionCard[] = [
  {
    id: "off_the_shelf_apps",
    title: "Off-the-Shelf AI Apps (copilots, vertical SaaS)",
    what: "Ready-made AI inside productivity or line-of-business tools.",
    bestFor: [
      "Fast productivity uplift and drafting",
      "Low-risk internal tasks and experimentation",
      "Broad enablement across roles"
    ],
    notIdeal: [
      "Deep domain reasoning or custom UX is needed",
      "Strict residency or bespoke security controls required"
    ],
    prerequisites: [
      "Usage policy and guardrails",
      "Onboarding guides and examples",
      "Basic monitoring of adoption/incidents"
    ],
    timelineMeters: { speed: 4, buildEffort: 1, ops: 1 },
    dataNeeds: "None beyond typical app content; avoid sensitive data unless enterprise terms cover it.",
    risks: [
      "Vendor terms and data-use defaults",
      "Prompt hygiene; misrouting sensitive content",
      "\"Shadow usage\" without enablement"
    ],
    kpis: [
      "Adoption in target roles",
      "Time saved per task / rework rate"
    ],
    myth: {
      claim: "Off-the-shelf is toy-grade.",
      truth: "Often the fastest ROI and a strong baseline."
    },
    axes: { speed: 4, control: 1, dataLeverage: 1, riskLoad: 1, opsBurden: 1, portability: 2, costShape: 3 },
    cautions: ["high_sensitivity", "regulated"]
  },
  {
    id: "api_orchestration",
    title: "API Orchestration & Prompt Libraries (no training)",
    what: "Call foundation model APIs from your systems; reusable prompts; function calling.",
    bestFor: [
      "Integrating AI into existing apps and workflows",
      "Controlled logging/costs with simple evals",
      "Tool use (formatting, extraction, enrichment)"
    ],
    notIdeal: [
      "Outputs must be grounded in proprietary knowledge (use RAG)"
    ],
    prerequisites: [
      "Basic dev capacity; logging/alerts",
      "Token budgeting/quotas",
      "Evaluation harness for prompts"
    ],
    timelineMeters: { speed: 3, buildEffort: 2, ops: 2 },
    dataNeeds: "Operational inputs only; no training corpus.",
    risks: [
      "Rate limits/quotas; spend spikes",
      "PII handling in prompts/logs",
      "Model version drift without tests"
    ],
    kpis: [
      "Cost per call; p95 latency",
      "Success rate per use-case"
    ],
    myth: {
      claim: "Prompting is guesswork.",
      truth: "Templates + evals make it engineering, not magic."
    },
    axes: { speed: 3, control: 2, dataLeverage: 2, riskLoad: 2, opsBurden: 2, portability: 3, costShape: 3 },
    cautions: ["regulated", "high_sensitivity"]
  },
  {
    id: "rag",
    title: "Retrieval-Augmented Generation (RAG)",
    what: "The model retrieves your own content as context before generating an answer.",
    bestFor: [
      "Policies/FAQs; internal knowledge assistance",
      "Domain Q&A and search + summarization"
    ],
    notIdeal: [
      "You need new capabilities not present in base model (consider fine-tune)"
    ],
    prerequisites: [
      "Curated corpus; indexing & chunking strategy",
      "Access controls mirrored in retrieval",
      "Retrieval/e2e evals (precision/recall; factuality)"
    ],
    timelineMeters: { speed: 3, buildEffort: 3, ops: 3 },
    dataNeeds: "Rights-clear documents; refresh cadence for updates.",
    risks: [
      "Data leakage in indices",
      "Stale or conflicting content",
      "Over-trust without citations"
    ],
    kpis: [
      "Retrieval precision/recall",
      "Answer factuality / citation coverage"
    ],
    myth: {
      claim: "RAG removes hallucinations.",
      truth: "It reduces them when retrieval is good; still verify."
    },
    axes: { speed: 3, control: 3, dataLeverage: 4, riskLoad: 3, opsBurden: 3, portability: 3, costShape: 3 },
    cautions: ["high_sensitivity", "regulated"]
  },
  {
    id: "agents",
    title: "Agentic Workflows & Orchestrators",
    what: "Multi-step LLM workflows that call tools/APIs, plan subtasks, and verify steps.",
    bestFor: [
      "Complex processes (intake → classify → retrieve → draft → QA)",
      "Operations triage, case handling, multi-tool flows"
    ],
    notIdeal: [
      "Tasks must be fully deterministic with strict audit trails"
    ],
    prerequisites: [
      "Stable tool APIs and schemas",
      "Step-wise evals and guardrails",
      "Incident runbook; kill-switches"
    ],
    timelineMeters: { speed: 2, buildEffort: 3, ops: 3 },
    dataNeeds: "Tool schemas; optional RAG for knowledge.",
    risks: [
      "Cascading failures across steps",
      "Prompt-injection via tools/data",
      "Harder debugging without tracing"
    ],
    kpis: [
      "End-to-end success rate",
      "Intervention rate / step accuracy"
    ],
    myth: {
      claim: "Agents are autonomous.",
      truth: "Effective agents are structured workflows, not free roam."
    },
    axes: { speed: 2, control: 4, dataLeverage: 3, riskLoad: 4, opsBurden: 3, portability: 2, costShape: 2 },
    cautions: ["regulated", "high_sensitivity", "low_readiness"]
  },
  {
    id: "light_ft",
    title: "Light Fine-Tuning (LoRA / adapters)",
    what: "Small, targeted updates so a model matches style, format, or narrow domain behaviors.",
    bestFor: [
      "Consistent formatting and tone/brand",
      "Routine, structured outputs"
    ],
    notIdeal: [
      "You lack labeled examples",
      "You need factual grounding (use RAG)"
    ],
    prerequisites: [
      "Labeled examples; eval harness",
      "Rollout/rollback plan",
      "IP/rights for training data"
    ],
    timelineMeters: { speed: 2, buildEffort: 3, ops: 3 },
    dataNeeds: "Rights-clear, high-quality examples; continuous curation.",
    risks: [
      "Overfitting; model/weights drift",
      "Maintenance as base models evolve",
      "Legal/IP questions on data"
    ],
    kpis: [
      "Exact match / rubric scores",
      "Editing time reduction"
    ],
    myth: {
      claim: "Fine-tuning fixes hallucinations.",
      truth: "Often better for style/format; ground facts with RAG."
    },
    axes: { speed: 2, control: 3, dataLeverage: 2, riskLoad: 3, opsBurden: 3, portability: 2, costShape: 2 },
    cautions: ["low_readiness", "high_sensitivity", "regulated"]
  },
  {
    id: "heavy_ft",
    title: "Heavy Fine-Tuning / Domain Model",
    what: "Extensive training to adapt a base model for a specific domain/task.",
    bestFor: [
      "Specialized reasoning or non-English domains",
      "Strict latency/size constraints via smaller models"
    ],
    notIdeal: [
      "Limited clean, labeled datasets",
      "Immature MLOps/governance/IR"
    ],
    prerequisites: [
      "Significant labeled data; ML team",
      "Safety testing; governance; IR plan",
      "Sustained budget and roadmap"
    ],
    timelineMeters: { speed: 1, buildEffort: 4, ops: 4 },
    dataNeeds: "Large, high-signal, rights-clear datasets; ongoing refresh.",
    risks: [
      "High cost; obsolescence vs frontier",
      "Compliance review overhead",
      "Vendor/model architecture lock-in"
    ],
    kpis: [
      "Task accuracy vs baseline",
      "Stability under drift; unit economics"
    ],
    myth: {
      claim: "We need our own model to compete.",
      truth: "Only if differentiation + data + readiness all align."
    },
    axes: { speed: 1, control: 4, dataLeverage: 4, riskLoad: 4, opsBurden: 4, portability: 1, costShape: 1 },
    cautions: ["low_readiness", "regulated", "high_sensitivity"]
  },
  {
    id: "private_hosting",
    title: "Private Hosting / VPC",
    what: "Run models in your controlled environment for privacy, control, or SLAs.",
    bestFor: [
      "Sensitive data; isolation needs",
      "Custom SLAs and network policies"
    ],
    notIdeal: [
      "Limited infra/ops capacity",
      "Need frontier capabilities updated frequently"
    ],
    prerequisites: [
      "Infra budget; MLOps; security posture",
      "Monitoring, patching, upgrades"
    ],
    timelineMeters: { speed: 2, buildEffort: 3, ops: 4 },
    dataNeeds: "None to host; more if tuning/training.",
    risks: [
      "Patch/upgrade debt",
      "Availability/latency obligations shift to you",
      "Under-provisioned failover"
    ],
    kpis: [
      "Uptime and p95 latency",
      "Security incidents; capacity headroom"
    ],
    myth: {
      claim: "On-prem is automatically safer.",
      truth: "Safety = process & controls; hosting shifts responsibility to you."
    },
    axes: { speed: 2, control: 3, dataLeverage: 2, riskLoad: 3, opsBurden: 4, portability: 3, costShape: 2 },
    cautions: ["high_sensitivity", "regulated", "edge"]
  },
  {
    id: "edge_small_models",
    title: "Small Models at the Edge",
    what: "Deploy compact models on devices/near data for latency, privacy, or offline use.",
    bestFor: [
      "Field ops, manufacturing, retail POS",
      "Low-latency or intermittent connectivity"
    ],
    notIdeal: [
      "Need frontier model capabilities updated weekly"
    ],
    prerequisites: [
      "Model/runtime selection; OTA update plan",
      "Telemetry and rollback strategy"
    ],
    timelineMeters: { speed: 2, buildEffort: 3, ops: 4 },
    dataNeeds: "Optional on-device tuning; minimize sensitive capture.",
    risks: [
      "Fleet inconsistency; upgrade debt",
      "Physical access risks",
      "Debugging without full logs"
    ],
    kpis: [
      "p95 latency; offline success rate",
      "Update failure rate / rollback count"
    ],
    myth: {
      claim: "Edge is less safe.",
      truth: "Different safety: more control, more patch discipline."
    },
    axes: { speed: 2, control: 3, dataLeverage: 2, riskLoad: 3, opsBurden: 4, portability: 2, costShape: 2 },
    cautions: ["edge", "regulated"]
  },
  {
    id: "classical_ml_rules_rpa",
    title: "Classical ML, Rules & RPA",
    what: "Regression/classifiers, rule engines, extract/transform, and automation of deterministic tasks.",
    bestFor: [
      "Structured, repeatable decisions",
      "Forms processing; validations; deterministic checks"
    ],
    notIdeal: [
      "Open-ended generation or multimodal reasoning"
    ],
    prerequisites: [
      "Process mapping; data schema; feature engineering"
    ],
    timelineMeters: { speed: 3, buildEffort: 2, ops: 2 },
    dataNeeds: "Labeled/tabular data for ML; rules specs for RPA.",
    risks: [
      "Brittle rules; process drift",
      "Blind spots without monitoring"
    ],
    kpis: [
      "Precision/recall or F1 (ML)",
      "Straight-through-processing rate; exception volume"
    ],
    myth: {
      claim: "LLMs replace earlier techniques.",
      truth: "Hybrid systems win: rules/ML for structure + LLMs for judgment."
    },
    axes: { speed: 3, control: 3, dataLeverage: 3, riskLoad: 2, opsBurden: 2, portability: 4, costShape: 3 },
    cautions: []
  }
];

// Misconception Questions
export const MISCONCEPTION_QUESTIONS: MisconceptionQuestion[] = [
  {
    id: "fine_tuning_hallucinations",
    statement: "Fine-tuning a model fixes hallucinations and makes outputs more factual.",
    correct: false,
    explanation: "Fine-tuning typically improves style, format, and task-specific behavior, but doesn't necessarily improve factual accuracy. For grounding facts, use RAG (Retrieval-Augmented Generation) instead.",
    relatedOptions: ["light_ft", "heavy_ft", "rag"]
  },
  {
    id: "agents_autonomous",
    statement: "AI agents can work completely autonomously without human oversight.",
    correct: false,
    explanation: "Effective agents are structured workflows with clear guardrails, not autonomous systems. They require human-defined boundaries, kill-switches, and monitoring.",
    relatedOptions: ["agents"]
  },
  {
    id: "prompting_guesswork",
    statement: "Prompt engineering is mostly trial-and-error guesswork.",
    correct: false,
    explanation: "Good prompting uses templates, systematic evaluation, and engineering discipline. It's a craft that can be measured and improved methodically.",
    relatedOptions: ["api_orchestration"]
  },
  {
    id: "edge_less_safe",
    statement: "Deploying models at the edge is inherently less secure than cloud deployment.",
    correct: false,
    explanation: "Edge deployment has different security considerations - you control the physical environment but take responsibility for patching and updates. It's not inherently more or less secure, just different.",
    relatedOptions: ["edge_small_models"]
  },
  {
    id: "llms_replace_all",
    statement: "Large Language Models will eventually replace all traditional ML and rule-based systems.",
    correct: false,
    explanation: "Hybrid systems often work best - combining rules/traditional ML for structured decisions with LLMs for judgment and generation. Each approach has its strengths.",
    relatedOptions: ["classical_ml_rules_rpa"]
  }
];

export const CAUTION_MESSAGES = {
  regulated: "HITL + assurance required before scale",
  high_sensitivity: "Data residency/retention & vendor data-use terms apply",
  low_readiness: "Build later: start with Buy/API/RAG patterns",
  edge: "Design for offline/latency; define fallback"
} as const;