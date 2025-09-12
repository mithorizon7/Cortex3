import { useState, useCallback } from "react";
import type { OptionsStudioSession, ContextProfile } from "@shared/schema";
import { OPTION_CARDS, CAUTION_MESSAGES } from "@shared/options-studio-data";

export function useOptionsStudio(contextProfile?: ContextProfile) {
  const [session, setSession] = useState<OptionsStudioSession>({
    misconceptionsAnswered: {},
    optionsViewed: [],
    optionsCompared: [],
    reflections: {},
  });

  // Compute personalization based on context profile
  const personalization = useCallback(() => {
    if (!contextProfile) return { emphasizedLenses: [], cautionChips: {} };

    const emphasizedLenses: string[] = [];
    const cautionChips: Record<string, string[]> = {};

    // Risk & Compliance emphasis for regulated/safety-critical orgs
    if (contextProfile.regulatory_intensity >= 3 || contextProfile.safety_criticality >= 3) {
      emphasizedLenses.push("riskLoad");
      
      // Add HITL + assurance cautions to relevant options
      const regulatedOptions = ["api_orchestration", "rag", "agents", "light_ft", "heavy_ft", "private_hosting", "edge_small_models"];
      regulatedOptions.forEach(optionId => {
        if (!cautionChips[optionId]) cautionChips[optionId] = [];
        cautionChips[optionId].push("regulated");
      });
    }

    // Data sensitivity emphasis
    if (contextProfile.data_sensitivity >= 3) {
      emphasizedLenses.push("portability");
      
      // Add data residency cautions
      const dataOptions = ["rag", "light_ft", "heavy_ft", "private_hosting"];
      dataOptions.forEach(optionId => {
        if (!cautionChips[optionId]) cautionChips[optionId] = [];
        cautionChips[optionId].push("high_sensitivity");
      });
      
      // Add vendor data-use notes to off-the-shelf/API
      ["off_the_shelf_apps", "api_orchestration"].forEach(optionId => {
        if (!cautionChips[optionId]) cautionChips[optionId] = [];
        cautionChips[optionId].push("high_sensitivity");
      });
    }

    // Build readiness emphasis
    if (contextProfile.build_readiness <= 1) {
      emphasizedLenses.push("opsBurden");
      
      // Add "build later" to fine-tuning options
      ["light_ft", "heavy_ft"].forEach(optionId => {
        if (!cautionChips[optionId]) cautionChips[optionId] = [];
        cautionChips[optionId].push("low_readiness");
      });
    }

    // Latency/Edge emphasis
    if (contextProfile.latency_edge >= 3) {
      emphasizedLenses.push("speed");
      
      // Add edge/offline notes
      if (!cautionChips["edge_small_models"]) cautionChips["edge_small_models"] = [];
      cautionChips["edge_small_models"].push("edge");
      
      if (!cautionChips["private_hosting"]) cautionChips["private_hosting"] = [];
      cautionChips["private_hosting"].push("edge");
    }

    // Clock-speed emphasis
    if (contextProfile.clock_speed >= 3) {
      emphasizedLenses.push("speed");
    }

    return { emphasizedLenses, cautionChips };
  }, [contextProfile]);

  // Update session methods
  const updateSession = useCallback((updates: Partial<OptionsStudioSession>) => {
    setSession(prev => ({ ...prev, ...updates }));
  }, []);

  const answerMisconception = useCallback((questionId: string, answer: boolean) => {
    setSession(prev => ({
      ...prev,
      misconceptionsAnswered: {
        ...prev.misconceptionsAnswered,
        [questionId]: answer
      }
    }));
  }, []);

  const viewOption = useCallback((optionId: string) => {
    setSession(prev => ({
      ...prev,
      optionsViewed: Array.from(new Set([...prev.optionsViewed, optionId]))
    }));
  }, []);

  const compareOptions = useCallback((optionIds: string[]) => {
    setSession(prev => ({
      ...prev,
      optionsCompared: optionIds
    }));
  }, []);

  const updateReflections = useCallback((reflections: Partial<OptionsStudioSession['reflections']>) => {
    setSession(prev => ({
      ...prev,
      reflections: { ...prev.reflections, ...reflections }
    }));
  }, []);

  const completeSession = useCallback(() => {
    setSession(prev => ({
      ...prev,
      completedAt: new Date().toISOString()
    }));
  }, []);

  // Get enriched option cards with cautions
  const getEnrichedOptionCards = useCallback(() => {
    const { cautionChips } = personalization();
    
    return OPTION_CARDS.map(card => ({
      ...card,
      cautions: [
        ...(card.cautions || []),
        ...(cautionChips[card.id] || [])
      ] as ('regulated' | 'high_sensitivity' | 'low_readiness' | 'edge')[]
    }));
  }, [personalization]);

  return {
    session,
    updateSession,
    answerMisconception,
    viewOption,
    compareOptions,
    updateReflections,
    completeSession,
    personalization: personalization(),
    enrichedOptionCards: getEnrichedOptionCards(),
  };
}