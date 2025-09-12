import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { 
  OptionsStudioSession, 
  ContextProfile, 
  OptionCard, 
  ExtendedOptionCard
} from '@shared/schema';
import { extendOptionCard } from '@shared/schema';
import { 
  OPTION_CARDS, 
  MISCONCEPTION_QUESTIONS, 
  CAUTION_MESSAGES,
  LENS_LABELS 
} from '@shared/options-studio-data';

export interface UseOptionsStudioBackendReturn {
  // State (loaded from backend)
  useCase: string;
  goals: string[];
  misconceptionResponses: Record<string, boolean>;
  comparedOptions: string[];
  reflectionPrompts: string[];
  completed: boolean;
  
  // Loading states
  isLoading: boolean;
  isError: boolean;
  isSaving: boolean;
  
  // Core Functions
  updateUseCase: (useCase: string) => void;
  toggleGoal: (goal: string) => void;
  setMisconceptionResponse: (questionId: string, answer: boolean) => void;
  toggleCompareOption: (optionId: string) => void;
  addReflectionResponse: (prompt: string) => void;
  markCompleted: () => void;
  
  // Personalization Logic
  getPersonalizedCards: (contextProfile: ContextProfile) => ExtendedOptionCard[];
  getCautionMessages: (contextProfile: ContextProfile) => string[];
  getEmphasizedLenses: (contextProfile: ContextProfile) => string[];
  
  // Export Functions
  getSessionSummary: () => OptionsStudioSession;
  resetSession: () => void;
  
  // Manual save function
  saveSession: () => void;
  
  // Computed Values
  sessionProgress: number;
  availableOptions: ExtendedOptionCard[];
  misconceptionQuestions: typeof MISCONCEPTION_QUESTIONS;
}

// Helper function to calculate card relevance based on context
function calculateCardRelevance(card: ExtendedOptionCard, contextProfile: ContextProfile): number {
  let score = 0;
  
  // Score based on build readiness alignment
  const readiness = contextProfile.build_readiness;
  if (card.category === 'ready' && readiness <= 2) score += 3;
  if (card.category === 'build' && readiness >= 2) score += 2;
  if (card.category === 'custom' && readiness >= 3) score += 1;
  
  // Score based on regulatory/safety context
  const regulatory = contextProfile.regulatory_intensity + contextProfile.safety_criticality;
  if (regulatory >= 6 && card.cautions?.includes('regulated')) score -= 2;
  if (regulatory <= 2 && !card.cautions?.includes('regulated')) score += 1;
  
  // Score based on data sensitivity
  if (contextProfile.data_sensitivity >= 3 && card.cautions?.includes('high_sensitivity')) score -= 1;
  if (contextProfile.data_sensitivity <= 1 && !card.cautions?.includes('high_sensitivity')) score += 1;
  
  return score;
}

export function useOptionsStudioBackend(assessmentId: string | undefined): UseOptionsStudioBackendReturn {
  const { toast } = useToast();
  
  // Local state for immediate UI updates before backend sync
  const [localState, setLocalState] = useState<OptionsStudioSession>({
    useCase: '',
    goals: [],
    misconceptionResponses: {},
    comparedOptions: [],
    reflectionPrompts: [],
    completed: false
  });
  
  // Track if local state has been initialized from backend
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Fetch session data from backend
  const {
    data: backendSession,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['/api/options-studio', assessmentId],
    enabled: !!assessmentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2
  });
  
  // Initialize local state from backend data
  useEffect(() => {
    if (backendSession && !isInitialized) {
      setLocalState(backendSession as OptionsStudioSession);
      setIsInitialized(true);
    }
  }, [backendSession, isInitialized]);
  
  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (sessionData: OptionsStudioSession) => {
      if (!assessmentId) throw new Error('Assessment ID is required');
      
      const response = await apiRequest(
        'PUT',
        `/api/options-studio/${assessmentId}`,
        sessionData
      );
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate cache to refresh data
      queryClient.invalidateQueries({ 
        queryKey: ['/api/options-studio', assessmentId] 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: "Failed to save your progress. Please try again.",
        variant: "destructive"
      });
      console.error('Failed to save Options Studio session:', error);
    }
  });
  
  // Auto-save debounced helper
  const [saveTimeoutId, setSaveTimeoutId] = useState<NodeJS.Timeout | null>(null);
  
  const scheduleAutoSave = useCallback((newState: OptionsStudioSession) => {
    if (!assessmentId || !isInitialized) return;
    
    // Clear existing timeout
    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId);
    }
    
    // Schedule new save after 2 seconds of no changes
    const timeoutId = setTimeout(() => {
      saveMutation.mutate(newState);
    }, 2000);
    
    setSaveTimeoutId(timeoutId);
  }, [assessmentId, isInitialized, saveTimeoutId, saveMutation]);
  
  // Helper to update local state and schedule auto-save
  const updateLocalState = useCallback((updater: (prev: OptionsStudioSession) => OptionsStudioSession) => {
    setLocalState(prev => {
      const newState = updater(prev);
      scheduleAutoSave(newState);
      return newState;
    });
  }, [scheduleAutoSave]);
  
  // Core Functions
  const updateUseCase = useCallback((newUseCase: string) => {
    updateLocalState(prev => ({ ...prev, useCase: newUseCase }));
  }, [updateLocalState]);

  const toggleGoal = useCallback((goal: string) => {
    updateLocalState(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  }, [updateLocalState]);

  const setMisconceptionResponse = useCallback((questionId: string, answer: boolean) => {
    updateLocalState(prev => ({
      ...prev,
      misconceptionResponses: {
        ...prev.misconceptionResponses,
        [questionId]: answer
      }
    }));
  }, [updateLocalState]);

  const toggleCompareOption = useCallback((optionId: string) => {
    updateLocalState(prev => ({
      ...prev,
      comparedOptions: prev.comparedOptions.includes(optionId)
        ? prev.comparedOptions.filter(id => id !== optionId)
        : [...prev.comparedOptions, optionId]
    }));
  }, [updateLocalState]);

  const addReflectionResponse = useCallback((prompt: string) => {
    updateLocalState(prev => ({
      ...prev,
      reflectionPrompts: [...prev.reflectionPrompts, prompt]
    }));
  }, [updateLocalState]);

  const markCompleted = useCallback(() => {
    updateLocalState(prev => ({
      ...prev,
      completed: true,
      completedAt: new Date().toISOString()
    }));
  }, [updateLocalState]);
  
  // Personalization Logic (same as original hook)
  const getPersonalizedCards = useCallback((contextProfile: ContextProfile): ExtendedOptionCard[] => {
    const cards = OPTION_CARDS.map(card => extendOptionCard(card));
    
    return cards.sort((a, b) => {
      const scoreA = calculateCardRelevance(a, contextProfile);
      const scoreB = calculateCardRelevance(b, contextProfile);
      return scoreB - scoreA;
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
    
    // Emphasis based on context profile characteristics
    if (contextProfile.clock_speed >= 3) emphasized.push('Speed-to-Value');
    if (contextProfile.regulatory_intensity >= 3) emphasized.push('Risk & Compliance Load');
    if (contextProfile.data_sensitivity >= 3) emphasized.push('Data Leverage');
    if (contextProfile.build_readiness <= 1) emphasized.push('Operational Burden');
    if (contextProfile.finops_priority >= 3) emphasized.push('Cost Shape');
    if (contextProfile.edge_operations) emphasized.push('Portability & Lock-in');
    
    return emphasized;
  }, []);
  
  // Export Functions
  const getSessionSummary = useCallback((): OptionsStudioSession => {
    return { ...localState };
  }, [localState]);

  const resetSession = useCallback(() => {
    const emptySession: OptionsStudioSession = {
      useCase: '',
      goals: [],
      misconceptionResponses: {},
      comparedOptions: [],
      reflectionPrompts: [],
      completed: false
    };
    
    setLocalState(emptySession);
    setIsInitialized(true);
    
    if (assessmentId) {
      saveMutation.mutate(emptySession);
    }
  }, [assessmentId, saveMutation]);

  // Manual save function
  const saveSession = useCallback(() => {
    if (assessmentId && isInitialized) {
      saveMutation.mutate(localState);
    }
  }, [assessmentId, isInitialized, localState, saveMutation]);

  // Computed Values
  const sessionProgress = useMemo(() => {
    let progress = 0;
    let totalSteps = 5; // intro, misconceptions, situation, options, reflection
    
    if (localState.useCase) progress += 1;
    if (Object.keys(localState.misconceptionResponses).length > 0) progress += 1;
    if (localState.goals.length > 0) progress += 1;
    if (localState.comparedOptions.length > 0) progress += 1;
    if (localState.completed) progress += 1;
    
    return Math.round((progress / totalSteps) * 100);
  }, [localState]);

  const availableOptions = useMemo(() => {
    return OPTION_CARDS.map(card => extendOptionCard(card));
  }, []);

  // Show error toast if query fails
  useEffect(() => {
    if (isError && error) {
      toast({
        title: "Load Failed",
        description: "Failed to load your session. Please refresh the page.",
        variant: "destructive"
      });
    }
  }, [isError, error, toast]);

  return {
    // State
    useCase: localState.useCase,
    goals: localState.goals,
    misconceptionResponses: localState.misconceptionResponses,
    comparedOptions: localState.comparedOptions,
    reflectionPrompts: localState.reflectionPrompts,
    completed: localState.completed,
    
    // Loading states
    isLoading: isLoading && !isInitialized,
    isError,
    isSaving: saveMutation.isPending,
    
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
    saveSession,
    
    // Computed Values
    sessionProgress,
    availableOptions,
    misconceptionQuestions: MISCONCEPTION_QUESTIONS,
  };
}