import type { OptionCard, MisconceptionQuestion, ContextProfile } from "@shared/schema";

// 7 Lens Labels for Options Studio
export const LENS_LABELS = [
  "Speed-to-Value",
  "Customization & Control", 
  "Data Leverage",
  "Risk & Compliance Load",
  "Operational Burden",
  "Portability & Lock-in",
  "Cost Shape"
] as const;

// 9 Option Cards for AI implementation approaches
export const OPTION_CARDS: OptionCard[] = [
  // READY SOLUTIONS
  {
    id: "off-shelf-ai",
    title: "Off-the-Shelf AI Apps",
    shortDescription: "Ready-to-use AI applications like ChatGPT, Notion AI, or GitHub Copilot",
    fullDescription: "Consumer and enterprise AI applications that require no setup or technical implementation. These tools offer immediate productivity gains with minimal learning curve and zero infrastructure requirements.",
    pros: [
      "Immediate availability with no setup time",
      "No technical expertise required",
      "Continuously updated with latest AI advances",
      "Low cost of entry",
      "Proven reliability and performance"
    ],
    cons: [
      "Limited customization options",
      "No access to your proprietary data",
      "Potential vendor dependency",
      "Generic outputs not tailored to your domain",
      "Data privacy concerns with third-party tools"
    ],
    bestFor: [
      "Quick productivity wins for knowledge workers",
      "Organizations testing AI value before larger investments",
      "Use cases where generic AI capabilities are sufficient",
      "Teams without technical AI expertise"
    ],
    examples: [
      "ChatGPT for content creation and analysis",
      "GitHub Copilot for code assistance",
      "Notion AI for document enhancement",
      "Grammarly for writing improvement"
    ],
    category: "ready",
    lensValues: {
      Speed: 5,
      Custom: 2,
      Data: 1,
      Risk: 2,
      Ops: 1,
      Lock: 4,
      Cost: 2
    }
  },
  {
    id: "api-orchestration",
    title: "API Orchestration",
    shortDescription: "Workflow automation using OpenAI, Claude, or other LLM APIs",
    fullDescription: "Building custom workflows that orchestrate multiple AI API calls to create sophisticated automation. This approach combines the power of leading AI models with your business logic to create tailored solutions.",
    pros: [
      "Access to cutting-edge AI models",
      "Moderate customization through prompt engineering",
      "Scalable infrastructure handled by providers",
      "Rapid prototyping and iteration",
      "Integration with existing business systems"
    ],
    cons: [
      "Ongoing API costs that scale with usage",
      "Limited control over model behavior",
      "Dependency on external service availability",
      "Data leaves your infrastructure",
      "Rate limiting and quotas"
    ],
    bestFor: [
      "Automating complex business processes",
      "Applications requiring high-quality language understanding",
      "Prototyping AI features before larger investments",
      "Teams with software development capabilities"
    ],
    examples: [
      "Customer service chatbots with OpenAI GPT-4",
      "Document processing workflows with Claude",
      "Content generation pipelines",
      "Automated research and analysis tools"
    ],
    category: "ready",
    lensValues: {
      Speed: 4,
      Custom: 3,
      Data: 2,
      Risk: 3,
      Ops: 2,
      Lock: 3,
      Cost: 3
    }
  },
  {
    id: "rag-system",
    title: "RAG (Retrieval-Augmented Generation)",
    shortDescription: "Vector databases combined with LLMs for intelligent document and data retrieval",
    fullDescription: "A hybrid approach that combines your proprietary documents and data with large language models. Vector databases store your content as embeddings, allowing AI to retrieve relevant context and generate informed responses based on your specific knowledge base.",
    pros: [
      "Leverages your proprietary knowledge and documents",
      "More accurate responses grounded in your data",
      "Customizable retrieval and ranking strategies",
      "Relatively quick to implement with existing tools",
      "Can update knowledge base without retraining models"
    ],
    cons: [
      "Requires careful data preparation and chunking",
      "Quality depends heavily on document quality",
      "Complex optimization of retrieval parameters",
      "Ongoing maintenance of vector databases",
      "May hallucinate when retrieval is insufficient"
    ],
    bestFor: [
      "Knowledge management and Q&A systems",
      "Technical documentation and support",
      "Research and analysis applications",
      "Organizations with substantial document libraries"
    ],
    examples: [
      "Internal knowledge base chatbots",
      "Technical documentation assistants",
      "Legal document analysis systems",
      "Research paper summarization tools"
    ],
    category: "ready",
    lensValues: {
      Speed: 3,
      Custom: 4,
      Data: 4,
      Risk: 3,
      Ops: 3,
      Lock: 3,
      Cost: 3
    }
  },
  // BUILD SOLUTIONS
  {
    id: "agentic-workflows",
    title: "Agentic Workflows",
    shortDescription: "Multi-step AI agents that can plan, execute, and adapt their approach",
    fullDescription: "Sophisticated AI systems that can break down complex tasks into steps, use tools and APIs, and adapt their approach based on results. These agents can autonomously navigate multi-step processes and handle complex decision-making scenarios.",
    pros: [
      "Handles complex, multi-step processes autonomously",
      "Can adapt strategy based on intermediate results",
      "Integrates with multiple tools and data sources",
      "Highly customizable behavior and decision logic",
      "Potential for significant automation of knowledge work"
    ],
    cons: [
      "Complex architecture requiring significant development",
      "Difficult to predict and control agent behavior",
      "Higher computational and API costs",
      "Requires extensive testing and validation",
      "May require human oversight and intervention"
    ],
    bestFor: [
      "Complex business process automation",
      "Research and analysis tasks requiring multiple steps",
      "Customer service scenarios with varied workflows",
      "Applications where adaptability is crucial"
    ],
    examples: [
      "Automated market research agents",
      "Multi-step customer onboarding systems",
      "Intelligent project management assistants",
      "Automated compliance checking workflows"
    ],
    category: "build",
    lensValues: {
      Speed: 2,
      Custom: 5,
      Data: 4,
      Risk: 4,
      Ops: 4,
      Lock: 4,
      Cost: 4
    }
  },
  {
    id: "light-fine-tuning",
    title: "Light Fine-Tuning",
    shortDescription: "Parameter-efficient training methods like LoRA or prompt tuning",
    fullDescription: "Advanced techniques that adapt pre-trained models to your specific use case without full retraining. Methods like LoRA (Low-Rank Adaptation) modify only a small subset of model parameters, making customization more efficient and cost-effective.",
    pros: [
      "Highly customized model behavior for your domain",
      "More efficient than full fine-tuning",
      "Can achieve superior performance on specific tasks",
      "Retains general model capabilities",
      "Relatively lower computational requirements"
    ],
    cons: [
      "Requires machine learning expertise",
      "Need substantial labeled training data",
      "Complex optimization and hyperparameter tuning",
      "Longer development cycles",
      "Risk of overfitting to training data"
    ],
    bestFor: [
      "Domain-specific applications with unique terminology",
      "Tasks requiring specialized knowledge",
      "Applications where generic models perform poorly",
      "Organizations with ML expertise and training data"
    ],
    examples: [
      "Medical diagnosis assistants trained on clinical data",
      "Legal document analysis for specific jurisdictions",
      "Financial analysis tools for specialized markets",
      "Technical support bots for specific products"
    ],
    category: "build",
    lensValues: {
      Speed: 2,
      Custom: 4,
      Data: 5,
      Risk: 4,
      Ops: 3,
      Lock: 3,
      Cost: 4
    }
  },
  {
    id: "heavy-fine-tuning",
    title: "Heavy Fine-Tuning",
    shortDescription: "Full model training and retraining on your specific datasets",
    fullDescription: "Comprehensive model training that adjusts all parameters of a foundation model using your proprietary data. This approach offers maximum customization but requires significant computational resources and machine learning expertise.",
    pros: [
      "Maximum control over model behavior and capabilities",
      "Can achieve best-in-class performance for specific domains",
      "Complete customization of model responses and style",
      "Potential for breakthrough performance on niche tasks",
      "Full intellectual property ownership of the fine-tuned model"
    ],
    cons: [
      "Extremely resource-intensive and expensive",
      "Requires world-class ML engineering capabilities",
      "Very long development and training cycles",
      "High risk of training instability and failures",
      "Ongoing maintenance and retraining needs"
    ],
    bestFor: [
      "Mission-critical applications requiring maximum performance",
      "Highly specialized domains with unique requirements",
      "Organizations with substantial ML resources and expertise",
      "Applications where competitive advantage depends on AI superiority"
    ],
    examples: [
      "Proprietary trading algorithms for financial markets",
      "Advanced medical imaging analysis systems",
      "Specialized scientific research applications",
      "Custom language models for unique domains"
    ],
    category: "build",
    lensValues: {
      Speed: 1,
      Custom: 5,
      Data: 5,
      Risk: 5,
      Ops: 5,
      Lock: 4,
      Cost: 5
    }
  },
  // CUSTOM SOLUTIONS
  {
    id: "private-hosting",
    title: "Private Hosting",
    shortDescription: "On-premise model deployment for maximum security and control",
    fullDescription: "Deploying AI models entirely within your own infrastructure, ensuring complete data privacy and security. This approach gives you full control over the AI pipeline while meeting the strictest compliance and security requirements.",
    pros: [
      "Complete data privacy and security control",
      "No external dependencies or vendor lock-in",
      "Meets strictest compliance requirements",
      "Customizable infrastructure and deployment",
      "Predictable costs independent of usage volume"
    ],
    cons: [
      "Extremely high infrastructure and maintenance costs",
      "Requires deep technical expertise across the stack",
      "Limited access to latest model innovations",
      "Complex scaling and performance optimization",
      "Significant ongoing operational overhead"
    ],
    bestFor: [
      "Highly regulated industries (finance, healthcare, defense)",
      "Applications processing extremely sensitive data",
      "Organizations with strict data sovereignty requirements",
      "Large enterprises with existing ML infrastructure"
    ],
    examples: [
      "Banking fraud detection systems",
      "Healthcare patient data analysis",
      "Government intelligence applications",
      "Enterprise document processing with IP protection"
    ],
    category: "custom",
    lensValues: {
      Speed: 1,
      Custom: 4,
      Data: 3,
      Risk: 1,
      Ops: 5,
      Lock: 1,
      Cost: 5
    }
  },
  {
    id: "edge-models",
    title: "Small Models at Edge",
    shortDescription: "Lightweight AI models running locally on devices or edge infrastructure",
    fullDescription: "Deploying smaller, efficient AI models directly on user devices or edge computing infrastructure. This approach prioritizes speed, privacy, and offline capability over maximum AI sophistication.",
    pros: [
      "Ultra-low latency with local processing",
      "Complete data privacy with no external transmission",
      "Works offline without internet connectivity",
      "No ongoing API or cloud costs",
      "Highly scalable across distributed devices"
    ],
    cons: [
      "Limited model capabilities compared to large models",
      "Complex deployment and update management",
      "Device compatibility and performance constraints",
      "Requires optimization for different hardware platforms",
      "May need sophisticated model compression techniques"
    ],
    bestFor: [
      "Real-time applications requiring instant responses",
      "Mobile and IoT applications with connectivity constraints",
      "Privacy-sensitive consumer applications",
      "Applications with high volume and cost sensitivity"
    ],
    examples: [
      "Mobile keyboard autocomplete and suggestions",
      "Real-time video analysis for security cameras",
      "Offline voice assistants for smart speakers",
      "Edge-based quality control in manufacturing"
    ],
    category: "custom",
    lensValues: {
      Speed: 3,
      Custom: 3,
      Data: 2,
      Risk: 1,
      Ops: 4,
      Lock: 1,
      Cost: 3
    }
  },
  {
    id: "classical-ml",
    title: "Classical ML",
    shortDescription: "Traditional machine learning algorithms optimized for specific tasks",
    fullDescription: "Proven machine learning techniques including decision trees, neural networks, and statistical models that are specifically designed and optimized for particular use cases. While not using the latest AI advances, these approaches offer reliability, interpretability, and efficiency.",
    pros: [
      "Highly interpretable and explainable results",
      "Proven reliability and predictable behavior",
      "Lower computational requirements and costs",
      "Complete control over feature engineering",
      "Well-understood debugging and optimization techniques"
    ],
    cons: [
      "Limited to narrow, specific use cases",
      "Requires extensive manual feature engineering",
      "Cannot handle complex natural language or generative tasks",
      "May require multiple models for different aspects",
      "Less adaptable to changing requirements"
    ],
    bestFor: [
      "Structured data analysis and prediction tasks",
      "Applications requiring explainable decisions",
      "High-volume, low-latency prediction scenarios",
      "Organizations with traditional ML expertise"
    ],
    examples: [
      "Credit scoring and risk assessment models",
      "Recommendation systems for e-commerce",
      "Predictive maintenance for industrial equipment",
      "Fraud detection for financial transactions"
    ],
    category: "custom",
    lensValues: {
      Speed: 2,
      Custom: 5,
      Data: 5,
      Risk: 2,
      Ops: 3,
      Lock: 1,
      Cost: 2
    }
  }
];

// 5 Misconception Questions for AI implementation understanding
export const MISCONCEPTION_QUESTIONS: MisconceptionQuestion[] = [
  {
    id: "fine-tuning-always-better",
    question: "Fine-tuning an AI model on your data always produces better results than using a general-purpose model",
    correctAnswer: false,
    explanation: "Fine-tuning can actually hurt performance if you don't have enough high-quality training data or if the base model already handles your use case well. Many applications achieve excellent results with prompt engineering and RAG systems using general-purpose models."
  },
  {
    id: "more-data-always-better", 
    question: "More training data always leads to better AI model performance",
    correctAnswer: false,
    explanation: "Data quality matters more than quantity. Poor quality, biased, or irrelevant data can actually degrade model performance. Additionally, models can overfit to large datasets, and there are often diminishing returns beyond a certain data size."
  },
  {
    id: "ai-eliminates-human-oversight",
    question: "Advanced AI systems eliminate the need for human oversight and validation",
    correctAnswer: false,
    explanation: "Even the most sophisticated AI systems require human oversight, especially for critical decisions. AI can hallucinate, make biased decisions, or fail in edge cases. Human-in-the-loop systems typically perform better than fully automated ones for complex tasks."
  },
  {
    id: "open-source-always-cheaper",
    question: "Using open-source AI models is always more cost-effective than commercial APIs",
    correctAnswer: false,
    explanation: "While open-source models have no licensing fees, they require significant infrastructure, maintenance, and expertise costs. For many use cases, especially with moderate usage volumes, commercial APIs provide better total cost of ownership."
  },
  {
    id: "latest-model-always-best",
    question: "The newest, largest AI model is always the best choice for any application",
    correctAnswer: false,
    explanation: "Newer models often have higher costs, latency, and complexity. Smaller, specialized models frequently outperform larger general models on specific tasks while being more efficient. The best model depends on your specific requirements, constraints, and use case."
  }
];

// Caution Messages based on Context Profile conditions
export const CAUTION_MESSAGES: Record<string, (profile: ContextProfile) => string | null> = {
  highRegulatoryIntensity: (profile: ContextProfile) => 
    profile.regulatory_intensity >= 3 
      ? "High regulatory environment detected. Consider solutions with strong compliance features, audit trails, and data governance capabilities."
      : null,
      
  highDataSensitivity: (profile: ContextProfile) =>
    profile.data_sensitivity >= 3
      ? "Sensitive data handling required. Prioritize solutions with strong encryption, access controls, and consider on-premise deployment options."
      : null,
      
  highSafetyCriticality: (profile: ContextProfile) =>
    profile.safety_criticality >= 3
      ? "Safety-critical application detected. Ensure robust testing, human oversight, and fail-safe mechanisms in your AI implementation."
      : null,
      
  highBrandExposure: (profile: ContextProfile) =>
    profile.brand_exposure >= 3
      ? "High brand visibility application. Consider solutions with proven reliability and implement thorough content moderation and quality controls."
      : null,
      
  lowBuildReadiness: (profile: ContextProfile) =>
    profile.build_readiness <= 1
      ? "Limited technical readiness detected. Focus on ready-to-use solutions or consider building internal AI capabilities before custom development."
      : null,
      
  procurementConstraints: (profile: ContextProfile) =>
    profile.procurement_constraints
      ? "Procurement constraints may limit vendor options. Consider open-source solutions or approved vendor lists when selecting AI tools."
      : null,
      
  edgeOperations: (profile: ContextProfile) =>
    profile.edge_operations
      ? "Edge computing requirements detected. Consider lightweight models, offline capabilities, and distributed deployment strategies."
      : null,
      
  highScaleRequirements: (profile: ContextProfile) =>
    profile.scale_throughput >= 4
      ? "High-scale requirements demand careful architecture planning. Consider solutions that can handle your throughput needs and scale efficiently."
      : null
};