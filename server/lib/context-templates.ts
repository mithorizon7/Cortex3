import type { ContextProfile } from "../../shared/schema";

export interface ContextMirrorPayload {
  insight: string;       // two paragraphs separated by \n\n
  disclaimer: string;    // one-line micro-disclaimer
}

/**
 * Rule-based fallback templates for different organizational contexts
 */
export function getContextTemplate(profile: ContextProfile): ContextMirrorPayload {
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
        insight: `Your operating context favors speed and iteration. Low external constraints and faster competitive tempo enable experimentation and short feedback loops, while raising the risk of fragmented tooling, shadow adoption, and uneven quality if standards lag behind usage. The opportunity is rapid learning and differentiation; the hazard is value that stalls at pilot because integration and measurement trail adoption.

Prioritize quick wins that connect directly to revenue or cycle-time, but anchor them to minimal, shared guardrails: prompt and output policies, data boundaries, and review criteria for customer-facing content. Instrument for outcome metrics from the start (time saved, conversion, resolution rate), and publish a simple graduation path from pilot → supported → scaled. Consolidate on a small set of services early to avoid tool sprawl as usage accelerates.`,
        disclaimer: "Educational reflection based on your context; not a compliance determination."
      };

    case 'legacy':
      return {
        insight: `A complex integration surface and strict continuity needs favor reliability over novelty. Value tends to appear where AI augments well-bounded tasks near existing systems of record. The benefit is clear provenance and stable runtime behavior; the downside is longer integration paths and stricter latency/observability constraints that can limit model choice or scope.

Start where latency budgets are tolerant and interfaces are stable (internal knowledge retrieval, assisted drafting, triage). Define p95 latency and rollback paths up front so operations never stall. Co-locate inference near data when feasible, and prefer patterns that cache, retrieve, and verify over those that require deep re-platforming. As reliability holds, expand into higher-impact surfaces with explicit SLOs and automated quality checks.`,
        disclaimer: "Educational reflection based on your context; not a compliance determination."
      };

    default: // regulated
      return {
        insight: `Your organization operates in a context where regulatory expectations and data sensitivity create clear guardrails and stakeholder trust, while also imposing oversight and integration friction. In environments like this, value tends to emerge where outcomes are observable and risk can be bounded. The upside is a strong license to operate when controls are explicit; the trade-off is slower path-to-production if governance, data lineage, and vendor requirements aren't addressed early.

Momentum typically comes from contained, high-signal pilots—workflows with measurable decisions, well-defined inputs, and human-in-the-loop checkpoints for material outcomes. Codify continuity early: latency thresholds, fallbacks to standard procedures, and simple rollbacks prevent operational surprises. As pilots prove stable, expand along data pipelines you already trust, harden auditability, and make review criteria explicit so oversight becomes routine rather than reactive.`,
        disclaimer: "Educational reflection based on your context; not a compliance determination."
      };
  }
}