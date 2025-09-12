import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const assessments = pgTable("assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // Firebase user ID for ownership tracking
  contextProfile: jsonb("context_profile").notNull(),
  contextMirror: jsonb("context_mirror"),
  contextMirrorUpdatedAt: text("context_mirror_updated_at"),
  pulseResponses: jsonb("pulse_responses"),
  pillarScores: jsonb("pillar_scores"),
  triggeredGates: jsonb("triggered_gates"),
  priorityMoves: jsonb("priority_moves"),
  contentTags: jsonb("content_tags"),
  contextGuidance: jsonb("context_guidance"),
  valueOverlay: jsonb("value_overlay"),
  optionsStudioSession: jsonb("options_studio_session"),
  completedAt: text("completed_at"),
  createdAt: text("created_at").default(sql`now()`),
});

export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  createdAt: true,
});

export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Assessment = typeof assessments.$inferSelect;

// Context Profile Types
export const contextProfileSchema = z.object({
  regulatory_intensity: z.number().min(0).max(4),
  data_sensitivity: z.number().min(0).max(4),
  safety_criticality: z.number().min(0).max(4),
  brand_exposure: z.number().min(0).max(4),
  clock_speed: z.number().min(0).max(4),
  latency_edge: z.number().min(0).max(4),
  scale_throughput: z.number().min(0).max(4),
  data_advantage: z.number().min(0).max(4),
  build_readiness: z.number().min(0).max(4),
  finops_priority: z.number().min(0).max(4),
  procurement_constraints: z.boolean(),
  edge_operations: z.boolean(),
});

export type ContextProfile = z.infer<typeof contextProfileSchema>;

// Pulse Check Types
export const pulseResponsesSchema = z.record(z.string(), z.boolean());
export type PulseResponses = z.infer<typeof pulseResponsesSchema>;

// Pillar Scores
export const pillarScoresSchema = z.object({
  C: z.number().min(0).max(3),
  O: z.number().min(0).max(3),
  R: z.number().min(0).max(3),
  T: z.number().min(0).max(3),
  E: z.number().min(0).max(3),
  X: z.number().min(0).max(3),
});

export type PillarScores = z.infer<typeof pillarScoresSchema>;

// Gate Types
export const gateSchema = z.object({
  id: z.string(),
  title: z.string(),
  triggered: z.boolean(),
  reason: z.string(),
});

export type Gate = z.infer<typeof gateSchema>;

// Value Overlay Types
export const valueOverlayPillarSchema = z.object({
  metric_id: z.string(),
  name: z.string(),
  baseline: z.number().nullable(),
  target: z.number().nullable(),
  unit: z.string(),
  cadence: z.enum(['monthly', 'quarterly']),
});

export const valueOverlaySchema = z.object({
  C: valueOverlayPillarSchema.optional(),
  O: valueOverlayPillarSchema.optional(),
  R: valueOverlayPillarSchema.optional(),
  T: valueOverlayPillarSchema.optional(),
  E: valueOverlayPillarSchema.optional(),
  X: valueOverlayPillarSchema.optional(),
});

export type ValueOverlayPillar = z.infer<typeof valueOverlayPillarSchema>;
export type ValueOverlay = z.infer<typeof valueOverlaySchema>;

// Context Mirror Types
export const contextMirrorSchema = z.object({
  strengths: z.array(z.string().min(8).max(180)).length(3),
  fragilities: z.array(z.string().min(8).max(180)).length(3),
  whatWorks: z.array(z.string().min(10).max(180)).length(2),
  disclaimer: z.string().min(10).max(140),
});

export type ContextMirror = z.infer<typeof contextMirrorSchema>;

// Context Mirror Request Validation Schema
export const contextMirrorRequestSchema = z.object({
  assessmentId: z.string().uuid("Assessment ID must be a valid UUID"),
});

export type ContextMirrorRequest = z.infer<typeof contextMirrorRequestSchema>;

// Options Studio Types - Seven Lenses Framework
export const lensPositionsSchema = z.object({
  speed: z.number().int().min(0).max(4),               // Speed-to-Value: 0=months+; 2=weeks; 4=days
  control: z.number().int().min(0).max(4),             // Customization & Control: 0=out-of-box; 4=deeply tailored
  dataLeverage: z.number().int().min(0).max(4),        // Data Leverage: 0=doesn't use your data; 4=strong proprietary use
  riskLoad: z.number().int().min(0).max(4),            // Risk & Compliance Load: 0=minimal controls; 4=heavy governance
  opsBurden: z.number().int().min(0).max(4),           // Operational Burden: 0=near zero ops; 4=dedicated team
  portability: z.number().int().min(0).max(4),         // Portability & Lock-in: 0=hard to switch; 4=easy to migrate
  costShape: z.number().int().min(0).max(4),           // Cost Shape: 0=heavy fixed/CapEx; 4=variable/throttleable OpEx
});

export const timelineMetersSchema = z.object({
  speed: z.number().int().min(0).max(4),
  buildEffort: z.number().int().min(0).max(4),
  ops: z.number().int().min(0).max(4),
});

export const mythSchema = z.object({
  claim: z.string(),
  truth: z.string(),
});

export const optionCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  what: z.string(),                              // What this option is
  bestFor: z.array(z.string()),                  // 3-5 bullets of when to use
  notIdeal: z.array(z.string()),                 // 2-4 bullets of when not to use
  prerequisites: z.array(z.string()),            // 3-5 bullets of what's needed
  timelineMeters: timelineMetersSchema,
  dataNeeds: z.string(),                         // 1-2 sentences about data requirements
  risks: z.array(z.string()),                    // 3-5 bullets of key risks
  kpis: z.array(z.string()),                     // 2-3 bullets of success metrics
  myth: mythSchema,                              // Common misconception and truth
  axes: lensPositionsSchema,                     // Seven Lenses positioning
  cautions: z.array(z.enum(['regulated', 'high_sensitivity', 'low_readiness', 'edge'])).optional(),
});

export const misconceptionQuestionSchema = z.object({
  id: z.string(),
  statement: z.string(),                         // The misconception statement
  correctAnswer: z.boolean(),                    // True/False for the statement
  explanation: z.string(),                       // Why the answer is correct
  links: z.array(z.string()),                    // Related option IDs
});

export const optionsStudioSessionSchema = z.object({
  useCase: z.string(),
  goals: z.array(z.string()),
  misconceptionResponses: z.record(z.string(), z.boolean()),  // misconception ID -> user answer
  comparedOptions: z.array(z.string()),          // Option IDs that were compared
  viewedOptions: z.array(z.string()),            // Option IDs that were viewed
  reflectionAnswers: z.record(z.string(), z.string()),       // reflection prompt ID -> user answer
  completed: z.boolean(),
  completedAt: z.string().optional(),
});

export type LensPositions = z.infer<typeof lensPositionsSchema>;
export type TimelineMeters = z.infer<typeof timelineMetersSchema>;
export type Myth = z.infer<typeof mythSchema>;
export type OptionCard = z.infer<typeof optionCardSchema>;
export type MisconceptionQuestion = z.infer<typeof misconceptionQuestionSchema>;
export type OptionsStudioSession = z.infer<typeof optionsStudioSessionSchema>;
