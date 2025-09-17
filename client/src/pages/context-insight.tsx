import { useParams, Link } from "wouter";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useContextMirror } from "@/hooks/useContextMirror";
import { useToast } from "@/hooks/use-toast";
import type { Assessment, ContextProfile, ContextMirror } from "../../../shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Brain, Compass, TrendingUp, MessageSquare, FileText, CheckCircle, AlertTriangle, ListTodo, Shield, Copy } from "lucide-react";
import { generateContextBrief } from "@/lib/pdf-generator";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { LoadingTips } from "@/components/context-mirror/LoadingTips";
import { ContextReflection } from "@/components/context-mirror/ContextReflection";
import { violatesPolicy, sanitizeInsight } from "@/components/context-mirror/sanitizeInsight";


function EducationalLoader() {
  return (
    <div className="space-y-6 py-8" data-testid="educational-loader">
      <div className="flex flex-col items-center justify-center space-y-4">
        <LoadingTips intervalMs={2500} />
      </div>
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          We're analyzing your specific context to provide tailored insights
        </p>
      </div>
    </div>
  );
}

interface NarrativeReflection {
  insight: string;
  disclaimer: string;
}

// Component for Context Mirror display (handles both legacy and 2.0 formats)
function ContextMirrorCard({ mirror }: { mirror: ContextMirror }) {
  if (!mirror.insight && !mirror.headline) {
    // No content available
    return (
      <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
        <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        <AlertDescription className="text-orange-700 dark:text-orange-300">
          This reflection is in legacy format. Please refresh the page to generate the updated narrative format.
        </AlertDescription>
      </Alert>
    );
  }

  // Use the enhanced ContextReflection component that handles both formats
  return <ContextReflection mirror={mirror} />;
}

function ErrorFallback({ error }: { error: Error }) {
  const isLLMFailure = error.message.includes('generation') || error.message.includes('AI') || error.message.includes('model');
  
  return (
    <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
      <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
      <AlertDescription className="text-orange-700 dark:text-orange-300">
        {isLLMFailure ? (
          <>
            Advanced analysis unavailable. Using rule-based Context Mirror framework to provide structured insights from your assessment responses.
            <br />
            <span className="text-xs opacity-75">The structured approach still offers valuable strategic reflection for leadership discussion.</span>
          </>
        ) : (
          <>
            We couldn't generate the insight. Showing a concise rule-based summary.
            <br />
            <span className="text-xs opacity-75">Error: {error.message}</span>
          </>
        )}
      </AlertDescription>
    </Alert>
  );
}

function renderDiscussionPrompts(contextMirror: ContextMirror | null) {
  // Check if we have Context Mirror 2.0 data with specific actions and watchouts
  const hasActions = contextMirror?.actions && contextMirror.actions.length > 0;
  const hasWatchouts = contextMirror?.watchouts && contextMirror.watchouts.length > 0;
  
  if (hasActions || hasWatchouts) {
    // Generate targeted prompts based on actual context mirror data
    const prompts = [];
    
    // Prompt 1: Focus on prioritizing actions
    if (hasActions) {
      prompts.push({
        id: "action-priority",
        text: `Of the ${contextMirror.actions!.length} leadership actions identified, which one could deliver the clearest <strong>customer impact</strong> within 60-90 days?`
      });
    } else {
      prompts.push({
        id: "generic-advantage",
        text: `Which <strong>advantage</strong> in the reflection could power an early win, and which <strong>constraint</strong> would most undermine it?`
      });
    }
    
    // Prompt 2: Focus on de-risking based on watchouts
    if (hasWatchouts) {
      prompts.push({
        id: "watchout-mitigation",
        text: `Looking at the watch-outs identified, what <strong>specific guardrails</strong> (rollback plans, monitoring, approval gates) should be in place before moving forward?`
      });
    } else {
      prompts.push({
        id: "generic-impact",
        text: `Where would <strong>customer-visible impact</strong> be clearest within 60–90 days without increasing risk?`
      });
    }
    
    // Prompt 3: Focus on balancing actions against watchouts
    if (hasActions && hasWatchouts) {
      prompts.push({
        id: "action-watchout-balance",
        text: `Which leadership action would be most constrained by the watch-outs, and how could you <strong>sequence initiatives</strong> to minimize that tension?`
      });
    } else {
      prompts.push({
        id: "generic-guardrails",
        text: `What <strong>de-risking guardrails</strong> (Human-in-the-Loop, rollback path, audit trail) should be present from day one?`
      });
    }
    
    return (
      <ul className="space-y-4 pl-1">
        {prompts.map((prompt, index) => (
          <li key={prompt.id} className="flex items-start gap-3 text-sm text-foreground leading-relaxed" data-testid={`discussion-prompt-${index + 1}`}>
            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
            <span dangerouslySetInnerHTML={{ __html: prompt.text }} />
          </li>
        ))}
      </ul>
    );
  }
  
  // Fallback to generic prompts when no specific data is available
  return (
    <ul className="space-y-4 pl-1">
      <li className="flex items-start gap-3 text-sm text-foreground leading-relaxed" data-testid="discussion-prompt-1">
        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
        <span>Which <strong>advantage</strong> in the reflection could power an early win, and which <strong>constraint</strong> would most undermine it?</span>
      </li>
      <li className="flex items-start gap-3 text-sm text-foreground leading-relaxed" data-testid="discussion-prompt-2">
        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
        <span>Where would <strong>customer-visible impact</strong> be clearest within 60–90 days without increasing risk?</span>
      </li>
      <li className="flex items-start gap-3 text-sm text-foreground leading-relaxed" data-testid="discussion-prompt-3">
        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
        <span>What <strong>de-risking guardrails</strong> (Human-in-the-Loop, rollback path, audit trail) should be present from day one?</span>
      </li>
    </ul>
  );
}

function ContextInsightPageContent() {
  const { id } = useParams();
  const { data, isLoading, isError, error, generateMirror, reset } = useContextMirror();
  const { toast } = useToast();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // Generate the context mirror when the component mounts and we have an id
  useEffect(() => {
    if (id && !data && !isLoading && !isError) {
      generateMirror(id);
    }
  }, [id, data, isLoading, isError, generateMirror]);
  
  // Fetch the full assessment data to get contextProfile
  const { data: assessmentData, isLoading: assessmentLoading } = useQuery<Assessment>({
    queryKey: ['/api/assessments', id],
    enabled: !!id,
  });

  const handleDownloadBrief = async () => {
    if (!data || !assessmentData || !id || !data.insight) {
      toast({
        title: "Cannot generate PDF",
        description: "Missing required data. Please try refreshing the page.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingPDF(true);
    
    try {
      await generateContextBrief({
        insight: data.insight,
        disclaimer: data.disclaimer,
        contextProfile: assessmentData.contextProfile as ContextProfile,
        assessmentId: id,
      });
      
      toast({
        title: "PDF downloaded successfully",
        description: "Your CORTEX context brief has been saved to your downloads folder.",
      });
    } catch (error) {
      console.error('Failed to generate context brief:', error);
      
      // Enhanced error handling with incidentId extraction
      let errorMessage = 'An unexpected error occurred';
      let incidentId: string | null = null;
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Try to extract incidentId from error message or response
        const incidentIdMatch = error.message.match(/incident[Ii]d:\s*([a-zA-Z0-9-]+)/);
        if (incidentIdMatch) {
          incidentId = incidentIdMatch[1];
        }
        
        // Check if this is a fetch error with a response
        if ((error as any).response) {
          try {
            const response = (error as any).response;
            if (response.incidentId) {
              incidentId = response.incidentId;
            }
          } catch (parseError) {
            // Ignore parsing errors, continue with basic error handling
          }
        }
      }
      
      // Construct enhanced error description
      let description = errorMessage;
      if (incidentId) {
        description += `\n\nIncident ID: ${incidentId}\nPlease reference this ID when contacting support.`;
      } else if (errorMessage.includes('contact support')) {
        description = errorMessage + '\n\nTip: Try refreshing the page or check your internet connection.';
      }
      
      toast({
        title: "Failed to generate PDF",
        description,
        variant: "destructive",
        duration: 6000, // Show longer for error messages with more detail
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <section 
      className="max-w-7xl mx-auto px-6 py-10 space-y-8"
      data-testid="context-insight-page"
    >
      {/* Header */}
      <header className="space-y-3 pb-2">
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
          Context Reflection
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          Strategic analysis tailored to your organizational context. Executive insights to inform leadership discussion.
        </p>
      </header>

      {/* Main Content - Two Column Layout */}
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left Card: Context Reflection (Main) - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Card className="w-full" data-testid="card-context-reflection">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Brain className="h-5 w-5 text-primary" />
                  Context Reflection
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      if (data?.insight) {
                        navigator.clipboard.writeText(data.insight + "\n\n" + data.disclaimer);
                      }
                    }}
                    disabled={!data?.insight}
                    data-testid="button-copy-reflection"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Executive narrative analyzing what your organizational context enables and constrains, with implications for early AI strategy.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <EducationalLoader />
              ) : isError && error ? (
                <ErrorFallback error={error} />
              ) : data ? (
                <div className="animate-in fade-in duration-300">
                  <ContextMirrorCard mirror={data} />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* Right Card: Discussion Prompts */}
        <div className="lg:col-span-1">
          <Card className="h-fit" data-testid="card-discussion-prompts">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <MessageSquare className="h-5 w-5 text-primary" />
                Discussion Prompts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-0">
              <div className="space-y-5">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Strategic questions for executive discussion based on your context reflection:
                </p>
                {renderDiscussionPrompts(data)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer Actions */}
      <footer className="flex items-center justify-end gap-4 pt-8 border-t" data-testid="footer-actions">
        <Button
          variant="secondary"
          onClick={() => {
            if (!data) return;
            // Save to Action Plan functionality
            const contextData = {
              headline: (data as any).headline,
              actions: (data as any).actions,
              watchouts: (data as any).watchouts,
              scenarios: (data as any).scenarios
            };
            
            // Store in localStorage for now (future: integrate with action plan service)
            const savedPlans = JSON.parse(localStorage.getItem('cortex_action_plans') || '[]');
            const newPlan = {
              id: Date.now().toString(),
              assessmentId: id,
              timestamp: new Date().toISOString(),
              ...contextData
            };
            savedPlans.push(newPlan);
            localStorage.setItem('cortex_action_plans', JSON.stringify(savedPlans));
            
            toast({
              title: "Added to Action Plan",
              description: "Context reflection and next steps saved for future reference."
            });
          }}
          disabled={!data || isLoading}
          data-testid="button-save-to-plan"
        >
          Save to Plan
        </Button>
        <Button 
          variant="outline" 
          onClick={handleDownloadBrief}
          disabled={!data || isLoading || !assessmentData || assessmentLoading || isGeneratingPDF}
          data-testid="button-download-brief"
        >
          {isGeneratingPDF ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Download Brief
            </>
          )}
        </Button>
        <Link to={`/pulse/${id}`} data-testid="link-proceed-pulse">
          <Button size="default" data-testid="button-proceed-pulse">
            Continue to Pulse Check
          </Button>
        </Link>
      </footer>
    </section>
  );
}

export default function ContextInsightPage() {
  return (
    <ProtectedRoute requireAuth={true}>
      <ContextInsightPageContent />
    </ProtectedRoute>
  );
}