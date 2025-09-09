import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import ProgressHeader from "@/components/progress-header";
import { PULSE_QUESTIONS, CORTEX_PILLARS } from "@/lib/cortex";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, HelpCircle, Clock, Target } from "lucide-react";

// Group questions by pillar for domain-based flow
const DOMAIN_GROUPS = [
  { pillar: 'C', questions: PULSE_QUESTIONS.filter(q => q.pillar === 'C') },
  { pillar: 'O', questions: PULSE_QUESTIONS.filter(q => q.pillar === 'O') },
  { pillar: 'R', questions: PULSE_QUESTIONS.filter(q => q.pillar === 'R') },
  { pillar: 'T', questions: PULSE_QUESTIONS.filter(q => q.pillar === 'T') },
  { pillar: 'E', questions: PULSE_QUESTIONS.filter(q => q.pillar === 'E') },
  { pillar: 'X', questions: PULSE_QUESTIONS.filter(q => q.pillar === 'X') }
];

export default function PulseCheckPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const assessmentId = window.location.pathname.split('/')[2];
  
  const [responses, setResponses] = useState<Record<string, boolean | null>>({});
  const [currentDomain, setCurrentDomain] = useState(0);
  
  const { data: assessment, isLoading } = useQuery({
    queryKey: ['/api/assessments', assessmentId],
    enabled: !!assessmentId,
  });

  const updatePulse = useMutation({
    mutationFn: async (pulseResponses: Record<string, boolean>) => {
      const response = await apiRequest("PATCH", `/api/assessments/${assessmentId}/pulse`, { pulseResponses });
      return response.json();
    },
    onSuccess: () => {
      navigate(`/results/${assessmentId}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save pulse responses. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleResponseChange = (questionId: string, value: boolean | null) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = () => {
    if (currentDomain < DOMAIN_GROUPS.length - 1) {
      setCurrentDomain(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentDomain > 0) {
      setCurrentDomain(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    // Convert responses: null (unsure) becomes false for scoring, but we track it was "unsure"
    const scoringResponses = Object.fromEntries(
      Object.entries(responses).map(([key, value]) => [key, value === true])
    );
    updatePulse.mutate(scoringResponses);
  };

  const currentGroup = DOMAIN_GROUPS[currentDomain];
  const currentPillar = CORTEX_PILLARS[currentGroup.pillar as keyof typeof CORTEX_PILLARS];
  const progress = ((currentDomain + 1) / DOMAIN_GROUPS.length) * 100;
  const totalAnswered = Object.keys(responses).length;
  const isLastDomain = currentDomain === DOMAIN_GROUPS.length - 1;
  
  // Get current domain answers
  const currentDomainAnswers = currentGroup.questions.filter(q => 
    responses[q.id] !== undefined
  ).length;
  const currentDomainTotal = currentGroup.questions.length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
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
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ProgressHeader currentStep={2} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Target className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Pulse Check</h1>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-lg text-muted-foreground mb-4">
            Answer "Yes" only if this is fully true in your organization today
          </p>
          <div className="space-y-3">
            <Progress value={progress} className="w-full max-w-md mx-auto" />
            <p className="text-sm text-muted-foreground">
              Domain {currentDomain + 1} of {DOMAIN_GROUPS.length} • {totalAnswered}/18 total answered
            </p>
          </div>
        </div>

        {/* Current Domain */}
        <Card className="mb-8">
          <CardContent className="p-8">
            {/* Domain Header */}
            <div className="mb-8 text-center">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="bg-primary text-primary-foreground p-3 rounded-full">
                  <span className="text-2xl font-bold">{currentGroup.pillar}</span>
                </div>
                <div className="text-left">
                  <h2 className="text-2xl font-bold text-foreground">{currentPillar.name}</h2>
                  <p className="text-base text-muted-foreground">{currentPillar.description}</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-sm">
                {currentDomainAnswers}/{currentDomainTotal} questions answered
              </Badge>
            </div>

            {/* Domain Questions */}
            <div className="space-y-8">
              {currentGroup.questions.map((question) => (
                <div key={question.id} className="border border-border rounded-lg p-6 bg-card">
                  <h3 className="text-lg font-semibold mb-4" data-testid={`question-${question.id}`}>
                    {question.id}. {question.text}
                  </h3>
                  
                  <div className="flex justify-center space-x-4">
                    <Button
                      variant={responses[question.id] === false ? "destructive" : "outline"}
                      size="lg"
                      onClick={() => handleResponseChange(question.id, false)}
                      className="flex items-center space-x-2 min-w-[100px]"
                      data-testid={`button-no-${question.id}`}
                    >
                      <XCircle className="h-5 w-5" />
                      <span>No</span>
                    </Button>
                    
                    <Button
                      variant={responses[question.id] === null ? "secondary" : "outline"}
                      size="lg"
                      onClick={() => handleResponseChange(question.id, null)}
                      className="flex items-center space-x-2 min-w-[100px]"
                      data-testid={`button-unsure-${question.id}`}
                    >
                      <HelpCircle className="h-5 w-5" />
                      <span>Unsure</span>
                    </Button>
                    
                    <Button
                      variant={responses[question.id] === true ? "default" : "outline"}
                      size="lg"
                      onClick={() => handleResponseChange(question.id, true)}
                      className="flex items-center space-x-2 min-w-[100px]"
                      data-testid={`button-yes-${question.id}`}
                    >
                      <CheckCircle className="h-5 w-5" />
                      <span>Yes</span>
                    </Button>
                  </div>
                  
                  {responses[question.id] !== undefined && (
                    <div className="text-center mt-4">
                      <Badge 
                        variant={responses[question.id] === true ? "default" : responses[question.id] === false ? "destructive" : "secondary"}
                        className="text-sm"
                      >
                        {responses[question.id] === true ? 'Yes' : responses[question.id] === false ? 'No' : 'Unsure'}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentDomain === 0}
            className="flex items-center space-x-2"
            data-testid="button-previous"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous Domain</span>
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {currentDomainAnswers}/{currentDomainTotal} domain questions • {totalAnswered}/18 total
            </p>
          </div>
          
          {isLastDomain ? (
            <Button 
              onClick={handleComplete}
              disabled={totalAnswered < 18 || updatePulse.isPending}
              size="lg"
              className="flex items-center space-x-2"
              data-testid="button-complete"
            >
              <span>{updatePulse.isPending ? "Generating Results..." : "Get My Results"}</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleNext}
              size="lg"
              className="flex items-center space-x-2"
              data-testid="button-next"
            >
              <span>Next Domain</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Domain Overview */}
        <div className="mt-8 flex justify-center">
          <div className="flex space-x-2">
            {DOMAIN_GROUPS.map((group, index) => {
              const pillar = CORTEX_PILLARS[group.pillar as keyof typeof CORTEX_PILLARS];
              const domainAnswered = group.questions.filter(q => responses[q.id] !== undefined).length;
              const isCompleted = domainAnswered === group.questions.length;
              const isCurrent = index === currentDomain;
              
              return (
                <div 
                  key={group.pillar}
                  className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                    isCurrent 
                      ? 'border-primary bg-primary/10' 
                      : isCompleted 
                      ? 'border-green-500 bg-green-50 dark:bg-green-950' 
                      : 'border-border bg-muted/30'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isCurrent 
                      ? 'bg-primary text-primary-foreground'
                      : isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {group.pillar}
                  </div>
                  <div className="text-xs text-center mt-1 max-w-[80px]">
                    {pillar.name.split(' ')[0]}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {domainAnswered}/3
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}