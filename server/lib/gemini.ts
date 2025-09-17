import { GoogleGenAI } from "@google/genai";
import type { ContextProfile, ContextMirror, ContextMirrorPayload } from "../../shared/schema";
import { getContextTemplate } from "./context-templates";
import { BANNED_PHRASES_REGEX, WORD_COUNT_LIMITS, violatesPolicy } from "../../shared/context-validation";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateContextMirror(profile: ContextProfile): Promise<ContextMirror> {
  // 25 second timeout for complex Context Mirror 2.0 prompts with structured JSON schema
  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error('LLM request timed out after 25 seconds')), 25000)
  );

  try {
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

    const llmRequest = ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            headline: { type: "string", maxLength: 120 },
            insight: { type: "string", description: "Two paragraphs separated by \\n\\n, 150-220 words total" },
            actions: { type: "array", items: { type: "string", maxLength: 84 }, minItems: 3, maxItems: 3 },
            watchouts: { type: "array", items: { type: "string", maxLength: 84 }, minItems: 2, maxItems: 2 },
            scenarios: {
              type: "object",
              properties: {
                if_regulation_tightens: { type: "string" },
                if_budgets_tighten: { type: "string" }
              },
              required: ["if_regulation_tightens", "if_budgets_tighten"]
            },
            disclaimer: { type: "string" }
          },
          required: ["headline", "insight", "actions", "watchouts", "scenarios", "disclaimer"]
        }
      }
    });

    const response = await Promise.race([llmRequest, timeoutPromise]);

    const rawJson = response.text;

    if (rawJson) {
      // Clean the response - remove markdown code block wrapper if present
      const cleanedJson = rawJson
        .replace(/^```json\n?/, '')    // Remove opening ```json
        .replace(/\n?```$/, '')        // Remove closing ```
        .trim();                       // Remove extra whitespace
      
      const payload: ContextMirrorPayload = JSON.parse(cleanedJson);
      
      // Check for policy violations using shared validation
      if (violatesPolicy(payload.insight)) {
        // Retry once with clearer instructions
        const retryPrompt = `Rewrite plainly. No internal rule text. Context Mirror 2.0 format required.
Context profile:
- Regulatory intensity: ${profile.regulatory_intensity}
- Data sensitivity: ${profile.data_sensitivity}
- Market clock-speed: ${profile.clock_speed}
- Integration complexity: ${profile.scale_throughput + profile.latency_edge}
- Change tolerance: ${profile.build_readiness}
- Scale: ${profile.scale_throughput}

Return complete Context Mirror 2.0 JSON with headline, insight (two paragraphs), actions (3), watchouts (2), scenarios, disclaimer.`;

        try {
          const retryLlmRequest = ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: retryPrompt,
            config: {
              systemInstruction: systemPrompt,
              responseMimeType: "application/json",
              responseSchema: {
                type: "object",
                properties: {
                  headline: { type: "string", maxLength: 120 },
                  insight: { type: "string" },
                  actions: { type: "array", items: { type: "string", maxLength: 84 }, minItems: 3, maxItems: 3 },
                  watchouts: { type: "array", items: { type: "string", maxLength: 84 }, minItems: 2, maxItems: 2 },
                  scenarios: {
                    type: "object",
                    properties: {
                      if_regulation_tightens: { type: "string" },
                      if_budgets_tighten: { type: "string" }
                    },
                    required: ["if_regulation_tightens", "if_budgets_tighten"]
                  },
                  disclaimer: { type: "string" }
                },
                required: ["headline", "insight", "actions", "watchouts", "scenarios", "disclaimer"]
              }
            }
          });
          
          const retryResponse = await Promise.race([retryLlmRequest, timeoutPromise]);
          
          const retryJson = retryResponse.text;
          if (retryJson) {
            // Clean the retry response - remove markdown code block wrapper if present
            const cleanedRetryJson = retryJson
              .replace(/^```json\n?/, '')    // Remove opening ```json
              .replace(/\n?```$/, '')        // Remove closing ```
              .trim();                       // Remove extra whitespace
            
            const retryPayload: ContextMirrorPayload = JSON.parse(cleanedRetryJson);
            
            // CRITICAL: Validate retry response before returning
            if (!violatesPolicy(retryPayload.insight)) {
              return {
                headline: retryPayload.headline,
                insight: retryPayload.insight,
                actions: retryPayload.actions,
                watchouts: retryPayload.watchouts,
                scenarios: retryPayload.scenarios,
                disclaimer: retryPayload.disclaimer
              };
            }
          }
        } catch (retryError) {
          console.warn('Retry failed, using fallback template:', retryError);
        }
        
        // If retry violates policy or fails, use fallback template
        console.warn('Original and retry both violated policy or retry failed, using fallback template');
        const fallback = getContextTemplate(profile);
        return {
          headline: fallback.headline,
          insight: fallback.insight,
          actions: fallback.actions,
          watchouts: fallback.watchouts,
          scenarios: fallback.scenarios,
          disclaimer: fallback.disclaimer
        };
      }
      
      return {
        headline: payload.headline,
        insight: payload.insight,
        actions: payload.actions,
        watchouts: payload.watchouts,
        scenarios: payload.scenarios,
        disclaimer: payload.disclaimer
      };
    } else {
      throw new Error("Empty response from Gemini");
    }
  } catch (error) {
    console.warn('LLM generation failed, using fallback:', error);
    const fallback = getContextTemplate(profile);
    return {
      headline: fallback.headline,
      insight: fallback.insight,
      actions: fallback.actions,
      watchouts: fallback.watchouts,
      scenarios: fallback.scenarios,
      disclaimer: fallback.disclaimer
    };
  }
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