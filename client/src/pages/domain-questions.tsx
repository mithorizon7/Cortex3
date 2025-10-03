import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ProgressHeader from "@/components/progress-header";
import OfflineBanner from "@/components/offline-banner";
import { ErrorFallback } from "@/components/error-boundary";
import { QuestionSkeleton } from "@/components/skeleton-loader";
import { AppHeader } from "@/components/navigation/app-header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { PULSE_QUESTIONS, CORTEX_PILLARS } from "@/lib/cortex";
import { apiRequest, getNetworkError } from "@/lib/queryClient";
import { getEnhancedErrorMessage } from "@/lib/error-utils";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, PlayCircle, Circle, Clock, Target } from "lucide-react";

const DOMAIN_ORDER = ['C', 'O', 'R', 'T', 'E', 'X'];

// Group questions by pillar for domain-based flow
const DOMAIN_GROUPS = [
  { pillar: 'C', questions: PULSE_QUESTIONS.filter(q => q.pillar === 'C') },
  { pillar: 'O', questions: PULSE_QUESTIONS.filter(q => q.pillar === 'O') },
  { pillar: 'R', questions: PULSE_QUESTIONS.filter(q => q.pillar === 'R') },
  { pillar: 'T', questions: PULSE_QUESTIONS.filter(q => q.pillar === 'T') },
  { pillar: 'E', questions: PULSE_QUESTIONS.filter(q => q.pillar === 'E') },
  { pillar: 'X', questions: PULSE_QUESTIONS.filter(q => q.pillar === 'X') }
];

export default function DomainQuestionsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { domain, id: assessmentId } = useParams();
  
  const [responses, setResponses] = useState<Record<string, number>>({});
  
  const { data: assessment, isLoading } = useQuery({
    queryKey: ['/api/assessments', assessmentId],
    enabled: !!assessmentId,
  });

  // Load existing responses
  useEffect(() => {
    if (assessment && (assessment as any)?.pulseResponses) {
      setResponses((assessment as any).pulseResponses);
    }
  }, [assessment]);

  const updatePulse = useMutation({
    mutationFn: async (pulseResponses: Record<string, boolean | null>) => {
      const response = await apiRequest("PATCH", `/api/assessments/${assessmentId}/pulse`, { pulseResponses });
      return response.json();
    },
    onSuccess: () => {
      // Navigate to next domain or results
      const currentIndex = DOMAIN_ORDER.indexOf(domain as string);
      const skipIntros = localStorage.getItem('cortex_skip_intros') === 'true';
      
      if (currentIndex < DOMAIN_ORDER.length - 1) {
        const nextDomain = DOMAIN_ORDER[currentIndex + 1];
        if (skipIntros) {
          navigate(`/pulse/${nextDomain}/questions/${assessmentId}`);
        } else {
          navigate(`/pulse/${nextDomain}/intro/${assessmentId}`);
        }
      } else {
        // All domains completed
        navigate(`/results/${assessmentId}`);
      }
    },
    onError: (error) => {
      console.error("Pulse check error:", error);
      const errorType = getNetworkError(error);
      
      let title = "Save Failed";
      let description = "Unable to save your responses. Please try again.";
      
      switch (errorType) {
        case 'offline':
          title = "No Internet Connection";
          description = "Please check your connection and try again when you're back online.";
          break;
        case 'network':
          title = "Connection Problem";
          description = "Unable to reach our servers. Please check your connection and try again.";
          break;
        case 'server':
          title = "Server Issue";
          description = "Our servers are experiencing issues. Please try again in a moment.";
          break;
      }
      
      const enhancedError = getEnhancedErrorMessage(error, title, description);
      
      toast({
        title: enhancedError.title,
        description: enhancedError.description,
        variant: "destructive",
      });
    },
  });

  const handleResponseChange = (questionId: string, value: number) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleContinue = () => {
    updatePulse.mutate(responses);
  };

  const handlePrevious = async () => {
    const currentIndex = DOMAIN_ORDER.indexOf(domain as string);
    const skipIntros = localStorage.getItem('cortex_skip_intros') === 'true';
    
    if (currentIndex > 0) {
      // Save current responses before navigating backward
      try {
        if (Object.keys(responses).length > 0) {
          await apiRequest("PATCH", `/api/assessments/${assessmentId}/pulse`, { pulseResponses: responses });
        }
      } catch (error) {
        console.error("Failed to save responses before navigating:", error);
        toast({
          title: "Save Warning",
          description: "Some responses may not have been saved. Please check your answers in the next screen.",
          variant: "destructive",
        });
      }
      
      const prevDomain = DOMAIN_ORDER[currentIndex - 1];
      if (skipIntros) {
        navigate(`/pulse/${prevDomain}/questions/${assessmentId}`);
      } else {
        navigate(`/pulse/${prevDomain}/intro/${assessmentId}`);
      }
    }
  };

  const currentGroup = DOMAIN_GROUPS.find(g => g.pillar === domain);
  const currentPillar = currentGroup ? CORTEX_PILLARS[currentGroup.pillar as keyof typeof CORTEX_PILLARS] : null;
  const currentIndex = DOMAIN_ORDER.indexOf(domain as string);
  const progress = ((currentIndex + 1) / DOMAIN_ORDER.length) * 100;
  
  // Get current domain answers
  const currentDomainAnswers = currentGroup?.questions.filter(q => 
    responses[q.id] !== undefined
  ).length || 0;
  const currentDomainTotal = currentGroup?.questions.length || 0;
  const isLastDomain = currentIndex === DOMAIN_ORDER.length - 1;
  
  // Check if all questions in current domain are answered
  const isDomainComplete = currentDomainAnswers === currentDomainTotal;

  if (isLoading || !currentGroup || !currentPillar) {
    return (
      <ProtectedRoute requireAuth>
        <div className="min-h-screen bg-background">
          <AppHeader />
          <ProgressHeader currentStep={3} />
          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Target className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-display font-bold text-foreground">Loading Questions...</h1>
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-8">
              <QuestionSkeleton />
              <QuestionSkeleton />
              <QuestionSkeleton />
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (!assessment) {
    return (
      <ProtectedRoute requireAuth>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground mb-2">Assessment Not Found</h1>
                <p className="text-muted-foreground mb-4">
                  The assessment you're looking for doesn't exist or has been removed.
                </p>
                <Button onClick={() => navigate("/")} data-testid="button-start-new">
                  Start New Assessment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAuth>
      <div className="min-h-screen bg-background">
        <AppHeader />
        <OfflineBanner 
          onRetry={() => window.location.reload()} 
          showRetryButton={true}
        />
        <ProgressHeader currentStep={3} />
      
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Target className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-display font-bold text-foreground">
                Domain {currentIndex + 1} of {DOMAIN_ORDER.length}
              </h1>
            </div>
            
            <div className="space-y-3">
              <Progress value={progress} className="w-full max-w-md mx-auto" />
              <p className="text-sm text-muted-foreground font-ui">
                {currentDomainAnswers}/{currentDomainTotal} questions answered in {currentPillar.name}
              </p>
            </div>
          </div>

          {/* Current Domain */}
          <Card className="mb-6 sm:mb-8">
            <CardContent className="p-6 sm:p-8">
              {/* Domain Header */}
              <div className="mb-8 text-center">
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <div className="bg-primary text-primary-foreground p-3 rounded-full">
                    <span className="text-2xl font-bold">{currentGroup.pillar}</span>
                  </div>
                  <div className="text-left">
                    <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
                      <span className="sm:hidden">{currentPillar.name.split(' ')[0]}</span>
                      <span className="hidden sm:inline">{currentPillar.name}</span>
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground font-ui">{currentPillar.description}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-sm">
                  {currentDomainAnswers}/{currentDomainTotal} questions answered
                </Badge>
              </div>

              {/* Domain Questions */}
              <div className="space-y-8">
                {currentGroup.questions.map((question) => (
                  <div key={question.id} className="border border-border rounded-lg p-6 sm:p-6 bg-card">
                    <h3 className="text-lg sm:text-lg font-ui font-semibold mb-6" data-testid={`question-${question.id}`}>
                      {question.id}. {question.text}
                    </h3>
                    
                    <div className="grid grid-cols-2 sm:flex sm:flex-row sm:justify-center gap-3 sm:gap-4">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={responses[question.id] === 0 ? "accent" : "outline"}
                              size="lg"
                              onClick={() => handleResponseChange(question.id, 0)}
                              className="flex items-center justify-center space-x-2 font-ui"
                              data-testid={`button-no-${question.id}`}
                            >
                              <XCircle className="h-5 w-5" />
                              <span>No</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>This is not in place today</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={responses[question.id] === 0.25 ? "secondary" : "outline"}
                              size="lg"
                              onClick={() => handleResponseChange(question.id, 0.25)}
                              className="flex items-center justify-center space-x-2 font-ui"
                              data-testid={`button-started-${question.id}`}
                            >
                              <PlayCircle className="h-5 w-5" />
                              <span>Started</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Work has begun and first concrete steps exist, but not yet largely implemented</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={responses[question.id] === 0.5 ? "secondary" : "outline"}
                              size="lg"
                              onClick={() => handleResponseChange(question.id, 0.5)}
                              className="flex items-center justify-center space-x-2 font-ui"
                              data-testid={`button-mostly-${question.id}`}
                            >
                              <Circle className="h-5 w-5" />
                              <span>Mostly</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>This is largely implemented and working in practice; only minor gaps remain</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={responses[question.id] === 1 ? "default" : "outline"}
                              size="lg"
                              onClick={() => handleResponseChange(question.id, 1)}
                              className="flex items-center justify-center space-x-2 font-ui"
                              data-testid={`button-yes-${question.id}`}
                            >
                              <CheckCircle className="h-5 w-5" />
                              <span>Yes</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Fully true today across the organization, with evidence we could cite</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    {responses[question.id] !== undefined && (
                      <div className="text-center mt-4">
                        <Badge 
                          variant={
                            responses[question.id] === 1 ? "default" : 
                            responses[question.id] === 0 ? "accent" : 
                            "secondary"
                          }
                          className="text-sm"
                        >
                          {responses[question.id] === 1 ? 'Yes' : 
                           responses[question.id] === 0.5 ? 'Mostly' : 
                           responses[question.id] === 0.25 ? 'Started' : 
                           'No'}
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
            <div className="flex justify-between sm:justify-start items-center">
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="flex items-center space-x-2 font-ui"
                data-testid="button-previous"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Previous Domain</span>
                <span className="sm:hidden">Previous</span>
              </Button>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {currentDomainAnswers}/{currentDomainTotal} questions answered
              </p>
            </div>
            
            <div>
              <Button 
                onClick={handleContinue}
                disabled={!isDomainComplete || updatePulse.isPending}
                size="lg"
                className="flex items-center space-x-2"
                data-testid={isLastDomain ? "button-complete" : "button-continue"}
              >
                <span>
                  {updatePulse.isPending ? 
                    (isLastDomain ? "Generating Results..." : "Saving...") : 
                    (isLastDomain ? "Get My Results" : "Continue to Next Domain")
                  }
                </span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}