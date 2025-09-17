/**
 * Centralized validation rules and logic for Context Reflection content
 * Used by both client and server to ensure consistency
 */

export const BANNED_PHRASES_REGEX = /\bstrength(s)?\b|\bfragilit(y|ies)\b|No Vendor Names|No Benchmarks|Probability[- ]?Based|Under \d+\s*Words/gi;

export const WORD_COUNT_LIMITS = {
  min: 150,
  max: 220
} as const;

/**
 * Check if text violates content policy
 * @param text - Text to check for policy violations
 * @returns true if text violates policy, false otherwise
 */
export function violatesPolicy(text: string): boolean {
  return BANNED_PHRASES_REGEX.test(text);
}

/**
 * Validate word count is within acceptable limits
 * @param text - Text to count words for
 * @returns true if word count is valid, false otherwise
 */
export function isValidWordCount(text: string): boolean {
  const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
  return wordCount >= WORD_COUNT_LIMITS.min && wordCount <= WORD_COUNT_LIMITS.max;
}

/**
 * Get word count for a given text
 * @param text - Text to count words for
 * @returns number of words
 */
export function getWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Reset regex state to prevent issues with global regex
 */
export function resetBannedPhrasesRegex(): void {
  BANNED_PHRASES_REGEX.lastIndex = 0;
}