/**
 * CORTEX Domain Color System
 * 
 * Single source of truth for all CORTEX domain colors.
 * Change colors here and they propagate everywhere instantly.
 * 
 * Features:
 * - TypeScript type safety
 * - CSS custom properties for styling
 * - Light/dark mode variants
 * - Tint/shade support for backgrounds and borders
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
 * Get the CSS custom property name for a domain color
 * Use this when you want to reference colors in CSS/styles
 */
export function getPillarColorVar(
  key: PillarKey,
  variant: keyof ColorVariants = "base"
): string {
  return `var(--cortex-${key.toLowerCase()}-${variant})`;
}

/**
 * Generate inline styles for a domain color
 * Useful for dynamic styling in components
 */
export function getPillarColorStyles(
  key: PillarKey,
  options: {
    backgroundColor?: boolean;
    color?: boolean;
    borderColor?: boolean;
    variant?: keyof ColorVariants;
  } = {}
): React.CSSProperties {
  const {
    backgroundColor = false,
    color = false,
    borderColor = false,
    variant = "base",
  } = options;

  const colorValue = getPillarColorVariant(key, variant);
  const styles: React.CSSProperties = {};

  if (backgroundColor) styles.backgroundColor = colorValue;
  if (color) styles.color = colorValue;
  if (borderColor) styles.borderColor = colorValue;

  return styles;
}

/**
 * CSS Custom Property Names
 * These are registered in cortex-colors.css
 */
export const CORTEX_CSS_VARS = {
  C: {
    base: "--cortex-c-base",
    light: "--cortex-c-light",
    dark: "--cortex-c-dark",
    text: "--cortex-c-text",
  },
  O: {
    base: "--cortex-o-base",
    light: "--cortex-o-light",
    dark: "--cortex-o-dark",
    text: "--cortex-o-text",
  },
  R: {
    base: "--cortex-r-base",
    light: "--cortex-r-light",
    dark: "--cortex-r-dark",
    text: "--cortex-r-text",
  },
  T: {
    base: "--cortex-t-base",
    light: "--cortex-t-light",
    dark: "--cortex-t-dark",
    text: "--cortex-t-text",
  },
  E: {
    base: "--cortex-e-base",
    light: "--cortex-e-light",
    dark: "--cortex-e-dark",
    text: "--cortex-e-text",
  },
  X: {
    base: "--cortex-x-base",
    light: "--cortex-x-light",
    dark: "--cortex-x-dark",
    text: "--cortex-x-text",
  },
} as const;
