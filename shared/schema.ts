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

// Options Studio Types
export const lensPositionsSchema = z.object({
  speed: z.number().min(0).max(4),
  control: z.number().min(0).max(4),
  dataLeverage: z.number().min(0).max(4),
  riskLoad: z.number().min(0).max(4),
  opsBurden: z.number().min(0).max(4),
  portability: z.number().min(0).max(4),
  costShape: z.number().min(0).max(4),
});

export type LensPositions = z.infer<typeof lensPositionsSchema>;

export const optionCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  what: z.string(),
  bestFor: z.array(z.string()),
  notIdeal: z.array(z.string()),
  prerequisites: z.array(z.string()),
  timelineMeters: z.object({
    speed: z.number().min(0).max(4),
    buildEffort: z.number().min(0).max(4),
    ops: z.number().min(0).max(4),
  }),
  dataNeeds: z.string(),
  risks: z.array(z.string()),
  kpis: z.array(z.string()),
  myth: z.object({
    claim: z.string(),
    truth: z.string(),
  }),
  axes: lensPositionsSchema,
  cautions: z.array(z.enum(['regulated', 'high_sensitivity', 'low_readiness', 'edge'])).optional(),
});

export type OptionCard = z.infer<typeof optionCardSchema>;

export const misconceptionQuestionSchema = z.object({
  id: z.string(),
  statement: z.string(),
  correct: z.boolean(),
  explanation: z.string(),
  relatedOptions: z.array(z.string()),
});

export type MisconceptionQuestion = z.infer<typeof misconceptionQuestionSchema>;

export const optionsStudioSessionSchema = z.object({
  useCaseTitle: z.string().optional(),
  goals: z.array(z.enum(['speed', 'quality', 'compliance', 'cost'])).optional(),
  misconceptionsAnswered: z.record(z.string(), z.boolean()),
  optionsViewed: z.array(z.string()),
  optionsCompared: z.array(z.string()),
  reflections: z.object({
    promisingOptions: z.string().max(240).optional(),
    priorityLenses: z.array(z.string()).optional(),
  }),
  completedAt: z.string().optional(),
});

export type OptionsStudioSession = z.infer<typeof optionsStudioSessionSchema>;
