import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { getFirebaseIdToken } from '@/lib/queryClient';

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
      
      // Verify the assessment exists (return it even if in progress)
      try {
        // Get Firebase ID token for authentication
        const idToken = await getFirebaseIdToken();
        
        const response = await fetch(`/api/assessments/${latestAssessmentId}`, {
          headers: {
            ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
          },
          credentials: 'include'
        });
        
        if (!response.ok) return null;
        
        const assessment = await response.json();
        return assessment;
      } catch {
        return null;
      }
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};