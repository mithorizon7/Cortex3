import { type Assessment, type InsertAssessment, type OptionsStudioSession, type User, type InsertUser, type Cohort, type InsertCohort, assessments, users, cohorts, optionsStudioSessionSchema } from "@shared/schema";
import { randomUUID } from "crypto";
import { logger, withErrorHandling } from "./logger";
import { withDatabaseErrorHandling } from "./utils/database-errors";
import { eq, and, desc } from "drizzle-orm";

// Lazy-load database connection to avoid initialization errors in tests
let _db: any = null;
async function getDb() {
  if (!_db) {
    try {
      const { db } = await import("./db");
      _db = db;
      logger.debug('Database connection initialized successfully');
    } catch (error) {
      logger.error(
        'Failed to initialize database connection',
        error instanceof Error ? error : new Error(String(error)),
        {
          additionalContext: { operation: 'database_initialization' }
        }
      );
      throw error;
    }
  }
  return _db;
}

export interface IStorage {
  // Assessment operations
  getAssessment(id: string, userId?: string): Promise<Assessment | null>;
  getUserAssessments(userId: string): Promise<Assessment[]>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  updateAssessment(id: string, updates: Partial<InsertAssessment>, userId?: string): Promise<Assessment | null>;
  
  // Options Studio Session Operations
  getOptionsStudioSession(assessmentId: string, userId?: string): Promise<OptionsStudioSession | null>;
  createOrUpdateOptionsStudioSession(assessmentId: string, sessionData: OptionsStudioSession, userId?: string): Promise<Assessment | null>;
  
  // User operations
  getUser(userId: string): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(userId: string, updates: Partial<InsertUser>): Promise<User | null>;
  
  // Cohort operations
  getCohort(id: string): Promise<Cohort | null>;
  getCohortByCode(code: string): Promise<Cohort | null>;
  createCohort(cohort: InsertCohort): Promise<Cohort>;
  updateCohort(id: string, updates: Partial<InsertCohort>): Promise<Cohort | null>;
  joinCohort(userId: string, cohortId: string): Promise<User | null>;
  getCohortUsers(cohortId: string): Promise<User[]>;
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

  async getUserAssessments(userId: string): Promise<Assessment[]> {
    return withDatabaseErrorHandling(
      'getUserAssessments',
      async () => {
        const db = await getDb();
        const userAssessments = await db
          .select()
          .from(assessments)
          .where(eq(assessments.userId, userId))
          .orderBy(assessments.createdAt);
        
        logger.debug('User assessments retrieved successfully', {
          additionalContext: { 
            userId, 
            assessmentCount: userAssessments.length 
          }
        });
        
        return userAssessments;
      },
      { functionArgs: { userId } }
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

  // User operations
  async getUser(userId: string): Promise<User | null> {
    return withDatabaseErrorHandling(
      'getUser',
      async () => {
        const db = await getDb();
        const [user] = await db.select().from(users).where(eq(users.userId, userId));
        
        if (user) {
          logger.debug('User retrieved successfully', {
            additionalContext: { userId }
          });
          return user;
        } else {
          logger.debug('User not found', {
            additionalContext: { userId }
          });
          return null;
        }
      },
      { functionArgs: { userId } }
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    return withDatabaseErrorHandling(
      'createUser',
      async () => {
        const db = await getDb();
        const [user] = await db
          .insert(users)
          .values(insertUser)
          .returning();
        
        logger.info('User created successfully', {
          additionalContext: { 
            userId: user.userId,
            email: user.email,
            role: user.role
          }
        });
        
        return user;
      },
      { functionArgs: { insertUser } }
    );
  }

  async updateUser(userId: string, updates: Partial<InsertUser>): Promise<User | null> {
    return withDatabaseErrorHandling(
      'updateUser',
      async () => {
        const db = await getDb();
        const [updated] = await db
          .update(users)
          .set(updates)
          .where(eq(users.userId, userId))
          .returning();
        
        if (updated) {
          logger.info('User updated successfully', {
            additionalContext: { 
              userId,
              updateKeys: Object.keys(updates)
            }
          });
          return updated;
        } else {
          logger.warn('Cannot update user - not found', {
            additionalContext: { userId }
          });
          return null;
        }
      },
      { functionArgs: { userId, updates } }
    );
  }

  // Cohort operations
  async getCohort(id: string): Promise<Cohort | null> {
    return withDatabaseErrorHandling(
      'getCohort',
      async () => {
        const db = await getDb();
        const [cohort] = await db.select().from(cohorts).where(eq(cohorts.id, id));
        
        if (cohort) {
          logger.debug('Cohort retrieved successfully', {
            additionalContext: { cohortId: id }
          });
          return cohort;
        } else {
          logger.debug('Cohort not found', {
            additionalContext: { cohortId: id }
          });
          return null;
        }
      },
      { functionArgs: { id } }
    );
  }

  async getCohortByCode(code: string): Promise<Cohort | null> {
    return withDatabaseErrorHandling(
      'getCohortByCode',
      async () => {
        const db = await getDb();
        const [cohort] = await db.select().from(cohorts).where(eq(cohorts.code, code));
        
        if (cohort) {
          logger.debug('Cohort retrieved by code successfully', {
            additionalContext: { code }
          });
          return cohort;
        } else {
          logger.debug('Cohort not found by code', {
            additionalContext: { code }
          });
          return null;
        }
      },
      { functionArgs: { code } }
    );
  }

  async createCohort(insertCohort: InsertCohort): Promise<Cohort> {
    return withDatabaseErrorHandling(
      'createCohort',
      async () => {
        const db = await getDb();
        const [cohort] = await db
          .insert(cohorts)
          .values(insertCohort)
          .returning();
        
        logger.info('Cohort created successfully', {
          additionalContext: { 
            cohortId: cohort.id,
            code: cohort.code,
            name: cohort.name
          }
        });
        
        return cohort;
      },
      { functionArgs: { insertCohort } }
    );
  }

  async updateCohort(id: string, updates: Partial<InsertCohort>): Promise<Cohort | null> {
    return withDatabaseErrorHandling(
      'updateCohort',
      async () => {
        const db = await getDb();
        const [updated] = await db
          .update(cohorts)
          .set(updates)
          .where(eq(cohorts.id, id))
          .returning();
        
        if (updated) {
          logger.info('Cohort updated successfully', {
            additionalContext: { 
              cohortId: id,
              updateKeys: Object.keys(updates)
            }
          });
          return updated;
        } else {
          logger.warn('Cannot update cohort - not found', {
            additionalContext: { cohortId: id }
          });
          return null;
        }
      },
      { functionArgs: { id, updates } }
    );
  }

  async joinCohort(userId: string, cohortId: string): Promise<User | null> {
    return withDatabaseErrorHandling(
      'joinCohort',
      async () => {
        const db = await getDb();
        const [updated] = await db
          .update(users)
          .set({ cohortId })
          .where(eq(users.userId, userId))
          .returning();
        
        if (updated) {
          logger.info('User joined cohort successfully', {
            additionalContext: { userId, cohortId }
          });
          return updated;
        } else {
          logger.warn('Cannot join cohort - user not found', {
            additionalContext: { userId, cohortId }
          });
          return null;
        }
      },
      { functionArgs: { userId, cohortId } }
    );
  }

  async getCohortUsers(cohortId: string): Promise<User[]> {
    return withDatabaseErrorHandling(
      'getCohortUsers',
      async () => {
        const db = await getDb();
        const cohortUsers = await db
          .select()
          .from(users)
          .where(eq(users.cohortId, cohortId))
          .orderBy(desc(users.createdAt));
        
        logger.debug('Cohort users retrieved successfully', {
          additionalContext: { 
            cohortId, 
            userCount: cohortUsers.length 
          }
        });
        
        return cohortUsers;
      },
      { functionArgs: { cohortId } }
    );
  }
}

export class MemStorage implements IStorage {
  private assessments: Map<string, Assessment>;
  private users: Map<string, User>;
  private cohorts: Map<string, Cohort>;

  constructor() {
    this.assessments = new Map();
    this.users = new Map();
    this.cohorts = new Map();
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

  async getUserAssessments(userId: string): Promise<Assessment[]> {
    return withErrorHandling(
      'getUserAssessments',
      async () => {
        const userAssessments = Array.from(this.assessments.values())
          .filter(assessment => assessment.userId === userId)
          .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
        
        logger.debug('User assessments retrieved successfully', {
          additionalContext: { 
            userId, 
            assessmentCount: userAssessments.length 
          }
        });
        
        return userAssessments;
      },
      { functionArgs: { userId } }
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
          situationAssessment: insertAssessment.situationAssessment || null,
          situationAssessmentUpdatedAt: insertAssessment.situationAssessmentUpdatedAt || null,
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

  // User operations
  async getUser(userId: string): Promise<User | null> {
    return withErrorHandling(
      'getUser',
      async () => {
        const user = this.users.get(userId);
        
        if (user) {
          logger.debug('User retrieved successfully', {
            additionalContext: { userId }
          });
          return user;
        } else {
          logger.debug('User not found', {
            additionalContext: { userId }
          });
          return null;
        }
      },
      { functionArgs: { userId } }
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    return withErrorHandling(
      'createUser',
      async () => {
        const user: User = { 
          ...insertUser,
          role: insertUser.role || 'user', // Default to 'user' role
          createdAt: new Date().toISOString(),
          lastActiveAt: insertUser.lastActiveAt || null,
          invitedBy: insertUser.invitedBy || null,
          cohortId: insertUser.cohortId || null
        };
        
        this.users.set(user.userId, user);
        
        logger.info('User created successfully', {
          additionalContext: { 
            userId: user.userId,
            email: user.email,
            role: user.role
          }
        });
        
        return user;
      },
      { functionArgs: { insertUser } }
    );
  }

  async updateUser(userId: string, updates: Partial<InsertUser>): Promise<User | null> {
    return withErrorHandling(
      'updateUser',
      async () => {
        const existing = this.users.get(userId);
        if (!existing) {
          logger.warn('Cannot update user - not found', {
            additionalContext: { userId }
          });
          return null;
        }
        
        const updated: User = { ...existing, ...updates };
        this.users.set(userId, updated);
        
        logger.info('User updated successfully', {
          additionalContext: { 
            userId,
            updateKeys: Object.keys(updates)
          }
        });
        
        return updated;
      },
      { functionArgs: { userId, updates } }
    );
  }

  // Cohort operations
  async getCohort(id: string): Promise<Cohort | null> {
    return withErrorHandling(
      'getCohort',
      async () => {
        const cohort = this.cohorts.get(id);
        
        if (cohort) {
          logger.debug('Cohort retrieved successfully', {
            additionalContext: { cohortId: id }
          });
          return cohort;
        } else {
          logger.debug('Cohort not found', {
            additionalContext: { cohortId: id }
          });
          return null;
        }
      },
      { functionArgs: { id } }
    );
  }

  async getCohortByCode(code: string): Promise<Cohort | null> {
    return withErrorHandling(
      'getCohortByCode',
      async () => {
        const cohort = Array.from(this.cohorts.values()).find(c => c.code === code);
        
        if (cohort) {
          logger.debug('Cohort retrieved by code successfully', {
            additionalContext: { code }
          });
          return cohort;
        } else {
          logger.debug('Cohort not found by code', {
            additionalContext: { code }
          });
          return null;
        }
      },
      { functionArgs: { code } }
    );
  }

  async createCohort(insertCohort: InsertCohort): Promise<Cohort> {
    return withErrorHandling(
      'createCohort',
      async () => {
        const id = randomUUID();
        const cohort: Cohort = { 
          ...insertCohort,
          id,
          description: insertCohort.description || null,
          status: insertCohort.status || 'active',
          usedSlots: 0,
          createdAt: new Date().toISOString()
        };
        
        this.cohorts.set(id, cohort);
        
        logger.info('Cohort created successfully', {
          additionalContext: { 
            cohortId: cohort.id,
            code: cohort.code,
            name: cohort.name
          }
        });
        
        return cohort;
      },
      { functionArgs: { insertCohort } }
    );
  }

  async updateCohort(id: string, updates: Partial<InsertCohort>): Promise<Cohort | null> {
    return withErrorHandling(
      'updateCohort',
      async () => {
        const existing = this.cohorts.get(id);
        if (!existing) {
          logger.warn('Cannot update cohort - not found', {
            additionalContext: { cohortId: id }
          });
          return null;
        }
        
        const updated: Cohort = { ...existing, ...updates };
        this.cohorts.set(id, updated);
        
        logger.info('Cohort updated successfully', {
          additionalContext: { 
            cohortId: id,
            updateKeys: Object.keys(updates)
          }
        });
        
        return updated;
      },
      { functionArgs: { id, updates } }
    );
  }

  async joinCohort(userId: string, cohortId: string): Promise<User | null> {
    return withErrorHandling(
      'joinCohort',
      async () => {
        const existing = this.users.get(userId);
        if (!existing) {
          logger.warn('Cannot join cohort - user not found', {
            additionalContext: { userId, cohortId }
          });
          return null;
        }
        
        const updated: User = { ...existing, cohortId };
        this.users.set(userId, updated);
        
        logger.info('User joined cohort successfully', {
          additionalContext: { userId, cohortId }
        });
        
        return updated;
      },
      { functionArgs: { userId, cohortId } }
    );
  }

  async getCohortUsers(cohortId: string): Promise<User[]> {
    return withErrorHandling(
      'getCohortUsers',
      async () => {
        const cohortUsers = Array.from(this.users.values())
          .filter(user => user.cohortId === cohortId)
          .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
        
        logger.debug('Cohort users retrieved successfully', {
          additionalContext: { 
            cohortId, 
            userCount: cohortUsers.length 
          }
        });
        
        return cohortUsers;
      },
      { functionArgs: { cohortId } }
    );
  }
}

export const storage = new DatabaseStorage();
