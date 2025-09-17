export function sanitizeInsight(text: string): string {
  let t = text
    .replace(/\r/g, "")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\.(\s*\.)+/g, ".")
    .replace(/^\s*[-•]\s*/gm, "");

  // Remove leaked internal rules
  const banned = /(No Vendor Names|No Benchmarks|Probability[- ]?Based|Under \d+\s*Words)/gi;
  t = t.replace(banned, "");

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

export function violatesPolicy(text: string): boolean {
  return /\bstrength(s)?\b|\bfragilit(y|ies)\b/i.test(text);
}