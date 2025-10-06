/**
 * CORTEX Domain Color System - SINGLE SOURCE OF TRUTH
 * 
 * ⚠️ IMPORTANT: This is the ONLY place to change domain colors.
 * All 6 CORTEX domain colors are defined here and automatically
 * propagate to ALL components across the entire application.
 * 
 * To change colors: Simply update the hex values in CORTEX_COLOR_PALETTE below.
 * 
 * Features:
 * - TypeScript type safety for all color operations
 * - Light/dark mode variants (auto-adjusted for each theme)
 * - Helper functions for inline styles and components
 * - No duplicate color definitions anywhere else in the codebase
 */

export type PillarKey = "C" | "O" | "R" | "T" | "E" | "X";

export interface ColorVariants {
  base: string;      // Primary brand color (used for icons, accents, strong emphasis)
  light: string;     // Light tint for backgrounds in light mode
  dark: string;      // Adjusted color for dark mode
  text: string;      // Accessible text color that works on light backgrounds
}

/**
 * CORTEX Domain Color Palette
 * 
 * To change domain colors, simply update the hex values here.
 * All components will automatically use the new colors.
 */
export const CORTEX_COLOR_PALETTE: Record<PillarKey, ColorVariants> = {
  C: {
    base: "#0C63D6",    // Blue - Clarity & Command
    light: "#E9F3FF",   // Light blue background
    dark: "#5592E2",    // Lighter blue for dark mode
    text: "#0C63D6",    // Same as base for consistency
  },
  O: {
    base: "#007561",    // Pine Green - Operations & Data
    light: "#E6F4F1",   // Light green background
    dark: "#339181",    // Lighter green for dark mode
    text: "#007561",
  },
  R: {
    base: "#750014",    // Rosewood - Risk, Trust & Security
    light: "#FDEBEC",   // Light red background
    dark: "#9E4C5A",    // Lighter red for dark mode
    text: "#750014",
  },
  T: {
    base: "#FFA72E",    // Orange - Talent & Culture
    light: "#FFF4E5",   // Light orange background
    dark: "#FFB347",    // Lighter orange for dark mode
    text: "#E68A00",    // Darker orange for better contrast
  },
  E: {
    base: "#339181",    // Teal - Ecosystem & Infrastructure
    light: "#DDF2EF",   // Light teal background
    dark: "#55A69A",    // Lighter teal for dark mode
    text: "#339181",
  },
  X: {
    base: "#69B3FF",    // Light Blue - Experimentation & Evolution
    light: "#D9ECFF",   // Very light blue background
    dark: "#A0CCFF",    // Lighter blue for dark mode
    text: "#2B8FF7",    // Darker blue for better contrast
  },
};

/**
 * Get the base color for a domain
 */
export function getPillarColor(key: PillarKey): string {
  return CORTEX_COLOR_PALETTE[key]?.base || "#999999";
}

/**
 * Get a specific color variant for a domain
 */
export function getPillarColorVariant(
  key: PillarKey,
  variant: keyof ColorVariants = "base"
): string {
  return CORTEX_COLOR_PALETTE[key]?.[variant] || "#999999";
}

/**
 * Example: How to use these colors in your components
 * 
 * // Method 1: Direct access from CORTEX_COLOR_PALETTE
 * import { CORTEX_COLOR_PALETTE } from '@/lib/cortex-colors';
 * <div style={{ backgroundColor: CORTEX_COLOR_PALETTE.C.base }}>...</div>
 * 
 * // Method 2: Using helper function
 * import { getPillarColor } from '@/lib/cortex';
 * <div style={{ color: getPillarColor('C') }}>...</div>
 * 
 * // Method 3: Access from CORTEX_PILLARS (most common pattern)
 * import { CORTEX_PILLARS } from '@/lib/cortex';
 * <div style={{ color: CORTEX_PILLARS.C.color }}>...</div>
 * <div style={{ backgroundColor: CORTEX_PILLARS.C.colorLight }}>...</div>
 */
