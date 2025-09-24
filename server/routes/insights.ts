import { Router } from "express";
import { db } from "../db";
import { assessments } from "../../shared/schema";
import { contextMirrorSchema, contextMirrorRequestSchema, type ContextMirror, type ContextMirrorWithDiagnostics } from "../../shared/schema";
import { generateContextMirror, generateRuleBasedFallback } from "../lib/gemini";
import { eq, and } from "drizzle-orm";
import { requireAuthMiddleware, contextMirrorRateLimitMiddleware } from "../middleware/security";
import { generateIncidentId, createUserError, sanitizeErrorForUser } from "../utils/incident";
import { USER_ERROR_MESSAGES, HTTP_STATUS } from "../constants";
import { logger } from "../logger";

const router = Router();

// In-memory cache for context mirrors (24 hour TTL) - supports both legacy and diagnostic formats
const mirrorCache = new Map<string, { data: ContextMirror | ContextMirrorWithDiagnostics; expires: number }>();

router.post("/context-mirror", 
  requireAuthMiddleware,
  contextMirrorRateLimitMiddleware,
  async (req, res) => {
    const incidentId = generateIncidentId();
    const userId = req.userId!; // Guaranteed to exist due to requireAuthMiddleware
    
    try {
      // 1. Validate request body using Zod schema
      const validationResult = contextMirrorRequestSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        logger.warn('Invalid Context Mirror request body', {
          additionalContext: {
            operation: 'context_mirror_validation_error',
            errors: validationResult.error.errors,
            incidentId
          }
        });
        
        return res.status(HTTP_STATUS.BAD_REQUEST)
          .json(createUserError(USER_ERROR_MESSAGES.VALIDATION_ERROR, incidentId, HTTP_STATUS.BAD_REQUEST));
      }
      
      const { assessmentId } = validationResult.data;
      
      logger.info('Processing Context Mirror request', {
        additionalContext: {
          operation: 'context_mirror_request',
          assessmentId,
          incidentId
        }
      });

      const cacheKey = `mirror:${userId}:${assessmentId}`;
      const TTL_HOURS = 24;
      const TTL_MS = TTL_HOURS * 60 * 60 * 1000;

      // 2. Check in-memory cache first (fastest path) - user-specific cache
      const cached = mirrorCache.get(cacheKey);
      if (cached && Date.now() < cached.expires) {
        logger.debug('Context Mirror served from cache', {
          additionalContext: { assessmentId, cacheHit: true }
        });
        return res.json(cached.data);
      }

      // 3. Fetch assessment from database with ownership verification
      const assessment = await db
        .select()
        .from(assessments)
        .where(and(
          eq(assessments.id, assessmentId),
          eq(assessments.userId, userId) // Ownership verification
        ))
        .limit(1);

      if (!assessment.length) {
        logger.warn('Assessment not found or access denied', {
          additionalContext: {
            operation: 'context_mirror_assessment_not_found',
            assessmentId,
            requestingUserId: userId,
            incidentId
          }
        });
        
        return res.status(HTTP_STATUS.NOT_FOUND)
          .json(createUserError(USER_ERROR_MESSAGES.NOT_FOUND, incidentId, HTTP_STATUS.NOT_FOUND));
      }

      const { contextProfile, contextMirror, contextMirrorUpdatedAt } = assessment[0];
      
      if (!contextProfile) {
        logger.warn('Context profile not found in assessment', {
          additionalContext: {
            operation: 'context_mirror_profile_missing',
            assessmentId,
            incidentId
          }
        });
        
        return res.status(HTTP_STATUS.BAD_REQUEST)
          .json(createUserError('Assessment is not ready for Context Mirror analysis. Please complete the context profile first.', incidentId, HTTP_STATUS.BAD_REQUEST));
      }

      // 4. Check if DB has fresh contextMirror (< 24 hours old)
      if (contextMirror && contextMirrorUpdatedAt) {
        const updatedAtTime = new Date(contextMirrorUpdatedAt).getTime();
        const isFresh = Date.now() - updatedAtTime < TTL_MS;
        
        if (isFresh) {
          // Validate existing DB mirror
          try {
            const validatedMirror = contextMirrorSchema.parse(contextMirror);
            
            // Update in-memory cache for future requests
            mirrorCache.set(cacheKey, {
              data: validatedMirror,
              expires: updatedAtTime + TTL_MS
            });
            
            logger.debug('Context Mirror served from database cache', {
              additionalContext: { assessmentId, cacheHit: true, source: 'database' }
            });
            
            return res.json(validatedMirror);
          } catch (validationError) {
            logger.warn("Stored contextMirror is invalid, regenerating:", {
              additionalContext: {
                operation: 'context_mirror_invalid_stored',
                assessmentId,
                validationError: validationError instanceof Error ? validationError.message : String(validationError),
                incidentId
              }
            });
          }
        }
      }

      // 5. Generate new contextMirror (DB cache miss or stale)
      logger.info('Generating new Context Mirror', {
        additionalContext: {
          operation: 'context_mirror_generation_start',
          assessmentId,
          incidentId
        }
      });

      let mirrorWithDiagnostics: ContextMirrorWithDiagnostics;

      try {
        // Try LLM generation first - this now returns ContextMirrorWithDiagnostics
        mirrorWithDiagnostics = await generateContextMirror(contextProfile as any);
        
        logger.info('LLM Context Mirror generation successful with diagnostics', {
          additionalContext: {
            operation: 'context_mirror_llm_success',
            assessmentId,
            source: mirrorWithDiagnostics.debug.source,
            finalSource: mirrorWithDiagnostics.debug.finalSource,
            attempts: mirrorWithDiagnostics.debug.attempts.length,
            totalDuration: mirrorWithDiagnostics.debug.totalDuration,
            incidentId
          }
        });
        
      } catch (error) {
        logger.warn("LLM generation failed, using rule-based fallback:", {
          additionalContext: {
            operation: 'context_mirror_llm_fallback',
            assessmentId,
            error: error instanceof Error ? error.message : String(error),
            incidentId
          }
        });
        // Fall back to rule-based generation - convert to diagnostic format
        const fallbackMirror = generateRuleBasedFallback(contextProfile as any);
        mirrorWithDiagnostics = {
          headline: fallbackMirror.headline,
          insight: fallbackMirror.insight,
          actions: fallbackMirror.actions,
          watchouts: fallbackMirror.watchouts,
          scenarios: fallbackMirror.scenarios,
          disclaimer: fallbackMirror.disclaimer,
          debug: {
            source: 'fallback' as const,
            attempts: [],
            finalSource: 'template' as const,
            templateUsed: 'emergency-fallback',
            totalDuration: 0,
            generatedAt: new Date().toISOString()
          }
        };
      }

      // 6. Store legacy format in database (for backward compatibility) and full format in memory cache
      const now = new Date().toISOString();
      
      // Extract legacy format for database storage (without debug info)
      const legacyMirror: ContextMirror = {
        headline: mirrorWithDiagnostics.headline,
        insight: mirrorWithDiagnostics.insight,
        actions: mirrorWithDiagnostics.actions,
        watchouts: mirrorWithDiagnostics.watchouts,
        scenarios: mirrorWithDiagnostics.scenarios,
        disclaimer: mirrorWithDiagnostics.disclaimer
      };
      
      try {
        await db
          .update(assessments)
          .set({ 
            contextMirror: legacyMirror as any,
            contextMirrorUpdatedAt: now
          })
          .where(and(
            eq(assessments.id, assessmentId),
            eq(assessments.userId, userId) // Ownership verification on update
          ));
          
        logger.info('Context Mirror saved to database', {
          additionalContext: {
            operation: 'context_mirror_saved',
            assessmentId,
            source: mirrorWithDiagnostics.debug.source,
            incidentId
          }
        });
      } catch (dbError) {
        logger.error("Failed to save context mirror to database", dbError instanceof Error ? dbError : new Error(String(dbError)), {
          additionalContext: {
            operation: 'context_mirror_save_error',
            assessmentId,
            incidentId
          }
        });
      }

      // Update in-memory cache with full diagnostic format (24 hours TTL)
      mirrorCache.set(cacheKey, {
        data: mirrorWithDiagnostics,
        expires: Date.now() + TTL_MS
      });

      logger.info('Context Mirror generation completed successfully', {
        additionalContext: {
          operation: 'context_mirror_generation_complete',
          assessmentId,
          source: mirrorWithDiagnostics.debug.source,
          finalSource: mirrorWithDiagnostics.debug.finalSource,
          incidentId
        }
      });

      res.json(mirrorWithDiagnostics);
      
    } catch (error) {
      logger.error(
        'Context Mirror generation failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          additionalContext: {
            operation: 'context_mirror_generation_error',
            assessmentId: req.body?.assessmentId,
            incidentId
          }
        }
      );
      
      // Return rule-based fallback as last resort
      try {
        const validationResult = contextMirrorRequestSchema.safeParse(req.body);
        if (validationResult.success) {
          const { assessmentId } = validationResult.data;
          const assessment = await db
            .select()
            .from(assessments)
            .where(and(
              eq(assessments.id, assessmentId),
              eq(assessments.userId, userId) // Ownership verification
            ))
            .limit(1);
            
          if (assessment.length && assessment[0].contextProfile) {
            const fallbackMirror = generateRuleBasedFallback(assessment[0].contextProfile as any);
            // Convert to diagnostic format for consistency
            const fallbackWithDiagnostics: ContextMirrorWithDiagnostics = {
              headline: fallbackMirror.headline,
              insight: fallbackMirror.insight,
              actions: fallbackMirror.actions,
              watchouts: fallbackMirror.watchouts,
              scenarios: fallbackMirror.scenarios,
              disclaimer: fallbackMirror.disclaimer,
              debug: {
                source: 'fallback' as const,
                attempts: [],
                finalSource: 'template' as const,
                templateUsed: 'error-recovery-fallback',
                totalDuration: 0,
                generatedAt: new Date().toISOString()
              }
            };
            logger.info('Context Mirror fallback generation successful', {
              additionalContext: {
                operation: 'context_mirror_fallback_success',
                assessmentId,
                source: 'fallback',
                incidentId
              }
            });
            return res.json(fallbackWithDiagnostics);
          }
        }
        
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
          .json(createUserError(USER_ERROR_MESSAGES.SERVER_ERROR, incidentId, HTTP_STATUS.INTERNAL_SERVER_ERROR));
      } catch (fallbackError) {
        logger.error(
          'Context Mirror fallback generation also failed',
          fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError)),
          {
            additionalContext: {
              operation: 'context_mirror_fallback_error',
              incidentId
            }
          }
        );
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
          .json(createUserError(USER_ERROR_MESSAGES.SERVER_ERROR, incidentId, HTTP_STATUS.INTERNAL_SERVER_ERROR));
      }
    }
  });


export default router;