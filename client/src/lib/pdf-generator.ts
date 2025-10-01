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
  ink: hexToRgb("#0F172A"),            // slate-900
  inkSubtle: hexToRgb("#334155"),      // slate-700
  accent: hexToRgb("#6366F1"),         // indigo-500
  success: hexToRgb("#22C55E"),        // green-500
  warning: hexToRgb("#F59E0B"),        // amber-500
  danger: hexToRgb("#EF4444"),         // red-500
  line: hexToRgb("#E5E7EB"),           // gray-200
  tint: hexToRgb("#F8FAFC"),           // slate-50
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
  doc.setFont("helvetica", t.weight);
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
  const t = String(s)
    .replace(/\u00A0/g, " ")
    .replace(/[\u2000-\u200B\u202F\u205F\u2060]/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  // Collapse “char space char space …” patterns
  if (/^(?:\S\s){8,}\S$/.test(t)) {
    return t.replace(/\s+/g, "");
  }
  return t;
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

// Footer pass after content is placed
async function finalizeFooters(doc: any, labelLeft: string) {
  const n = doc.getNumberOfPages();
  
  // Load MIT Open Learning logo
  let logoData: string | null = null;
  try {
    const logoModule = await import("@assets/Open-Learning-logo-revised copy_1759350974487.png");
    const logoUrl = logoModule.default;
    const response = await fetch(logoUrl);
    const blob = await response.blob();
    logoData = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn("Could not load logo for PDF footer:", e);
  }
  
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    
    // Add logo centered above page numbers
    if (logoData) {
      const logoWidth = 30;
      const logoHeight = 8;
      const logoX = (w - logoWidth) / 2;
      const logoY = h - 18;
      doc.addImage(logoData, 'PNG', logoX, logoY, logoWidth, logoHeight);
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

function newDoc(J: any) {
  const doc = new J("p", "mm", "a4");
  doc.setProperties({
    title: "CORTEX Brief",
    subject: "Executive PDF",
    creator: "CORTEX",
    author: "CORTEX"
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
  const { ph } = doc.internal.pageSize;
  const maxY = ph - PAGE.footer - PAGE.margin; // usable bottom
  if (cursorY + needed <= maxY) return { cursorY, added: false };
  doc.addPage();
  const { pw } = doc.internal.pageSize;
  if (titleForRunHeader) runningHeader(doc, pw, titleForRunHeader);
  return { cursorY: PAGE.margin, added: true };
}

function drawSectionTitle(doc: any, title: string, y: number) {
  setFont(doc, TYPO.h1);
  setText(doc, PALETTE.accent);
  doc.text(title, PAGE.margin, y);
  return y + PAGE.line * 4;
}

function drawSubTitle(doc: any, title: string, y: number) {
  setFont(doc, TYPO.h2);
  setText(doc, PALETTE.ink);
  doc.text(title, PAGE.margin, y);
  return y + PAGE.line * 3;
}

function drawBody(doc: any, text: string, maxWidth: number, y: number) {
  setFont(doc, TYPO.body);
  setText(doc, PALETTE.ink);
  const lines = wrap(doc, text, maxWidth);
  for (const ln of lines) {
    doc.text(ln, PAGE.margin, y);
    y += PAGE.line;
  }
  return y;
}

function drawBullets(doc: any, items: string[], maxWidth: number, y: number) {
  setFont(doc, TYPO.body);
  setText(doc, PALETTE.ink);
  const indent = 4.5;
  for (const it of (items || [])) {
    const bullet = "• ";
    const lines = wrap(doc, bullet + normalizeText(it), maxWidth - indent);
    for (let i = 0; i < lines.length; i++) {
      const line = i === 0 ? lines[i] : "  " + lines[i];
      doc.text(line, PAGE.margin + indent, y);
      y += PAGE.line;
    }
    y += 1.5;
  }
  return y;
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

function formatKV(doc: any, label: string, value?: string | number | boolean) {
  let v: string;
  if (typeof value === 'boolean') {
    v = value ? 'Yes' : 'No';
  } else {
    v = value != null ? String(value) : '—';
  }
  return wrap(doc, `${label}: ${v}`, 999); // wrap later in card
}

function pillarLabel(id: string) {
  const key = id?.toUpperCase?.() as keyof typeof CORTEX_PILLARS;
  return (CORTEX_PILLARS?.[key]?.name as string) || id;
}

function drawScoreBars(doc: any, scores: Record<string, number>, y: number) {
  const { x, w } = bounds(doc);
  const max = 4;
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
    const color = score >= 3 ? PALETTE.success : score >= 2 ? PALETTE.warning : PALETTE.danger;
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

  const J = await ensureJsPDF();
  const doc = newDoc(J);
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

  // Status chip
  setFill(doc, PALETTE.success);
  doc.circle(pw - PAGE.margin - 8, 30, 2, "F");
  setFont(doc, TYPO.small);
  doc.text("COMPLETED", pw - PAGE.margin - 25, 31.5);

  // Body start
  let y = PAGE.headerBar + 10;

  // Executive Summary
  y = drawSectionTitle(doc, "EXECUTIVE SUMMARY", y);
  if (data.mirror?.headline) {
    setFont(doc, TYPO.h2);
    setText(doc, PALETTE.ink);
    y = drawBody(doc, data.mirror.headline, bounds(doc).w, y);
    y += PAGE.line * 0.5;
  }
  const insightText = hasMirror ? data.mirror?.insight : data.insight?.split("\n\n")?.[0];
  if (insightText) {
    y = drawBody(doc, insightText, bounds(doc).w, y);
  }
  y += PAGE.line * 1;

  // Two-column section: Strategic Context + Organizational Context
  const runHeader = "CORTEX — Situation Assessment";
  const col = twoColumn(doc, y);
  let leftY = col.y;
  let rightY = col.y;

  // Left card: Strategic Context (always present)
  leftY = drawSubTitle(doc, "Strategic Context", leftY);
  leftY += 2;
  const leftLines = wrap(doc, hasMirror ? (data.mirror?.insight || "") : (data.insight?.split("\n\n")?.[1] || ""), col.left.w);
  for (const ln of leftLines) {
    ({ cursorY: leftY } = addPageIfNeeded(doc, PAGE.line, leftY, runHeader));
    setFont(doc, TYPO.body); setText(doc, PALETTE.ink);
    doc.text(ln, col.left.x, leftY);
    leftY += PAGE.line;
  }

  // Right column: Organizational Context as compact cards
  rightY = drawSubTitle(doc, "Organizational Context", rightY);
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
    ay = drawBullets(doc, actions, grid.left.w, ay);
  }
  if (watchouts.length) {
    setFont(doc, TYPO.h3); setText(doc, PALETTE.ink);
    doc.text("Watch-outs", grid.right.x, wy);
    wy += PAGE.line * 1.6;
    wy = drawBullets(doc, watchouts, grid.right.w, wy);
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
  await finalizeFooters(doc, "CORTEX Executive AI Readiness Assessment");

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

  const J = await ensureJsPDF();
  const doc = newDoc(J);
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
  if ((sessionData as any).useCase) {
    y = drawSectionTitle(doc, "USE CASE", y);
    y = drawBody(doc, String((sessionData as any).useCase), bounds(doc).w, y);
    y += PAGE.line;
  }

  // Goals
  if (Array.isArray((sessionData as any).goals) && (sessionData as any).goals.length) {
    y = drawSectionTitle(doc, "GOALS", y);
    y = drawBullets(doc, (sessionData as any).goals, bounds(doc).w, y);
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
    y = drawBullets(doc, sessionData.emphasizedLenses, bounds(doc).w, y);
    y += PAGE.line * 0.5;
  }

  // Misconception Check (if present)
  if ((sessionData as any).misconceptionResponses && Object.keys((sessionData as any).misconceptionResponses).length) {
    ({ cursorY: y } = addPageIfNeeded(doc, 22, y, "CORTEX — Options Studio"));
    y = drawSectionTitle(doc, "MISCONCEPTION CHECK RESULTS", y);

    const map = MISCONCEPTION_QUESTIONS.reduce((acc, q) => { acc[q.id] = q; return acc; }, {} as Record<string, typeof MISCONCEPTION_QUESTIONS[0]>);
    for (const [qid, ans] of Object.entries((sessionData as any).misconceptionResponses)) {
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
  const summary = `Options explored: ${sessionData.selectedOptions?.length ?? 0} • Completed: ${(sessionData as any).completed ? "Yes" : "No"}`;
  doc.text(summary, PAGE.margin, y + 2);

  await finalizeFooters(doc, "CORTEX Options Studio");

  const blob = doc.output("blob");
  if (!(blob instanceof Blob)) throw new Error("Failed to generate PDF blob");
  downloadBlob(blob, `cortex-options-${assessmentId}.pdf`);
}

/* ====================================================================================
   3) EXECUTIVE BRIEF (scores + priorities + insights)
==================================================================================== */

export async function generateExecutiveBriefPDF(data: EnhancedAssessmentResults, assessmentId: string): Promise<void> {
  if (!data?.contextProfile || !data?.pillarScores || !assessmentId) {
    throw new Error("Missing required data for executive PDF generation");
  }

  // Generate insights if missing
  let insights = data.insights;
  if (!insights || !Array.isArray(insights) || insights.length === 0) {
    try {
      const result = await generateEnhancedExecutiveInsights({
        contextProfile: data.contextProfile,
        pillarScores: data.pillarScores
      } as any);
      insights = result.insights || [];
    } catch { insights = []; }
  }

  const J = await ensureJsPDF();
  const doc = newDoc(J);
  const { pw } = bounds(doc);

  // Header band
  setFill(doc, PALETTE.ink);
  doc.rect(0, 0, pw, PAGE.headerBar, "F");
  setText(doc, PALETTE.white);
  setFont(doc, TYPO.hero);
  doc.text("CORTEX™", PAGE.margin, 18);
  setFont(doc, TYPO.body);
  doc.text("EXECUTIVE READINESS BRIEF", PAGE.margin, 26);

  const dateText = `Generated: ${new Date(data.completedAt ?? Date.now()).toLocaleString()}`;
  const idText = `ID: ${String(assessmentId).slice(0, 8).toUpperCase()}`;
  doc.text(dateText, pw - PAGE.margin - doc.getTextWidth(dateText), 16);
  doc.text(idText,  pw - PAGE.margin - doc.getTextWidth(idText),  22);

  let y = PAGE.headerBar + 10;

  // Summary tiles
  const avg = Number.isFinite(data.averageScore) ? (data.averageScore as number) : undefined;
  const maturity = data.maturityLevel || (avg ? `Level ${avg.toFixed(1)}` : undefined);

  setFont(doc, TYPO.h1); setText(doc, PALETTE.accent);
  doc.text("EXECUTIVE SUMMARY", PAGE.margin, y);
  y += PAGE.line * 2.5;

  if (maturity) {
    setFont(doc, TYPO.h2); setText(doc, PALETTE.ink);
    doc.text(`Overall Maturity: ${maturity}`, PAGE.margin, y);
    y += PAGE.line * 1.8;
  }

  // Domain bars
  ({ cursorY: y } = addPageIfNeeded(doc, 40, y, "CORTEX — Executive Brief"));
  y = drawScoreBars(doc, data.pillarScores, y);
  y += 2;

  // Priorities (if present)
  if (Array.isArray(data.priorities) && data.priorities.length) {
    ({ cursorY: y } = addPageIfNeeded(doc, 18, y, "CORTEX — Executive Brief"));
    y = drawSectionTitle(doc, "ACTION PRIORITIES", y);
    const items = data.priorities
      .slice(0, 6)
      .map((p, idx) => `${idx + 1}. ${normalizeText(p.title)} ${p.timeframe ? `(${p.timeframe})` : ''}`);

    y = drawBullets(doc, items, bounds(doc).w, y);
    y += PAGE.line * 0.5;
  }

  // Insights
  if (Array.isArray(insights) && insights.length) {
    ({ cursorY: y } = addPageIfNeeded(doc, 22, y, "CORTEX — Executive Brief"));
    y = drawSectionTitle(doc, "EXECUTIVE INSIGHTS", y);
    for (const ins of insights.slice(0, 6)) {
      ({ cursorY: y } = addPageIfNeeded(doc, 14, y, "CORTEX — Executive Brief"));
      setFont(doc, TYPO.h3); setText(doc, PALETTE.ink);
      doc.text(normalizeText(ins.title || "Insight"), PAGE.margin, y);
      y += PAGE.line * 1.1;
      setFont(doc, TYPO.body); setText(doc, PALETTE.ink);
      y = drawBody(doc, normalizeText(ins.description || ins.reasoning || ""), bounds(doc).w, y);
      y += 1.2;
    }
  }

  await finalizeFooters(doc, "CORTEX Executive Brief");

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
