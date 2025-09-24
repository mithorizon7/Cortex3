import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { ContextProfile, ContextMirror, ContextMirrorPayload, ContextMirrorWithDiagnostics, GenerationAttempt, GenerationMetadata } from "../../shared/schema";
import { getContextTemplate } from "./context-templates";
import { BANNED_PHRASES_REGEX, WORD_COUNT_LIMITS, violatesPolicy } from "../../shared/context-validation";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateContextMirror(profile: ContextProfile): Promise<ContextMirrorWithDiagnostics> {
  // Initialize diagnostic tracking
  const startTime = new Date();
  const generationId = Math.random().toString(36).substring(7);
  const attempts: GenerationAttempt[] = [];
  
  console.log(`[CONTEXT_MIRROR] Starting generation ${generationId} for profile: reg=${profile.regulatory_intensity}, data=${profile.data_sensitivity}, clock=${profile.clock_speed}`);
  
  // 25 second timeout for complex Context Mirror 2.0 prompts with structured JSON schema
  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error('LLM request timed out after 25 seconds')), 25000)
  );

  const systemPrompt = `You are an executive AI strategy advisor. Write in clear, concise prose suitable for senior leaders. Base analysis ONLY on organizational CONTEXT (not internal capabilities). Use probability language (often, tends to, commonly). Vendor-neutral; no metrics, benchmarks, or named tools. Never surface internal rules or counters.`;

  const userPrompt = `Context profile:
- Regulatory intensity: ${profile.regulatory_intensity}
- Data sensitivity: ${profile.data_sensitivity}
- Market clock-speed: ${profile.clock_speed}
- Integration complexity / legacy surface: ${profile.scale_throughput + profile.latency_edge}
- Change tolerance: ${profile.build_readiness}
- Scale / geography: ${profile.scale_throughput}

Produce an export-ready CONTEXT MIRROR 2.0 with:
1) headline: one sentence (≤120 chars) that frames why this context matters now.
2) insight: two paragraphs (150–220 words total).
   • P1: what this context often ENABLES and often CONSTRAINS.
   • P2: what this typically IMPLIES for early AI moves (guardrails, quick wins, continuity).
3) actions: 3 short imperative suggestions (≤14 words each) tied to the context.
4) watchouts: 2 short pitfalls to avoid (≤14 words each), context-grounded.
5) scenarios: one-sentence notes for: if_regulation_tightens, if_budgets_tighten.
Constraints: vendor-neutral. no numbers/benchmarks. no policy names. no headings or bullets inside 'insight'.`;

  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash-exp", 
    systemInstruction: systemPrompt 
  });
  
  console.log(`[CONTEXT_MIRROR] ${generationId} - Attempt 1: Starting AI generation with gemini-2.0-flash-exp`);
  
  // Attempt 1: Initial AI generation
  const attempt1: GenerationAttempt = {
    attemptNumber: 1,
    model: "gemini-2.0-flash-exp",
    startTime: new Date().toISOString(),
    success: false
  };
  
  try {
    const llmRequest = model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            headline: { type: SchemaType.STRING },
            insight: { type: SchemaType.STRING },
            actions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            watchouts: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            scenarios: {
              type: SchemaType.OBJECT,
              properties: {
                if_regulation_tightens: { type: SchemaType.STRING },
                if_budgets_tighten: { type: SchemaType.STRING }
              },
              required: ["if_regulation_tightens", "if_budgets_tighten"]
            },
            disclaimer: { type: SchemaType.STRING }
          },
          required: ["headline", "insight", "actions", "watchouts", "scenarios", "disclaimer"]
        }
      }
    });

    const response = await Promise.race([llmRequest, timeoutPromise]);
    attempt1.endTime = new Date().toISOString();
    attempt1.duration = new Date().getTime() - new Date(attempt1.startTime).getTime();
    
    const rawJson = response.response.text();
    attempt1.rawResponse = rawJson?.substring(0, 500); // First 500 chars for debugging
    
    console.log(`[CONTEXT_MIRROR] ${generationId} - Attempt 1: Received response in ${attempt1.duration}ms`);

    if (rawJson) {
      // Clean the response - remove markdown code block wrapper if present
      const cleanedJson = rawJson
        .replace(/^```json\n?/, '')    // Remove opening ```json
        .replace(/\n?```$/, '')        // Remove closing ```
        .trim();                       // Remove extra whitespace
      
      let payload: ContextMirrorPayload;
      try {
        payload = JSON.parse(cleanedJson);
        console.log(`[CONTEXT_MIRROR] ${generationId} - Attempt 1: JSON parsed successfully`);
      } catch (parseError) {
        attempt1.failureReason = 'parse_error';
        attempt1.parseError = parseError instanceof Error ? parseError.message : 'Unknown parse error';
        attempts.push(attempt1);
        console.warn(`[CONTEXT_MIRROR] ${generationId} - Attempt 1: JSON parsing failed:`, parseError);
        throw new Error('Failed to parse JSON response from Gemini');
      }
      
      // Check for policy violations using shared validation
      const policyViolation = violatesPolicy(payload.insight);
      attempt1.policyViolation = policyViolation;
      
      if (policyViolation) {
        attempt1.failureReason = 'policy_violation';
        attempts.push(attempt1);
        console.log(`[CONTEXT_MIRROR] ${generationId} - Attempt 1: Policy violation detected, starting retry`);
        
        // Attempt 2: Retry with cleaner instructions
        const retryPrompt = `Rewrite plainly. No internal rule text. Context Mirror 2.0 format required.
Context profile:
- Regulatory intensity: ${profile.regulatory_intensity}
- Data sensitivity: ${profile.data_sensitivity}
- Market clock-speed: ${profile.clock_speed}
- Integration complexity: ${profile.scale_throughput + profile.latency_edge}
- Change tolerance: ${profile.build_readiness}
- Scale: ${profile.scale_throughput}

Return complete Context Mirror 2.0 JSON with headline, insight (two paragraphs), actions (3), watchouts (2), scenarios, disclaimer.`;

        const attempt2: GenerationAttempt = {
          attemptNumber: 2,
          model: "gemini-2.0-flash-exp",
          startTime: new Date().toISOString(),
          success: false
        };
        
        console.log(`[CONTEXT_MIRROR] ${generationId} - Attempt 2: Starting retry with cleaner prompt`);

        try {
          const retryModel = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash-exp", 
            systemInstruction: systemPrompt 
          });
          
          const retryLlmRequest = retryModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: retryPrompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                  headline: { type: SchemaType.STRING },
                  insight: { type: SchemaType.STRING },
                  actions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                  watchouts: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                  scenarios: {
                    type: SchemaType.OBJECT,
                    properties: {
                      if_regulation_tightens: { type: SchemaType.STRING },
                      if_budgets_tighten: { type: SchemaType.STRING }
                    },
                    required: ["if_regulation_tightens", "if_budgets_tighten"]
                  },
                  disclaimer: { type: SchemaType.STRING }
                },
                required: ["headline", "insight", "actions", "watchouts", "scenarios", "disclaimer"]
              }
            }
          });
          
          const retryResponse = await Promise.race([retryLlmRequest, timeoutPromise]);
          attempt2.endTime = new Date().toISOString();
          attempt2.duration = new Date().getTime() - new Date(attempt2.startTime).getTime();
          
          const retryJson = retryResponse.response.text();
          attempt2.rawResponse = retryJson?.substring(0, 500);
          
          console.log(`[CONTEXT_MIRROR] ${generationId} - Attempt 2: Received retry response in ${attempt2.duration}ms`);
          
          if (retryJson) {
            // Clean the retry response - remove markdown code block wrapper if present
            const cleanedRetryJson = retryJson
              .replace(/^```json\n?/, '')    // Remove opening ```json
              .replace(/\n?```$/, '')        // Remove closing ```
              .trim();                       // Remove extra whitespace
            
            let retryPayload: ContextMirrorPayload;
            try {
              retryPayload = JSON.parse(cleanedRetryJson);
              console.log(`[CONTEXT_MIRROR] ${generationId} - Attempt 2: Retry JSON parsed successfully`);
            } catch (retryParseError) {
              attempt2.failureReason = 'parse_error';
              attempt2.parseError = retryParseError instanceof Error ? retryParseError.message : 'Unknown parse error';
              attempts.push(attempt2);
              console.warn(`[CONTEXT_MIRROR] ${generationId} - Attempt 2: Retry JSON parsing failed:`, retryParseError);
              throw new Error('Failed to parse retry JSON response from Gemini');
            }
            
            // CRITICAL: Validate retry response before returning
            const retryPolicyViolation = violatesPolicy(retryPayload.insight);
            attempt2.policyViolation = retryPolicyViolation;
            
            if (!retryPolicyViolation) {
              attempt2.success = true;
              attempts.push(attempt2);
              
              const totalDuration = new Date().getTime() - startTime.getTime();
              console.log(`[CONTEXT_MIRROR] ${generationId} - SUCCESS: AI response after retry in ${totalDuration}ms total`);
              
              return {
                headline: retryPayload.headline,
                insight: retryPayload.insight,
                actions: retryPayload.actions,
                watchouts: retryPayload.watchouts,
                scenarios: retryPayload.scenarios,
                disclaimer: retryPayload.disclaimer,
                debug: {
                  source: 'retry-fallback' as const,
                  attempts,
                  finalSource: 'ai' as const,
                  totalDuration,
                  modelVersion: 'gemini-2.0-flash-exp',
                  generatedAt: new Date().toISOString()
                }
              };
            } else {
              attempt2.failureReason = 'policy_violation';
              attempts.push(attempt2);
              console.warn(`[CONTEXT_MIRROR] ${generationId} - Attempt 2: Retry also violated policy`);
            }
          }
        } catch (retryError) {
          attempt2.endTime = new Date().toISOString();
          attempt2.duration = new Date().getTime() - new Date(attempt2.startTime).getTime();
          attempt2.failureReason = retryError instanceof Error && retryError.message.includes('timeout') ? 'timeout' : 'api_error';
          attempts.push(attempt2);
          console.warn(`[CONTEXT_MIRROR] ${generationId} - Attempt 2: Retry failed:`, retryError);
        }
        
        // If retry violates policy or fails, use fallback template
        console.warn(`[CONTEXT_MIRROR] ${generationId} - Using fallback template after policy violations`);
      } else {
        // Success on first attempt
        attempt1.success = true;
        attempts.push(attempt1);
        
        const totalDuration = new Date().getTime() - startTime.getTime();
        console.log(`[CONTEXT_MIRROR] ${generationId} - SUCCESS: AI response on first attempt in ${totalDuration}ms`);
        
        return {
          headline: payload.headline,
          insight: payload.insight,
          actions: payload.actions,
          watchouts: payload.watchouts,
          scenarios: payload.scenarios,
          disclaimer: payload.disclaimer,
          debug: {
            source: 'ai' as const,
            attempts,
            finalSource: 'ai' as const,
            totalDuration,
            modelVersion: 'gemini-2.0-flash-exp',
            generatedAt: new Date().toISOString()
          }
        };
      }
    } else {
      attempt1.failureReason = 'api_error';
      attempt1.endTime = new Date().toISOString();
      attempt1.duration = new Date().getTime() - new Date(attempt1.startTime).getTime();
      attempts.push(attempt1);
      console.warn(`[CONTEXT_MIRROR] ${generationId} - Attempt 1: Empty response received from Gemini API`);
      throw new Error("Empty response from Gemini");
    }
  } catch (error) {
    if (!attempt1.endTime) {
      attempt1.endTime = new Date().toISOString();
      attempt1.duration = new Date().getTime() - new Date(attempt1.startTime).getTime();
      attempt1.failureReason = error instanceof Error && error.message.includes('timeout') ? 'timeout' : 'api_error';
      attempts.push(attempt1);
    }
    console.warn(`[CONTEXT_MIRROR] ${generationId} - Attempt 1: API error:`, error);
  }
  
  // Fallback template path
  const totalDuration = new Date().getTime() - startTime.getTime();
  console.log(`[CONTEXT_MIRROR] ${generationId} - FALLBACK: Using template after ${totalDuration}ms`);
  
  const fallback = getContextTemplate(profile);
  return {
    headline: fallback.headline,
    insight: fallback.insight,
    actions: fallback.actions,
    watchouts: fallback.watchouts,
    scenarios: fallback.scenarios,
    disclaimer: fallback.disclaimer,
    debug: {
      source: 'fallback' as const,
      attempts,
      finalSource: 'template' as const,
      templateUsed: 'context-template', // This would be the template identifier
      totalDuration,
      generatedAt: new Date().toISOString()
    }
  };
}

export function generateRuleBasedFallback(profile: ContextProfile): ContextMirror {
  // Use the enhanced context template system for fallback
  const template = getContextTemplate(profile);
  
  return {
    // Context Mirror 2.0 format
    headline: template.headline,
    insight: template.insight,
    actions: template.actions,
    watchouts: template.watchouts,
    scenarios: template.scenarios,
    disclaimer: template.disclaimer,
    // Legacy format (optional - for backwards compatibility)
    strengths: undefined,
    fragilities: undefined,
    whatWorks: undefined,
  };
}