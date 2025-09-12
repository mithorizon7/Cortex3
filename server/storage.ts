import { type Assessment, type InsertAssessment, assessments } from "@shared/schema";
import { randomUUID } from "crypto";
import { logger, withErrorHandling } from "./logger";
import { withDatabaseErrorHandling } from "./utils/database-errors";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getAssessment(id: string, userId?: string): Promise<Assessment | null>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  updateAssessment(id: string, updates: Partial<InsertAssessment>, userId?: string): Promise<Assessment | null>;
}

export class DatabaseStorage implements IStorage {
  async getAssessment(id: string): Promise<Assessment | null> {
    return withDatabaseErrorHandling(
      'getAssessment',
      async () => {
        const [assessment] = await db.select().from(assessments).where(eq(assessments.id, id));
        
        if (assessment) {
          logger.debug('Assessment retrieved successfully', {
            additionalContext: { assessmentId: id }
          });
          return assessment;
        } else {
          logger.warn('Assessment not found', {
            additionalContext: { assessmentId: id }
          });
          return null;
        }
      },
      { functionArgs: { id } }
    );
  }

  async createAssessment(insertAssessment: InsertAssessment): Promise<Assessment> {
    return withDatabaseErrorHandling(
      'createAssessment',
      async () => {
        const [assessment] = await db
          .insert(assessments)
          .values(insertAssessment)
          .returning();
        
        logger.info('Assessment created successfully', {
          additionalContext: { 
            assessmentId: assessment.id,
            hasContextProfile: !!insertAssessment.contextProfile
          }
        });
        
        return assessment;
      },
      { functionArgs: { insertAssessment } }
    );
  }

  async updateAssessment(id: string, updates: Partial<InsertAssessment>): Promise<Assessment | null> {
    return withDatabaseErrorHandling(
      'updateAssessment',
      async () => {
        const [updated] = await db
          .update(assessments)
          .set(updates)
          .where(eq(assessments.id, id))
          .returning();
        
        if (updated) {
          logger.info('Assessment updated successfully', {
            additionalContext: { 
              assessmentId: id,
              updateKeys: Object.keys(updates),
              hasCompletedAt: !!updated.completedAt
            }
          });
          return updated;
        } else {
          logger.warn('Cannot update assessment - not found', {
            additionalContext: { assessmentId: id }
          });
          return null;
        }
      },
      { functionArgs: { id, updates } }
    );
  }
}

export class MemStorage implements IStorage {
  private assessments: Map<string, Assessment>;

  constructor() {
    this.assessments = new Map();
  }

  async getAssessment(id: string): Promise<Assessment | null> {
    return withErrorHandling(
      'getAssessment',
      async () => {
        const assessment = this.assessments.get(id);
        
        if (assessment) {
          logger.debug('Assessment retrieved successfully', {
            additionalContext: { assessmentId: id }
          });
          return assessment;
        } else {
          logger.warn('Assessment not found', {
            additionalContext: { assessmentId: id }
          });
          return null;
        }
      },
      { functionArgs: { id } }
    );
  }

  async createAssessment(insertAssessment: InsertAssessment): Promise<Assessment> {
    return withErrorHandling(
      'createAssessment',
      async () => {
        const id = randomUUID();
        const assessment: Assessment = { 
          ...insertAssessment, 
          id,
          createdAt: new Date().toISOString(),
          contextMirror: insertAssessment.contextMirror || null,
          contextMirrorUpdatedAt: insertAssessment.contextMirrorUpdatedAt || null,
          pulseResponses: insertAssessment.pulseResponses || null,
          pillarScores: insertAssessment.pillarScores || null,
          triggeredGates: insertAssessment.triggeredGates || null,
          priorityMoves: insertAssessment.priorityMoves || null,
          contentTags: insertAssessment.contentTags || null,
          contextGuidance: insertAssessment.contextGuidance || null,
          valueOverlay: insertAssessment.valueOverlay || null,
          completedAt: insertAssessment.completedAt || null,
        };
        
        this.assessments.set(id, assessment);
        
        logger.info('Assessment created successfully', {
          additionalContext: { 
            assessmentId: id,
            hasContextProfile: !!insertAssessment.contextProfile
          }
        });
        
        return assessment;
      },
      { functionArgs: { insertAssessment } }
    );
  }

  async updateAssessment(id: string, updates: Partial<InsertAssessment>): Promise<Assessment | null> {
    return withErrorHandling(
      'updateAssessment',
      async () => {
        const existing = this.assessments.get(id);
        if (!existing) {
          logger.warn('Cannot update assessment - not found', {
            additionalContext: { assessmentId: id }
          });
          return null;
        }
        
        const updated: Assessment = { ...existing, ...updates };
        this.assessments.set(id, updated);
        
        logger.info('Assessment updated successfully', {
          additionalContext: { 
            assessmentId: id,
            updateKeys: Object.keys(updates),
            hasCompletedAt: !!updated.completedAt
          }
        });
        
        return updated;
      },
      { functionArgs: { id, updates } }
    );
  }
}

export const storage = new DatabaseStorage();
