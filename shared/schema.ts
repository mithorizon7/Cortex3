import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const assessments = pgTable("assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contextProfile: jsonb("context_profile").notNull(),
  contextMirror: jsonb("context_mirror"),
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
