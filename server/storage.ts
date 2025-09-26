import { type Assessment, type InsertAssessment, type OptionsStudioSession, type User, type InsertUser, type Cohort, type InsertCohort, type BootstrapInvite, type InsertBootstrapInvite, assessments, users, cohorts, bootstrapInvites, optionsStudioSessionSchema } from "@shared/schema";
import { randomUUID } from "crypto";
import { logger, withErrorHandling } from "./logger";
import { withDatabaseErrorHandling } from "./utils/database-errors";
import { eq, and, desc, sql, count, avg, isNotNull } from "drizzle-orm";
import type { PgTransaction } from 'drizzle-orm/pg-core';

// Analytics types
export interface CohortAnalytics {
  cohortId: string;
  cohortName: string;
  cohortCode: string;
  cohortStatus: string;
  totalMembers: number;
  allowedSlots: number;
  activeMembers: number;
  totalAssessments: number;
  completedAssessments: number;
  completionRate: number;
  averageCompletionTime: number | null;
  averagePillarScores: {
    C: number | null;
    O: number | null;
    R: number | null;
    T: number | null;
    E: number | null;
    X: number | null;
  };
  lastActivity: string | null;
  createdAt: string;
}

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
  getSuperAdminCount(): Promise<number>;
  
  // Cohort operations
  getCohort(id: string): Promise<Cohort | null>;
  getCohortByCode(code: string): Promise<Cohort | null>;
  getAllCohorts(): Promise<Cohort[]>;
  createCohort(cohort: InsertCohort): Promise<Cohort>;
  updateCohort(id: string, updates: Partial<InsertCohort>): Promise<Cohort | null>;
  deleteCohort(id: string): Promise<boolean>;
  joinCohort(userId: string, cohortId: string): Promise<User | null>;
  joinCohortAtomic(userId: string, cohortId: string): Promise<{ user: User; cohort: Cohort } | null>;
  getCohortUsers(cohortId: string): Promise<User[]>;
  
  // Bootstrap invite operations
  getBootstrapInvite(code: string): Promise<BootstrapInvite | null>;
  createBootstrapInvite(invite: InsertBootstrapInvite): Promise<BootstrapInvite>;
  updateBootstrapInvite(id: string, updates: Partial<InsertBootstrapInvite>): Promise<BootstrapInvite | null>;
  useBootstrapInvite(code: string, userId: string): Promise<BootstrapInvite | null>;
  getAllBootstrapInvites(): Promise<BootstrapInvite[]>;
  revokeBootstrapInvite(id: string): Promise<BootstrapInvite | null>;
  
  // Analytics operations
  getCohortAnalytics(cohortId?: string | null): Promise<CohortAnalytics[]>;
  getCohortAnalyticsById(cohortId: string): Promise<CohortAnalytics | null>;
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

  async getSuperAdminCount(): Promise<number> {
    return withDatabaseErrorHandling(
      'getSuperAdminCount',
      async () => {
        const db = await getDb();
        const [result] = await db
          .select({ count: count() })
          .from(users)
          .where(eq(users.role, 'super_admin'));
        
        const adminCount = result.count;
        
        logger.debug('Super admin count retrieved', {
          additionalContext: { count: adminCount }
        });
        
        return adminCount;
      },
      { functionArgs: {} }
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
        
        // Generate unique 6-digit code (same logic as in routes and memory storage)
        let code: string;
        let attempts = 0;
        const maxAttempts = 10;
        
        do {
          const { randomBytes } = await import('crypto');
          const randomBytesBuffer = randomBytes(3);
          code = (parseInt(randomBytesBuffer.toString('hex'), 16) % 1000000).toString().padStart(6, '0');
          attempts++;
          
          // Check if code already exists in database
          const [existingCohort] = await db.select().from(cohorts).where(eq(cohorts.code, code));
          if (!existingCohort) break;
          
          if (attempts >= maxAttempts) {
            throw new Error('Failed to generate unique cohort code');
          }
        } while (true);
        
        const [cohort] = await db
          .insert(cohorts)
          .values({ ...insertCohort, code })
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

  async getAllCohorts(): Promise<Cohort[]> {
    return withDatabaseErrorHandling(
      'getAllCohorts',
      async () => {
        const db = await getDb();
        const allCohorts = await db
          .select()
          .from(cohorts)
          .orderBy(desc(cohorts.createdAt));
        
        logger.debug('All cohorts retrieved successfully', {
          additionalContext: { 
            cohortCount: allCohorts.length 
          }
        });
        
        return allCohorts;
      },
      { functionArgs: {} }
    );
  }

  async joinCohortAtomic(userId: string, cohortId: string): Promise<{ user: User; cohort: Cohort } | null> {
    return withDatabaseErrorHandling(
      'joinCohortAtomic',
      async () => {
        const db = await getDb();
        
        // Use a database transaction to ensure atomicity with proper business logic checks
        const result = await db.transaction(async (tx: PgTransaction<any, any, any>) => {
          // First, get current cohort state with FOR UPDATE lock to prevent race conditions
          const [currentCohort] = await tx
            .select()
            .from(cohorts)
            .where(eq(cohorts.id, cohortId))
            .for('update');
          
          if (!currentCohort) {
            throw new Error('Cohort not found');
          }
          
          // Check if cohort has available slots
          if (currentCohort.usedSlots >= currentCohort.allowedSlots) {
            throw new Error('Cohort is full');
          }
          
          // Get current user state with FOR UPDATE lock
          const [currentUser] = await tx
            .select()
            .from(users)
            .where(eq(users.userId, userId))
            .for('update');
          
          if (!currentUser) {
            throw new Error('User not found');
          }
          
          // Check if user is already in this cohort (prevent duplicate joins)
          if (currentUser.cohortId === cohortId) {
            throw new Error('User is already a member of this cohort');
          }
          
          // Check if user is in any other cohort (enforce single cohort membership)
          if (currentUser.cohortId !== null) {
            throw new Error('User is already a member of another cohort');
          }
          
          // All checks passed - now perform the updates atomically
          // Update the user's cohort membership first
          const [updatedUser] = await tx
            .update(users)
            .set({ cohortId })
            .where(eq(users.userId, userId))
            .returning();
          
          if (!updatedUser) {
            throw new Error('Failed to update user cohort membership');
          }
          
          // Then increment the cohort's used slots
          const [updatedCohort] = await tx
            .update(cohorts)
            .set({ usedSlots: currentCohort.usedSlots + 1 })
            .where(eq(cohorts.id, cohortId))
            .returning();
          
          if (!updatedCohort) {
            throw new Error('Failed to update cohort slots');
          }
          
          return { user: updatedUser, cohort: updatedCohort };
        });
        
        logger.info('User joined cohort atomically', {
          additionalContext: { 
            userId, 
            cohortId,
            newUsedSlots: result.cohort.usedSlots
          }
        });
        
        return result;
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

  async deleteCohort(id: string): Promise<boolean> {
    return withDatabaseErrorHandling(
      'deleteCohort',
      async () => {
        const db = await getDb();
        
        // First check if cohort exists
        const [existing] = await db.select().from(cohorts).where(eq(cohorts.id, id));
        if (!existing) {
          logger.warn('Cannot delete cohort - not found', {
            additionalContext: { cohortId: id }
          });
          return false;
        }
        
        // Delete the cohort (cascade should handle foreign keys)
        const [deleted] = await db
          .delete(cohorts)
          .where(eq(cohorts.id, id))
          .returning();
        
        if (deleted) {
          logger.info('Cohort deleted successfully', {
            additionalContext: { cohortId: id, cohortName: existing.name }
          });
          return true;
        }
        
        return false;
      },
      { functionArgs: { id } }
    );
  }

  async getCohortAnalytics(cohortId?: string | null): Promise<CohortAnalytics[]> {
    return withDatabaseErrorHandling(
      'getCohortAnalytics',
      async () => {
        const db = await getDb();
        
        // Build base query for cohorts
        let cohortQuery = db.select().from(cohorts);
        
        if (cohortId) {
          cohortQuery = cohortQuery.where(eq(cohorts.id, cohortId));
        }
        
        const cohortsData = await cohortQuery;
        const analyticsResults: CohortAnalytics[] = [];
        
        for (const cohort of cohortsData) {
          // Get user counts for this cohort
          const [userCounts] = await db
            .select({
              total: count(users.userId),
              active: sql<number>`COUNT(CASE WHEN ${users.lastActiveAt} IS NOT NULL THEN 1 END)`
            })
            .from(users)
            .where(eq(users.cohortId, cohort.id));
          
          // Get assessment counts and completion data
          const [assessmentCounts] = await db
            .select({
              total: count(assessments.id),
              completed: sql<number>`COUNT(CASE WHEN ${assessments.completedAt} IS NOT NULL THEN 1 END)`
            })
            .from(assessments)
            .innerJoin(users, eq(assessments.userId, users.userId))
            .where(eq(users.cohortId, cohort.id));
          
          // Get average pillar scores
          const [pillarAvgs] = await db
            .select({
              avgC: avg(sql<number>`CAST((${assessments.pillarScores}->>'C') AS NUMERIC)`),
              avgO: avg(sql<number>`CAST((${assessments.pillarScores}->>'O') AS NUMERIC)`),
              avgR: avg(sql<number>`CAST((${assessments.pillarScores}->>'R') AS NUMERIC)`),
              avgT: avg(sql<number>`CAST((${assessments.pillarScores}->>'T') AS NUMERIC)`),
              avgE: avg(sql<number>`CAST((${assessments.pillarScores}->>'E') AS NUMERIC)`),
              avgX: avg(sql<number>`CAST((${assessments.pillarScores}->>'X') AS NUMERIC)`)
            })
            .from(assessments)
            .innerJoin(users, eq(assessments.userId, users.userId))
            .where(and(
              eq(users.cohortId, cohort.id),
              isNotNull(assessments.pillarScores)
            ));
          
          // Get last activity timestamp
          const [lastActivity] = await db
            .select({
              lastActivity: sql<string>`MAX(GREATEST(${users.lastActiveAt}, ${assessments.createdAt}))`
            })
            .from(users)
            .leftJoin(assessments, eq(assessments.userId, users.userId))
            .where(eq(users.cohortId, cohort.id));
          
          const totalMembers = userCounts?.total || 0;
          const completedAssessments = assessmentCounts?.completed || 0;
          const totalAssessments = assessmentCounts?.total || 0;
          
          const analytics: CohortAnalytics = {
            cohortId: cohort.id,
            cohortName: cohort.name,
            cohortCode: cohort.code,
            cohortStatus: cohort.status,
            totalMembers,
            allowedSlots: cohort.allowedSlots,
            activeMembers: userCounts?.active || 0,
            totalAssessments,
            completedAssessments,
            completionRate: totalAssessments > 0 ? (completedAssessments / totalAssessments) * 100 : 0,
            averageCompletionTime: null, // Would require more complex calculation
            averagePillarScores: {
              C: pillarAvgs?.avgC ? Number(pillarAvgs.avgC) : null,
              O: pillarAvgs?.avgO ? Number(pillarAvgs.avgO) : null,
              R: pillarAvgs?.avgR ? Number(pillarAvgs.avgR) : null,
              T: pillarAvgs?.avgT ? Number(pillarAvgs.avgT) : null,
              E: pillarAvgs?.avgE ? Number(pillarAvgs.avgE) : null,
              X: pillarAvgs?.avgX ? Number(pillarAvgs.avgX) : null,
            },
            lastActivity: lastActivity?.lastActivity || null,
            createdAt: cohort.createdAt || new Date().toISOString()
          };
          
          analyticsResults.push(analytics);
        }
        
        logger.info('Cohort analytics retrieved successfully', {
          additionalContext: { 
            cohortCount: analyticsResults.length,
            specificCohortId: cohortId
          }
        });
        
        return analyticsResults;
      },
      { functionArgs: { cohortId } }
    );
  }

  async getCohortAnalyticsById(cohortId: string): Promise<CohortAnalytics | null> {
    return withDatabaseErrorHandling(
      'getCohortAnalyticsById',
      async () => {
        const analytics = await this.getCohortAnalytics(cohortId);
        return analytics.length > 0 ? analytics[0] : null;
      },
      { functionArgs: { cohortId } }
    );
  }

  // Bootstrap invite operations
  async getBootstrapInvite(code: string): Promise<BootstrapInvite | null> {
    return withDatabaseErrorHandling(
      'getBootstrapInvite',
      async () => {
        const db = await getDb();
        const [invite] = await db
          .select()
          .from(bootstrapInvites)
          .where(eq(bootstrapInvites.code, code));
        
        if (invite) {
          logger.debug('Bootstrap invite retrieved successfully', {
            additionalContext: { code, status: invite.status }
          });
          return invite;
        } else {
          logger.debug('Bootstrap invite not found', {
            additionalContext: { code }
          });
          return null;
        }
      },
      { functionArgs: { code } }
    );
  }

  async createBootstrapInvite(insertInvite: InsertBootstrapInvite): Promise<BootstrapInvite> {
    return withDatabaseErrorHandling(
      'createBootstrapInvite',
      async () => {
        const db = await getDb();
        const [invite] = await db
          .insert(bootstrapInvites)
          .values(insertInvite)
          .returning();
        
        logger.info('Bootstrap invite created successfully', {
          additionalContext: { 
            inviteId: invite.id,
            code: invite.code,
            role: invite.role,
            allowedUses: invite.allowedUses
          }
        });
        
        return invite;
      },
      { functionArgs: { insertInvite } }
    );
  }

  async updateBootstrapInvite(id: string, updates: Partial<InsertBootstrapInvite>): Promise<BootstrapInvite | null> {
    return withDatabaseErrorHandling(
      'updateBootstrapInvite',
      async () => {
        const db = await getDb();
        const [updated] = await db
          .update(bootstrapInvites)
          .set(updates)
          .where(eq(bootstrapInvites.id, id))
          .returning();
        
        if (updated) {
          logger.info('Bootstrap invite updated successfully', {
            additionalContext: { 
              inviteId: id,
              updateKeys: Object.keys(updates)
            }
          });
          return updated;
        } else {
          logger.warn('Cannot update bootstrap invite - not found', {
            additionalContext: { inviteId: id }
          });
          return null;
        }
      },
      { functionArgs: { id, updates } }
    );
  }

  async useBootstrapInvite(code: string, userId: string): Promise<BootstrapInvite | null> {
    return withDatabaseErrorHandling(
      'useBootstrapInvite',
      async () => {
        const db = await getDb();
        
        // Use transaction to ensure atomic operation
        const result = await db.transaction(async (tx) => {
          // Get the invite with FOR UPDATE lock
          const [invite] = await tx
            .select()
            .from(bootstrapInvites)
            .where(eq(bootstrapInvites.code, code))
            .for('update');
          
          if (!invite) {
            throw new Error('Bootstrap invite not found');
          }
          
          // Check if invite is still valid
          if (invite.status !== 'active') {
            throw new Error('Bootstrap invite is not active');
          }
          
          if (invite.remainingUses <= 0) {
            throw new Error('Bootstrap invite has no remaining uses');
          }
          
          if (new Date() > new Date(invite.expiresAt)) {
            throw new Error('Bootstrap invite has expired');
          }
          
          // Get current usedBy array and add this user
          const usedByArray = (invite.usedBy as string[]) || [];
          usedByArray.push(userId);
          
          // Update the invite
          const [updatedInvite] = await tx
            .update(bootstrapInvites)
            .set({
              remainingUses: invite.remainingUses - 1,
              lastUsedAt: new Date().toISOString(),
              usedBy: usedByArray,
              status: invite.remainingUses - 1 <= 0 ? 'expired' : 'active'
            })
            .where(eq(bootstrapInvites.id, invite.id))
            .returning();
          
          return updatedInvite;
        });
        
        logger.info('Bootstrap invite used successfully', {
          additionalContext: { 
            code,
            userId,
            remainingUses: result.remainingUses
          }
        });
        
        return result;
      },
      { functionArgs: { code, userId } }
    );
  }

  async getAllBootstrapInvites(): Promise<BootstrapInvite[]> {
    return withDatabaseErrorHandling(
      'getAllBootstrapInvites',
      async () => {
        const db = await getDb();
        const invites = await db
          .select()
          .from(bootstrapInvites)
          .orderBy(desc(bootstrapInvites.createdAt));
        
        logger.debug('All bootstrap invites retrieved successfully', {
          additionalContext: { 
            inviteCount: invites.length 
          }
        });
        
        return invites;
      },
      { functionArgs: {} }
    );
  }

  async revokeBootstrapInvite(id: string): Promise<BootstrapInvite | null> {
    return withDatabaseErrorHandling(
      'revokeBootstrapInvite',
      async () => {
        const db = await getDb();
        const [revoked] = await db
          .update(bootstrapInvites)
          .set({ status: 'revoked' })
          .where(eq(bootstrapInvites.id, id))
          .returning();
        
        if (revoked) {
          logger.info('Bootstrap invite revoked successfully', {
            additionalContext: { inviteId: id }
          });
          return revoked;
        } else {
          logger.warn('Cannot revoke bootstrap invite - not found', {
            additionalContext: { inviteId: id }
          });
          return null;
        }
      },
      { functionArgs: { id } }
    );
  }
}

export class MemStorage implements IStorage {
  private assessments: Map<string, Assessment>;
  private users: Map<string, User>;
  private cohorts: Map<string, Cohort>;
  private bootstrapInvites: Map<string, BootstrapInvite>;

  constructor() {
    this.assessments = new Map();
    this.users = new Map();
    this.cohorts = new Map();
    this.bootstrapInvites = new Map();
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

  async getSuperAdminCount(): Promise<number> {
    return withErrorHandling(
      'getSuperAdminCount',
      async () => {
        const adminCount = Array.from(this.users.values())
          .filter(user => user.role === 'super_admin').length;
        
        logger.debug('Super admin count retrieved', {
          additionalContext: { count: adminCount }
        });
        
        return adminCount;
      },
      { functionArgs: {} }
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
        
        // Generate unique 6-digit code (same logic as in routes)
        let code: string;
        let attempts = 0;
        const maxAttempts = 10;
        
        do {
          const { randomBytes } = await import('crypto');
          const randomBytesBuffer = randomBytes(3);
          code = (parseInt(randomBytesBuffer.toString('hex'), 16) % 1000000).toString().padStart(6, '0');
          attempts++;
          
          // Check if code already exists in memory storage
          const existingCohort = Array.from(this.cohorts.values()).find(c => c.code === code);
          if (!existingCohort) break;
          
          if (attempts >= maxAttempts) {
            throw new Error('Failed to generate unique cohort code');
          }
        } while (true);
        
        const cohort: Cohort = { 
          ...insertCohort,
          id,
          code,
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

  async getAllCohorts(): Promise<Cohort[]> {
    return withErrorHandling(
      'getAllCohorts',
      async () => {
        const allCohorts = Array.from(this.cohorts.values())
          .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
        
        logger.debug('All cohorts retrieved successfully', {
          additionalContext: { 
            cohortCount: allCohorts.length 
          }
        });
        
        return allCohorts;
      },
      { functionArgs: {} }
    );
  }

  async joinCohortAtomic(userId: string, cohortId: string): Promise<{ user: User; cohort: Cohort } | null> {
    return withErrorHandling(
      'joinCohortAtomic',
      async () => {
        const user = this.users.get(userId);
        const cohort = this.cohorts.get(cohortId);
        
        if (!user) {
          throw new Error('User not found');
        }
        
        if (!cohort) {
          throw new Error('Cohort not found');
        }
        
        // Check if cohort has available slots
        if (cohort.usedSlots >= cohort.allowedSlots) {
          throw new Error('Cohort is full');
        }
        
        // Check if user is already in this cohort (prevent duplicate joins)
        if (user.cohortId === cohortId) {
          throw new Error('User is already a member of this cohort');
        }
        
        // Check if user is in any other cohort (enforce single cohort membership)
        if (user.cohortId !== null) {
          throw new Error('User is already a member of another cohort');
        }
        
        // All checks passed - perform the updates
        const updatedUser: User = { ...user, cohortId };
        const updatedCohort: Cohort = { ...cohort, usedSlots: cohort.usedSlots + 1 };
        
        // Update both in memory
        this.users.set(userId, updatedUser);
        this.cohorts.set(cohortId, updatedCohort);
        
        logger.info('User joined cohort atomically', {
          additionalContext: { 
            userId, 
            cohortId,
            newUsedSlots: updatedCohort.usedSlots
          }
        });
        
        return { user: updatedUser, cohort: updatedCohort };
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

  async deleteCohort(id: string): Promise<boolean> {
    return withErrorHandling(
      'deleteCohort',
      async () => {
        const existing = this.cohorts.get(id);
        if (!existing) {
          logger.warn('Cannot delete cohort - not found', {
            additionalContext: { cohortId: id }
          });
          return false;
        }
        
        // Remove cohort from memory
        this.cohorts.delete(id);
        
        // Remove users from this cohort
        for (const [userId, user] of this.users) {
          if (user.cohortId === id) {
            const updatedUser = { ...user, cohortId: null };
            this.users.set(userId, updatedUser);
          }
        }
        
        logger.info('Cohort deleted successfully', {
          additionalContext: { cohortId: id, cohortName: existing.name }
        });
        
        return true;
      },
      { functionArgs: { id } }
    );
  }

  async getCohortAnalytics(cohortId?: string | null): Promise<CohortAnalytics[]> {
    return withErrorHandling(
      'getCohortAnalytics',
      async () => {
        const analyticsResults: CohortAnalytics[] = [];
        
        // Get cohorts to analyze
        const cohortsToAnalyze = cohortId 
          ? [this.cohorts.get(cohortId)].filter(Boolean) as Cohort[]
          : Array.from(this.cohorts.values());
        
        for (const cohort of cohortsToAnalyze) {
          // Get users in this cohort
          const cohortUsers = Array.from(this.users.values())
            .filter(user => user.cohortId === cohort.id);
          
          // Get assessments for cohort users
          const cohortAssessments = Array.from(this.assessments.values())
            .filter(assessment => cohortUsers.some(user => user.userId === assessment.userId));
          
          // Calculate metrics
          const totalMembers = cohortUsers.length;
          const activeMembers = cohortUsers.filter(user => user.lastActiveAt).length;
          const totalAssessments = cohortAssessments.length;
          const completedAssessments = cohortAssessments.filter(a => a.completedAt).length;
          
          // Calculate average pillar scores
          const completedWithScores = cohortAssessments.filter(a => a.pillarScores);
          const averagePillarScores = {
            C: null as number | null,
            O: null as number | null,
            R: null as number | null,
            T: null as number | null,
            E: null as number | null,
            X: null as number | null,
          };
          
          if (completedWithScores.length > 0) {
            const sumScores = { C: 0, O: 0, R: 0, T: 0, E: 0, X: 0 };
            for (const assessment of completedWithScores) {
              const scores = assessment.pillarScores as any;
              if (scores) {
                sumScores.C += scores.C || 0;
                sumScores.O += scores.O || 0;
                sumScores.R += scores.R || 0;
                sumScores.T += scores.T || 0;
                sumScores.E += scores.E || 0;
                sumScores.X += scores.X || 0;
              }
            }
            
            averagePillarScores.C = sumScores.C / completedWithScores.length;
            averagePillarScores.O = sumScores.O / completedWithScores.length;
            averagePillarScores.R = sumScores.R / completedWithScores.length;
            averagePillarScores.T = sumScores.T / completedWithScores.length;
            averagePillarScores.E = sumScores.E / completedWithScores.length;
            averagePillarScores.X = sumScores.X / completedWithScores.length;
          }
          
          // Find last activity
          let lastActivity: string | null = null;
          const allDates = [
            ...cohortUsers.map(u => u.lastActiveAt).filter(Boolean),
            ...cohortAssessments.map(a => a.createdAt).filter(Boolean)
          ];
          if (allDates.length > 0) {
            lastActivity = allDates.sort().pop()!;
          }
          
          const analytics: CohortAnalytics = {
            cohortId: cohort.id,
            cohortName: cohort.name,
            cohortCode: cohort.code,
            cohortStatus: cohort.status,
            totalMembers,
            allowedSlots: cohort.allowedSlots,
            activeMembers,
            totalAssessments,
            completedAssessments,
            completionRate: totalAssessments > 0 ? (completedAssessments / totalAssessments) * 100 : 0,
            averageCompletionTime: null, // Would require more complex calculation
            averagePillarScores,
            lastActivity,
            createdAt: cohort.createdAt || new Date().toISOString()
          };
          
          analyticsResults.push(analytics);
        }
        
        logger.info('Cohort analytics retrieved successfully', {
          additionalContext: { 
            cohortCount: analyticsResults.length,
            specificCohortId: cohortId
          }
        });
        
        return analyticsResults;
      },
      { functionArgs: { cohortId } }
    );
  }

  async getCohortAnalyticsById(cohortId: string): Promise<CohortAnalytics | null> {
    return withErrorHandling(
      'getCohortAnalyticsById',
      async () => {
        const analytics = await this.getCohortAnalytics(cohortId);
        return analytics.length > 0 ? analytics[0] : null;
      },
      { functionArgs: { cohortId } }
    );
  }

  // Bootstrap invite operations
  async getBootstrapInvite(code: string): Promise<BootstrapInvite | null> {
    return withErrorHandling(
      'getBootstrapInvite',
      async () => {
        const invite = Array.from(this.bootstrapInvites.values())
          .find(inv => inv.code === code);
        
        if (invite) {
          logger.debug('Bootstrap invite retrieved successfully', {
            additionalContext: { code, status: invite.status }
          });
          return invite;
        } else {
          logger.debug('Bootstrap invite not found', {
            additionalContext: { code }
          });
          return null;
        }
      },
      { functionArgs: { code } }
    );
  }

  async createBootstrapInvite(insertInvite: InsertBootstrapInvite): Promise<BootstrapInvite> {
    return withErrorHandling(
      'createBootstrapInvite',
      async () => {
        const id = randomUUID();
        const invite: BootstrapInvite = {
          ...insertInvite,
          id,
          createdAt: new Date().toISOString(),
          lastUsedAt: null,
          usedBy: []
        };
        
        this.bootstrapInvites.set(id, invite);
        
        logger.info('Bootstrap invite created successfully', {
          additionalContext: { 
            inviteId: invite.id,
            code: invite.code,
            role: invite.role,
            allowedUses: invite.allowedUses
          }
        });
        
        return invite;
      },
      { functionArgs: { insertInvite } }
    );
  }

  async updateBootstrapInvite(id: string, updates: Partial<InsertBootstrapInvite>): Promise<BootstrapInvite | null> {
    return withErrorHandling(
      'updateBootstrapInvite',
      async () => {
        const existing = this.bootstrapInvites.get(id);
        if (!existing) {
          logger.warn('Cannot update bootstrap invite - not found', {
            additionalContext: { inviteId: id }
          });
          return null;
        }
        
        const updated = { ...existing, ...updates };
        this.bootstrapInvites.set(id, updated);
        
        logger.info('Bootstrap invite updated successfully', {
          additionalContext: { 
            inviteId: id,
            updateKeys: Object.keys(updates)
          }
        });
        
        return updated;
      },
      { functionArgs: { id, updates } }
    );
  }

  async useBootstrapInvite(code: string, userId: string): Promise<BootstrapInvite | null> {
    return withErrorHandling(
      'useBootstrapInvite',
      async () => {
        const invite = Array.from(this.bootstrapInvites.values())
          .find(inv => inv.code === code);
        
        if (!invite) {
          throw new Error('Bootstrap invite not found');
        }
        
        // Check if invite is still valid
        if (invite.status !== 'active') {
          throw new Error('Bootstrap invite is not active');
        }
        
        if (invite.remainingUses <= 0) {
          throw new Error('Bootstrap invite has no remaining uses');
        }
        
        if (new Date() > new Date(invite.expiresAt)) {
          throw new Error('Bootstrap invite has expired');
        }
        
        // Update the invite
        const usedByArray = [...(invite.usedBy as string[])];
        usedByArray.push(userId);
        
        const updatedInvite: BootstrapInvite = {
          ...invite,
          remainingUses: invite.remainingUses - 1,
          lastUsedAt: new Date().toISOString(),
          usedBy: usedByArray,
          status: invite.remainingUses - 1 <= 0 ? 'expired' : 'active'
        };
        
        this.bootstrapInvites.set(invite.id, updatedInvite);
        
        logger.info('Bootstrap invite used successfully', {
          additionalContext: { 
            code,
            userId,
            remainingUses: updatedInvite.remainingUses
          }
        });
        
        return updatedInvite;
      },
      { functionArgs: { code, userId } }
    );
  }

  async getAllBootstrapInvites(): Promise<BootstrapInvite[]> {
    return withErrorHandling(
      'getAllBootstrapInvites',
      async () => {
        const invites = Array.from(this.bootstrapInvites.values())
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        logger.debug('All bootstrap invites retrieved successfully', {
          additionalContext: { 
            inviteCount: invites.length 
          }
        });
        
        return invites;
      },
      { functionArgs: {} }
    );
  }

  async revokeBootstrapInvite(id: string): Promise<BootstrapInvite | null> {
    return withErrorHandling(
      'revokeBootstrapInvite',
      async () => {
        const existing = this.bootstrapInvites.get(id);
        if (!existing) {
          logger.warn('Cannot revoke bootstrap invite - not found', {
            additionalContext: { inviteId: id }
          });
          return null;
        }
        
        const revoked = { ...existing, status: 'revoked' as const };
        this.bootstrapInvites.set(id, revoked);
        
        logger.info('Bootstrap invite revoked successfully', {
          additionalContext: { inviteId: id }
        });
        
        return revoked;
      },
      { functionArgs: { id } }
    );
  }
}

export const storage = new DatabaseStorage();
