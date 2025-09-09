import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import ProgressHeader from "@/components/progress-header";
import { PULSE_QUESTIONS, CORTEX_PILLARS } from "@/lib/cortex";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function PulseCheckPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const assessmentId = window.location.pathname.split('/')[2];
  
  const [responses, setResponses] = useState<Record<string, boolean>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
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

  const handleResponseChange = (questionId: string, value: boolean) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < PULSE_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    updatePulse.mutate(responses);
  };

  const progress = ((currentQuestionIndex + 1) / PULSE_QUESTIONS.length) * 100;
  const completedCount = Object.keys(responses).length;
  const currentQuestion = PULSE_QUESTIONS[currentQuestionIndex];
  const currentPillar = CORTEX_PILLARS[currentQuestion.pillar as keyof typeof CORTEX_PILLARS];

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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Pulse Check (18)</h1>
          <p className="text-muted-foreground mb-4">
            Answer "Yes" only if fully true today. This diagnostic covers all six CORTEX domains.
          </p>
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {PULSE_QUESTIONS.length} • {completedCount} answered
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                  <i className={`fas fa-${currentPillar.icon} text-lg`}></i>
                </div>
                <div>
                  <h2 className="font-semibold text-lg">{currentPillar.name}</h2>
                  <p className="text-sm text-muted-foreground">{currentPillar.description}</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-medium mb-4" data-testid={`question-${currentQuestion.id}`}>
                {currentQuestion.id}. {currentQuestion.text}
              </h3>
              
              <div className="flex items-center justify-center space-x-8">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <Switch
                    checked={responses[currentQuestion.id] === false}
                    onCheckedChange={(checked) => handleResponseChange(currentQuestion.id, !checked)}
                    data-testid={`switch-no-${currentQuestion.id}`}
                  />
                  <span className="text-lg font-medium text-red-600">No</span>
                </label>
                
                <label className="flex items-center space-x-3 cursor-pointer">
                  <Switch
                    checked={responses[currentQuestion.id] === true}
                    onCheckedChange={(checked) => handleResponseChange(currentQuestion.id, checked)}
                    data-testid={`switch-yes-${currentQuestion.id}`}
                  />
                  <span className="text-lg font-medium text-green-600">Yes</span>
                </label>
              </div>
              
              {responses[currentQuestion.id] !== undefined && (
                <div className="text-center mt-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    responses[currentQuestion.id] 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {responses[currentQuestion.id] ? 'Yes' : 'No'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                data-testid="button-previous"
              >
                Previous
              </Button>
              
              {currentQuestionIndex === PULSE_QUESTIONS.length - 1 ? (
                <Button 
                  onClick={handleComplete}
                  disabled={completedCount < PULSE_QUESTIONS.length || updatePulse.isPending}
                  data-testid="button-complete"
                >
                  {updatePulse.isPending ? "Completing..." : "Complete Assessment"}
                </Button>
              ) : (
                <Button 
                  onClick={handleNext}
                  data-testid="button-next"
                >
                  Next
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
