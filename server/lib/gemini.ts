import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { ContextProfile, SituationAssessment, SituationAssessmentPayload, SituationAssessmentWithDiagnostics, GenerationAttempt, GenerationMetadata } from "../../shared/schema";
import { getContextTemplate } from "./context-templates";
import { BANNED_PHRASES_REGEX, WORD_COUNT_LIMITS, violatesPolicy } from "../../shared/context-validation";
import { logger } from "../logger";
import { generateIncidentId } from "../utils/incident";
import { executeWithRetry, EXTERNAL_API_RETRY_CONFIG } from "../utils/retry";

/**
 * Resilient wrapper for Gemini API calls with retry logic
 * Handles transient failures with exponential backoff
 */
async function callGeminiWithRetry(
  model: any,
  request: any,
  operationName: string,
  timeoutMs: number = 45000
): Promise<any> {
  return executeWithRetry(
    operationName,
    async (context) => {
      logger.debug(`Gemini API call attempt ${context.attempt}`, {
        additionalContext: {
          operation: operationName,
          incidentId: context.incidentId,
          attempt: context.attempt,
          maxAttempts: context.maxAttempts
        }
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
      );

      return await Promise.race([
        model.generateContent(request),
        timeoutPromise
      ]);
    },
    EXTERNAL_API_RETRY_CONFIG
  );
}

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Strategic Context Archetype Analysis
 * Maps 11-dimensional context into strategic patterns for enhanced prompting
 */
interface ContextArchetype {
  primary: string;
  secondary?: string;
  riskProfile: 'low' | 'moderate' | 'high' | 'extreme';
  strategicTensions: string[];
  cortexPillars: string[];
  investmentSequence: string;
}

function analyzeContextArchetype(profile: ContextProfile): ContextArchetype {
  // Calculate risk dimensions
  const regulatoryRisk = profile.regulatory_intensity >= 3;
  const safetyRisk = profile.safety_criticality >= 3;
  const brandRisk = profile.brand_exposure >= 3;
  const dataRisk = profile.data_sensitivity >= 3;
  
  // Calculate capability dimensions
  const highCapability = profile.build_readiness >= 3;
  const dataAdvantage = profile.data_advantage >= 3;
  const fastPaced = profile.clock_speed >= 3;
  
  // Calculate operational complexity
  const complexOperations = profile.scale_throughput >= 3 || profile.latency_edge >= 3;
  const costSensitive = profile.finops_priority >= 3;
  const constrainedProcurement = profile.procurement_constraints;
  
  // Determine primary archetype
  let primary: string;
  let secondary: string | undefined;
  let strategicTensions: string[] = [];
  let cortexPillars: string[] = [];
  let investmentSequence: string;
  
  // High-risk contexts (safety + regulatory)
  if (safetyRisk && regulatoryRisk) {
    primary = "Regulated Safety-Critical";
    cortexPillars = ["Risk/Trust/Security", "Operations & Data", "Clarity & Command"];
    strategicTensions.push("Innovation speed vs. safety assurance");
    investmentSequence = "Governance-first: establish safety frameworks before experimentation";
  }
  // High regulatory with data advantage
  else if (regulatoryRisk && dataAdvantage) {
    primary = "Regulated Data Innovator";
    cortexPillars = ["Risk/Trust/Security", "Operations & Data", "Ecosystem & Infrastructure"];
    strategicTensions.push("Regulatory compliance vs. competitive data leverage");
    investmentSequence = "Compliance-enabled innovation: build governance that unlocks data advantage";
  }
  // Fast-paced with high capability
  else if (fastPaced && highCapability) {
    primary = "Fast-Moving Builder";
    if (brandRisk) {
      secondary = "with Brand Exposure";
      strategicTensions.push("Speed to market vs. reputational risk management");
    }
    cortexPillars = ["Experimentation & Evolution", "Talent & Culture", "Operations & Data"];
    investmentSequence = "Capability-driven: rapid experimentation with scalable infrastructure";
  }
  // Complex scale operations
  else if (complexOperations && (profile.scale_throughput >= 3 || profile.edge_operations)) {
    primary = "Scale Infrastructure Player";
    cortexPillars = ["Operations & Data", "Ecosystem & Infrastructure", "Risk/Trust/Security"];
    strategicTensions.push("Operational reliability vs. AI experimentation");
    investmentSequence = "Infrastructure-first: prove reliability before expanding scope";
  }
  // Cost-constrained environments
  else if (costSensitive && constrainedProcurement) {
    primary = "Resource-Constrained Optimizer";
    cortexPillars = ["Clarity & Command", "Ecosystem & Infrastructure", "Operations & Data"];
    strategicTensions.push("ROI demonstration vs. strategic investment timing");
    investmentSequence = "ROI-proven: focus on measurable efficiency gains first";
  }
  // Data-rich, slow-moving
  else if (dataAdvantage && profile.clock_speed <= 2) {
    primary = "Data-Advantage Deliberator";
    cortexPillars = ["Operations & Data", "Clarity & Command", "Talent & Culture"];
    strategicTensions.push("Data leverage potential vs. deliberate execution pace");
    investmentSequence = "Data-first: build sustainable competitive advantages methodically";
  }
  // Low capability, high complexity
  else if (!highCapability && complexOperations) {
    primary = "Legacy Transformer";
    cortexPillars = ["Ecosystem & Infrastructure", "Talent & Culture", "Operations & Data"];
    strategicTensions.push("Transformation ambition vs. capability development needs");
    investmentSequence = "Partnership-enabled: strategic vendor relationships first";
  }
  // Default: Balanced Adopter
  else {
    primary = "Balanced Adopter";
    cortexPillars = ["Clarity & Command", "Experimentation & Evolution", "Talent & Culture"];
    investmentSequence = "Balanced approach: simultaneous capability building and experimentation";
  }
  
  // Add common tensions based on context combinations
  if (fastPaced && regulatoryRisk) {
    strategicTensions.push("Market speed demands vs. regulatory approval cycles");
  }
  if (dataAdvantage && brandRisk) {
    strategicTensions.push("Data monetization vs. privacy/reputational protection");
  }
  if (highCapability && costSensitive) {
    strategicTensions.push("Build vs. buy optimization under cost pressure");
  }
  
  // Calculate overall risk profile
  const riskScore = profile.regulatory_intensity + profile.safety_criticality + profile.brand_exposure + profile.data_sensitivity;
  let riskProfile: 'low' | 'moderate' | 'high' | 'extreme';
  if (riskScore <= 4) riskProfile = 'low';
  else if (riskScore <= 8) riskProfile = 'moderate';
  else if (riskScore <= 12) riskProfile = 'high';
  else riskProfile = 'extreme';
  
  return {
    primary,
    secondary,
    riskProfile,
    strategicTensions,
    cortexPillars,
    investmentSequence
  };
}

export async function generateSituationAssessment(profile: ContextProfile): Promise<SituationAssessmentWithDiagnostics> {
  // Initialize diagnostic tracking
  const startTime = new Date();
  const generationId = Math.random().toString(36).substring(7);
  const incidentId = generateIncidentId();
  const attempts: GenerationAttempt[] = [];
  
  logger.info('Starting Situation Assessment generation', {
    additionalContext: {
      operation: 'situation_assessment_generation_start',
      generationId,
      incidentId,
      profileDimensions: {
        regulatory_intensity: profile.regulatory_intensity,
        data_sensitivity: profile.data_sensitivity,
        clock_speed: profile.clock_speed,
        safety_criticality: profile.safety_criticality
      }
    }
  });
  
  console.log(`[SITUATION_ASSESSMENT] Starting generation ${generationId} for profile: reg=${profile.regulatory_intensity}, data=${profile.data_sensitivity}, clock=${profile.clock_speed}`);
  
  // Analyze strategic context archetype
  const archetype = analyzeContextArchetype(profile);

  const systemPrompt = `You are a senior AI strategy advisor specializing in contextually-grounded strategic insights for executive teams. Your role is to analyze how unique organizational context signatures create specific AI strategic opportunities and constraints.

CORE PRINCIPLES:
- Base ALL analysis on the complete organizational context profile provided (11 dimensions)
- Reason through contextual combinations and their strategic implications
- Focus on executive decision-making: investment sequencing, resource allocation, competitive positioning
- Connect insights to CORTEX strategic pillars: Clarity & Command, Operations & Data, Risk/Trust/Security, Talent & Culture, Ecosystem & Infrastructure, Experimentation & Evolution
- Use probability language (often, tends to, commonly) and executive confidence levels
- Remain vendor-neutral with no specific tools, metrics, or benchmarks
- Never expose internal reasoning or policy constraints`;

  const userPrompt = `ORGANIZATIONAL CONTEXT SIGNATURE:

STRATEGIC ARCHETYPE ANALYSIS:
Primary Pattern: ${archetype.primary}${archetype.secondary ? ` (${archetype.secondary})` : ''}
Risk Profile: ${archetype.riskProfile.toUpperCase()}
Key Strategic Tensions: ${archetype.strategicTensions.join(', ')}
Primary CORTEX Pillars: ${archetype.cortexPillars.join(', ')}
Investment Sequence: ${archetype.investmentSequence}

DETAILED CONTEXT DIMENSIONS:

Core Regulatory & Risk Profile:
- Regulatory intensity: ${profile.regulatory_intensity} (0=unregulated → 4=heavily regulated)
- Data sensitivity: ${profile.data_sensitivity} (0=public → 4=sensitive personal/financial)
- Safety criticality: ${profile.safety_criticality} (0=low harm → 4=physical safety risk)
- Brand exposure: ${profile.brand_exposure} (0=tolerant → 4=existential reputational risk)

Operational & Market Context:
- Market clock speed: ${profile.clock_speed} (0=annual changes → 4=frontier pace)
- System latency requirements: ${profile.latency_edge} (0=seconds OK → 4=offline/edge)
- Scale throughput demands: ${profile.scale_throughput} (0=small teams → 4=hyperscale)
- Data advantage assets: ${profile.data_advantage} (0=commodity → 4=unique proprietary)

Capability & Resource Context:
- Internal build readiness: ${profile.build_readiness} (0=outsource-only → 4=deep AI capability)
- Financial operations priority: ${profile.finops_priority} (0=spend freely → 4=cost control critical)
- Procurement constraints: ${profile.procurement_constraints ? 'YES (public RFP/vendor rules)' : 'NO (flexible vendor selection)'}
- Edge operations requirements: ${profile.edge_operations ? 'YES (industrial/offline systems)' : 'NO (cloud-first operations)'}

STRATEGIC REASONING TASK:

First, identify the PRIMARY CONTEXTUAL FORCES at play:
1. What are the 2-3 dominant contextual dimensions that most shape AI strategy for this organization?
2. What tensions or contradictions exist in this context profile that require strategic trade-offs?
3. What unique combination of context creates specific strategic opportunities or constraints?

Then, map these forces to CORTEX STRATEGIC PILLARS implications:
- Clarity & Command: How does context affect AI strategy clarity and executive alignment needs?
- Operations & Data: What operational patterns does this context signature enable or constrain?
- Risk/Trust/Security: How does the risk profile determine appropriate AI governance approach?
- Talent & Culture: What AI talent and adoption strategies fit these contextual constraints?
- Ecosystem & Infrastructure: How does context guide technology stack and vendor selection?
- Experimentation & Evolution: What experimentation and scaling approach fits this context?

Produce SITUATION ASSESSMENT 2.0 strategic advisory:

1) HEADLINE (≤120 chars): Strategic frame explaining why this specific context signature matters for AI strategy now.

2) STRATEGIC INSIGHT (150-220 words, exactly two paragraphs):
   Paragraph 1: Context Analysis - What this specific combination of contextual forces STRATEGICALLY ENABLES and FUNDAMENTALLY CONSTRAINS for AI initiatives. Focus on unique implications, not generic advice.
   
   Paragraph 2: Executive Implications - What this context signature means for INVESTMENT SEQUENCING, RESOURCE ALLOCATION, and COMPETITIVE POSITIONING. Connect to specific CORTEX pillars most relevant to this context.

3) STRATEGIC ACTIONS (3 items, ≤14 words each): 
   Executive-level imperatives tied directly to the contextual analysis above. Focus on strategic moves, not tactical implementations.

4) CONTEXTUAL WATCHOUTS (2 items, ≤14 words each):
   Strategic pitfalls that this specific context signature creates. Not generic risks.

5) SCENARIO IMPLICATIONS:
   if_regulation_tightens: How would increased regulation specifically impact this context signature?
   if_budgets_tighten: How would budget pressure specifically affect AI strategy given this context?

REQUIREMENTS:
- Ground ALL analysis in the specific context dimensions provided
- Reason through contextual combinations, don't treat dimensions in isolation  
- Focus on strategic implications executives can't get from generic AI advice
- Use executive confidence language: "typically", "often constrains", "commonly enables"
- Maintain vendor neutrality - no specific tools, platforms, or metrics
- Connect to broader CORTEX strategic framework where relevant`;

  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash", 
    systemInstruction: systemPrompt 
  });
  
  console.log(`[SITUATION_ASSESSMENT] ${generationId} - Attempt 1: Starting AI generation with gemini-2.5-flash`);
  
  // Attempt 1: Initial AI generation
  const attempt1: GenerationAttempt = {
    attemptNumber: 1,
    model: "gemini-2.5-flash",
    startTime: new Date().toISOString(),
    success: false
  };
  
  try {
    const llmRequest = {
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
    };

    const response = await callGeminiWithRetry(
      model, 
      llmRequest, 
      'situation_assessment_generation_primary'
    );
    attempt1.endTime = new Date().toISOString();
    attempt1.duration = new Date().getTime() - new Date(attempt1.startTime).getTime();
    
    const rawJson = response.response.text();
    attempt1.rawResponse = rawJson?.substring(0, 500); // First 500 chars for debugging
    
    console.log(`[SITUATION_ASSESSMENT] ${generationId} - Attempt 1: Received response in ${attempt1.duration}ms`);

    if (rawJson) {
      // Clean the response - remove markdown code block wrapper if present
      const cleanedJson = rawJson
        .replace(/^```json\n?/, '')    // Remove opening ```json
        .replace(/\n?```$/, '')        // Remove closing ```
        .trim();                       // Remove extra whitespace
      
      let payload: SituationAssessmentPayload;
      try {
        payload = JSON.parse(cleanedJson);
        logger.debug('Situation Assessment JSON parsed successfully', {
          additionalContext: {
            operation: 'situation_assessment_json_parse_success',
            generationId,
            incidentId,
            attemptNumber: 1
          }
        });
        console.log(`[SITUATION_ASSESSMENT] ${generationId} - Attempt 1: JSON parsed successfully`);
      } catch (parseError) {
        attempt1.failureReason = 'parse_error';
        attempt1.parseError = parseError instanceof Error ? parseError.message : 'Unknown parse error';
        attempts.push(attempt1);
        
        logger.error(
          'Situation Assessment JSON parsing failed',
          parseError instanceof Error ? parseError : new Error(String(parseError)),
          {
            additionalContext: {
              operation: 'situation_assessment_json_parse_error',
              generationId,
              incidentId,
              attemptNumber: 1,
              rawResponseLength: cleanedJson?.length || 0,
              rawResponsePreview: cleanedJson?.substring(0, 200)
            }
          }
        );
        
        console.warn(`[SITUATION_ASSESSMENT] ${generationId} - Attempt 1: JSON parsing failed:`, parseError);
        throw new Error(`Failed to parse JSON response from Gemini. Incident ID: ${incidentId}`);
      }
      
      // Check for policy violations using shared validation
      const policyViolation = violatesPolicy(payload.insight);
      attempt1.policyViolation = policyViolation;
      
      if (policyViolation) {
        attempt1.failureReason = 'policy_violation';
        attempts.push(attempt1);
        console.log(`[SITUATION_ASSESSMENT] ${generationId} - Attempt 1: Policy violation detected, starting retry`);
        
        // Attempt 2: Retry with enhanced contextual analysis
        const retryPrompt = `RETRY: Enhanced contextual analysis required. Use the complete organizational context signature.

${userPrompt}

Focus on specific contextual combinations rather than generic advice. Ensure strategic reasoning connects directly to the organization's unique context profile. Return complete Situation Assessment 2.0 JSON format.`;

        const attempt2: GenerationAttempt = {
          attemptNumber: 2,
          model: "gemini-2.5-flash",
          startTime: new Date().toISOString(),
          success: false
        };
        
        console.log(`[SITUATION_ASSESSMENT] ${generationId} - Attempt 2: Starting retry with cleaner prompt`);

        try {
          const retryModel = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash", 
            systemInstruction: systemPrompt 
          });
          
          const retryRequest = {
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
          };
          
          const retryResponse = await callGeminiWithRetry(
            retryModel,
            retryRequest,
            'situation_assessment_generation_retry'
          );
          attempt2.endTime = new Date().toISOString();
          attempt2.duration = new Date().getTime() - new Date(attempt2.startTime).getTime();
          
          const retryJson = retryResponse.response.text();
          attempt2.rawResponse = retryJson?.substring(0, 500);
          
          console.log(`[SITUATION_ASSESSMENT] ${generationId} - Attempt 2: Received retry response in ${attempt2.duration}ms`);
          
          if (retryJson) {
            // Clean the retry response - remove markdown code block wrapper if present
            const cleanedRetryJson = retryJson
              .replace(/^```json\n?/, '')    // Remove opening ```json
              .replace(/\n?```$/, '')        // Remove closing ```
              .trim();                       // Remove extra whitespace
            
            let retryPayload: SituationAssessmentPayload;
            try {
              retryPayload = JSON.parse(cleanedRetryJson);
              console.log(`[SITUATION_ASSESSMENT] ${generationId} - Attempt 2: Retry JSON parsed successfully`);
            } catch (retryParseError) {
              attempt2.failureReason = 'parse_error';
              attempt2.parseError = retryParseError instanceof Error ? retryParseError.message : 'Unknown parse error';
              attempts.push(attempt2);
              console.warn(`[SITUATION_ASSESSMENT] ${generationId} - Attempt 2: Retry JSON parsing failed:`, retryParseError);
              throw new Error('Failed to parse retry JSON response from Gemini');
            }
            
            // CRITICAL: Validate retry response before returning
            const retryPolicyViolation = violatesPolicy(retryPayload.insight);
            attempt2.policyViolation = retryPolicyViolation;
            
            if (!retryPolicyViolation) {
              attempt2.success = true;
              attempts.push(attempt2);
              
              const totalDuration = new Date().getTime() - startTime.getTime();
              console.log(`[SITUATION_ASSESSMENT] ${generationId} - SUCCESS: AI response after retry in ${totalDuration}ms total`);
              
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
                  modelVersion: 'gemini-2.5-flash',
                  generatedAt: new Date().toISOString()
                }
              };
            } else {
              attempt2.failureReason = 'policy_violation';
              attempts.push(attempt2);
              console.warn(`[SITUATION_ASSESSMENT] ${generationId} - Attempt 2: Retry also violated policy`);
            }
          }
        } catch (retryError) {
          attempt2.endTime = new Date().toISOString();
          attempt2.duration = new Date().getTime() - new Date(attempt2.startTime).getTime();
          attempt2.failureReason = retryError instanceof Error && retryError.message.includes('timeout') ? 'timeout' : 'api_error';
          attempts.push(attempt2);
          console.warn(`[SITUATION_ASSESSMENT] ${generationId} - Attempt 2: Retry failed:`, retryError);
        }
        
        // If retry violates policy or fails, use fallback template
        console.warn(`[SITUATION_ASSESSMENT] ${generationId} - Using fallback template after policy violations`);
      } else {
        // Success on first attempt
        attempt1.success = true;
        attempts.push(attempt1);
        
        const totalDuration = new Date().getTime() - startTime.getTime();
        console.log(`[SITUATION_ASSESSMENT] ${generationId} - SUCCESS: AI response on first attempt in ${totalDuration}ms`);
        
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
            modelVersion: 'gemini-2.5-flash',
            generatedAt: new Date().toISOString()
          }
        };
      }
    } else {
      attempt1.failureReason = 'api_error';
      attempt1.endTime = new Date().toISOString();
      attempt1.duration = new Date().getTime() - new Date(attempt1.startTime).getTime();
      attempts.push(attempt1);
      console.warn(`[SITUATION_ASSESSMENT] ${generationId} - Attempt 1: Empty response received from Gemini API`);
      throw new Error("Empty response from Gemini");
    }
  } catch (error) {
    if (!attempt1.endTime) {
      attempt1.endTime = new Date().toISOString();
      attempt1.duration = new Date().getTime() - new Date(attempt1.startTime).getTime();
      const isTimeout = error instanceof Error && error.message.includes('timeout');
      attempt1.failureReason = isTimeout ? 'timeout' : 'api_error';
      attempts.push(attempt1);
      
      logger.error(
        'Situation Assessment generation attempt 1 failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          additionalContext: {
            operation: 'situation_assessment_attempt1_failed',
            generationId,
            incidentId,
            attemptNumber: 1,
            duration: attempt1.duration,
            failureReason: attempt1.failureReason,
            isTimeout
          }
        }
      );
    }
    console.warn(`[SITUATION_ASSESSMENT] ${generationId} - Attempt 1: API error:`, error);
  }
  
  // Fallback template path
  const totalDuration = new Date().getTime() - startTime.getTime();
  console.log(`[SITUATION_ASSESSMENT] ${generationId} - FALLBACK: Using template after ${totalDuration}ms`);
  
  logger.warn('Situation Assessment falling back to template', {
    additionalContext: {
      operation: 'situation_assessment_fallback_template',
      generationId,
      incidentId,
      totalDuration,
      attemptCount: attempts.length,
      failureReasons: attempts.map(a => a.failureReason).filter(Boolean)
    }
  });
  
  try {
    const fallback = getContextTemplate(profile);
    
    logger.info('Situation Assessment template fallback successful', {
      additionalContext: {
        operation: 'situation_assessment_template_success',
        generationId,
        incidentId,
        totalDuration
      }
    });
    
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
  } catch (templateError) {
    logger.error(
      'Situation Assessment template fallback failed',
      templateError instanceof Error ? templateError : new Error(String(templateError)),
      {
        additionalContext: {
          operation: 'situation_assessment_template_failed',
          generationId,
          incidentId,
          totalDuration
        }
      }
    );
    
    // Last resort - throw error with incident ID
    throw new Error(`Situation Assessment generation completely failed. Incident ID: ${incidentId}`);
  }
}

export function generateRuleBasedFallback(profile: ContextProfile): SituationAssessment {
  // Use the enhanced context template system for fallback
  const template = getContextTemplate(profile);
  
  return {
    // Situation Assessment 2.0 format
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