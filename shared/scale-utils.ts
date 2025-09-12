/**
 * Centralized scale utilities for consistent CORTEX context profile handling
 * All ContextProfile fields use a 0-4 scale as defined in schema.ts
 */

export type ScaleValue = 0 | 1 | 2 | 3 | 4;

/**
 * Field-specific labels for each context profile dimension
 * Each field has its own meaningful labels for the 0-4 scale
 */
export const CONTEXT_FIELD_LABELS: Record<string, [string, string, string, string, string]> = {
  regulatory_intensity: ['None', 'Guidance', 'Some Rules', 'Audited', 'Heavily Regulated'],
  data_sensitivity: ['Public', 'Internal', 'Confidential', 'PII/Trade Secrets', 'PHI/PCI + Regional'],
  safety_criticality: ['Low Harm', 'Inconvenience', 'Costly Mistakes', 'Serious Impact', 'Physical Safety'],
  brand_exposure: ['Tolerant', 'Minor Risk', 'Meaningful Risk', 'Major Risk', 'Existential Risk'],
  clock_speed: ['Annual', 'Quarterly', 'Monthly', 'Weekly', 'Frontier Pace'],
  latency_edge: ['Seconds OK', '<1s', '<500ms', '<200ms', 'Offline/Edge'],
  scale_throughput: ['Small Internal', 'Department', 'Enterprise', 'High-Traffic', 'Hyperscale'],
  data_advantage: ['None', 'Small', 'Moderate', 'Strong', 'Large & Clear'],
  build_readiness: ['None', 'Early Pilots', 'Basics in Place', 'Mature CoE', 'Industrialized'],
  finops_priority: ['Low', 'Med-Low', 'Medium', 'High', 'Strict Budgets'],
};

/**
 * Generic scale labels for fallback when field-specific labels aren't available
 */
export const GENERIC_SCALE_LABELS: Record<ScaleValue, string> = {
  0: "Very Low",
  1: "Low", 
  2: "Medium",
  3: "High",
  4: "Very High"
};

/**
 * Formats a scale value for a specific field with its appropriate labels
 * @param fieldKey - The context profile field key (e.g., 'scale_throughput')
 * @param value - The scale value (0-4)
 * @param showNumeric - Whether to include numeric indicator like "(2/4)"
 * @returns Formatted string like "Enterprise (2/4)" or just "Enterprise"
 */
export function formatScaleValue(fieldKey: string, value: number, showNumeric: boolean = true): string {
  const clampedValue = Math.max(0, Math.min(4, Math.round(value))) as ScaleValue;
  
  // Get field-specific labels or fall back to generic labels
  const labels = CONTEXT_FIELD_LABELS[fieldKey] || 
    [GENERIC_SCALE_LABELS[0], GENERIC_SCALE_LABELS[1], GENERIC_SCALE_LABELS[2], GENERIC_SCALE_LABELS[3], GENERIC_SCALE_LABELS[4]];
  
  const label = labels[clampedValue];
  
  return showNumeric ? `${label} (${clampedValue}/4)` : label;
}

/**
 * Gets just the label for a scale value without numeric indicator
 * @param fieldKey - The context profile field key 
 * @param value - The scale value (0-4)
 * @returns Just the label like "Enterprise"
 */
export function formatScaleLabelOnly(fieldKey: string, value: number): string {
  return formatScaleValue(fieldKey, value, false);
}

/**
 * Generic scale formatter when field context isn't available
 * @param value - The scale value (0-4)
 * @param showNumeric - Whether to include numeric indicator
 * @returns Formatted string with generic labels
 */
export function formatGenericScale(value: number, showNumeric: boolean = true): string {
  const clampedValue = Math.max(0, Math.min(4, Math.round(value))) as ScaleValue;
  const label = GENERIC_SCALE_LABELS[clampedValue];
  
  return showNumeric ? `${label} (${clampedValue}/4)` : label;
}

/**
 * Validates that a value is within the valid scale range
 * @param value - The value to validate
 * @returns true if value is between 0-4 inclusive
 */
export function isValidScaleValue(value: number): value is ScaleValue {
  return Number.isInteger(value) && value >= 0 && value <= 4;
}

/**
 * Converts a scale value to a normalized percentage (0-100%)
 * Useful for progress bars, sliders, etc.
 * @param value - The scale value (0-4)
 * @returns Percentage value (0-100)
 */
export function scaleToPercentage(value: number): number {
  const clampedValue = Math.max(0, Math.min(4, value));
  return (clampedValue / 4) * 100;
}

/**
 * Converts a percentage to a scale value
 * @param percentage - Percentage value (0-100)
 * @returns Scale value (0-4)
 */
export function percentageToScale(percentage: number): ScaleValue {
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  return Math.round((clampedPercentage / 100) * 4) as ScaleValue;
}

/**
 * Gets a CSS color class based on scale value for visual indicators
 * @param value - The scale value (0-4)
 * @returns CSS color class name
 */
export function getScaleColorClass(value: number): string {
  const clampedValue = Math.max(0, Math.min(4, Math.round(value)));
  
  switch (clampedValue) {
    case 0: return 'text-muted-foreground';
    case 1: return 'text-yellow-600 dark:text-yellow-500';
    case 2: return 'text-orange-600 dark:text-orange-500';
    case 3: return 'text-blue-600 dark:text-blue-500';
    case 4: return 'text-green-600 dark:text-green-500';
    default: return 'text-muted-foreground';
  }
}