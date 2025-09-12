import { useState, useCallback, useMemo } from 'react';
import type { 
  OptionsStudioSession, 
  ContextProfile, 
  OptionCard, 
  LensValues 
} from '@shared/schema';
import { 
  OPTION_CARDS, 
  MISCONCEPTION_QUESTIONS, 
  CAUTION_MESSAGES,
  LENS_LABELS 
} from '@shared/options-studio-data';

export interface UseOptionsStudioReturn {
  // State
  useCase: string;
  goals: string[];
  misconceptionResponses: Record<string, boolean>;
  comparedOptions: string[];
  reflectionPrompts: string[];
  completed: boolean;
  
  // Core Functions
  updateUseCase: (useCase: string) => void;
  toggleGoal: (goal: string) => void;
  setMisconceptionResponse: (questionId: string, answer: boolean) => void;
  toggleCompareOption: (optionId: string) => void;
  addReflectionResponse: (prompt: string) => void;
  markCompleted: () => void;
  
  // Personalization Logic
  getPersonalizedCards: (contextProfile: ContextProfile) => OptionCard[];
  getCautionMessages: (contextProfile: ContextProfile) => string[];
  getEmphasizedLenses: (contextProfile: ContextProfile) => string[];
  
  // Export Functions
  getSessionSummary: () => OptionsStudioSession;
  resetSession: () => void;
  
  // Computed Values
  sessionProgress: number;
  availableOptions: OptionCard[];
  misconceptionQuestions: typeof MISCONCEPTION_QUESTIONS;
}

export function useOptionsStudio(): UseOptionsStudioReturn {
  // State Management
  const [useCase, setUseCase] = useState<string>('');
  const [goals, setGoals] = useState<string[]>([]);
  const [misconceptionResponses, setMisconceptionResponses] = useState<Record<string, boolean>>({});
  const [comparedOptions, setComparedOptions] = useState<string[]>([]);
  const [reflectionPrompts, setReflectionPrompts] = useState<string[]>([]);
  const [completed, setCompleted] = useState<boolean>(false);

  // Core Functions
  const updateUseCase = useCallback((newUseCase: string) => {
    setUseCase(newUseCase);
  }, []);

  const toggleGoal = useCallback((goal: string) => {
    setGoals(prev => {
      if (prev.includes(goal)) {
        return prev.filter(g => g !== goal);
      } else {
        return [...prev, goal];
      }
    });
  }, []);

  const setMisconceptionResponse = useCallback((questionId: string, answer: boolean) => {
    setMisconceptionResponses(prev => ({
      ...prev,
      [questionId]: answer
    }));
  }, []);

  const toggleCompareOption = useCallback((optionId: string) => {
    setComparedOptions(prev => {
      if (prev.includes(optionId)) {
        return prev.filter(id => id !== optionId);
      } else {
        return [...prev, optionId];
      }
    });
  }, []);

  const addReflectionResponse = useCallback((prompt: string) => {
    setReflectionPrompts(prev => [...prev, prompt]);
  }, []);

  const markCompleted = useCallback(() => {
    setCompleted(true);
  }, []);

  // Personalization Logic
  const getPersonalizedCards = useCallback((contextProfile: ContextProfile): OptionCard[] => {
    const cards = [...OPTION_CARDS];
    
    // Sort cards based on context profile relevance
    return cards.sort((a, b) => {
      const scoreA = calculateCardRelevance(a, contextProfile);
      const scoreB = calculateCardRelevance(b, contextProfile);
      return scoreB - scoreA; // Higher scores first
    });
  }, []);

  const getCautionMessages = useCallback((contextProfile: ContextProfile): string[] => {
    const messages: string[] = [];
    
    Object.values(CAUTION_MESSAGES).forEach(getMessageFn => {
      const message = getMessageFn(contextProfile);
      if (message) {
        messages.push(message);
      }
    });
    
    return messages;
  }, []);

  const getEmphasizedLenses = useCallback((contextProfile: ContextProfile): string[] => {
    const emphasized: string[] = [];
    
    // High regulatory intensity emphasizes Risk & Compliance
    if (contextProfile.regulatory_intensity >= 3) {
      emphasized.push('Risk & Compliance Load');
    }
    
    // High data sensitivity emphasizes Data Leverage and Risk
    if (contextProfile.data_sensitivity >= 3) {
      emphasized.push('Data Leverage', 'Risk & Compliance Load');
    }
    
    // High safety criticality emphasizes Risk and Operational Burden
    if (contextProfile.safety_criticality >= 3) {
      emphasized.push('Risk & Compliance Load', 'Operational Burden');
    }
    
    // High brand exposure emphasizes Risk
    if (contextProfile.brand_exposure >= 3) {
      emphasized.push('Risk & Compliance Load');
    }
    
    // High clock speed emphasizes Speed-to-Value
    if (contextProfile.clock_speed >= 3) {
      emphasized.push('Speed-to-Value');
    }
    
    // Low latency edge emphasizes Speed-to-Value
    if (contextProfile.latency_edge >= 3) {
      emphasized.push('Speed-to-Value');
    }
    
    // High scale throughput emphasizes Operational Burden and Cost
    if (contextProfile.scale_throughput >= 3) {
      emphasized.push('Operational Burden', 'Cost Shape');
    }
    
    // High data advantage emphasizes Data Leverage
    if (contextProfile.data_advantage >= 3) {
      emphasized.push('Data Leverage');
    }
    
    // Low build readiness emphasizes Speed-to-Value (ready solutions)
    if (contextProfile.build_readiness <= 1) {
      emphasized.push('Speed-to-Value');
    }
    
    // High finops priority emphasizes Cost
    if (contextProfile.finops_priority >= 3) {
      emphasized.push('Cost Shape');
    }
    
    // Procurement constraints emphasize Portability
    if (contextProfile.procurement_constraints) {
      emphasized.push('Portability & Lock-in');
    }
    
    // Edge operations emphasize Operational Burden and Speed
    if (contextProfile.edge_operations) {
      emphasized.push('Operational Burden', 'Speed-to-Value');
    }
    
    // Remove duplicates and return
    return [...new Set(emphasized)];
  }, []);

  // Export Functions
  const getSessionSummary = useCallback((): OptionsStudioSession => {
    return {
      useCase,
      goals,
      misconceptionResponses,
      comparedOptions,
      reflectionPrompts,
      completed,
      completedAt: completed ? new Date().toISOString() : undefined
    };
  }, [useCase, goals, misconceptionResponses, comparedOptions, reflectionPrompts, completed]);

  const resetSession = useCallback(() => {
    setUseCase('');
    setGoals([]);
    setMisconceptionResponses({});
    setComparedOptions([]);
    setReflectionPrompts([]);
    setCompleted(false);
  }, []);

  // Computed Values
  const sessionProgress = useMemo(() => {
    let completedSteps = 0;
    const totalSteps = 5; // useCase, goals, misconceptions, comparison, reflection
    
    if (useCase.trim().length > 0) completedSteps++;
    if (goals.length > 0) completedSteps++;
    if (Object.keys(misconceptionResponses).length === MISCONCEPTION_QUESTIONS.length) completedSteps++;
    if (comparedOptions.length >= 2) completedSteps++;
    if (reflectionPrompts.length > 0) completedSteps++;
    
    return (completedSteps / totalSteps) * 100;
  }, [useCase, goals, misconceptionResponses, comparedOptions, reflectionPrompts]);

  const availableOptions = useMemo(() => OPTION_CARDS, []);
  const misconceptionQuestions = useMemo(() => MISCONCEPTION_QUESTIONS, []);

  return {
    // State
    useCase,
    goals,
    misconceptionResponses,
    comparedOptions,
    reflectionPrompts,
    completed,
    
    // Core Functions
    updateUseCase,
    toggleGoal,
    setMisconceptionResponse,
    toggleCompareOption,
    addReflectionResponse,
    markCompleted,
    
    // Personalization Logic
    getPersonalizedCards,
    getCautionMessages,
    getEmphasizedLenses,
    
    // Export Functions
    getSessionSummary,
    resetSession,
    
    // Computed Values
    sessionProgress,
    availableOptions,
    misconceptionQuestions
  };
}

// Helper function to calculate card relevance based on context profile
function calculateCardRelevance(card: OptionCard, profile: ContextProfile): number {
  let score = 0;
  const lensValues = card.lensValues;
  
  // High regulatory intensity favors lower risk solutions
  if (profile.regulatory_intensity >= 3) {
    score += (6 - lensValues.Risk) * 2; // Inverse scoring for risk
  }
  
  // High data sensitivity favors solutions with good data leverage but low risk
  if (profile.data_sensitivity >= 3) {
    score += lensValues.Data * 1.5;
    score += (6 - lensValues.Risk) * 1.5;
  }
  
  // High safety criticality heavily penalizes risky solutions
  if (profile.safety_criticality >= 3) {
    score += (6 - lensValues.Risk) * 3;
    score += (6 - lensValues.Ops) * 1.5; // Lower operational burden preferred
  }
  
  // High brand exposure favors reliable, low-risk solutions
  if (profile.brand_exposure >= 3) {
    score += (6 - lensValues.Risk) * 2;
  }
  
  // High clock speed favors fast implementation
  if (profile.clock_speed >= 3) {
    score += lensValues.Speed * 2;
  }
  
  // Low latency needs fast solutions
  if (profile.latency_edge >= 3) {
    score += lensValues.Speed * 1.5;
  }
  
  // High scale throughput considerations
  if (profile.scale_throughput >= 3) {
    score += (6 - lensValues.Ops) * 1.5; // Lower operational burden
    score += (6 - lensValues.Cost) * 1; // Consider cost implications
  }
  
  // High data advantage favors solutions that can leverage data
  if (profile.data_advantage >= 3) {
    score += lensValues.Data * 2;
  }
  
  // Low build readiness favors ready solutions with low customization needs
  if (profile.build_readiness <= 1) {
    score += lensValues.Speed * 2;
    score += (6 - lensValues.Custom) * 1.5; // Less customization preferred
    score += (6 - lensValues.Ops) * 1.5; // Lower operational burden
  }
  
  // High finops priority considers cost heavily
  if (profile.finops_priority >= 3) {
    score += (6 - lensValues.Cost) * 2.5;
  }
  
  // Procurement constraints favor portable solutions
  if (profile.procurement_constraints) {
    score += (6 - lensValues.Lock) * 2;
  }
  
  // Edge operations favor low operational burden and speed
  if (profile.edge_operations) {
    score += (6 - lensValues.Ops) * 2;
    score += lensValues.Speed * 1.5;
  }
  
  // Category preferences based on build readiness
  if (profile.build_readiness <= 1 && card.category === 'ready') {
    score += 10; // Strong preference for ready solutions
  } else if (profile.build_readiness >= 3 && card.category === 'build') {
    score += 5; // Moderate preference for build solutions
  } else if (profile.build_readiness >= 4 && card.category === 'custom') {
    score += 3; // Slight preference for custom solutions
  }
  
  return score;
}