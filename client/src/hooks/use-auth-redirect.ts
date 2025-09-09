import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/auth-context';

interface UseAuthRedirectOptions {
  redirectTo?: string;
  requireAuth?: boolean;
  redirectIfAuthenticated?: string;
}

/**
 * Custom hook to handle authentication-based redirects
 * 
 * @param options Configuration for redirect behavior
 */
export const useAuthRedirect = (options: UseAuthRedirectOptions = {}) => {
  const { 
    redirectTo = '/auth', 
    requireAuth = false,
    redirectIfAuthenticated 
  } = options;
  
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    // Don't redirect while loading
    if (loading) return;

    // Redirect unauthenticated users if auth is required
    if (requireAuth && !user) {
      navigate(redirectTo);
      return;
    }

    // Redirect authenticated users away from auth pages
    if (redirectIfAuthenticated && user) {
      navigate(redirectIfAuthenticated);
      return;
    }
  }, [user, loading, requireAuth, redirectTo, redirectIfAuthenticated, navigate]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    shouldRedirect: (requireAuth && !user) || (redirectIfAuthenticated && user)
  };
};