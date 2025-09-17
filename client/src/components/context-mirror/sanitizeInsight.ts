import { BANNED_PHRASES_REGEX, violatesPolicy, getWordCount, isValidWordCount } from "../../../../shared/context-validation";

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

export function validateWordCount(text: string): boolean {
  return isValidWordCount(text);
}

// Re-export from shared validation for backwards compatibility
export { getWordCount, violatesPolicy } from "../../../../shared/context-validation";