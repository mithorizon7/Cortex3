import { type Assessment, type InsertAssessment, type OptionsStudioSession, assessments, optionsStudioSessionSchema } from "@shared/schema";
import { randomUUID } from "crypto";
import { logger, withErrorHandling } from "./logger";
import { withDatabaseErrorHandling } from "./utils/database-errors";
import { eq, and } from "drizzle-orm";

// Lazy-load database connection to avoid initialization errors in tests
let _db: any = null;
async function getDb() {
  if (!_db) {
    const { db } = await import("./db");
    _db = db;
  }
  return _db;
}

export interface IStorage {
  getAssessment(id: string, userId?: string): Promise<Assessment | null>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  updateAssessment(id: string, updates: Partial<InsertAssessment>, userId?: string): Promise<Assessment | null>;
  
  // Options Studio Session Operations
  getOptionsStudioSession(assessmentId: string, userId?: string): Promise<OptionsStudioSession | null>;
  createOrUpdateOptionsStudioSession(assessmentId: string, sessionData: OptionsStudioSession, userId?: string): Promise<Assessment | null>;
}

export class DatabaseStorage implements IStorage {
  async getAssessment(id: string, userId?: string): Promise<Assessment | null> {
    return withDatabaseErrorHandling(
      'getAssessment',
      async () => {
        // Build query with optional userId filter for ownership verification
        let whereConditions = [eq(assessments.id, id)];
        
        // If userId is provided, add ownership filter
        if (userId) {
          whereConditions.push(eq(assessments.userId, userId));
        }
        
        const db = await getDb();
        const [assessment] = await db.select().from(assessments).where(and(...whereConditions));
        
        if (assessment) {
          logger.debug('Assessment retrieved successfully', {
            additionalContext: { assessmentId: id, hasUserFilter: !!userId }
          });
          return assessment;
        } else {
          logger.warn('Assessment not found', {
            additionalContext: { assessmentId: id, hasUserFilter: !!userId }
          });
          return null;
        }
      },
      { functionArgs: { id, userId } }
    );
  }

  async createAssessment(insertAssessment: InsertAssessment): Promise<Assessment> {
    return withDatabaseErrorHandling(
      'createAssessment',
      async () => {
        const db = await getDb();
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

  async updateAssessment(id: string, updates: Partial<InsertAssessment>, userId?: string): Promise<Assessment | null> {
    return withDatabaseErrorHandling(
      'updateAssessment',
      async () => {
        // Build query with optional userId filter for ownership verification
        let whereConditions = [eq(assessments.id, id)];
        
        // If userId is provided, add ownership filter
        if (userId) {
          whereConditions.push(eq(assessments.userId, userId));
        }
        
        const db = await getDb();
        const [updated] = await db
          .update(assessments)
          .set(updates)
          .where(and(...whereConditions))
          .returning();
        
        if (updated) {
          logger.info('Assessment updated successfully', {
            additionalContext: { 
              assessmentId: id,
              updateKeys: Object.keys(updates),
              hasCompletedAt: !!updated.completedAt,
              hasUserFilter: !!userId
            }
          });
          return updated;
        } else {
          logger.warn('Cannot update assessment - not found or access denied', {
            additionalContext: { assessmentId: id, hasUserFilter: !!userId }
          });
          return null;
        }
      },
      { functionArgs: { id, updates, userId } }
    );
  }

  async getOptionsStudioSession(assessmentId: string, userId?: string): Promise<OptionsStudioSession | null> {
    return withDatabaseErrorHandling(
      'getOptionsStudioSession',
      async () => {
        // Build query with optional userId filter for ownership verification
        let whereConditions = [eq(assessments.id, assessmentId)];
        
        // If userId is provided, add ownership filter
        if (userId) {
          whereConditions.push(eq(assessments.userId, userId));
        }
        
        const db = await getDb();
        const [assessment] = await db
          .select({ optionsStudioSession: assessments.optionsStudioSession })
          .from(assessments)
          .where(and(...whereConditions));
        
        if (assessment?.optionsStudioSession) {
          try {
            const validatedSession = optionsStudioSessionSchema.parse(assessment.optionsStudioSession);
            logger.debug('Options Studio session retrieved successfully', {
              additionalContext: { assessmentId, hasUserFilter: !!userId }
            });
            return validatedSession;
          } catch (validationError) {
            logger.warn('Invalid Options Studio session data in database', {
              additionalContext: { 
                assessmentId,
                error: validationError instanceof Error ? validationError.message : String(validationError)
              }
            });
            return null;
          }
        } else {
          logger.debug('No Options Studio session found for assessment', {
            additionalContext: { assessmentId, hasUserFilter: !!userId }
          });
          return null;
        }
      },
      { functionArgs: { assessmentId, userId } }
    );
  }

  async createOrUpdateOptionsStudioSession(assessmentId: string, sessionData: OptionsStudioSession, userId?: string): Promise<Assessment | null> {
    return withDatabaseErrorHandling(
      'createOrUpdateOptionsStudioSession',
      async () => {
        // Validate session data before storing
        const validatedSessionData = optionsStudioSessionSchema.parse(sessionData);
        
        // Build query with optional userId filter for ownership verification
        let whereConditions = [eq(assessments.id, assessmentId)];
        
        // If userId is provided, add ownership filter
        if (userId) {
          whereConditions.push(eq(assessments.userId, userId));
        }
        
        const db = await getDb();
        const [updated] = await db
          .update(assessments)
          .set({ optionsStudioSession: validatedSessionData as any })
          .where(and(...whereConditions))
          .returning();
        
        if (updated) {
          logger.info('Options Studio session saved successfully', {
            additionalContext: { 
              assessmentId,
              hasUseCase: !!validatedSessionData.useCase,
              goalsCount: validatedSessionData.goals.length,
              comparedOptionsCount: validatedSessionData.comparedOptions.length,
              completed: validatedSessionData.completed
            }
          });
          return updated;
        } else {
          logger.warn('Cannot update Options Studio session - assessment not found or access denied', {
            additionalContext: { assessmentId, hasUserFilter: !!userId }
          });
          return null;
        }
      },
      { functionArgs: { assessmentId, sessionData, userId } }
    );
  }
}

export class MemStorage implements IStorage {
  private assessments: Map<string, Assessment>;

  constructor() {
    this.assessments = new Map();
  }

  async getAssessment(id: string, userId?: string): Promise<Assessment | null> {
    return withErrorHandling(
      'getAssessment',
      async () => {
        const assessment = this.assessments.get(id);
        
        // If userId is provided, verify ownership
        if (assessment && userId && assessment.userId !== userId) {
          logger.warn('Assessment access denied - user mismatch', {
            additionalContext: { assessmentId: id, requestedUserId: userId, actualUserId: assessment.userId }
          });
          return null;
        }
        
        if (assessment) {
          logger.debug('Assessment retrieved successfully', {
            additionalContext: { assessmentId: id, hasUserFilter: !!userId }
          });
          return assessment;
        } else {
          logger.warn('Assessment not found', {
            additionalContext: { assessmentId: id, hasUserFilter: !!userId }
          });
          return null;
        }
      },
      { functionArgs: { id, userId } }
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
          confidenceGaps: insertAssessment.confidenceGaps || null,
          triggeredGates: insertAssessment.triggeredGates || null,
          priorityMoves: insertAssessment.priorityMoves || null,
          contentTags: insertAssessment.contentTags || null,
          contextGuidance: insertAssessment.contextGuidance || null,
          valueOverlay: insertAssessment.valueOverlay || null,
          optionsStudioSession: insertAssessment.optionsStudioSession || null,
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

  async updateAssessment(id: string, updates: Partial<InsertAssessment>, userId?: string): Promise<Assessment | null> {
    return withErrorHandling(
      'updateAssessment',
      async () => {
        const existing = this.assessments.get(id);
        if (!existing) {
          logger.warn('Cannot update assessment - not found', {
            additionalContext: { assessmentId: id, hasUserFilter: !!userId }
          });
          return null;
        }
        
        // If userId is provided, verify ownership
        if (userId && existing.userId !== userId) {
          logger.warn('Cannot update assessment - access denied', {
            additionalContext: { assessmentId: id, requestedUserId: userId, actualUserId: existing.userId }
          });
          return null;
        }
        
        const updated: Assessment = { ...existing, ...updates };
        this.assessments.set(id, updated);
        
        logger.info('Assessment updated successfully', {
          additionalContext: { 
            assessmentId: id,
            updateKeys: Object.keys(updates),
            hasCompletedAt: !!updated.completedAt,
            hasUserFilter: !!userId
          }
        });
        
        return updated;
      },
      { functionArgs: { id, updates, userId } }
    );
  }

  async getOptionsStudioSession(assessmentId: string, userId?: string): Promise<OptionsStudioSession | null> {
    return withErrorHandling(
      'getOptionsStudioSession',
      async () => {
        const assessment = this.assessments.get(assessmentId);
        
        if (assessment?.optionsStudioSession) {
          try {
            const validatedSession = optionsStudioSessionSchema.parse(assessment.optionsStudioSession);
            logger.debug('Options Studio session retrieved successfully', {
              additionalContext: { assessmentId, hasUserFilter: !!userId }
            });
            return validatedSession;
          } catch (validationError) {
            logger.warn('Invalid Options Studio session data in memory', {
              additionalContext: { 
                assessmentId,
                error: validationError instanceof Error ? validationError.message : String(validationError)
              }
            });
            return null;
          }
        } else {
          logger.debug('No Options Studio session found for assessment', {
            additionalContext: { assessmentId, hasUserFilter: !!userId }
          });
          return null;
        }
      },
      { functionArgs: { assessmentId, userId } }
    );
  }

  async createOrUpdateOptionsStudioSession(assessmentId: string, sessionData: OptionsStudioSession, userId?: string): Promise<Assessment | null> {
    return withErrorHandling(
      'createOrUpdateOptionsStudioSession',
      async () => {
        const existing = this.assessments.get(assessmentId);
        if (!existing) {
          logger.warn('Cannot update Options Studio session - assessment not found or access denied', {
            additionalContext: { assessmentId, hasUserFilter: !!userId }
          });
          return null;
        }
        
        // Validate session data before storing
        const validatedSessionData = optionsStudioSessionSchema.parse(sessionData);
        
        const updated: Assessment = { 
          ...existing, 
          optionsStudioSession: validatedSessionData as any
        };
        this.assessments.set(assessmentId, updated);
        
        logger.info('Options Studio session saved successfully', {
          additionalContext: { 
            assessmentId,
            hasUseCase: !!validatedSessionData.useCase,
            goalsCount: validatedSessionData.goals.length,
            comparedOptionsCount: validatedSessionData.comparedOptions.length,
            completed: validatedSessionData.completed
          }
        });
        
        return updated;
      },
      { functionArgs: { assessmentId, sessionData, userId } }
    );
  }
}

export const storage = new DatabaseStorage();
