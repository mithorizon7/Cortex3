import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';

/**
 * Hook to get the user's latest assessment from localStorage and verify it exists
 */
export const useLatestAssessment = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['latest-assessment', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      
      const latestAssessmentId = localStorage.getItem(`latest-assessment-${user.uid}`);
      if (!latestAssessmentId) return null;
      
      // Verify the assessment exists and is completed
      try {
        const response = await fetch(`/api/assessments/${latestAssessmentId}`);
        if (!response.ok) return null;
        
        const assessment = await response.json();
        return assessment?.completedAt ? assessment : null;
      } catch {
        return null;
      }
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};