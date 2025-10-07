// pdf-generator.ts — rebuilt for executive-grade PDFs

import { formatScaleValue } from "@shared/scale-utils";
import type {
  ContextProfile,
  ExtendedOptionCard,
  OptionsStudioSession
} from "@shared/schema";
import { MISCONCEPTION_QUESTIONS } from "@shared/options-studio-data";
import {
  generateEnhancedExecutiveInsights,
  type ExecutiveInsight,
  type ActionPriority
} from "./insight-engine";
import { CORTEX_PILLARS } from "./cortex";
import { CORTEX_COLOR_PALETTE, type PillarKey } from "./cortex-colors";
import { loadInterFonts, type PDFFontData } from "./pdf-fonts";

// Embedded logo (Base64 encoded for reliability and performance - eliminates network dependency)
const EMBEDDED_LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA1oAAACiCAYAAABYi7x3AAAACXBIWXMAAAsTAAALEwEAmpwYAAAGAGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMTctMDktMDVUMTE6MTk6MzktMDQ6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDE5LTA1LTMxVDE0OjEyOjQ3LTA0OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDE5LTA1LTMxVDE0OjEyOjQ3LTA0OjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjM4ZGY5YzRhLTczNTAtNGFlYS05MWNlLTFhMTI4ZGFiN2YwOSIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjExZDc4NmI3LWYxNzctMWQ0ZS1hMDE5LWIwOWMyNDVmNmE4NCIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOmE3MTM2YzY5LTQ2NWYtNDM4My04NDc5LTkzNGRjZTUxMDU1OSI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6YTcxMzZjNjktNDY1Zi00MzgzLTg0NzktOTM0ZGNlNTEwNTU5IiBzdEV2dDp3aGVuPSIyMDE3LTA5LTA1VDExOjE5OjM5LTA0OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoTWFjaW50b3NoKSIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6MzhkZjljNGEtNzM1MC00YWVhLTkxY2UtMWExMjhkYWI3ZjA5IiBzdEV2dDp3aGVuPSIyMDE5LTA1LTMxVDE0OjEyOjQ3LTA0OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoTWFjaW50b3NoKSIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz6ZjqjWAABAAElEQVR4AeydB7wdRdnA/4WEhBYIJfQaeh9CkyodERBQsIBiRy0foj4qFhTsgIoKKiAqiChVbCgdEQQRUHovUqX3TkJJyPd/dp/N3Lmz9+yde+/dM+fO/p/f757ZnZ2dOXN3/vPMzM7MoIEDBzJP5hPgE+AT4BPgE+AT4BPgE+AT4BPgE+AToE+gH09+PKUJAAAA//9QSwMEFAAGAAgAAAAhAKlf7eIwAQAARAIAABEACAFkb2NQcm9wcy9jb3JlLnhtbCCiBAEooAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfJJRS8MwFIXfBf9DyXtN166DJWRssI2BDtz2byS9bUPzaElud7/etEoZTtnDXpJ753znm5s0yed7rwufjbUyusQ0CjDhsmKVNmWJ397SK0x8oE1Fu8pIXOIT9svreZ5lbgu2DoEnZy0OIV7iwFjjkM7a9TiYoHMSWsOF63qCg7YBYsqIzTNW+VbpWLuGEHbzgXFxVzuJXdPgbqcDrlD79mCC7kZ36jm0KHHXhVD4m3lAjziFBEJxqvGWpgRsxP9TxAj5VlPRSKH0XorxbFQwVVYlXkW6amznV7AwWdybL+AyuOXh4OPMqvuBqiGnT5lxqPiocbfzDU8ofvW+9M9AKHnmvnQ+k+XiNRPW4MZbj1+n/fkcHVqgE07jxYrN4nhKOEsTRlkSsyROaDqPWZbE03lCZ4v5KonZfJXQ+fJltlgsqOBn1sErHNw7h/jDXfwBAAD//w==";

/* ====================================================================================
   PUBLIC TYPES (unchanged)
==================================================================================== */

export interface AssessmentResults {
  contextProfile: ContextProfile;
  pillarScores: Record<string, number>;
  triggeredGates: any[];
  priorityMoves?: any;
  valueOverlay?: any;
  completedAt: string;
}

export interface SituationAssessmentData {
  // Legacy (back-compat)
  insight?: string;           // Two paragraphs separated by \n\n
  disclaimer?: string;

  // Situation Assessment 2.0 “mirror”
  mirror?: {
    headline?: string;
    insight?: string;
    actions?: string[];
    watchouts?: string[];
    scenarios?: {
      if_regulation_tightens?: string;
      if_budgets_tighten?: string;
    };
    disclaimer?: string;
  };

  contextProfile: ContextProfile;
  assessmentId: string;
}

// Options Studio export (unchanged)
export interface OptionsStudioData extends OptionsStudioSession {
  contextProfile: ContextProfile;
  selectedOptions: ExtendedOptionCard[];
  emphasizedLenses: string[];
  reflectionAnswers: Record<string, string>;
  exportedAt: string;
  cautionFlags?: string[];
  cautionMessages?: string[];
}

// Enhanced executive export (unchanged)
export interface EnhancedAssessmentResults extends AssessmentResults {
  insights?: ExecutiveInsight[];
  priorities?: ActionPriority[];
  maturityLevel?: string;
  averageScore?: number;
}

/* ====================================================================================
   LIGHTWEIGHT LAYOUT SYSTEM
   - crisp baseline grid
   - robust wrapping
   - section-aware page breaking
==================================================================================== */

type RGB = [number, number, number];

const PALETTE = {
  ink: hexToRgb("#011627"),            // Rich Black (CORTEX text color)
  inkSubtle: hexToRgb("#8B959E"),      // Silver Gray (CORTEX muted text)
  accent: hexToRgb("#007561"),         // Pine Green (CORTEX secondary accent)
  success: hexToRgb("#007561"),        // Pine Green (CORTEX success color)
  warning: hexToRgb("#FF9F1C"),        // Orange Peel (CORTEX warning color)
  danger: hexToRgb("#750014"),         // MIT Rosewood (CORTEX destructive color)
  line: hexToRgb("#DDE1E6"),           // Light Gray 2 (CORTEX border color)
  tint: hexToRgb("#F2F4F8"),           // Light Gray 1 (CORTEX secondary background)
  white: [255, 255, 255] as RGB,
  black: [0, 0, 0] as RGB
};

const TYPO = {
  hero:   { size: 24, weight: "bold" as const },
  h1:     { size: 16, weight: "bold" as const },
  h2:     { size: 13, weight: "bold" as const },
  h3:     { size: 11, weight: "bold" as const },
  body:   { size: 10, weight: "normal" as const },
  small:  { size: 9,  weight: "normal" as const },
  caption:{ size: 8,  weight: "normal" as const }
};

// Baseline + margins
const PAGE = {
  margin: 24,             // outer margin
  footer: 18,             // reserved for footer
  headerBar: 44,          // dark intro band on page 1
  line: 4.2               // baseline “leading”
};

// Shape helpers rely on jsPDF's built-ins only (no plugins)
function setFill(doc: any, c: RGB) { doc.setFillColor(c[0], c[1], c[2]); }
function setStroke(doc: any, c: RGB) { doc.setDrawColor(c[0], c[1], c[2]); }
function setText(doc: any, c: RGB) { doc.setTextColor(c[0], c[1], c[2]); }
function setFont(doc: any, t: { size: number; weight: "bold" | "normal" }) {
  doc.setFont("Inter", t.weight);
  doc.setFontSize(t.size);
}

// Converts hex to RGB for jsPDF
function hexToRgb(hex: string): RGB {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16)] as RGB : [0,0,0];
}

// Text normalization to prevent spaced-out glyph artifact
function normalizeText(s: any): string {
  if (!s) return "";
  
  // Sanitize: Remove control characters but preserve printable Unicode
  // Only strip ASCII control chars (\x00-\x1F) except tab/newline/carriage return
  // This preserves em-dashes, smart quotes, currency symbols, accented characters
  const sanitized = String(s)
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Control chars except \t\n\r
    .replace(/[\uFFFD\uFFFE\uFFFF]/g, ''); // Replacement/invalid chars
  
  const t = sanitized
    .replace(/\u00A0/g, " ")                              // NBSP -> space
    .replace(/[\u2000-\u200B\u202F\u205F\u2060]/g, " ")  // Thin/narrow/zero-width -> space
    .replace(/\u2011/g, "-")                              // Non-breaking hyphen -> hyphen-minus
    .replace(/\u2212/g, "-")                              // Math minus -> hyphen-minus
    .replace(/\u2013/g, "-")                              // En dash -> hyphen-minus
    .replace(/\u2014/g, "-")                              // Em dash -> hyphen-minus
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  // Targeted fix: Only collapse clear ALL-CAPS letter-spaced runs (e.g., "E X E C U T I V E")
  // This prevents the aggressive space removal that was fusing words together
  const fixed = t.replace(
    /(?:^|\s)((?:[A-Z]\s){4,}[A-Z])(?=$|\s)/g,
    (match) => match.replace(/\s+/g, "")
  );
  
  return fixed;
}

// Reliable wrap with sanity checks
function wrap(doc: any, text: string, width: number): string[] {
  const clean = normalizeText(text);
  if (!clean) return [];
  const lines = doc.splitTextToSize(clean, width);
  return Array.isArray(lines) ? lines.map((x: any) => String(x)) : [String(lines)];
}

// Running header (page > 1)
function runningHeader(doc: any, pageWidth: number, title: string) {
  const y = PAGE.margin - 8;
  setStroke(doc, PALETTE.line);
  doc.line(PAGE.margin, y + 2, pageWidth - PAGE.margin, y + 2);
  setFont(doc, TYPO.small);
  setText(doc, PALETTE.inkSubtle);
  doc.text(title, PAGE.margin, y);
}

// Footer pass after content is placed (now synchronous with embedded logo)
function finalizeFooters(doc: any, labelLeft: string) {
  const n = doc.getNumberOfPages();
  
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    
    // Add embedded logo and MIT Open Learning branding
    try {
      const logoWidth = 32;
      const logoHeight = 8.5;
      const brandingText = "MIT Open Learning";
      
      setFont(doc, TYPO.caption);
      setText(doc, PALETTE.inkSubtle);
      const textWidth = doc.getTextWidth(brandingText);
      
      // Center the logo + text combination
      const totalWidth = logoWidth + 3 + textWidth;
      const startX = (w - totalWidth) / 2;
      
      // Logo on left
      const logoX = startX;
      const logoY = h - 18;
      doc.addImage(EMBEDDED_LOGO, 'PNG', logoX, logoY, logoWidth, logoHeight);
      
      // Text on right of logo, vertically centered
      const textX = logoX + logoWidth + 3;
      const textY = logoY + (logoHeight / 2) + 1.5;
      doc.text(brandingText, textX, textY);
    } catch (error) {
      // Logo failed to load - skip it and continue with PDF generation
      console.warn('Logo could not be added to PDF footer:', error);
    }
    
    // Page text at bottom
    const y = h - 6;
    setFont(doc, TYPO.caption);
    setText(doc, PALETTE.inkSubtle);
    doc.text(labelLeft, PAGE.margin, y);
    const pageText = `Page ${i} of ${n}`;
    doc.text(pageText, w - PAGE.margin - doc.getTextWidth(pageText), y);
  }
}

function ensureJsPDF() {
  return import("jspdf").then(m => {
    const J = (m as any).jsPDF;
    if (!J) throw new Error("jsPDF not available");
    return J;
  });
}

function newDoc(J: any, fonts: PDFFontData, metadata?: { title?: string; subject?: string; keywords?: string }) {
  const doc = new J("p", "mm", "a4");
  
  // Register Inter fonts for proper Unicode support
  doc.addFileToVFS("Inter-Regular.ttf", fonts.regular);
  doc.addFont("Inter-Regular.ttf", "Inter", "normal");
  doc.addFileToVFS("Inter-Bold.ttf", fonts.bold);
  doc.addFont("Inter-Bold.ttf", "Inter", "bold");
  
  // Set line height factor for consistent typography
  doc.setLineHeightFactor(1.15);
  
  doc.setProperties({
    title: metadata?.title || "CORTEX Brief",
    subject: metadata?.subject || "Executive AI Readiness Assessment",
    creator: "CORTEX™ Executive AI Readiness Platform",
    author: "CORTEX",
    keywords: metadata?.keywords || "AI, readiness, assessment, executive, strategy"
  });
  return doc;
}

function bounds(doc: any) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const x = PAGE.margin;
  const y = PAGE.margin;
  const w = pw - PAGE.margin * 2;
  const h = ph - PAGE.margin - PAGE.footer;
  return { pw, ph, x, y, w, h };
}

function addPageIfNeeded(doc: any, needed: number, cursorY: number, titleForRunHeader?: string) {
  const ph = doc.internal.pageSize.getHeight();
  const maxY = ph - PAGE.footer - PAGE.margin; // usable bottom
  if (cursorY + needed <= maxY) return { cursorY, added: false };
  doc.addPage();
  const pw = doc.internal.pageSize.getWidth();
  if (titleForRunHeader) runningHeader(doc, pw, titleForRunHeader);
  return { cursorY: PAGE.margin, added: true };
}

function drawSectionTitle(doc: any, title: string, y: number) {
  setFont(doc, TYPO.h1);
  setText(doc, PALETTE.accent);
  doc.text(title, PAGE.margin, y);
  return y + PAGE.line * 4;
}

function drawSubTitle(doc: any, title: string, x: number, y: number) {
  setFont(doc, TYPO.h2);
  setText(doc, PALETTE.ink);
  doc.text(title, x, y);
  return y + PAGE.line * 3;
}

function drawBody(doc: any, text: string, maxWidth: number, y: number, runHeader?: string) {
  setFont(doc, TYPO.body);
  setText(doc, PALETTE.ink);
  const lines = wrap(doc, text, maxWidth);
  for (const ln of lines) {
    if (runHeader) {
      ({ cursorY: y } = addPageIfNeeded(doc, PAGE.line, y, runHeader));
    }
    doc.text(ln, PAGE.margin, y);
    y += PAGE.line;
  }
  return y;
}

// Draw bullet as vector dot for consistent rendering across all PDF viewers
function drawBulletDot(doc: any, x: number, y: number, radius = 0.9) {
  setFill(doc, PALETTE.ink);
  doc.circle(x, y - 2.6, radius, "F");  // "F" = filled circle
}

function drawBullets(doc: any, items: string[], maxWidth: number, x: number, y: number, runHeader?: string) {
  setFont(doc, TYPO.body);
  setText(doc, PALETTE.ink);
  const indent = 5.5;  // Space for vector bullet
  for (const it of (items || [])) {
    const lines = wrap(doc, normalizeText(it), maxWidth - indent);
    // Draw vector bullet dot
    drawBulletDot(doc, x + 2.2, y);
    for (let i = 0; i < lines.length; i++) {
      if (runHeader) {
        ({ cursorY: y } = addPageIfNeeded(doc, PAGE.line, y, runHeader));
        if (i === 0) drawBulletDot(doc, x + 2.2, y); // Redraw bullet if new page
      }
      const line = i === 0 ? lines[i] : "  " + lines[i];
      doc.text(line, x + indent, y);
      y += PAGE.line;
    }
    y += 1.5;
  }
  return y;
}

function drawPrompts(doc: any, items: string[], maxWidth: number, y: number, runHeader?: string) {
  setFont(doc, TYPO.body);
  setText(doc, PALETTE.inkSubtle);
  const indent = 5;
  for (const it of (items || [])) {
    // Use ASCII ">" for prompts (reliable across all fonts)
    const prompt = "> ";
    const lines = wrap(doc, prompt + normalizeText(it), maxWidth - indent);
    for (let i = 0; i < lines.length; i++) {
      if (runHeader) {
        ({ cursorY: y } = addPageIfNeeded(doc, PAGE.line, y, runHeader));
      }
      const line = i === 0 ? lines[i] : "  " + lines[i];
      doc.text(line, PAGE.margin + indent, y);
      y += PAGE.line;
    }
    y += 1.5;
  }
  return y;
}

function drawDomainSeparator(doc: any, y: number) {
  const { pw } = bounds(doc);
  setStroke(doc, PALETTE.line);
  doc.setLineWidth(0.5);
  doc.line(PAGE.margin, y, pw - PAGE.margin, y);
  doc.setLineWidth(0.2); // reset
  return y + PAGE.line * 2;
}

function drawCard(doc: any, x: number, y: number, w: number, header: string, bodyLines: string[][]) {
  // background
  setFill(doc, PALETTE.tint);
  doc.rect(x, y - 3, w, 6 + bodyLines.reduce((acc, ls) => acc + (ls.length * PAGE.line) + 1.5, 0) + 2, "F");
  // header
  setFont(doc, TYPO.h3);
  setText(doc, PALETTE.ink);
  doc.text(header, x + 3, y + 1);
  y += PAGE.line * 1.8;
  // divider
  setStroke(doc, PALETTE.line);
  doc.line(x + 3, y - 2, x + w - 3, y - 2);
  // lines
  setFont(doc, TYPO.small);
  for (const lines of bodyLines) {
    for (const ln of lines) {
      doc.text(ln, x + 3, y);
      y += PAGE.line - 0.1;
    }
    y += 1.2;
  }
  return y;
}

function twoColumn(doc: any, y: number) {
  const { x, w } = bounds(doc);
  const gap = 8;
  const colW = (w - gap) / 2;
  const left = { x, w: colW };
  const right = { x: x + colW + gap, w: colW };
  return { left, right, y };
}

function formatContextValue(value: number | boolean | undefined | null): string {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value == null) return '—';
  
  // Map numeric scale to human-readable labels
  switch (value) {
    case 1: return 'Low';
    case 2: return 'Medium';
    case 3: return 'High';
    case 4: return 'Very High';
    default: return String(value);
  }
}

function formatKV(doc: any, label: string, value?: string | number | boolean) {
  let v: string;
  if (typeof value === 'boolean') {
    v = value ? 'Yes' : 'No';
  } else if (typeof value === 'number') {
    v = formatContextValue(value);
  } else {
    v = value != null ? String(value) : '—';
  }
  return wrap(doc, `${label}: ${v}`, 999); // wrap later in card
}

function pillarLabel(id: string) {
  const key = id?.toUpperCase?.() as keyof typeof CORTEX_PILLARS;
  return (CORTEX_PILLARS?.[key]?.name as string) || id;
}

function getMaturityLevel(score: number): string {
  return score < 1 ? 'Nascent' : score < 1.5 ? 'Emerging' : score < 2.5 ? 'Integrated' : 'Leading';
}

function getMaturityColor(score: number): RGB {
  return score >= 2.5 ? PALETTE.success : score >= 1.5 ? PALETTE.warning : PALETTE.danger;
}

function hexToRGB(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

function getDomainColor(pillarKey: string): RGB {
  const key = pillarKey.toUpperCase() as PillarKey;
  const hexColor = CORTEX_COLOR_PALETTE[key]?.base || "#8B959E";
  return hexToRGB(hexColor);
}

function drawScoreBars(doc: any, scores: Record<string, number>, y: number) {
  const { x, w } = bounds(doc);
  const max = 3;
  const rowH = 8;
  const barW = w * 0.55;
  const labelW = w - barW - 6;

  setFont(doc, TYPO.h2);
  setText(doc, PALETTE.ink);
  doc.text("Domain Performance", x, y);
  y += PAGE.line * 2.5;

  Object.entries(scores).forEach(([k, raw]) => {
    const score = Math.max(0, Math.min(max, Number(raw)));
    // label
    setFont(doc, TYPO.small);
    setText(doc, PALETTE.inkSubtle);
    const label = pillarLabel(k);
    doc.text(label, x, y + 3);
    // bar
    const bx = x + labelW;
    const bw = barW;
    setFill(doc, PALETTE.line);
    doc.rect(bx, y, bw, 4, "F");
    const color = getDomainColor(k);
    setFill(doc, color);
    doc.rect(bx, y, (score / max) * bw, 4, "F");
    // number
    setFont(doc, TYPO.caption);
    setText(doc, PALETTE.ink);
    const num = score.toFixed(1);
    doc.text(num, bx + bw + 2, y + 3);
    y += rowH;
  });

  return y + 2;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ====================================================================================
   1) SITUATION ASSESSMENT BRIEF
==================================================================================== */

export async function generateSituationAssessmentBrief(data: SituationAssessmentData): Promise<void> {
  if (!data?.contextProfile || !data?.assessmentId) {
    throw new Error("Missing required data for PDF generation");
  }

  const hasLegacy = data.insight && data.disclaimer;
  const hasMirror = data.mirror && (data.mirror.headline || data.mirror.insight);
  if (!hasLegacy && !hasMirror) {
    throw new Error("Missing context insight data for PDF generation");
  }

  const [J, fonts] = await Promise.all([ensureJsPDF(), loadInterFonts()]);
  const doc = newDoc(J, fonts);
  const { pw } = bounds(doc);

  // Page 1 Header Bar
  setFill(doc, PALETTE.ink);
  doc.rect(0, 0, pw, PAGE.headerBar, "F");
  setText(doc, PALETTE.white);
  setFont(doc, TYPO.hero);
  doc.text("CORTEX™", PAGE.margin, 18);
  setFont(doc, TYPO.body);
  doc.text("EXECUTIVE AI READINESS ASSESSMENT", PAGE.margin, 26);

  // Right meta
  const dateText = `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`;
  const idText = `ID: ${String(data.assessmentId).slice(0, 8).toUpperCase()}`;
  doc.text(dateText, pw - PAGE.margin - doc.getTextWidth(dateText), 16);
  doc.text(idText,  pw - PAGE.margin - doc.getTextWidth(idText),  22);

  // Status chip - green dot next to text
  const statusX = pw - PAGE.margin;
  const statusY = 31;
  setFont(doc, TYPO.small);
  const statusText = "COMPLETED";
  const statusWidth = doc.getTextWidth(statusText);
  
  // Draw green circle to the left of text, vertically centered
  setFill(doc, PALETTE.success);
  doc.circle(statusX - statusWidth - 5, statusY - 1.5, 2, "F");
  
  // Draw text
  setText(doc, PALETTE.white);
  doc.text(statusText, statusX - statusWidth, statusY);

  // Body start
  let y = PAGE.headerBar + 10;

  // Split insight text properly between Executive Summary and Strategic Context
  const insightParts = (hasMirror ? data.mirror?.insight : data.insight)?.split('\n\n') || [];
  const mainInsight = insightParts[0] || '';
  // Use the second part for context, or fall back to empty for mirror data if not split
  const strategicContext = insightParts[1] || (hasMirror ? '' : mainInsight);

  // Executive Summary
  y = drawSectionTitle(doc, "EXECUTIVE SUMMARY", y);
  if (data.mirror?.headline) {
    setFont(doc, TYPO.h2);
    setText(doc, PALETTE.ink);
    y = drawBody(doc, data.mirror.headline, bounds(doc).w, y);
    y += PAGE.line * 0.5;
  }
  if (mainInsight) {
    y = drawBody(doc, mainInsight, bounds(doc).w, y);
  }
  y += PAGE.line * 1;

  // Two-column section: Strategic Context + Organizational Context
  const runHeader = "CORTEX — Situation Assessment";
  const col = twoColumn(doc, y);
  let leftY = col.y;
  let rightY = col.y;

  // Left card: Strategic Context (always present)
  leftY = drawSubTitle(doc, "Strategic Context", col.left.x, leftY);
  leftY += 2;
  const leftLines = wrap(doc, strategicContext, col.left.w);
  for (const ln of leftLines) {
    ({ cursorY: leftY } = addPageIfNeeded(doc, PAGE.line, leftY, runHeader));
    setFont(doc, TYPO.body); setText(doc, PALETTE.ink);
    doc.text(ln, col.left.x, leftY);
    leftY += PAGE.line;
  }

  // Right column: Organizational Context as compact cards
  rightY = drawSubTitle(doc, "Organizational Context", col.right.x, rightY);
  rightY += 2;

  const cp = data.contextProfile;
  const buckets: { title: string; items: (string[])[] }[] = [
    {
      title: "Risk & Compliance",
      items: [
        formatKV(doc, "Regulatory Intensity", cp?.regulatory_intensity),
        formatKV(doc, "Data Sensitivity", cp?.data_sensitivity),
        formatKV(doc, "Safety Criticality", cp?.safety_criticality),
        formatKV(doc, "Brand Exposure", cp?.brand_exposure)
      ]
    },
    {
      title: "Operations & Performance",
      items: [
        formatKV(doc, "Clock Speed", cp?.clock_speed),
        formatKV(doc, "Edge Latency", cp?.latency_edge),
        formatKV(doc, "Scale & Throughput", cp?.scale_throughput)
      ]
    },
    {
      title: "Strategic Assets",
      items: [
        formatKV(doc, "Data Advantage", cp?.data_advantage),
        formatKV(doc, "Build Readiness", cp?.build_readiness),
        formatKV(doc, "FinOps Priority", cp?.finops_priority)
      ]
    },
    {
      title: "Operational Constraints",
      items: [
        formatKV(doc, "Procurement Constraints", cp?.procurement_constraints),
        formatKV(doc, "Edge Operations", cp?.edge_operations)
      ]
    }
  ];

  for (const b of buckets) {
    // estimate height and force break if needed
    ({ cursorY: rightY } = addPageIfNeeded(doc, 26, rightY, runHeader));
    const body = b.items.map(arr => wrap(doc, arr.join(" "), col.right.w - 6));
    rightY = drawCard(doc, col.right.x, rightY, col.right.w, b.title, body);
    rightY += 2;
  }

  y = Math.max(leftY, rightY) + PAGE.line * 1.5;

  // Leadership Guidance (two buckets)
  ({ cursorY: y } = addPageIfNeeded(doc, 26, y, runHeader));
  y = drawSectionTitle(doc, "LEADERSHIP GUIDANCE", y);

  const actions = hasMirror ? (data.mirror?.actions || []) : [];
  const watchouts = hasMirror ? (data.mirror?.watchouts || []) : [];

  const grid = twoColumn(doc, y);
  let ay = grid.y, wy = grid.y;

  if (actions.length) {
    setFont(doc, TYPO.h3); setText(doc, PALETTE.ink);
    doc.text("Priority Actions", grid.left.x, ay);
    ay += PAGE.line * 1.6;
    ay = drawBullets(doc, actions, grid.left.w, grid.left.x, ay);
  }
  if (watchouts.length) {
    setFont(doc, TYPO.h3); setText(doc, PALETTE.ink);
    doc.text("Watch-outs", grid.right.x, wy);
    wy += PAGE.line * 1.6;
    wy = drawBullets(doc, watchouts, grid.right.w, grid.right.x, wy);
  }
  y = Math.max(ay, wy) + PAGE.line;

  // Scenario Lens
  const sc = hasMirror ? data.mirror?.scenarios : undefined;
  if (sc?.if_regulation_tightens || sc?.if_budgets_tighten) {
    ({ cursorY: y } = addPageIfNeeded(doc, 30, y, runHeader));
    y = drawSectionTitle(doc, "SCENARIO LENS", y);

    if (sc.if_regulation_tightens) {
      setFont(doc, TYPO.h3); setText(doc, PALETTE.ink);
      doc.text("If regulation tightens:", PAGE.margin, y);
      y += PAGE.line * 1.2;
      y = drawBody(doc, sc.if_regulation_tightens, bounds(doc).w, y);
      y += PAGE.line * 0.6;
    }
    if (sc.if_budgets_tighten) {
      setFont(doc, TYPO.h3); setText(doc, PALETTE.ink);
      doc.text("If budgets tighten:", PAGE.margin, y);
      y += PAGE.line * 1.2;
      y = drawBody(doc, sc.if_budgets_tighten, bounds(doc).w, y);
      y += PAGE.line * 0.6;
    }
  }

  // Disclaimer
  const disclaimerText = hasMirror ? data.mirror?.disclaimer : data.disclaimer;
  if (disclaimerText) {
    ({ cursorY: y } = addPageIfNeeded(doc, 22, y, runHeader));
    y = drawSectionTitle(doc, "DISCLAIMER", y);
    setFont(doc, TYPO.small); setText(doc, PALETTE.inkSubtle);
    y = drawBody(doc, disclaimerText, bounds(doc).w, y);
  }

  // Finalize footers
  finalizeFooters(doc, "CORTEX Executive AI Readiness Assessment");

  // Download
  const blob = doc.output("blob");
  if (!(blob instanceof Blob)) throw new Error("Failed to generate PDF blob");
  downloadBlob(blob, `cortex-assessment-${data.assessmentId}.pdf`);
}

/* ====================================================================================
   2) OPTIONS STUDIO EXPORT (clean narrative layout)
==================================================================================== */

export async function handleExportPDF(sessionData: OptionsStudioData, assessmentId: string): Promise<void> {
  if (!sessionData?.contextProfile || !assessmentId) {
    throw new Error("Missing required data for PDF generation");
  }

  const [J, fonts] = await Promise.all([ensureJsPDF(), loadInterFonts()]);
  const doc = newDoc(J, fonts);
  const { pw } = bounds(doc);

  // Page 1 header band
  setFill(doc, PALETTE.ink);
  doc.rect(0, 0, pw, PAGE.headerBar, "F");
  setText(doc, PALETTE.white);
  setFont(doc, TYPO.hero);
  doc.text("CORTEX™", PAGE.margin, 18);
  setFont(doc, TYPO.body);
  doc.text("OPTIONS STUDIO SUMMARY", PAGE.margin, 26);

  const dateText = `Exported: ${new Date(sessionData.exportedAt ?? Date.now()).toLocaleString()}`;
  const idText = `ID: ${String(assessmentId).slice(0, 8).toUpperCase()}`;
  doc.text(dateText, pw - PAGE.margin - doc.getTextWidth(dateText), 16);
  doc.text(idText,  pw - PAGE.margin - doc.getTextWidth(idText),  22);

  let y = PAGE.headerBar + 10;

  // Use Case
  if (sessionData.useCase) {
    y = drawSectionTitle(doc, "USE CASE", y);
    y = drawBody(doc, String(sessionData.useCase), bounds(doc).w, y);
    y += PAGE.line;
  }

  // Goals
  const goals = sessionData.goals ?? [];
  if (goals.length) {
    y = drawSectionTitle(doc, "GOALS", y);
    y = drawBullets(doc, goals, bounds(doc).w, PAGE.margin, y);
    y += PAGE.line * 0.5;
  }

  // Compared Options
  if (Array.isArray(sessionData.selectedOptions) && sessionData.selectedOptions.length) {
    ({ cursorY: y } = addPageIfNeeded(doc, 20, y, "CORTEX — Options Studio"));
    y = drawSectionTitle(doc, "COMPARED OPTIONS", y);
    setFont(doc, TYPO.body); setText(doc, PALETTE.ink);

    for (let i = 0; i < sessionData.selectedOptions.length; i++) {
      const opt = sessionData.selectedOptions[i] || {} as any;
      const title = opt.title || opt.id || `Option ${i + 1}`;
      const desc = opt.shortDescription || opt.fullDescription || "";

      ({ cursorY: y } = addPageIfNeeded(doc, 12, y, "CORTEX — Options Studio"));
      setFont(doc, TYPO.h3); setText(doc, PALETTE.ink);
      doc.text(`${i + 1}. ${title}`, PAGE.margin, y);
      y += PAGE.line * 1.1;

      setFont(doc, TYPO.body);
      y = drawBody(doc, String(desc), bounds(doc).w, y);
      y += 2;
    }
  }

  // Emphasized lenses
  if (Array.isArray(sessionData.emphasizedLenses) && sessionData.emphasizedLenses.length) {
    ({ cursorY: y } = addPageIfNeeded(doc, 18, y, "CORTEX — Options Studio"));
    y = drawSectionTitle(doc, "WHAT WE EMPHASIZED", y);
    y = drawBullets(doc, sessionData.emphasizedLenses, bounds(doc).w, PAGE.margin, y);
    y += PAGE.line * 0.5;
  }

  // Misconception Check (if present)
  const responses = sessionData.misconceptionResponses ?? {};
  if (Object.keys(responses).length) {
    ({ cursorY: y } = addPageIfNeeded(doc, 22, y, "CORTEX — Options Studio"));
    y = drawSectionTitle(doc, "MISCONCEPTION CHECK RESULTS", y);

    const map = MISCONCEPTION_QUESTIONS.reduce((acc, q) => { acc[q.id] = q; return acc; }, {} as Record<string, typeof MISCONCEPTION_QUESTIONS[0]>);
    for (const [qid, ans] of Object.entries(responses)) {
      const q = map[qid];
      if (!q) continue;
      const correct = ans === q.correctAnswer;
      ({ cursorY: y } = addPageIfNeeded(doc, 12, y, "CORTEX — Options Studio"));
      setFont(doc, TYPO.h3); setText(doc, PALETTE.ink);
      y = drawBody(doc, q.question, bounds(doc).w, y);
      setFont(doc, TYPO.small);
      setText(doc, correct ? PALETTE.success : PALETTE.danger);
      const verdict = correct ? "[CORRECT]" : "[INCORRECT]";
      doc.text(`Your answer: ${ans ? "True" : "False"} ${verdict}`, PAGE.margin, y + 1);
      y += PAGE.line * 1.1;
      if (q.explanation) {
        setText(doc, PALETTE.inkSubtle);
        y = drawBody(doc, q.explanation, bounds(doc).w, y);
      }
      y += 1.2;
    }
  }

  // Reflection Q&A
  if (sessionData.reflectionAnswers && Object.keys(sessionData.reflectionAnswers).length) {
    ({ cursorY: y } = addPageIfNeeded(doc, 22, y, "CORTEX — Options Studio"));
    y = drawSectionTitle(doc, "REFLECTIONS", y);
    for (const [qid, answer] of Object.entries(sessionData.reflectionAnswers)) {
      ({ cursorY: y } = addPageIfNeeded(doc, 14, y, "CORTEX — Options Studio"));
      setFont(doc, TYPO.h3); setText(doc, PALETTE.ink);
      doc.text(qid, PAGE.margin, y);
      y += PAGE.line * 1.1;
      setFont(doc, TYPO.body); setText(doc, PALETTE.ink);
      y = drawBody(doc, String(answer), bounds(doc).w, y);
      y += 1.5;
    }
  }

  // Summary line
  ({ cursorY: y } = addPageIfNeeded(doc, 10, y, "CORTEX — Options Studio"));
  setFont(doc, TYPO.small); setText(doc, PALETTE.inkSubtle);
  const summary = `Options explored: ${sessionData.selectedOptions?.length ?? 0} • Completed: ${sessionData.completed === true ? "Yes" : "No"}`;
  doc.text(summary, PAGE.margin, y + 2);

  finalizeFooters(doc, "CORTEX Options Studio");

  const blob = doc.output("blob");
  if (!(blob instanceof Blob)) throw new Error("Failed to generate PDF blob");
  downloadBlob(blob, `cortex-options-${assessmentId}.pdf`);
}

/* ====================================================================================
   3) EXECUTIVE BRIEF (comprehensive domain analysis)
==================================================================================== */

const DOMAIN_GUIDANCE = {
  C: {
    whyMatters: "Clarity turns AI from scattered pilots into business outcomes. When leaders publish a simple, measurable AI ambition and name a single owner with budget authority, teams stop guessing. A routine executive review creates momentum: work that moves the needle is funded and scaled; experiments that don't deliver are sunset. This alignment reduces duplicated effort, accelerates learning, and ties AI to revenue, cost, and risk.",
    whatGoodLooks: [
      "A one‑page AI ambition linked to business outcomes and customers",
      "A named senior owner and a clear split between CoE (enable/govern) and BUs (adopt/deliver)",
      "Quarterly executive/board review with reallocation decisions (fund/defund)",
      "Leaders share a common language for AI scope, risks, and value"
    ],
    howToImprove: "Progress usually starts with publishing a simple ambition (outcomes, not technologies), then clarifying who owns what between a Center of Excellence and business units. Reviews move from \"show‑and‑tell\" to decide‑and‑do—small amounts of money shift to what works, with clear rationale. Over time, AI outcomes appear in strategy documents and operating plans. In more regulated settings, leadership reviews also check that safeguards and evidence are in place.",
    commonPitfalls: [
      "Vision without ownership; ownership without budget",
      "Treating the CoE as a gatekeeper instead of an enabler",
      "Endless exploration with no reallocation"
    ],
    discussionPrompts: [
      "What two business outcomes will AI influence this year?",
      "Who is accountable for those outcomes and what budget do they control?",
      "What will we stop doing if it doesn't perform?"
    ]
  },
  O: {
    whyMatters: "Stable operations and governed data are the difference between a demo and a dependable service. Monitoring, human‑in‑the‑loop where risk warrants it, and basic data hygiene prevent silent failures, surprise bills, and reputational harm.",
    whatGoodLooks: [
      "A documented lifecycle: design → deploy → monitor → update → retire",
      "Logging, alerts, and simple dashboards for usage, cost, latency, and failure rates",
      "Human review and quality assurance checkpoints where stakes are high",
      "A searchable data catalogue with owners, lineage, quality thresholds",
      "A lightweight value/feasibility gate for new use‑cases"
    ],
    howToImprove: "Start with monitoring what you already run (latency, cost, error rate) and add simple alerts. Introduce a two‑page intake for new ideas: value hypothesis, data sources, risk level. Designate data owners for key tables or content used by AI. Where decisions affect customers, add human approval until you have evidence that automation is safe.",
    commonPitfalls: [
      "Over‑engineering MLOps before any value has shipped",
      "No drift or cost alerts; discovering issues from users or invoices",
      "Unowned data; stale or inconsistent sources"
    ],
    discussionPrompts: [
      "What do we measure today on our AI services? What's missing?",
      "Which one dataset, if cleaned and owned, would unlock the most value?",
      "Where should a human stay in the loop for now?"
    ]
  },
  R: {
    whyMatters: "Trust and safety make AI adoption sustainable. Stakeholders expect you to know what AI you run, the risks it carries, and how you'll respond when something goes wrong. Basic assurance practices prevent reputational damage and regulatory setbacks.",
    whatGoodLooks: [
      "An AI inventory with owners and risk levels",
      "Scheduled checks for fairness, privacy, and model/data drift",
      "Periodic red‑teaming for prompts/jailbreaks and data exfiltration attempts",
      "An incident response runbook with roles and communications",
      "Internal or third‑party review of controls (as required)"
    ],
    howToImprove: "Catalog what you already use (systems, vendors, purpose, data). Schedule basic checks for high‑impact use‑cases and test your defenses with simple adversarial prompts. Draft a one‑page IR plan: who triages, who decides, who informs customers. Regulated contexts often add annual assurance whether internal or external.",
    commonPitfalls: [
      "Policy documents without monitoring",
      "Unknown owners; no one reacts when metrics drift",
      "Treating red‑teaming as a one‑time event"
    ],
    discussionPrompts: [
      "Which AI system could create the most damage if it failed? Do we monitor it?",
      "Who picks up the phone when an AI incident occurs?",
      "How often do we test for bias, privacy, and jailbreaks?"
    ]
  },
  T: {
    whyMatters: "Adoption is about work, not tools. People need role‑specific skills and updated workflows that show when to use AI, when to verify, and how to escalate. Stories and incentives help good behaviors spread.",
    whatGoodLooks: [
      "Clear job families with role‑based AI fluency",
      "SOPs/SOP checklists updated to include AI tasks and checkpoints",
      "\"Wins and lessons\" shared on a regular rhythm",
      "Incentives that reward safe, effective use"
    ],
    howToImprove: "Pick two or three job families that touch customers or costly processes. Create before/after task maps and add simple guardrails (checklists, approval steps). Offer short, role‑specific training with real examples. Share what works and what fails—both teach.",
    commonPitfalls: [
      "Generic training without job redesign",
      "Incentives that reward activity over outcomes",
      "\"One wizard\" knows everything; no diffusion"
    ],
    discussionPrompts: [
      "Which roles will benefit most from AI in 90 days?",
      "What checkpoints keep customers safe while we learn?",
      "How will we recognize and reward smart usage?"
    ]
  },
  E: {
    whyMatters: "Partners and platform choices determine speed, cost, and flexibility. Elastic capacity keeps teams moving; portability and clear terms help you avoid lock‑in and surprises.",
    whatGoodLooks: [
      "Elastic capacity and simple FinOps visibility (unit costs, quotas)",
      "Strategic partners that fill capability gaps",
      "Exit/portability plans in contracts (export formats, second source)",
      "Governed APIs and basic interoperability standards"
    ],
    howToImprove: "Start by measuring unit costs and watching quotas. Consolidate on a few well‑understood services with clear terms (\"no training on our data/outputs\" when needed). Draft a one‑page exit plan: how we would switch, what we'd export, and a secondary option for critical paths.",
    commonPitfalls: [
      "Vendor lock‑in via proprietary formats and unclear rights",
      "Quota bottlenecks; budget surprises",
      "One‑off integrations that don't scale"
    ],
    discussionPrompts: [
      "Which costs or quotas block us most often?",
      "What contractual term would protect our data and options?",
      "If our primary vendor failed tomorrow, what's our plan?"
    ]
  },
  X: {
    whyMatters: "AI changes quickly. Disciplined experimentation—safe sandboxes, small budgets, explicit success and sunset criteria—increases learning velocity and prevents \"pilot purgatory.\"",
    whatGoodLooks: [
      "A guarded sandbox with representative data and spending caps",
      "A ring‑fenced slice of time/credits for experiments",
      "Every pilot has success and sunset criteria and a decision date",
      "Lightweight horizon scanning of tech, policy, and competitors"
    ],
    howToImprove: "Provide a clear on‑ramp: where to try ideas, what's allowed, and how to request data. Require a simple metric and decision date for every pilot. Run a short horizon brief quarterly to decide what to watch or ignore. Retire experiments on time so resources return to the pool.",
    commonPitfalls: [
      "Pilots with no metrics or end dates",
      "Sandboxes with real data but no guardrails",
      "Chasing every new model without a hypothesis"
    ],
    discussionPrompts: [
      "Which experiments have been running for months without a decision?",
      "What would \"good enough\" look like to promote or retire a pilot?",
      "Who scans the horizon, and what did they flag this quarter?"
    ]
  }
};

export async function generateExecutiveBriefPDF(data: EnhancedAssessmentResults, assessmentId: string): Promise<void> {
  // Comprehensive validation of required data
  if (!data) {
    throw new Error("Assessment data is missing");
  }
  
  if (!assessmentId) {
    throw new Error("Assessment ID is missing");
  }
  
  if (!data.contextProfile) {
    throw new Error("Context profile is missing. Please complete the assessment from the beginning.");
  }
  
  if (!data.pillarScores || typeof data.pillarScores !== 'object') {
    throw new Error("Pillar scores are missing. Please complete the pulse check.");
  }
  
  // Validate that pillarScores has actual data
  const scoreValues = Object.values(data.pillarScores);
  if (scoreValues.length === 0) {
    throw new Error("Pillar scores contain no data. Please complete the pulse check.");
  }
  
  // Validate score values are numbers
  const hasValidScores = scoreValues.every(score => typeof score === 'number' && !isNaN(score));
  if (!hasValidScores) {
    throw new Error("Pillar scores contain invalid data. Please restart the assessment.");
  }
  
  // Validate all CORTEX pillars are present
  const requiredPillars = ['C', 'O', 'R', 'T', 'E', 'X'];
  const missingPillars = requiredPillars.filter(pillar => !(pillar in data.pillarScores));
  if (missingPillars.length > 0) {
    throw new Error(`Incomplete pillar data. Missing domains: ${missingPillars.join(', ')}. Please complete the pulse check.`);
  }

  // Generate insights if missing
  let insights = data.insights;
  let priorities = data.priorities;
  let insightGenerationFailed = false;
  if (!insights || !Array.isArray(insights) || insights.length === 0) {
    try {
      const result = await generateEnhancedExecutiveInsights(
        data.pillarScores as any,
        data.triggeredGates || [],
        data.contextProfile
      );
      insights = result.insights || [];
      priorities = result.priorities || [];
    } catch (error) { 
      // Make insight generation failures visible instead of silently failing
      console.error("Failed to generate AI insights for PDF:", error);
      insightGenerationFailed = true;
      insights = []; 
      priorities = [];
    }
  }

  const [J, fonts] = await Promise.all([ensureJsPDF(), loadInterFonts()]);
  const contextTypes = [];
  if (data.contextProfile?.regulatory_intensity && data.contextProfile.regulatory_intensity >= 3) contextTypes.push('Regulated');
  if (data.contextProfile?.safety_criticality && data.contextProfile.safety_criticality >= 3) contextTypes.push('Safety-Critical');
  if (data.contextProfile?.data_sensitivity && data.contextProfile.data_sensitivity >= 3) contextTypes.push('Data-Sensitive');
  const contextKeywords = contextTypes.length > 0 ? contextTypes.join(', ') : 'Enterprise';
  
  const doc = newDoc(J, fonts, {
    title: `CORTEX Executive Brief - ${String(assessmentId).slice(0, 8).toUpperCase()}`,
    subject: `AI Readiness Assessment for ${contextKeywords} Organization`,
    keywords: `AI readiness, ${contextKeywords}, executive assessment, CORTEX, strategy`
  });
  const { pw } = bounds(doc);
  const runHeader = "CORTEX — Executive Brief";

  // Header band
  setFill(doc, PALETTE.ink);
  doc.rect(0, 0, pw, PAGE.headerBar, "F");
  setText(doc, PALETTE.white);
  setFont(doc, TYPO.hero);
  doc.text("CORTEX™", PAGE.margin, 18);
  setFont(doc, TYPO.body);
  doc.text("EXECUTIVE AI READINESS BRIEF", PAGE.margin, 26);

  const dateText = `Generated: ${new Date(data.completedAt ?? Date.now()).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`;
  const idText = `ID: ${String(assessmentId).slice(0, 8).toUpperCase()}`;
  doc.text(dateText, pw - PAGE.margin - doc.getTextWidth(dateText), 16);
  doc.text(idText,  pw - PAGE.margin - doc.getTextWidth(idText),  22);

  // Status chip - green dot next to text
  const statusX = pw - PAGE.margin;
  const statusY = 31;
  setFont(doc, TYPO.small);
  const statusText = "COMPLETED";
  const statusWidth = doc.getTextWidth(statusText);
  
  // Draw green circle to the left of text, vertically centered
  setFill(doc, PALETTE.success);
  doc.circle(statusX - statusWidth - 5, statusY - 1.5, 2, "F");
  
  // Draw text
  setText(doc, PALETTE.white);
  doc.text(statusText, statusX - statusWidth, statusY);

  let y = PAGE.headerBar + 10;

  // Executive Summary
  const pillarKeys = Object.keys(data.pillarScores);
  // Calculate average only from answered domains (filter undefined/null)
  const scoredValues = Object.values(data.pillarScores).filter((score): score is number => score !== undefined && score !== null);
  const avg = Number.isFinite(data.averageScore) ? (data.averageScore as number) : 
    (scoredValues.length > 0 ? scoredValues.reduce((sum: number, score: number) => sum + score, 0) / scoredValues.length : 0);
  const maturityLevel = getMaturityLevel(avg);

  y = drawSectionTitle(doc, "EXECUTIVE SUMMARY", y);
  setFont(doc, TYPO.h2); setText(doc, PALETTE.ink);
  doc.text(`Overall AI Readiness: ${maturityLevel} (${avg.toFixed(1)}/3)`, PAGE.margin, y);
  y += PAGE.line * 1.5;
  
  // Quick overview
  setFont(doc, TYPO.body); setText(doc, PALETTE.ink);
  const domainCount = Object.keys(data.pillarScores).length;
  const strongDomains = Object.values(data.pillarScores).filter(s => s >= 2.5).length;
  const developingDomains = Object.values(data.pillarScores).filter(s => s >= 1.5 && s < 2.5).length;
  const emergingDomains = Object.values(data.pillarScores).filter(s => s < 1.5).length;
  
  let summaryText = `This assessment evaluates your organization across ${domainCount} CORTEX domains. `;
  if (strongDomains > 0) summaryText += `${strongDomains} ${strongDomains === 1 ? 'domain shows' : 'domains show'} strong maturity. `;
  if (developingDomains > 0) summaryText += `${developingDomains} ${developingDomains === 1 ? 'requires' : 'require'} focused development. `;
  if (emergingDomains > 0) summaryText += `${emergingDomains} ${emergingDomains === 1 ? 'is' : 'are'} in early stages. `;
  
  y = drawBody(doc, summaryText, bounds(doc).w, y, runHeader);
  y += PAGE.line * 1.5;

  // Domain bars
  ({ cursorY: y } = addPageIfNeeded(doc, 50, y, runHeader));
  y = drawScoreBars(doc, data.pillarScores, y);
  y += PAGE.line;

  // Triggered Gates Section
  if (Array.isArray(data.triggeredGates) && data.triggeredGates.length > 0) {
    ({ cursorY: y } = addPageIfNeeded(doc, 26, y, runHeader));
    y = drawSectionTitle(doc, "CRITICAL REQUIREMENTS", y);
    setFont(doc, TYPO.body); setText(doc, PALETTE.ink);
    y = drawBody(doc, `Your organizational context triggered ${data.triggeredGates.length} critical requirement${data.triggeredGates.length > 1 ? 's' : ''} that must be addressed before scaling AI:`, bounds(doc).w, y, runHeader);
    y += PAGE.line * 0.5;
    
    const gateItems = data.triggeredGates.map((gate: any) => `${gate.title}: ${gate.reason || gate.explanation || ''}`);
    y = drawBullets(doc, gateItems, bounds(doc).w, PAGE.margin, y, runHeader);
    y += PAGE.line;
  }

  // Organizational Context Summary
  if (data.contextProfile) {
    ({ cursorY: y } = addPageIfNeeded(doc, 28, y, runHeader));
    y = drawSectionTitle(doc, "ORGANIZATIONAL CONTEXT", y);
    setFont(doc, TYPO.body); setText(doc, PALETTE.ink);
    y = drawBody(doc, "Your assessment captured the following organizational dimensions that shape your AI readiness requirements:", bounds(doc).w, y, runHeader);
    y += PAGE.line * 0.5;
    
    const contextItems: string[] = [];
    const cp = data.contextProfile;
    
    const dimensionLabels: Record<string, string> = {
      regulatory_intensity: 'Regulatory Intensity',
      safety_criticality: 'Safety Criticality',
      data_sensitivity: 'Data Sensitivity',
      brand_exposure: 'Brand Exposure',
      clock_speed: 'Market Clock Speed',
      latency_edge: 'Latency Requirements',
      scale_throughput: 'Scale/Throughput',
      build_readiness: 'Build Readiness',
      procurement_constraints: 'Procurement Requirements',
      edge_operations: 'Edge Operations',
      data_advantage: 'Data Advantage',
      finops_priority: 'FinOps Priority'
    };
    
    Object.entries(cp).forEach(([key, value]) => {
      if (value != null && dimensionLabels[key]) {
        if (typeof value === 'boolean') {
          contextItems.push(`${dimensionLabels[key]}: ${value ? 'Yes' : 'No'}`);
        } else if (typeof value === 'number') {
          const scaleLabel = formatScaleValue(key, value);
          contextItems.push(`${dimensionLabels[key]}: ${scaleLabel || `Level ${value}/4`}`);
        }
      }
    });
    
    if (contextItems.length > 0) {
      y = drawBullets(doc, contextItems, bounds(doc).w, PAGE.margin, y, runHeader);
      y += PAGE.line;
    }
  }

  // Value Overlay Metrics (if configured)
  if (data.valueOverlay) {
    ({ cursorY: y } = addPageIfNeeded(doc, 28, y, runHeader));
    y = drawSectionTitle(doc, "VALUE METRICS", y);
    setFont(doc, TYPO.body); setText(doc, PALETTE.ink);
    y = drawBody(doc, "You have configured the following business metrics to track AI impact:", bounds(doc).w, y, runHeader);
    y += PAGE.line * 0.5;
    
    const vo = data.valueOverlay as any;
    const metricItems: string[] = [];
    
    ['C', 'O', 'R', 'T', 'E', 'X'].forEach(pillarKey => {
      const pillarData = vo[pillarKey];
      if (pillarData?.metricId && pillarData?.metricName) {
        const pillarName = CORTEX_PILLARS[pillarKey as keyof typeof CORTEX_PILLARS]?.name || pillarKey;
        let metricStr = `${pillarName}: ${pillarData.metricName}`;
        
        if (pillarData.baseline != null && pillarData.target != null) {
          metricStr += ` (baseline: ${pillarData.baseline}, target: ${pillarData.target}`;
          if (pillarData.unit) metricStr += ` ${pillarData.unit}`;
          metricStr += ')';
        }
        
        if (pillarData.cadence) {
          metricStr += ` — ${pillarData.cadence} updates`;
        }
        
        metricItems.push(metricStr);
      }
    });
    
    if (metricItems.length > 0) {
      y = drawBullets(doc, metricItems, bounds(doc).w, PAGE.margin, y, runHeader);
      y += PAGE.line;
    }
  }

  // Action Priorities
  if (Array.isArray(priorities) && priorities.length > 0) {
    ({ cursorY: y } = addPageIfNeeded(doc, 22, y, runHeader));
    y = drawSectionTitle(doc, "ACTION PRIORITIES", y);
    
    for (let idx = 0; idx < Math.min(5, priorities.length); idx++) {
      const p = priorities[idx];
      ({ cursorY: y } = addPageIfNeeded(doc, 12, y, runHeader));
      
      setFont(doc, TYPO.h3); setText(doc, PALETTE.ink);
      const titleText = `${idx + 1}. ${normalizeText(p.title)}`;
      doc.text(titleText, PAGE.margin, y);
      y += PAGE.line * 1.1;
      
      if (p.timeframe) {
        setFont(doc, TYPO.small); setText(doc, PALETTE.inkSubtle);
        doc.text(`Timeframe: ${p.timeframe}`, PAGE.margin + 6, y);
        y += PAGE.line * 1.1;
      }
      
      if (p.description) {
        setFont(doc, TYPO.body); setText(doc, PALETTE.ink);
        y = drawBody(doc, normalizeText(p.description), bounds(doc).w - 6, y, runHeader);
      }
      
      y += PAGE.line * 0.5;
    }
    y += PAGE.line * 0.5;
  }

  // Comprehensive Domain Analysis
  ({ cursorY: y } = addPageIfNeeded(doc, 22, y, runHeader));
  y = drawSectionTitle(doc, "DOMAIN ANALYSIS", y);
  
  const pillarOrder = ['C', 'O', 'R', 'T', 'E', 'X'];
  for (let i = 0; i < pillarOrder.length; i++) {
    const pillarKey = pillarOrder[i];
    const pillar = CORTEX_PILLARS[pillarKey as keyof typeof CORTEX_PILLARS];
    const guidance = DOMAIN_GUIDANCE[pillarKey as keyof typeof DOMAIN_GUIDANCE];
    const score = data.pillarScores[pillarKey] || 0;
    
    if (!pillar || !guidance) continue;
    
    // Add separator between domains (but not before the first one)
    if (i > 0) {
      ({ cursorY: y } = addPageIfNeeded(doc, 8, y, runHeader));
      y = drawDomainSeparator(doc, y);
    }
    
    ({ cursorY: y } = addPageIfNeeded(doc, 55, y, runHeader));
    
    // Domain header with score badge
    setFont(doc, TYPO.h2); setText(doc, PALETTE.accent);
    doc.text(`${pillarKey}. ${pillar.name}`, PAGE.margin, y);
    
    // Score badge on same line (using consistent thresholds with overall maturity)
    const scoreColor = getMaturityColor(score);
    const scoreLabel = getMaturityLevel(score);
    setFont(doc, TYPO.small);
    setText(doc, scoreColor);
    const scoreText = `${scoreLabel} (${score.toFixed(1)}/3)`;
    const scoreX = bounds(doc).pw - PAGE.margin - doc.getTextWidth(scoreText);
    doc.text(scoreText, scoreX, y);
    y += PAGE.line * 2;
    
    // Why it matters
    setText(doc, PALETTE.ink);
    setFont(doc, TYPO.h3);
    doc.text("Why This Matters", PAGE.margin, y);
    y += PAGE.line * 1.2;
    setFont(doc, TYPO.body);
    y = drawBody(doc, guidance.whyMatters, bounds(doc).w, y, runHeader);
    y += PAGE.line * 0.8;
    
    // What good looks like
    ({ cursorY: y } = addPageIfNeeded(doc, 26, y, runHeader));
    setFont(doc, TYPO.h3); setText(doc, PALETTE.ink);
    doc.text("What Good Looks Like", PAGE.margin, y);
    y += PAGE.line * 1.2;
    y = drawBullets(doc, guidance.whatGoodLooks, bounds(doc).w, PAGE.margin, y, runHeader);
    y += PAGE.line * 0.5;
    
    // How to improve
    ({ cursorY: y } = addPageIfNeeded(doc, 18, y, runHeader));
    setFont(doc, TYPO.h3); setText(doc, PALETTE.ink);
    doc.text("How to Improve", PAGE.margin, y);
    y += PAGE.line * 1.2;
    setFont(doc, TYPO.body);
    y = drawBody(doc, guidance.howToImprove, bounds(doc).w, y, runHeader);
    y += PAGE.line * 0.8;
    
    // Common pitfalls
    if (guidance.commonPitfalls && guidance.commonPitfalls.length > 0) {
      ({ cursorY: y } = addPageIfNeeded(doc, 20, y, runHeader));
      setFont(doc, TYPO.h3); setText(doc, PALETTE.ink);
      doc.text("Common Pitfalls to Avoid", PAGE.margin, y);
      y += PAGE.line * 1.2;
      y = drawBullets(doc, guidance.commonPitfalls, bounds(doc).w, PAGE.margin, y, runHeader);
      y += PAGE.line * 0.5;
    }
    
    // Discussion prompts (styled differently)
    if (guidance.discussionPrompts && guidance.discussionPrompts.length > 0) {
      ({ cursorY: y } = addPageIfNeeded(doc, 20, y, runHeader));
      setFont(doc, TYPO.h3); setText(doc, PALETTE.ink);
      doc.text("Strategic Discussion Questions", PAGE.margin, y);
      y += PAGE.line * 1.2;
      y = drawPrompts(doc, guidance.discussionPrompts, bounds(doc).w, y, runHeader);
      y += PAGE.line * 0.8;
    }
  }

  // Executive Insights
  if (insightGenerationFailed) {
    // Show visible notice when AI insight generation fails
    ({ cursorY: y } = addPageIfNeeded(doc, 22, y, runHeader));
    y = drawSectionTitle(doc, "STRATEGIC INSIGHTS", y);
    setFont(doc, TYPO.body); setText(doc, PALETTE.inkSubtle);
    const errorNotice = "AI-powered strategic insights could not be generated for this report. This does not affect your assessment results or domain guidance. Please contact support if this issue persists.";
    y = drawBody(doc, errorNotice, bounds(doc).w, y, runHeader);
    y += PAGE.line * 1.5;
  } else if (Array.isArray(insights) && insights.length > 0) {
    ({ cursorY: y } = addPageIfNeeded(doc, 22, y, runHeader));
    y = drawSectionTitle(doc, "STRATEGIC INSIGHTS", y);
    for (const ins of insights.slice(0, 5)) {
      ({ cursorY: y } = addPageIfNeeded(doc, 16, y, runHeader));
      setFont(doc, TYPO.h3); setText(doc, PALETTE.ink);
      doc.text(normalizeText(ins.title || "Insight"), PAGE.margin, y);
      y += PAGE.line * 1.1;
      setFont(doc, TYPO.body);
      y = drawBody(doc, normalizeText(ins.description || ins.reasoning || ""), bounds(doc).w, y, runHeader);
      y += PAGE.line * 0.8;
    }
  }

  finalizeFooters(doc, "CORTEX Executive Brief");

  const blob = doc.output("blob");
  if (!(blob instanceof Blob)) throw new Error("Failed to generate PDF blob");
  downloadBlob(blob, `cortex-executive-${assessmentId}.pdf`);
}

/* ====================================================================================
   JSON EXPORT HELPERS (unchanged signatures)
==================================================================================== */

export function exportJSONResults(results: AssessmentResults): void {
  const dataStr = JSON.stringify(results, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  downloadBlob(blob, `cortex-assessment-${Date.now()}.json`);
}

export function handleExportJSON(sessionData: OptionsStudioData, filename: string): void {
  const exportData = {
    ...sessionData,
    version: "1.0",
    exportMetadata: {
      exportedAt: sessionData.exportedAt,
      dataStructureVersion: "1.0",
      sourceApplication: "CORTEX Options Studio"
    }
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  downloadBlob(blob, filename || `cortex-options-${Date.now()}.json`);
}
