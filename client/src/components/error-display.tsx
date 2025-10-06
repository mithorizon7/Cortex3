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
    <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950" data-testid="error-display">
      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
      <AlertTitle className="text-red-800 dark:text-red-200">
        {title}
      </AlertTitle>
      <AlertDescription className="text-red-700 dark:text-red-300">
        <div className="space-y-3">
          <p>{getMessage()}</p>
          
          {showIncidentId && incidentId && (
            <div className="text-sm text-red-600 dark:text-red-400">
              <p>Incident ID: <code className="bg-red-100 dark:bg-red-900 px-1 rounded text-xs">{incidentId}</code></p>
              <p className="text-xs mt-1">Please provide this ID if you contact support.</p>
            </div>
          )}
          
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="mt-2 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900"
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