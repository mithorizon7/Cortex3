import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { getNetworkError, isOnline } from '@/lib/queryClient';

interface ErrorFallbackProps {
  error: any;
  onRetry?: () => void;
  onGoHome?: () => void;
  context?: string;
}

export function ErrorFallback({ error, onRetry, onGoHome, context }: ErrorFallbackProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  
  const errorType = getNetworkError(error);
  const canRetry = errorType === 'network' || errorType === 'server' || (errorType === 'offline' && isOnline());

  const handleRetry = async () => {
    if (!onRetry) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const getErrorMessage = () => {
    switch (errorType) {
      case 'offline':
        return {
          title: 'No Internet Connection',
          description: 'Please check your connection and try again when you\'re back online.',
          action: 'Check connection and retry'
        };
      case 'network':
        return {
          title: 'Connection Problem',
          description: 'Unable to reach our servers. This might be a temporary issue.',
          action: 'Try again'
        };
      case 'server':
        return {
          title: 'Server Issue',
          description: 'Our servers are experiencing issues. Please try again in a moment.',
          action: 'Retry request'
        };
      case 'ratelimit':
        return {
          title: 'Too Many Requests',
          description: 'Please wait a moment before trying again.',
          action: 'Wait and retry'
        };
      default:
        return {
          title: 'Something Went Wrong',
          description: context 
            ? `We encountered an issue while ${context}. Please try again.`
            : 'An unexpected error occurred. Please try again.',
          action: 'Try again'
        };
    }
  };

  const { title, description, action } = getErrorMessage();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription>{description}</AlertDescription>
        </Alert>
        
        <div className="flex flex-col gap-2">
          {canRetry && onRetry && (
            <Button 
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full"
              data-testid="button-error-retry"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retrying...' : action}
            </Button>
          )}
          
          {onGoHome && (
            <Button 
              variant="outline"
              onClick={onGoHome}
              className="w-full"
              data-testid="button-error-home"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Home
            </Button>
          )}
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4">
            <summary className="text-sm text-muted-foreground cursor-pointer">
              Error Details (Development)
            </summary>
            <pre className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded overflow-auto">
              {error?.stack || error?.message || String(error)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}