import { useParams, Link } from "wouter";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSituationAssessment } from "@/hooks/useSituationAssessment";
import { useToast } from "@/hooks/use-toast";
import type { Assessment, ContextProfile, SituationAssessment, SituationAssessmentWithDiagnostics } from "../../../shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Brain, FileText, CheckCircle, AlertTriangle, Copy, ArrowRight, ChevronRight } from "lucide-react";
import { generateSituationAssessmentBrief, type SituationAssessmentData } from "@/lib/pdf-generator";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { LoadingTips } from "@/components/situation-assessment/LoadingTips";
import { SituationReflection } from "@/components/situation-assessment/SituationReflection";
import { violatesPolicy, sanitizeInsight } from "@/components/situation-assessment/sanitizeInsight";


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

// Component for Situation Assessment display (handles both legacy and 2.0 formats)  
function SituationAssessmentCard({ mirror, onRetry }: { mirror: SituationAssessment | SituationAssessmentWithDiagnostics, onRetry?: () => void }) {
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

  // Check if this has diagnostic information
  if ('debug' in mirror) {
    return <SituationReflection mirrorWithDiagnostics={mirror as SituationAssessmentWithDiagnostics} onRetry={onRetry} />;
  }

  // Use the enhanced SituationReflection component for regular mirror format
  return <SituationReflection mirror={mirror as SituationAssessment} />;
}

function ErrorFallback({ error }: { error: Error }) {
  const isLLMFailure = error.message.includes('generation') || error.message.includes('AI') || error.message.includes('model');
  
  return (
    <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
      <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
      <AlertDescription className="text-orange-700 dark:text-orange-300">
        {isLLMFailure ? (
          <>
            Advanced analysis unavailable. Using rule-based Situation Assessment framework to provide structured insights from your assessment responses.
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

function ContextInsightPageContent() {
  const { id } = useParams();
  const { data, isLoading, isError, error, generateSituationAssessment, reset } = useSituationAssessment();
  const { toast } = useToast();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // Generate the context mirror when the component mounts and we have an id
  useEffect(() => {
    if (id && !data && !isLoading && !isError) {
      generateSituationAssessment(id);
    }
  }, [id, data, isLoading, isError, generateSituationAssessment]);
  
  // Fetch the full assessment data to get contextProfile
  const { data: assessmentData, isLoading: assessmentLoading } = useQuery<Assessment>({
    queryKey: ['/api/assessments', id],
    enabled: !!id,
  });

  const handleDownloadBrief = async () => {
    if (!data || !assessmentData || !id) {
      toast({
        title: "Cannot generate PDF",
        description: "Missing required data. Please try refreshing the page.",
        variant: "destructive",
      });
      return;
    }
    
    // Check for Context Mirror 2.0 data or legacy format
    const hasContext2Data = data.headline || data.actions?.length || data.watchouts?.length;
    const hasLegacyData = data.insight && data.disclaimer;
    
    if (!hasContext2Data && !hasLegacyData) {
      toast({
        title: "Cannot generate PDF", 
        description: "Context Mirror data is not available. Please wait for generation to complete.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingPDF(true);
    
    try {
      // Prepare Situation Assessment data for PDF generation
      const situationAssessmentData: SituationAssessmentData = {
        contextProfile: assessmentData.contextProfile as ContextProfile,
        assessmentId: id,
        // Legacy format for backward compatibility
        insight: data.insight,
        disclaimer: data.disclaimer,
        // Situation Assessment 2.0 format - the full personalized data
        mirror: hasContext2Data ? {
          headline: data.headline,
          insight: data.insight,
          actions: data.actions,
          watchouts: data.watchouts,
          scenarios: data.scenarios,
          disclaimer: data.disclaimer
        } : undefined
      };
      
      await generateSituationAssessmentBrief(situationAssessmentData);
      
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
      className="max-w-5xl mx-auto px-6 py-10 space-y-8"
      data-testid="context-insight-page"
    >
      {/* Progress Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>Context Profile</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Situation Assessment</span>
          <ChevronRight className="h-4 w-4" />
          <span>Pulse Check</span>
        </div>
        <Badge variant="secondary" className="bg-[hsl(var(--success-lighter))] text-[hsl(var(--success-text))] border-[hsl(var(--success-border))] dark:bg-[hsl(var(--success-light))] dark:text-[hsl(var(--success-text))] dark:border-[hsl(var(--success-border))]">
          <CheckCircle className="h-3 w-3 mr-1" />
          Stage 2 of 3
        </Badge>
      </div>

      {/* Header */}
      <header className="space-y-4 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3 flex-1 min-w-0">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Situation Assessment
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
              Strategic analysis tailored to your organizational context
            </p>
          </div>
          {data && (
            <Badge variant="outline" className="bg-[hsl(var(--success-lighter))] border-[hsl(var(--success-border))] text-[hsl(var(--success-text))] dark:bg-[hsl(var(--success-light))] dark:border-[hsl(var(--success-border))] dark:text-[hsl(var(--success-text))] flex-shrink-0">
              <CheckCircle className="h-3 w-3 mr-1" />
              Complete
            </Badge>
          )}
        </div>
      </header>

      {/* Main Content - Full Width */}
      <div className="space-y-6">
        <Card className="w-full border-2" data-testid="card-situation-assessment">
          <CardHeader className="pb-6 space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <span>Your Strategic Context</span>
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  if (data?.insight) {
                    navigator.clipboard.writeText(data.insight + "\n\n" + data.disclaimer);
                    toast({
                      title: "Copied to clipboard",
                      description: "Situation assessment text has been copied."
                    });
                  }
                }}
                disabled={!data?.insight}
                data-testid="button-copy-reflection"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Text
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-8">
            {isLoading ? (
              <EducationalLoader />
            ) : isError && error ? (
              <ErrorFallback error={error} />
            ) : data ? (
              <div className="animate-in fade-in duration-500">
                <SituationAssessmentCard mirror={data} onRetry={() => generateSituationAssessment(id!)} />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Footer Actions */}
      <footer className="space-y-6 pt-8" data-testid="footer-actions">
        <div className="border-t pt-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground">Ready for the next step?</h3>
              <p className="text-sm text-muted-foreground">
                Continue to Pulse Check to assess your current AI readiness across six domains
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleDownloadBrief}
                disabled={!data || isLoading || !assessmentData || assessmentLoading || isGeneratingPDF}
                data-testid="button-download-brief"
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Download PDF
                  </>
                )}
              </Button>
              <Link to={`/pulse/${id}`} data-testid="link-proceed-pulse">
                <Button size="lg" className="gap-2" data-testid="button-proceed-pulse">
                  Continue to Pulse Check
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
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