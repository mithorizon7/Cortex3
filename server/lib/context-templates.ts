import type { ContextProfile } from "../../shared/schema";

// Enhanced Situation Assessment 2.0 Payload with executive dashboard elements
export interface SituationAssessmentPayload {
  headline: string;         // ≤120 chars, no title-case rules required
  insight: string;          // exactly two paragraphs separated by \n\n (150–220 words total)
  actions: string[];        // 3 concise, plain-language actions (≤14 words each)
  watchouts: string[];      // 2 concise risks/pitfalls (≤14 words each)
  scenarios: {
    if_regulation_tightens: string;  // one sentence
    if_budgets_tighten: string;      // one sentence
  };
  disclaimer: string;       // single-line micro-disclaimer
}

/**
 * Rule-based fallback templates for different organizational contexts
 */
export function getContextTemplate(profile: ContextProfile): SituationAssessmentPayload {
  const isHighlyRegulated = profile.regulatory_intensity >= 3;
  const isDataSensitive = profile.data_sensitivity >= 3;
  const isFastPaced = profile.clock_speed >= 3;
  const hasComplexLegacy = profile.scale_throughput >= 2 || profile.latency_edge >= 2;
  const isLowReadiness = profile.build_readiness <= 1;

  let templateType: 'regulated' | 'fast' | 'legacy' = 'regulated';
  
  if (isFastPaced && !isHighlyRegulated) {
    templateType = 'fast';
  } else if (hasComplexLegacy) {
    templateType = 'legacy';
  }

  switch (templateType) {
    case 'fast':
      return {
        headline: "Fast-paced context enables rapid AI experimentation but requires minimal guardrails to prevent fragmentation.",
        insight: `Your operating context favors speed and iteration over deliberate governance. Low external constraints and faster competitive tempo enable rapid experimentation, short feedback loops, and agile deployment patterns, while raising the risk of fragmented tooling, shadow adoption, and uneven quality if standards lag behind usage. The opportunity is rapid learning, market differentiation, and early revenue capture; the hazard is value that stalls at pilot because integration paths, measurement frameworks, and scaling practices trail behind adoption velocity.

Prioritize quick wins that connect directly to revenue metrics or operational cycle-time reduction, but anchor them to minimal, shared guardrails: prompt and output policies, data boundary definitions, and review criteria for customer-facing content. Instrument for outcome metrics from day one (time saved, conversion rates, resolution efficiency), establish clear graduation criteria from pilot to production, and publish simple pathways for scaling successful experiments. Consolidate on a focused set of AI services early to prevent tool sprawl and maintain operational coherence as usage accelerates across teams and use cases.‸`,
        actions: [
          "Focus on revenue-connected quick wins with measurable cycle-time reduction",
          "Establish minimal shared guardrails for prompts, outputs, and data boundaries",
          "Consolidate on focused AI service set to prevent tool sprawl"
        ],
        watchouts: [
          "Fragmented tooling and shadow adoption without standards",
          "Pilot value that stalls without clear scaling pathways"
        ],
        scenarios: {
          if_regulation_tightens: "Rapid experimentation often requires stronger audit trails and approval gates that slow velocity.",
          if_budgets_tighten: "Quick wins become essential to justify continued investment in AI capabilities."
        },
        disclaimer: "Educational reflection based on your context; not a compliance determination."
      };

    case 'legacy':
      return {
        headline: "Complex integration requirements favor reliable AI augmentation of existing systems over experimental approaches.",
        insight: `A complex integration surface and strict business continuity requirements favor reliability and proven patterns over experimental approaches. Value tends to emerge where AI augments well-bounded tasks adjacent to existing systems of record, leveraging established data pipelines and operational workflows. The benefit is clear provenance, predictable runtime behavior, and seamless integration with mission-critical processes; the constraint is longer development cycles and stricter latency, observability, and fallback requirements that can limit model selection and implementation scope.

Begin where latency budgets are tolerant and system interfaces are stable—internal knowledge retrieval, document assistance, and operational triage represent natural starting points. Define performance thresholds, rollback procedures, and monitoring criteria upfront to ensure operations never stall due to AI failures. Co-locate inference capabilities near existing data sources when feasible, and favor architectural patterns that emphasize caching, retrieval, and verification over deep re-platforming initiatives. As reliability patterns prove stable, gradually expand into higher-impact operational surfaces with explicit SLOs, automated quality assurance, and comprehensive change management protocols.‸`,
        actions: [
          "Start with stable interfaces: knowledge retrieval, document assistance, operational triage",
          "Define performance thresholds and rollback procedures upfront for continuity",
          "Co-locate inference near existing data sources using proven patterns"
        ],
        watchouts: [
          "Extended development cycles that delay practical value realization",
          "Strict requirements limiting model selection and implementation scope"
        ],
        scenarios: {
          if_regulation_tightens: "Integration complexity often increases with additional compliance requirements and audit trails.",
          if_budgets_tighten: "Longer development cycles become harder to justify without clear operational returns."
        },
        disclaimer: "Educational reflection based on your context; not a compliance determination."
      };

    default: // regulated
      return {
        headline: "Regulatory context requires observable outcomes and bounded risks but enables strong license to operate.",
        insight: `Your organization operates in a context where regulatory expectations and data sensitivity requirements create clear operational guardrails and stakeholder trust, while also imposing oversight obligations and integration friction that extends development timelines. In environments like this, value tends to emerge where outcomes are fully observable, risks can be explicitly bounded, and audit trails are comprehensive. The upside is a strong license to operate when controls and monitoring are transparent; the trade-off is extended path-to-production cycles if governance frameworks, data lineage documentation, and vendor compliance requirements aren't addressed systematically from project inception.

Sustainable momentum typically comes from contained, high-signal pilot programs—workflows with measurable decision points, well-defined input parameters, and human-in-the-loop validation checkpoints for material business outcomes. Establish operational continuity protocols early: performance thresholds, fallback procedures to standard operations, and straightforward rollback mechanisms that prevent service disruptions. As pilot programs demonstrate stability and compliance, expand systematically along data pipelines and operational workflows you already trust, strengthen auditability mechanisms, and codify review criteria so regulatory oversight becomes routine operational practice rather than reactive crisis management.‸`,
        actions: [
          "Launch contained pilot programs with measurable decision points and validation",
          "Establish operational continuity protocols with fallback procedures upfront",
          "Strengthen auditability mechanisms and codify routine review criteria"
        ],
        watchouts: [
          "Extended path-to-production cycles without systematic governance planning",
          "Reactive crisis management instead of routine operational oversight"
        ],
        scenarios: {
          if_regulation_tightens: "Stronger oversight requirements often extend timelines but validate the controlled approach.",
          if_budgets_tighten: "Contained pilots with clear ROI become essential to maintain regulatory compliance investments."
        },
        disclaimer: "Educational reflection based on your context; not a compliance determination."
      };
  }
}