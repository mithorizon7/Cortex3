import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AuthButton } from './auth-button';
import { Shield, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

const DefaultAuthRequired: React.FC = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>
            Please sign in to access this feature of the CORTEX AI Strategic Maturity Assessment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AuthButton 
            size="lg" 
            className="w-full" 
            data-testid="protected-route-sign-in"
          />
          <p className="text-xs text-center text-muted-foreground">
            We use Google Sign-In to provide a secure and personalized experience.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback,
  requireAuth = true 
}) => {
  const { user, loading } = useAuth();
  const [location, navigate] = useLocation();

  // Effect to handle redirect to home for deep links
  useEffect(() => {
    // Only redirect if user is definitively not authenticated (not loading)
    if (!loading && !user && requireAuth && location !== '/') {
      // Preserve the intended destination and redirect to home with auth intent
      const destination = encodeURIComponent(location);
      navigate(`/?auth=required&destination=${destination}`);
    }
  }, [user, loading, requireAuth, location, navigate]);

  // If auth is not required, always show children
  if (!requireAuth) {
    return <>{children}</>;
  }

  // Show loading state while checking auth
  if (loading) {
    return fallback || <DefaultAuthRequired />;
  }

  // Show sign-in prompt if user is not authenticated
  if (!user) {
    // For the home page, still show the fallback to avoid redirect loops
    if (location === '/') {
      return fallback || <DefaultAuthRequired />;
    }
    // For other pages, the useEffect will handle the redirect
    return fallback || <DefaultAuthRequired />;
  }

  // User is authenticated, show protected content
  return <>{children}</>;
};