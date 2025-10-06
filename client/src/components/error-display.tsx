import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorDisplayProps {
  error: any;
  onRetry?: () => void;
  title?: string;
  showIncidentId?: boolean;
}

/**
 * User-friendly error display component
 * Shows sanitized error messages and incident IDs when available
 */
export function ErrorDisplay({ 
  error, 
  onRetry, 
  title = "Something went wrong", 
  showIncidentId = true 
}: ErrorDisplayProps) {
  // Extract incident ID if present
  const incidentId = error?.incidentId;
  
  // Get user-friendly error message
  const getMessage = () => {
    if (error?.message) {
      const message = error.message.toLowerCase();
      
      // Handle network errors
      if (message.includes('offline') || message.includes('network')) {
        return "Please check your internet connection and try again.";
      }
      
      if (message.includes('timeout')) {
        return "The request took too long. Please try again.";
      }
      
      if (message.includes('500') || message.includes('server')) {
        return "We're experiencing technical difficulties. Please try again in a moment.";
      }
      
      if (message.includes('400') || message.includes('validation')) {
        return "Please check your input and try again.";
      }
      
      if (message.includes('404') || message.includes('not found')) {
        return "The requested information could not be found.";
      }
      
      if (message.includes('429') || message.includes('rate limit')) {
        return "Too many requests. Please wait a moment before trying again.";
      }
    }
    
    // Default fallback message
    return "An unexpected error occurred. Please try again.";
  };

  return (
    <Alert className="border-[hsl(var(--destructive-border))] bg-[hsl(var(--destructive-lighter))] dark:border-[hsl(var(--destructive-border))] dark:bg-[hsl(var(--destructive-light))]" data-testid="error-display">
      <AlertCircle className="h-4 w-4 text-[hsl(var(--destructive-text))] dark:text-[hsl(var(--destructive-text))]" />
      <AlertTitle className="text-[hsl(var(--destructive-text))] dark:text-[hsl(var(--destructive-text))]">
        {title}
      </AlertTitle>
      <AlertDescription className="text-[hsl(var(--destructive-text))] dark:text-[hsl(var(--destructive-text))]">
        <div className="space-y-3">
          <p>{getMessage()}</p>
          
          {showIncidentId && incidentId && (
            <div className="text-sm text-[hsl(var(--destructive-text))] dark:text-[hsl(var(--destructive-text))]">
              <p>Incident ID: <code className="bg-[hsl(var(--destructive-light))] dark:bg-[hsl(var(--destructive-lighter))] px-1 rounded text-xs">{incidentId}</code></p>
              <p className="text-xs mt-1">Please provide this ID if you contact support.</p>
            </div>
          )}
          
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="mt-2 border-[hsl(var(--destructive-border))] text-[hsl(var(--destructive-text))] hover:bg-[hsl(var(--destructive-light))] dark:border-[hsl(var(--destructive-border))] dark:text-[hsl(var(--destructive-text))] dark:hover:bg-[hsl(var(--destructive-lighter))]"
              data-testid="button-retry"
            >
              <RefreshCw className="mr-2 h-3 w-3" />
              Try Again
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}