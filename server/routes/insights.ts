import { Router } from "express";
import { db } from "../db";
import { assessments } from "../../shared/schema";
import { contextMirrorSchema, type ContextMirror } from "../../shared/schema";
import { generateContextMirror, generateRuleBasedFallback } from "../lib/gemini";
import { eq } from "drizzle-orm";

const router = Router();

// In-memory cache for context mirrors (24 hour TTL)
const mirrorCache = new Map<string, { data: ContextMirror; expires: number }>();

router.post("/context-mirror", async (req, res) => {
  try {
    const { assessmentId } = req.body;
    
    if (!assessmentId) {
      return res.status(400).json({ error: "Assessment ID is required" });
    }

    // Check cache first
    const cacheKey = `mirror:${assessmentId}`;
    const cached = mirrorCache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      return res.json(cached.data);
    }

    // Fetch assessment and context profile
    const assessment = await db
      .select()
      .from(assessments)
      .where(eq(assessments.id, assessmentId))
      .limit(1);

    if (!assessment.length) {
      return res.status(404).json({ error: "Assessment not found" });
    }

    const contextProfile = assessment[0].contextProfile;
    if (!contextProfile) {
      return res.status(400).json({ error: "Context profile not found" });
    }

    let mirror: ContextMirror;

    try {
      // Try LLM generation first
      mirror = await generateContextMirror(contextProfile as any);
      
      // Validate the response
      const validatedMirror = contextMirrorSchema.parse(mirror);
      mirror = validatedMirror;
      
    } catch (error) {
      console.warn("LLM generation failed, using rule-based fallback:", error);
      // Fall back to rule-based generation
      mirror = generateRuleBasedFallback(contextProfile as any);
    }

    // Cache the result (24 hours)
    mirrorCache.set(cacheKey, {
      data: mirror,
      expires: Date.now() + (24 * 60 * 60 * 1000)
    });

    // Optionally save to database
    try {
      await db
        .update(assessments)
        .set({ contextMirror: mirror as any })
        .where(eq(assessments.id, assessmentId));
    } catch (dbError) {
      console.warn("Failed to save context mirror to database:", dbError);
    }

    res.json(mirror);
    
  } catch (error) {
    console.error("Context mirror generation failed:", error);
    
    // Return rule-based fallback as last resort
    try {
      const { assessmentId } = req.body;
      const assessment = await db
        .select()
        .from(assessments)
        .where(eq(assessments.id, assessmentId))
        .limit(1);
        
      if (assessment.length && assessment[0].contextProfile) {
        const fallbackMirror = generateRuleBasedFallback(assessment[0].contextProfile as any);
        res.json(fallbackMirror);
      } else {
        res.status(500).json({ error: "Failed to generate context mirror" });
      }
    } catch {
      res.status(500).json({ error: "Failed to generate context mirror" });
    }
  }
});

export default router;