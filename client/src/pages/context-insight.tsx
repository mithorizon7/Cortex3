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
import { AlertCircle, Loader2, Brain, Compass, TrendingUp, MessageSquare, FileText, CheckCircle, AlertTriangle, ListTodo, Shield } from "lucide-react";
import { generateContextBrief } from "@/lib/pdf-generator";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { enforceConstraints, countNarrativeWords, truncateNarrativeContent, sanitizeContent } from "@/lib/context-constraints";


function EducationalLoader() {
  const [currentTip, setCurrentTip] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const educationalTips = [
    "Context Mirror methodology: Organizations tend to have unique combinations of strengths, fragilities, and working approaches that shape their strategic options and implementation paths.",
    "Probability-based analysis: Leadership insights often emerge from patterns rather than absolute predictions—each organizational context presents different likelihood scenarios for success.",
    "Educational approach: Board-ready summaries under 220 words help leaders focus on actionable insights rather than overwhelming detail or theoretical frameworks.",
    "Constraint-driven value: Avoiding vendor names and benchmark comparisons often leads to more strategic thinking about organizational capabilities and contextual fit.",
    "Structured reflection: Three strengths, three fragilities, and two working approaches typically provide sufficient depth for executive decision-making without analysis paralysis.",
    "Executive coaching methodology: Questions that surface organizational context often prove more valuable than prescriptive recommendations for complex strategic initiatives.",
    "Rule-based fallback: When advanced analysis is unavailable, structured frameworks still tend to provide useful strategic reflection for leadership teams."
  ];

  const analysisSteps = [
    "Analyzing your answers...",
    "Assessing regulatory environment...",
    "Evaluating data sensitivity...",
    "Reviewing operational constraints...",
    "Synthesizing strategic context..."
  ];

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % educationalTips.length);
    }, 2000);

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % analysisSteps.length);
    }, 1500);

    return () => {
      clearInterval(tipInterval);
      clearInterval(stepInterval);
    };
  }, []);

  return (
    <div className="space-y-6 py-8" data-testid="educational-loader">
      {/* Analysis Status */}
      <div className="flex items-center justify-center space-x-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-lg font-medium text-foreground" aria-live="polite">
          {analysisSteps[currentStep]}
        </p>
      </div>

      {/* Progress Steps */}
      <div 
        className="flex items-center justify-center space-x-2"
        role="progressbar"
        aria-valuenow={((currentStep + 1) / analysisSteps.length) * 100}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Analysis progress: step ${currentStep + 1} of ${analysisSteps.length}`}
      >
        {analysisSteps.map((_, index) => (
          <div
            key={index}
            className={`h-2 w-8 rounded-full transition-colors duration-300 ${
              index <= currentStep 
                ? 'bg-primary dark:bg-primary/90' 
                : 'bg-muted dark:bg-muted/60'
            }`}
            data-testid={`progress-step-${index}`}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Educational Tip */}
      <div className="border-l-4 border-primary/30 pl-6 py-4 bg-primary/10 dark:bg-primary/5 rounded-r-lg">
        <p 
          className="text-sm text-foreground/80 italic leading-relaxed min-h-[2.5rem] flex items-center font-medium"
          aria-live="polite"
          data-testid="educational-tip"
          role="status"
          aria-label="Educational insight"
        >
          {educationalTips[currentTip]}
        </p>
      </div>

      {/* Reassurance */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          We're analyzing your specific context to provide tailored insights
        </p>
      </div>
    </div>
  );
}

interface NarrativeContent {
  organizationContext: string;
  strategicImplications: string; 
  practicalNext: string;
}

function composeNarrative(contextMirror: ContextMirror): NarrativeContent {
  // First apply constraint enforcement before narrative composition
  const constraintResult = enforceConstraints(contextMirror);
  const { processed } = constraintResult;
  const { strengths, fragilities, whatWorks } = processed;
  
  // Note: Context Mirror methodology maintains board-ready brevity (under 220 words total)
  // Using probability-based language to reflect executive coaching approach
  
  // Sanitize individual elements before composing narrative
  const sanitizedStrengths = strengths.map(s => sanitizeContent(s).sanitized);
  const sanitizedFragilities = fragilities.map(f => sanitizeContent(f).sanitized);
  const sanitizedWhatWorks = whatWorks.map(w => sanitizeContent(w).sanitized);
  
  // Synthesize strengths into organizational positioning
  const strengthText = sanitizedStrengths.length > 0 
    ? sanitizedStrengths.slice(0, 2).join(' and ') + (sanitizedStrengths.length > 2 ? ', among other capabilities' : '')
    : 'established operational foundations';
    
  // Synthesize fragilities into risk landscape  
  const fragilityText = sanitizedFragilities.length > 0
    ? sanitizedFragilities.slice(0, 2).join(' while also navigating ') + (sanitizedFragilities.length > 2 ? ', among other considerations' : '')
    : 'typical organizational complexity';
    
  // Synthesize what works into starting approaches
  const startingApproaches = sanitizedWhatWorks.length > 0
    ? sanitizedWhatWorks.slice(0, 2).join(' and ') + (sanitizedWhatWorks.length > 2 ? ', among other approaches' : '')
    : 'focusing on incremental value delivery and capability building';

  const organizationContext = `Your organization tends to operate with ${strengthText}. However, you're likely also ${fragilityText}. This combination often creates a specific context that shapes both your opportunities and the strategic considerations for successful implementation.`;
  
  const strategicImplications = `Organizations with similar profiles often find that their established strengths can accelerate strategic initiatives when properly leveraged, while their operational considerations typically require thoughtful planning and phased approaches. This context often favors methodologies that build on existing capabilities while establishing appropriate governance early in the process.`;
  
  const practicalNext = `Where momentum typically starts for organizations like yours: by ${startingApproaches}. These approaches tend to establish confidence and internal expertise while respecting your operational requirements and building toward more strategic capabilities over time.`;
  
  const rawNarrative = {
    organizationContext,
    strategicImplications, 
    practicalNext
  };
  
  // Apply word limit enforcement
  const { truncated } = truncateNarrativeContent(rawNarrative, processed.disclaimer, 220);
  return truncated;
}

function NarrativeInsight({ content }: { content: NarrativeContent }) {
  return (
    <div className="space-y-6" data-testid="narrative-insight">
      {/* Organization Context */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Your Organization</h3>
        </div>
        <p className="text-sm text-foreground leading-relaxed pl-7" data-testid="organization-context">
          {content.organizationContext}
        </p>
      </div>

      {/* Strategic Implications */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Compass className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">What This Often Means</h3>
        </div>
        <p className="text-sm text-foreground leading-relaxed pl-7" data-testid="strategic-implications">
          {content.strategicImplications}
        </p>
      </div>

      {/* Practical Next Steps */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Where Momentum Usually Starts</h3>
        </div>
        <p className="text-sm text-foreground leading-relaxed pl-7" data-testid="practical-next">
          {content.practicalNext}
        </p>
      </div>
    </div>
  );
}

// New component for structured 3-3-2 display
function StructuredMirror({ mirror }: { mirror: ContextMirror }) {
  const constraintResult = enforceConstraints(mirror);
  const { processed, wordCount, wasTruncated, wasRedacted, structureValid, issues } = constraintResult;
  
  return (
    <div className="space-y-6" data-testid="structured-mirror">
      {/* Structure validation and constraint warnings */}
      {(!structureValid || wasTruncated || wasRedacted) && (
        <div className="space-y-2">
          {!structureValid && (
            <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-red-700 dark:text-red-300">
                Structure issues: {issues.join(', ')}
              </AlertDescription>
            </Alert>
          )}
          {wasRedacted && (
            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
              <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                Content sanitized: Vendor names and benchmarks replaced with generic categories per methodology requirements.
              </AlertDescription>
            </Alert>
          )}
          {wasTruncated && (
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-700 dark:text-amber-300">
                Content truncated to meet 220-word methodology requirement.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
      
      {/* Word count indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ListTodo className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Structured Format</span>
        </div>
        <Badge 
          variant={wordCount <= 220 ? "secondary" : "destructive"} 
          className="text-xs"
          data-testid="word-count-badge"
        >
          {wordCount}/220 words
        </Badge>
      </div>

      {/* Three Strengths */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          <h3 className="text-lg font-semibold text-foreground">Three Organizational Strengths</h3>
        </div>
        <ul className="space-y-3 pl-7">
          {processed.strengths.map((strength, index) => (
            <li key={index} className="flex items-start gap-3 text-sm text-foreground leading-relaxed" data-testid={`strength-${index}`}>
              <div className="w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-400 mt-2 flex-shrink-0" />
              <span>{strength}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Three Fragilities */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          <h3 className="text-lg font-semibold text-foreground">Three Organizational Fragilities</h3>
        </div>
        <ul className="space-y-3 pl-7">
          {processed.fragilities.map((fragility, index) => (
            <li key={index} className="flex items-start gap-3 text-sm text-foreground leading-relaxed" data-testid={`fragility-${index}`}>
              <div className="w-1.5 h-1.5 rounded-full bg-orange-600 dark:bg-orange-400 mt-2 flex-shrink-0" />
              <span>{fragility}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Two What Works */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-foreground">Two Proven Approaches</h3>
        </div>
        <ul className="space-y-3 pl-7">
          {processed.whatWorks.map((work, index) => (
            <li key={index} className="flex items-start gap-3 text-sm text-foreground leading-relaxed" data-testid={`what-works-${index}`}>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 mt-2 flex-shrink-0" />
              <span>{work}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
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
    if (!data || !assessmentData || !id) {
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
        strengths: data.strengths,
        fragilities: data.fragilities,
        whatWorks: data.whatWorks,
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
          Context Insight
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          Strategic reflection tailored to your organizational context. Educational insights to inform leadership discussion.
        </p>
      </header>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Primary Structured View - Full Width */}
        <Card className="w-full" data-testid="card-structured-mirror">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-xl">
                <ListTodo className="h-5 w-5 text-primary" />
                Context Mirror (3-3-2 Structure)
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs" data-testid="badge-methodology">Methodology Compliant</Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Strategic reflection structured as exactly three strengths, three fragilities, and two proven approaches—sanitized and word-limited per Context Mirror methodology.
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <EducationalLoader />
            ) : isError && error ? (
              <ErrorFallback error={error} />
            ) : data ? (
              <div className="animate-in fade-in duration-300">
                <StructuredMirror mirror={data} />
              </div>
            ) : null}
            
            {data?.disclaimer && (
              <div className="pt-6 border-t">
                <p className="text-xs text-muted-foreground">
                  <strong>Methodology Note:</strong> {sanitizeContent(data.disclaimer).sanitized}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Secondary Content - Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left Card: Narrative View */}
          <Card className="h-fit" data-testid="card-profile-signals">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Brain className="h-5 w-5 text-primary" />
                Executive Summary
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Narrative synthesis of your organizational context for leadership discussion.
              </p>
            </CardHeader>
            <CardContent className="space-y-6 pt-0">
              {isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">Generating narrative...</p>
                </div>
              ) : isError && error ? (
                <ErrorFallback error={error} />
              ) : data ? (
                <div className="animate-in fade-in duration-300">
                  <NarrativeInsight content={composeNarrative(data)} />
                </div>
              ) : null}
            </CardContent>
          </Card>

        {/* Right Card: Notes for discussion */}
        <Card className="h-fit" data-testid="card-discussion-notes">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <MessageSquare className="h-5 w-5 text-primary" />
              Leadership discussion guide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-0">
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Context Mirror questions for executive discussion—designed to surface strategic implications from your organizational profile:
              </p>
              <ul className="space-y-4 pl-1">
                <li className="flex items-start gap-3 text-sm text-foreground leading-relaxed" data-testid="discussion-note-1">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>From your three organizational strengths, which one creates the highest-probability pathway for initial strategic value, and which fragility requires immediate attention to protect that pathway?</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-foreground leading-relaxed" data-testid="discussion-note-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Of your identified organizational fragilities, which one would most likely amplify reputational or operational risk if not addressed during strategic initiatives?</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-foreground leading-relaxed" data-testid="discussion-note-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Which of your 'what works' approaches offers the most transferable foundation for scaling strategic capabilities across your organization?</span>
                </li>
              </ul>
            </div>
            
            <div className="pt-6 border-t">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs" data-testid="badge-no-vendor-names">No Vendor Names</Badge>
                <Badge variant="secondary" className="text-xs" data-testid="badge-no-benchmarks">No Benchmarks</Badge>
                <Badge variant="secondary" className="text-xs" data-testid="badge-probability-based">Probability-Based</Badge>
                <Badge variant="secondary" className="text-xs" data-testid="badge-word-limit">Under 220 Words</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Footer Actions */}
      <footer className="flex items-center justify-end gap-4 pt-8 border-t" data-testid="footer-actions">
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