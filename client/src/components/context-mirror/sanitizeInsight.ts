import { BANNED_PHRASES_REGEX, violatesPolicy, getWordCount, isValidWordCount } from "../../../../shared/context-validation";
import type { ContextMirror } from "../../../../shared/schema";

export function sanitizeInsight(text: string): string {
  let t = text
    .replace(/\r/g, "")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\.(\s*\.)+/g, ".")
    .replace(/^\s*[-•]\s*/gm, "");

  // Remove leaked internal rules
  t = t.replace(BANNED_PHRASES_REGEX, "");

  // Enforce exactly two paragraphs
  const parts = t.split(/\n{2,}/).filter(Boolean);
  if (parts.length === 1) {
    // try to split on sentence boundary near the middle
    const sentences = parts[0].match(/[^.!?]+[.!?]+/g) ?? [parts[0]];
    const mid = Math.ceil(sentences.length / 2);
    t = sentences.slice(0, mid).join(" ").trim() + "\n\n" + sentences.slice(mid).join(" ").trim();
  } else if (parts.length > 2) {
    t = parts.slice(0, 2).join("\n\n");
  }
  return t.trim();
}

// Context Mirror 2.0: Sanitize structured dashboard elements
export function sanitizeHeadline(headline: string): string {
  return headline
    .replace(BANNED_PHRASES_REGEX, "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120); // Enforce character limit
}

export function sanitizeActionItems(actions: string[]): string[] {
  return actions
    .slice(0, 3) // Enforce max 3 actions
    .map(action => 
      action
        .replace(BANNED_PHRASES_REGEX, "")
        .replace(/[\r\n]+/g, " ")
        .replace(/\s+/g, " ")
        .replace(/^[-•]\s*/, "") // Remove bullet points
        .trim()
        .slice(0, 84) // Enforce ≤14 words (~6 chars/word)
    )
    .filter(Boolean);
}

export function sanitizeWatchouts(watchouts: string[]): string[] {
  return watchouts
    .slice(0, 2) // Enforce max 2 watchouts  
    .map(watchout => 
      watchout
        .replace(BANNED_PHRASES_REGEX, "")
        .replace(/[\r\n]+/g, " ")
        .replace(/\s+/g, " ")
        .replace(/^[-•]\s*/, "") // Remove bullet points
        .trim()
        .slice(0, 84) // Enforce ≤14 words (~6 chars/word)
    )
    .filter(Boolean);
}

export function sanitizeScenarios(scenarios: { if_regulation_tightens: string; if_budgets_tighten: string }): { if_regulation_tightens: string; if_budgets_tighten: string } {
  return {
    if_regulation_tightens: scenarios.if_regulation_tightens
      .replace(BANNED_PHRASES_REGEX, "")
      .replace(/[\r\n]+/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
    if_budgets_tighten: scenarios.if_budgets_tighten
      .replace(BANNED_PHRASES_REGEX, "")
      .replace(/[\r\n]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  };
}

// Comprehensive sanitizer for full Context Mirror 2.0
export function sanitizeContextMirror(mirror: ContextMirror): ContextMirror {
  const sanitized: ContextMirror = {
    disclaimer: mirror.disclaimer?.replace(BANNED_PHRASES_REGEX, "").trim() || "",
    insight: mirror.insight ? sanitizeInsight(mirror.insight) : undefined,
    // Legacy fields (maintain for backwards compatibility)
    strengths: mirror.strengths,
    fragilities: mirror.fragilities, 
    whatWorks: mirror.whatWorks,
  };

  // Context Mirror 2.0 fields (optional)
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

// Re-export from shared validation for backwards compatibility
export { getWordCount, violatesPolicy } from "../../../../shared/context-validation";