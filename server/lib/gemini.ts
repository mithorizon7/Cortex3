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
  // 25 second timeout for complex Context Mirror prompts with JSON schema (executive advisory content takes longer)
  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error('LLM request timed out after 25 seconds')), 25000)
  );

  try {
    const systemPrompt = `You are an executive AI strategy advisor. Write in clear, concise prose suitable for senior leaders. Base your analysis *only* on organizational **context** (not internal capabilities). Use probability language ('often', 'tends to', 'commonly'). Vendor-neutral. No metrics or benchmarks. Output exactly two paragraphs of narrative (${WORD_COUNT_LIMITS.min}–${WORD_COUNT_LIMITS.max} words total).`;

    const userPrompt = `Context profile:

• Regulatory intensity: ${profile.regulatory_intensity}
• Data sensitivity: ${profile.data_sensitivity}
• Market clock-speed: ${profile.clock_speed}
• Integration complexity: ${profile.scale_throughput + profile.latency_edge}
• Change tolerance: ${profile.build_readiness}
• Scale: ${profile.scale_throughput}

Write a short, board-ready **Context Reflection** in 2 paragraphs.
Paragraph 1: What this context often **enables** and often **constrains**.
Paragraph 2: What this typically **implies** for early AI moves (guardrails, quick wins, continuity).
Avoid headings and bullets. Avoid the words 'strengths' and 'fragilities'. Avoid internal guidelines, rules, or counters. Return JSON:
{ "insight": "<two paragraphs>", "disclaimer": "Educational reflection based on your context; not a compliance determination." }`;

    const llmRequest = ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: userPrompt,
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          insight: {
            type: "string",
            description: "Two paragraphs separated by \\n\\n, approximately 150-220 words total"
          },
          disclaimer: {
            type: "string",
            description: "One-line micro-disclaimer"
          }
        },
        required: ["insight", "disclaimer"]
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
        const retryPrompt = `Rewrite plainly. No internal rule text. Two paragraphs only (${WORD_COUNT_LIMITS.min}-${WORD_COUNT_LIMITS.max} words total). Avoid "strengths" and "fragilities" words. Return JSON: { "insight": "<two paragraphs>", "disclaimer": "Educational reflection based on your context; not a compliance determination." }

Context profile:
• Regulatory intensity: ${profile.regulatory_intensity}
• Data sensitivity: ${profile.data_sensitivity}
• Market clock-speed: ${profile.clock_speed}
• Integration complexity: ${profile.scale_throughput + profile.latency_edge}
• Change tolerance: ${profile.build_readiness}
• Scale: ${profile.scale_throughput}`;

        try {
          const retryLlmRequest = ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: retryPrompt,
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema: {
              type: "object",
              properties: {
                insight: {
                  type: "string"
                },
                disclaimer: {
                  type: "string"
                }
              },
              required: ["insight", "disclaimer"]
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
                insight: retryPayload.insight,
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
          insight: fallback.insight,
          disclaimer: fallback.disclaimer
        };
      }
      
      return {
        insight: payload.insight,
        disclaimer: payload.disclaimer
      };
    } else {
      throw new Error("Empty response from Gemini");
    }
  } catch (error) {
    console.warn('LLM generation failed, using fallback:', error);
    const fallback = getContextTemplate(profile);
    return {
      insight: fallback.insight,
      disclaimer: fallback.disclaimer
    };
  }
}

export function generateRuleBasedFallback(profile: ContextProfile): ContextMirror {
  // Use the new context template system for fallback
  const template = getContextTemplate(profile);
  
  return {
    disclaimer: template.disclaimer,
    insight: template.insight,
    // Legacy format (optional - for backwards compatibility)
    strengths: undefined,
    fragilities: undefined,
    whatWorks: undefined,
  };
}