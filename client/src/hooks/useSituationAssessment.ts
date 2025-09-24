import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { SituationAssessment, SituationAssessmentWithDiagnostics, SituationAssessmentRequest } from "@shared/schema";
import { situationAssessmentRequestSchema } from "@shared/schema";

export interface UseSituationAssessmentReturn {
  data: SituationAssessmentWithDiagnostics | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  generateSituationAssessment: (assessmentId: string) => void;
  reset: () => void;
}

export function useSituationAssessment(): UseSituationAssessmentReturn {
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (assessmentId: string): Promise<SituationAssessmentWithDiagnostics> => {
      // Validate input before making API call
      const validationResult = situationAssessmentRequestSchema.safeParse({ assessmentId });
      
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(e => e.message).join(", ");
        throw new Error(`Invalid assessment ID: ${errors}`);
      }

      const response = await apiRequest(
        "POST",
        "/api/insight/situation-assessment",
        validationResult.data
      );

      const data = await response.json();
      
      // Handle backward compatibility - if legacy format received, add minimal diagnostic info
      if (!data.debug) {
        return {
          ...data,
          debug: {
            source: 'unknown' as const,
            attempts: [],
            finalSource: 'unknown' as const,
            totalDuration: 0,
            generatedAt: new Date().toISOString()
          }
        };
      }
      
      return data;
    },
    onSuccess: (data: SituationAssessmentWithDiagnostics) => {
      toast({
        title: "Situation Assessment Generated",
        description: "Your situation assessment analysis is ready.",
      });
    },
    onError: (error: any) => {
      console.error("Situation Assessment generation failed:", error);
      
      // Handle specific error types
      let errorMessage = "Failed to generate situation assessment. Please try again.";
      
      if (error?.message?.includes("404")) {
        errorMessage = "Assessment not found. Please ensure you have completed the context profile.";
      } else if (error?.message?.includes("offline")) {
        errorMessage = "You're offline. Please check your connection and try again.";
      } else if (error?.message?.includes("500")) {
        errorMessage = "Server error occurred. Please try again in a moment.";
      } else if (error?.message?.includes("429")) {
        errorMessage = "Too many requests. Please wait a moment and try again.";
      } else if (error?.incidentId) {
        errorMessage = `${error.message} (Incident ID: ${error.incidentId})`;
      }

      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    },
    retry: (failureCount, error: any) => {
      // Don't retry on client errors (4xx)
      if (error?.message?.match(/^4\d\d/)) {
        return false;
      }
      
      // Don't retry on validation errors
      if (error?.message?.includes("Invalid assessment ID")) {
        return false;
      }
      
      // Retry up to 2 times for server/network errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  const generateSituationAssessment = (assessmentId: string) => {
    // Additional client-side validation
    if (!assessmentId || typeof assessmentId !== 'string') {
      toast({
        title: "Invalid Input",
        description: "Assessment ID is required to generate a situation assessment.",
        variant: "destructive"
      });
      return;
    }

    if (assessmentId.trim().length === 0) {
      toast({
        title: "Invalid Input", 
        description: "Assessment ID cannot be empty.",
        variant: "destructive"
      });
      return;
    }

    mutation.mutate(assessmentId);
  };

  const reset = () => {
    mutation.reset();
  };

  return {
    data: mutation.data || null,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error as Error | null,
    generateSituationAssessment,
    reset,
  };
}