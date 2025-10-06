import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, RefreshCw, Info, Clock, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import type { GenerationMetadata, GenerationAttempt } from "@shared/schema";

interface DiagnosticModalProps {
  debug: GenerationMetadata;
  onRetry?: () => void;
}

export function DiagnosticModal({ debug, onRetry }: DiagnosticModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedAttempts, setExpandedAttempts] = useState<Set<number>>(new Set());

  const toggleAttempt = (attemptNumber: number) => {
    setExpandedAttempts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(attemptNumber)) {
        newSet.delete(attemptNumber);
      } else {
        newSet.add(attemptNumber);
      }
      return newSet;
    });
  };

  const getSourceBadge = () => {
    switch (debug.source) {
      case 'ai':
        return (
          <Badge variant="default" className="bg-[hsl(var(--success-lighter))] text-[hsl(var(--success-text))] border-[hsl(var(--success-border))]">
            <CheckCircle className="w-3 h-3 mr-1" />
            AI Generated
          </Badge>
        );
      case 'retry-fallback':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <RefreshCw className="w-3 h-3 mr-1" />
            AI After Retry
          </Badge>
        );
      case 'fallback':
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
            <XCircle className="w-3 h-3 mr-1" />
            Template Fallback
          </Badge>
        );
    }
  };

  const getAttemptIcon = (attempt: GenerationAttempt) => {
    if (attempt.success) {
      return <CheckCircle className="w-4 h-4 text-[hsl(var(--success))]" />;
    } else {
      return <XCircle className="w-4 h-4 text-[hsl(var(--destructive))]" />;
    }
  };

  const getFailureReasonText = (reason?: string) => {
    switch (reason) {
      case 'timeout':
        return 'Request timed out';
      case 'policy_violation':
        return 'Policy violation detected';
      case 'parse_error':
        return 'JSON parsing failed';
      case 'api_error':
        return 'API request failed';
      default:
        return 'Unknown error';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs text-muted-foreground hover:text-foreground p-1 h-auto"
          data-testid="source-button"
        >
          <Info className="w-3 h-3 mr-1" />
          Source
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="diagnostic-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Generation Diagnostics
            {getSourceBadge()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Quick Summary */}
          <div className="bg-muted/50 p-3 rounded-lg" data-testid="diagnostic-summary">
            <h4 className="font-medium mb-2">Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Source:</span> {debug.finalSource === 'ai' ? 'AI Generated' : 'Template Fallback'}
              </div>
              <div>
                <span className="text-muted-foreground">Total Duration:</span> {formatDuration(debug.totalDuration)}
              </div>
              <div>
                <span className="text-muted-foreground">Attempts:</span> {debug.attempts.length}
              </div>
              <div>
                <span className="text-muted-foreground">Model:</span> {debug.modelVersion || 'N/A'}
              </div>
            </div>
            {debug.templateUsed && (
              <div className="mt-2 text-sm">
                <span className="text-muted-foreground">Template Used:</span> {debug.templateUsed}
              </div>
            )}
          </div>

          {/* Generation Timeline */}
          <div data-testid="generation-timeline">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Generation Timeline
            </h4>
            <div className="space-y-2">
              {debug.attempts.map((attempt, index) => (
                <div key={attempt.attemptNumber} className="border rounded-lg">
                  <Collapsible 
                    open={expandedAttempts.has(attempt.attemptNumber)}
                    onOpenChange={() => toggleAttempt(attempt.attemptNumber)}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer" data-testid={`attempt-${attempt.attemptNumber}`}>
                        <div className="flex items-center gap-3">
                          {getAttemptIcon(attempt)}
                          <div>
                            <div className="font-medium text-sm">
                              Attempt {attempt.attemptNumber} - {attempt.model}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {attempt.success ? 'Success' : getFailureReasonText(attempt.failureReason)} • {formatDuration(attempt.duration)}
                              {attempt.policyViolation && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  Policy Violation
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {expandedAttempts.has(attempt.attemptNumber) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-3 pb-3 border-t bg-muted/20">
                        <div className="pt-3 space-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Start Time:</span> {new Date(attempt.startTime).toLocaleString()}
                          </div>
                          {attempt.endTime && (
                            <div>
                              <span className="text-muted-foreground">End Time:</span> {new Date(attempt.endTime).toLocaleString()}
                            </div>
                          )}
                          {attempt.duration && (
                            <div>
                              <span className="text-muted-foreground">Duration:</span> {formatDuration(attempt.duration)}
                            </div>
                          )}
                          {attempt.parseError && (
                            <div>
                              <span className="text-muted-foreground">Parse Error:</span> 
                              <code className="ml-2 text-xs bg-muted p-1 rounded">{attempt.parseError}</code>
                            </div>
                          )}
                          {attempt.rawResponse && (
                            <div>
                              <span className="text-muted-foreground">Raw Response (first 500 chars):</span>
                              <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap">
                                {attempt.rawResponse}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-xs text-muted-foreground">
              Generated at {new Date(debug.generatedAt).toLocaleString()}
            </div>
            {onRetry && (
              <Button 
                onClick={() => {
                  setIsOpen(false);
                  onRetry();
                }} 
                variant="outline" 
                size="sm"
                data-testid="retry-button"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Regenerate
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}