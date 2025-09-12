import { GoogleGenAI } from "@google/genai";
import type { ContextProfile, ContextMirror } from "../../shared/schema";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateContextMirror(profile: ContextProfile): Promise<ContextMirror> {
  try {
    const systemPrompt = `You are an executive coach for AI readiness. Produce concise, board-ready text. Use ONLY the structured profile JSON provided. Do not invent numbers, benchmarks, or proper nouns. Speak in probabilities ("often", "tends to") and options. Be educational, not prescriptive. Output valid JSON matching the supplied schema. Keep total under 220 words.`;

    const userPrompt = `Generate a Context Mirror with 3 strengths, 3 fragilities, and 2 "what usually works first" items based solely on this Profile.
Constraints:
• Each bullet is a single sentence.
• Make them specific to the profile (use dimension names implicitly, not verbatim).
• No vendor/tool names.
• No promises; avoid "guarantee", "always", "never".
• JSON only; match the schema exactly.

Profile JSON:
${JSON.stringify(profile)}

Return JSON only with keys: strengths[3], fragilities[3], whatWorks[2], disclaimer.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            strengths: {
              type: "array",
              items: { type: "string" },
              minItems: 3,
              maxItems: 3
            },
            fragilities: {
              type: "array", 
              items: { type: "string" },
              minItems: 3,
              maxItems: 3
            },
            whatWorks: {
              type: "array",
              items: { type: "string" },
              minItems: 2,
              maxItems: 2
            },
            disclaimer: { type: "string" }
          },
          required: ["strengths", "fragilities", "whatWorks", "disclaimer"]
        },
      },
      contents: userPrompt,
    });

    const rawJson = response.text;

    if (rawJson) {
      const data: ContextMirror = JSON.parse(rawJson);
      return data;
    } else {
      throw new Error("Empty response from Gemini");
    }
  } catch (error) {
    throw new Error(`Failed to generate context mirror: ${error}`);
  }
}

export function generateRuleBasedFallback(profile: ContextProfile): ContextMirror {
  const strengths: string[] = [];
  const fragilities: string[] = [];
  const whatWorks: string[] = [];

  // Strengths based on profile thresholds
  if (profile.regulatory_intensity >= 3) {
    strengths.push("Clear guardrails enable trust and focus on high-value, defensible use-cases.");
  }
  if (profile.clock_speed >= 3) {
    strengths.push("Faster market clock-speed encourages rapid iteration and learning velocity.");
  }
  if (profile.data_advantage >= 3) {
    strengths.push("Proprietary data offers leverage for differentiated results when harnessed safely.");
  }
  if (profile.build_readiness >= 3) {
    strengths.push("Mature teams and pipelines reduce time from prototype to dependable service.");
  }
  if (profile.finops_priority >= 3) {
    strengths.push("Cost discipline supports sustainable scaling and smart vendor choices.");
  }

  // Fragilities based on profile thresholds
  if (profile.safety_criticality >= 3) {
    fragilities.push("High-impact decisions can fail silently without human checkpoints and routine assurance.");
  }
  if (profile.data_sensitivity >= 3) {
    fragilities.push("Sensitive data in prompts/logs raises residency, retention, and exposure risks.");
  }
  if (profile.latency_edge >= 3) {
    fragilities.push("Near-real-time needs require tested fallbacks and smaller models for core tasks.");
  }
  if (profile.scale_throughput >= 3) {
    fragilities.push("Traffic spikes expose brittle integrations without rate limits and failover.");
  }
  if (profile.build_readiness <= 1) {
    fragilities.push("Heavy custom builds outpace governance and MLOps readiness, delaying value.");
  }

  // What usually works first
  if (profile.build_readiness <= 1) {
    whatWorks.push("Start Buy→API→RAG; prove gaps before any fine-tune.");
  }
  if (profile.regulatory_intensity >= 3 || profile.safety_criticality >= 3) {
    whatWorks.push("Add HITL to high-impact flows and run a monthly assurance cadence.");
  }
  if (profile.latency_edge >= 3 && whatWorks.length < 2) {
    whatWorks.push("Set p95 latency SLOs and implement a simple offline/backup path.");
  }
  if (profile.clock_speed >= 3 && whatWorks.length < 2) {
    whatWorks.push("Run time-boxed pilots with explicit decision dates and sunset logic.");
  }

  // Fill defaults if not enough matches
  while (strengths.length < 3) {
    const defaults = [
      "Clear organizational priorities help focus AI efforts on high-value applications.",
      "Existing data foundations provide material for initial AI experiments.", 
      "Leadership engagement signals readiness for strategic AI investment."
    ];
    strengths.push(defaults[strengths.length] || "Structured approach enables systematic AI capability building.");
  }

  while (fragilities.length < 3) {
    const defaults = [
      "Rapid AI advancement requires continuous capability assessment and adaptation.",
      "Integration complexity grows with organizational scale and technical diversity.",
      "Change management becomes critical as AI transforms existing workflows."
    ];
    fragilities.push(defaults[fragilities.length] || "Evolving AI landscape demands flexible strategic planning approaches.");
  }

  while (whatWorks.length < 2) {
    const defaults = [
      "Begin with low-risk pilot projects to build organizational AI confidence.",
      "Establish clear success metrics before launching any AI initiatives."
    ];
    whatWorks.push(defaults[whatWorks.length] || "Focus on quick wins to demonstrate AI value.");
  }

  return {
    strengths: strengths.slice(0, 3),
    fragilities: fragilities.slice(0, 3), 
    whatWorks: whatWorks.slice(0, 2),
    disclaimer: "Educational reflection based on your context; not a compliance determination."
  };
}