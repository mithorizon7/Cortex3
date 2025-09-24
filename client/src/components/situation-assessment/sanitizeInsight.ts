import { BANNED_PHRASES_REGEX, violatesPolicy, getWordCount, isValidWordCount } from "../../../../shared/context-validation";
import type { SituationAssessment } from "../../../../shared/schema";

export function sanitizeInsight(text: string): string {
  let t = (text || "").replace(/\r/g, "").trim();

  // Remove any leaked internal rules/counters - comprehensive patterns from plan
  t = t.replace(
    /(no vendor names|no benchmarks|probability[- ]?based|under \d+\s*words|methodology compliant|guidance compliant|avoid vendor|avoid naming|avoid metrics|avoid benchmarks)/gi,
    ""
  );

  // Remove leaked banned phrases
  t = t.replace(BANNED_PHRASES_REGEX, "");

  // Remove stray list tokens and excessive whitespace - enhanced cleanup
  t = t
    .replace(/^\s*[-•]\s*/gm, "")  // Remove bullet points
    .replace(/\s+\n/g, "\n")         // Clean line endings
    .replace(/\n{3,}/g, "\n\n")      // Max two newlines
    .replace(/\.(\s*\.)+/g, ".")     // Remove doubled periods
    .replace(/\s{2,}/g, " ")          // Single spaces only
    .trim();

  // Enforce exactly two paragraphs - improved logic from plan
  let parts = t.split(/\n{2,}/).filter(Boolean);
  if (parts.length === 0) return t;

  if (parts.length === 1) {
    // Split on sentence boundary near the middle
    const sents = parts[0].match(/[^.!?]+[.!?]+/g) ?? [parts[0]];
    const mid = Math.ceil(sents.length / 2);
    parts = [sents.slice(0, mid).join(" ").trim(), sents.slice(mid).join(" ").trim()];
  } else if (parts.length > 2) {
    parts = [parts[0], parts[1]];
  }

  return parts.map(p => p.trim()).join("\n\n");
}

// Situation Assessment 2.0: Sanitize structured dashboard elements with enhanced rules
export function sanitizeHeadline(headline: string): string {
  let clean = (headline || "")
    .replace(/(no vendor names|no benchmarks|probability[- ]?based|under \d+\s*words|methodology compliant)/gi, "")
    .replace(BANNED_PHRASES_REGEX, "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  
  return clean.slice(0, 120); // Enforce ≤120 chars
}

export function sanitizeActionItems(actions: string[]): string[] {
  return actions
    .slice(0, 3) // Enforce max 3 actions
    .map(action => 
      sanitizeStructuredField(action, 84) // Use enhanced sanitization
    )
    .filter(Boolean);
}

export function sanitizeWatchouts(watchouts: string[]): string[] {
  return watchouts
    .slice(0, 2) // Enforce max 2 watchouts
    .map(watchout => 
      sanitizeStructuredField(watchout, 84) // Use enhanced sanitization
    )
    .filter(Boolean);
}

export function sanitizeScenarios(scenarios: { if_regulation_tightens: string; if_budgets_tighten: string }): { if_regulation_tightens: string; if_budgets_tighten: string } {
  return {
    if_regulation_tightens: sanitizeStructuredField(scenarios.if_regulation_tightens),
    if_budgets_tighten: sanitizeStructuredField(scenarios.if_budgets_tighten)
  };
}

// Comprehensive sanitizer for full Situation Assessment 2.0
export function sanitizeSituationAssessment(mirror: SituationAssessment): SituationAssessment {
  const sanitized: SituationAssessment = {
    disclaimer: mirror.disclaimer?.replace(BANNED_PHRASES_REGEX, "").trim() || "",
    insight: mirror.insight ? sanitizeInsight(mirror.insight) : undefined,
    // Legacy fields (maintain for backwards compatibility)
    strengths: mirror.strengths,
    fragilities: mirror.fragilities, 
    whatWorks: mirror.whatWorks,
  };

  // Situation Assessment 2.0 fields (optional)
  if (mirror.headline) {
    sanitized.headline = sanitizeHeadline(mirror.headline);
  }
  
  if (mirror.actions) {
    sanitized.actions = sanitizeActionItems(mirror.actions);
  }
  
  if (mirror.watchouts) {
    sanitized.watchouts = sanitizeWatchouts(mirror.watchouts);
  }
  
  if (mirror.scenarios && mirror.scenarios.if_regulation_tightens && mirror.scenarios.if_budgets_tighten) {
    sanitized.scenarios = sanitizeScenarios(mirror.scenarios as { if_regulation_tightens: string; if_budgets_tighten: string });
  }

  return sanitized;
}

export function validateWordCount(text: string): boolean {
  return isValidWordCount(text);
}

// Enhanced sanitization for Situation Assessment 2.0 structured fields
export function sanitizeStructuredField(field: string, maxLength?: number): string {
  let clean = (field || "")
    .replace(/(no vendor names|no benchmarks|probability[- ]?based|under \d+\s*words|methodology compliant)/gi, "")
    .replace(BANNED_PHRASES_REGEX, "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[-•]\s*/, "") // Remove bullet points
    .trim();
    
  return maxLength ? clean.slice(0, maxLength) : clean;
}

// Re-export from shared validation for backwards compatibility
export { getWordCount, violatesPolicy } from "../../../../shared/context-validation";