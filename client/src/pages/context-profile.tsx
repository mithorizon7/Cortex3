import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import ProgressHeader from "@/components/progress-header";
import { contextProfileSchema, type ContextProfile } from "@shared/schema";
import { CONTEXT_ITEMS, CONTEXT_SCREENS } from "@/lib/cortex";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Clock, Target } from "lucide-react";

export default function ContextProfilePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentScreen, setCurrentScreen] = useState(0);
  
  const form = useForm<ContextProfile>({
    resolver: zodResolver(contextProfileSchema),
    defaultValues: {
      regulatory_intensity: 2,
      data_sensitivity: 2,
      safety_criticality: 2,
      brand_exposure: 2,
      clock_speed: 2,
      latency_edge: 1,
      scale_throughput: 2,
      data_advantage: 2,
      build_readiness: 2,
      finops_priority: 2,
      procurement_constraints: false,
      edge_operations: false,
    }
  });

  const createAssessment = useMutation({
    mutationFn: async (contextProfile: ContextProfile) => {
      const response = await apiRequest("POST", "/api/assessments", { contextProfile });
      return response.json();
    },
    onSuccess: (data) => {
      navigate(`/pulse-check/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save context profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const currentScreenData = CONTEXT_SCREENS[currentScreen];
  const progress = ((currentScreen + 1) / CONTEXT_SCREENS.length) * 100;
  const isLastScreen = currentScreen === CONTEXT_SCREENS.length - 1;
  
  const handleNext = () => {
    if (currentScreen < CONTEXT_SCREENS.length - 1) {
      setCurrentScreen(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentScreen > 0) {
      setCurrentScreen(prev => prev - 1);
    }
  };

  const onSubmit = (data: ContextProfile) => {
    createAssessment.mutate(data);
  };

  // Check if current screen questions are answered
  const getCurrentScreenAnswers = () => {
    const answers = currentScreenData.questions.map(questionKey => {
      const value = form.getValues(questionKey as keyof ContextProfile);
      return value !== undefined && value !== null;
    });
    return answers.filter(Boolean).length;
  };

  const currentScreenAnswers = getCurrentScreenAnswers();
  const currentScreenTotal = currentScreenData.questions.length;

  return (
    <div className="min-h-screen bg-background">
      <ProgressHeader currentStep={1} />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Target className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">AI Readiness Assessment</h1>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-lg text-muted-foreground mb-4">
            Get your personalized AI strategy in 8-10 minutes
          </p>
          <div className="space-y-3">
            <Progress value={progress} className="w-full max-w-md mx-auto" />
            <p className="text-sm text-muted-foreground">
              Step {currentScreen + 1} of {CONTEXT_SCREENS.length} • {currentScreenAnswers}/{currentScreenTotal} answered
            </p>
          </div>
        </div>

        {/* Current Screen */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">{currentScreenData.title}</h2>
              <p className="text-lg text-muted-foreground">{currentScreenData.subtitle}</p>
            </div>

            <Form {...form}>
              <div className="space-y-10">
                {currentScreenData.questions.map((questionKey) => {
                  const item = CONTEXT_ITEMS.find(i => i.key === questionKey);
                  if (!item) return null;

                  return (
                    <FormField
                      key={item.key}
                      control={form.control}
                      name={item.key as keyof ContextProfile}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xl font-semibold text-foreground">
                            {item.label}
                          </FormLabel>
                          <p className="text-base text-muted-foreground mb-4">
                            {item.description}
                          </p>
                          
                          {/* Show examples upfront */}
                          {item.examples && (
                            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                                Examples by level:
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-blue-800 dark:text-blue-200">
                                {item.examples.map((example, idx) => (
                                  <div key={idx} className="flex items-center space-x-2">
                                    <span className="bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded font-medium">
                                      {idx}
                                    </span>
                                    <span>{example}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <FormControl>
                            {item.type === 'slider' ? (
                              <div className="space-y-6">
                                <div className="px-4">
                                  <Slider
                                    min={0}
                                    max={4}
                                    step={1}
                                    value={[field.value as number]}
                                    onValueChange={(value) => field.onChange(value[0])}
                                    className="w-full"
                                    data-testid={`slider-${item.key}`}
                                  />
                                  {item.labels && (
                                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                      {item.labels.map((label, index) => (
                                        <span key={index} className="text-center flex-1">
                                          {label}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="text-center">
                                  <div className="inline-flex items-center space-x-3 bg-muted p-4 rounded-lg">
                                    <span className="text-lg font-bold text-primary">
                                      {field.value}/4
                                    </span>
                                    {item.labels && (
                                      <span className="text-base font-medium">
                                        {item.labels[field.value as number]}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {item.anchors && (
                                  <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
                                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">
                                      What this level means:
                                    </p>
                                    <p className="text-sm text-amber-800 dark:text-amber-200">
                                      {item.anchors[field.value as number]}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                {item.examples && (
                                  <div className="mb-4 p-3 bg-muted rounded-lg">
                                    <p className="text-sm font-medium mb-2">This typically includes:</p>
                                    <div className="text-sm text-muted-foreground">
                                      {item.examples.join(' • ')}
                                    </div>
                                  </div>
                                )}
                                <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
                                  <Switch
                                    checked={field.value as boolean}
                                    onCheckedChange={field.onChange}
                                    data-testid={`switch-${item.key}`}
                                  />
                                  <span className="text-lg font-medium">
                                    {field.value ? 'Yes' : 'No'}
                                  </span>
                                </div>
                              </div>
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  );
                })}
              </div>
            </Form>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentScreen === 0}
            className="flex items-center space-x-2"
            data-testid="button-previous"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {currentScreenAnswers} of {currentScreenTotal} questions answered
            </p>
          </div>
          
          {isLastScreen ? (
            <Button 
              onClick={form.handleSubmit(onSubmit)}
              disabled={createAssessment.isPending}
              size="lg"
              className="flex items-center space-x-2"
              data-testid="button-start-pulse-check"
            >
              <span>{createAssessment.isPending ? "Starting..." : "Start Pulse Check"}</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleNext}
              size="lg"
              className="flex items-center space-x-2"
              data-testid="button-next"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}