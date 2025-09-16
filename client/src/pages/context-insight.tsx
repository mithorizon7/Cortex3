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
import { AlertCircle, Loader2, Brain, Compass, TrendingUp, MessageSquare, FileText } from "lucide-react";
import { generateContextBrief } from "@/lib/pdf-generator";
import { ProtectedRoute } from "@/components/auth/protected-route";


function EducationalLoader() {
  const [currentTip, setCurrentTip] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const educationalTips = [
    "Strategic insight: Rapid AI advancement requires continuous organizational capability assessment and adaptive strategy development.",
    "Leadership consideration: Integration complexity scales with organizational size, regulatory requirements, and stakeholder diversity.",
    "Executive advantage: Organizations with established data governance frameworks typically achieve faster, more sustainable AI deployment outcomes.",
    "Context-driven approach: High-regulation environments require enhanced guardrails but provide clearer compliance frameworks for strategic decision-making.",
    "Foundational principle: AI readiness encompasses cultural transformation, process optimization, and strategic alignment—not just technical capabilities.",
    "Proven methodology: Strategic wins in controlled environments build organizational confidence and expertise before addressing complex enterprise use cases.",
    "Implementation best practice: Human-in-the-loop approaches establish trust, reduce risk, and enable continuous learning during AI transformation."
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
  const { strengths, fragilities, whatWorks } = contextMirror;
  
  // Synthesize strengths into organizational positioning
  const strengthText = strengths.length > 0 
    ? strengths.slice(0, 2).join(' and ') + (strengths.length > 2 ? ', among other key capabilities' : '')
    : 'established operational foundations';
    
  // Synthesize fragilities into risk landscape  
  const fragilityText = fragilities.length > 0
    ? fragilities.slice(0, 2).join(' while also managing ') + (fragilities.length > 2 ? ', among other strategic considerations' : '')
    : 'typical organizational complexity';
    
  // Synthesize what works into starting approaches
  const startingApproaches = whatWorks.length > 0
    ? whatWorks.slice(0, 2).join(' and ') + (whatWorks.length > 2 ? ', among other proven methodologies' : '')
    : 'focusing on incremental value delivery and capability building';

  const organizationContext = `Your organization operates with ${strengthText}. However, you're also navigating ${fragilityText}. This combination creates a specific context that shapes both your opportunities and the considerations needed for successful AI adoption.`;
  
  const strategicImplications = `Organizations with this profile often find that their established strengths can accelerate AI initiatives when properly leveraged, while their operational constraints require thoughtful planning and phased implementation. This context typically favors approaches that build on existing capabilities while establishing clear governance frameworks early in the journey.`;
  
  const practicalNext = `Where momentum usually starts for organizations like yours: by ${startingApproaches}. These moves help establish confidence and internal expertise while respecting your operational requirements and building toward more strategic AI capabilities over time.`;
  
  return {
    organizationContext,
    strategicImplications, 
    practicalNext
  };
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

function ErrorFallback({ error }: { error: Error }) {
  return (
    <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
      <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
      <AlertDescription className="text-orange-700 dark:text-orange-300">
        We couldn't generate the insight. Showing a concise rule-based summary.
        <br />
        <span className="text-xs opacity-75">Error: {error.message}</span>
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
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Left Card: What your profile signals */}
        <Card className="h-fit" data-testid="card-profile-signals">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Brain className="h-5 w-5 text-primary" />
              What your profile signals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 pt-0">
            {isLoading ? (
              <EducationalLoader />
            ) : isError && error ? (
              <ErrorFallback error={error} />
            ) : data ? (
              <div className="animate-in fade-in duration-300">
                <NarrativeInsight content={composeNarrative(data)} />
              </div>
            ) : null}
            
            {data?.disclaimer && (
              <p className="text-xs text-muted-foreground pt-4 border-t">
                {data.disclaimer}
              </p>
            )}
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
                Use these strategic questions to guide leadership discussion and identify actionable priorities:
              </p>
              <ul className="space-y-4 pl-1">
                <li className="flex items-start gap-3 text-sm text-foreground leading-relaxed" data-testid="discussion-note-1">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Identify one organizational strength that creates AI opportunity and one constraint that requires strategic attention.</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-foreground leading-relaxed" data-testid="discussion-note-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Which contextual factor would most significantly impact customer trust or brand reputation if mismanaged during AI implementation?</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-foreground leading-relaxed" data-testid="discussion-note-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>What is the most actionable next step to leverage your organizational context for AI success?</span>
                </li>
              </ul>
            </div>
            
            <div className="pt-6 border-t">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs" data-testid="badge-no-pii">Privacy Protected</Badge>
                <Badge variant="secondary" className="text-xs" data-testid="badge-no-benchmarks">No External Comparisons</Badge>
                <Badge variant="secondary" className="text-xs" data-testid="badge-context-based">Context-Based Analysis</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
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