import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import ProgressHeader from "@/components/progress-header";
import OfflineBanner from "@/components/offline-banner";
import { ErrorFallback } from "@/components/error-boundary";
import { FormSkeleton } from "@/components/skeleton-loader";
import { AppHeader } from "@/components/navigation/app-header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { contextProfileSchema, type ContextProfile } from "@shared/schema";
import { CONTEXT_ITEMS, CONTEXT_SCREENS } from "@/lib/cortex";
import { apiRequest, getNetworkError } from "@/lib/queryClient";
import { getEnhancedErrorMessage } from "@/lib/error-utils";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Target } from "lucide-react";

export default function ContextProfilePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentScreen, setCurrentScreen] = useState(0);
  // Track which fields users have actually interacted with
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  
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
      procurement_constraints: null,
      edge_operations: null,
    }
  });

  const createAssessment = useMutation({
    mutationFn: async (contextProfile: ContextProfile) => {
      const response = await apiRequest("POST", "/api/assessments", { contextProfile });
      return response.json();
    },
    onSuccess: (data) => {
      // Store the latest assessment ID for the user
      if (user?.uid) {
        localStorage.setItem(`latest-assessment-${user.uid}`, data.id);
      }
      navigate(`/context-insight/${data.id}`);
    },
    onError: (error) => {
      console.error("Context profile error:", error);
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
      
      // Enhance error message with incident ID if available
      const enhancedError = getEnhancedErrorMessage(error, title, description);
      
      toast({
        title: enhancedError.title,
        description: enhancedError.description,
        variant: "destructive",
      });
    },
  });

  const currentScreenData = CONTEXT_SCREENS[currentScreen];
  const progress = ((currentScreen + 1) / CONTEXT_SCREENS.length) * 100;
  const isLastScreen = currentScreen === CONTEXT_SCREENS.length - 1;
  
  // Auto-scroll to top when screen changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentScreen]);
  
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

  // Helper function to track user interactions
  const handleFieldTouch = (fieldKey: string) => {
    setTouchedFields(prev => new Set(prev).add(fieldKey));
  };

  const onSubmit = (data: ContextProfile) => {
    createAssessment.mutate(data);
  };

  // Check if current screen questions are answered (only count when user has interacted)
  const getCurrentScreenAnswers = () => {
    const answers = currentScreenData.questions.map(questionKey => {
      const item = CONTEXT_ITEMS.find(i => i.key === questionKey);
      if (!item) return false;
      
      // For sliders, count as answered when touched
      if (item.type === 'slider') {
        return touchedFields.has(questionKey);
      }
      
      // For boolean fields, count as answered when they have a non-null value
      if (item.type === 'boolean') {
        const fieldValue = form.getValues()[item.key as keyof ContextProfile];
        return fieldValue !== null && fieldValue !== undefined;
      }
      
      return touchedFields.has(questionKey);
    });
    return answers.filter(Boolean).length;
  };

  const currentScreenAnswers = getCurrentScreenAnswers();
  const currentScreenTotal = currentScreenData.questions.length;

  return (
    <ProtectedRoute requireAuth>
      <div className="min-h-screen bg-background">
        <AppHeader />
        <OfflineBanner 
          onRetry={() => window.location.reload()} 
          showRetryButton={true}
        />
        <ProgressHeader currentStep={1} />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Target className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-display font-bold text-foreground">AI Strategic Maturity Assessment</h1>
            <Target className="h-6 w-6 text-primary" />
          </div>
          <p className="text-lg text-muted-foreground mb-4 font-ui">
            A few quick questions tell us about your operating environment (regulation, sensitivity, speed, scale, etc.). We use these to <strong>tailor guidance and highlight critical requirements</strong>. We do <strong>not</strong> change your scores based on context.
          </p>
          <div className="space-y-3">
            <Progress value={progress} className="w-full max-w-md mx-auto" />
            <p className="text-sm text-muted-foreground font-ui">
              Step {currentScreen + 1} of {CONTEXT_SCREENS.length} • {currentScreenAnswers}/{currentScreenTotal} answered
            </p>
          </div>
        </div>

        {/* Current Screen */}
        <Card className="mb-6 sm:mb-8">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-6 sm:mb-8 text-center">
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-3">{currentScreenData.title}</h2>
              <p className="text-lg sm:text-xl text-muted-foreground font-ui">{currentScreenData.subtitle}</p>
            </div>

            <Form {...form}>
              <div className="space-y-8 sm:space-y-10">
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
                          <FormLabel className={`text-lg sm:text-xl font-ui font-semibold transition-colors duration-300 ${
                            touchedFields.has(item.key) ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {item.label}
                            {item.type === 'boolean' && !touchedFields.has(item.key) && (
                              <span className="ml-2 text-sm text-muted-foreground/60 font-normal">
                                (not answered)
                              </span>
                            )}
                          </FormLabel>
                          <p className={`text-sm sm:text-base mb-4 font-ui transition-colors duration-300 ${
                            touchedFields.has(item.key) ? 'text-muted-foreground' : 'text-muted-foreground/80'
                          }`}>
                            {item.description}
                          </p>
                          
                          {/* Show examples upfront */}
                          {item.examples && (
                            <div className="mb-6 p-4 bg-secondary rounded-lg border border-border">
                              <p className="text-sm font-medium text-secondary-foreground mb-2 font-ui">
                                Examples by level:
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-muted-foreground font-ui">
                                {item.examples.map((example, idx) => (
                                  <div key={idx} className="flex items-center space-x-2">
                                    <span className="bg-primary/20 px-2 py-1 rounded font-medium font-mono text-primary">
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
                              <div className={`space-y-6 transition-opacity duration-300 ${
                                touchedFields.has(item.key) ? 'opacity-100' : 'opacity-60'
                              }`}>
                                <div className="px-2 sm:px-4">
                                  <Slider
                                    min={0}
                                    max={4}
                                    step={1}
                                    value={[field.value as number]}
                                    onValueChange={(value) => {
                                      field.onChange(value[0]);
                                      handleFieldTouch(item.key);
                                    }}
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
                                  <div className={`inline-flex items-center space-x-3 p-5 sm:p-4 rounded-lg transition-all duration-300 ${
                                    touchedFields.has(item.key) 
                                      ? 'bg-primary/10 border-2 border-primary/30' 
                                      : 'bg-muted border-2 border-transparent'
                                  }`}>
                                    <span className={`text-xl sm:text-lg font-bold transition-colors duration-300 ${
                                      touchedFields.has(item.key) ? 'text-primary' : 'text-muted-foreground'
                                    }`}>
                                      {field.value}/4
                                    </span>
                                    {item.labels && (
                                      <span className={`text-lg sm:text-base font-medium transition-colors duration-300 ${
                                        touchedFields.has(item.key) ? 'text-foreground' : 'text-muted-foreground'
                                      }`}>
                                        {item.labels[field.value as number]}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {item.anchors && (
                                  <div className={`p-4 bg-primary/5 rounded-lg border border-primary/15 transition-opacity duration-300 ${
                                    touchedFields.has(item.key) ? 'opacity-100' : 'opacity-70'
                                  }`}>
                                    <p className="text-sm font-medium text-primary mb-2 font-ui">
                                      What this level means:
                                    </p>
                                    <p className="text-sm text-foreground/80 font-ui">
                                      {item.anchors[field.value as number]}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className={`transition-opacity duration-300 ${
                                touchedFields.has(item.key) ? 'opacity-100' : 'opacity-60'
                              }`}>
                                {item.examples && (
                                  <div className="mb-6 sm:mb-4 p-4 sm:p-3 bg-muted rounded-lg">
                                    <p className="text-sm font-medium mb-2">This typically includes:</p>
                                    <div className="text-sm text-muted-foreground">
                                      {item.examples.join(' • ')}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Neutral state with Yes/No buttons */}
                                {field.value === null ? (
                                  <div className="flex flex-col sm:flex-row gap-4 p-6 sm:p-4 bg-muted/50 rounded-lg border-2 border-transparent">
                                    <p className="text-lg font-medium text-muted-foreground mb-4 sm:mb-0 sm:mr-4 flex-1">
                                      Please select:
                                    </p>
                                    <div className="flex gap-3">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="lg"
                                        onClick={() => {
                                          field.onChange(false);
                                          handleFieldTouch(item.key);
                                        }}
                                        className="flex-1 sm:flex-none"
                                        data-testid={`button-no-${item.key}`}
                                      >
                                        No
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline" 
                                        size="lg"
                                        onClick={() => {
                                          field.onChange(true);
                                          handleFieldTouch(item.key);
                                        }}
                                        className="flex-1 sm:flex-none"
                                        data-testid={`button-yes-${item.key}`}
                                      >
                                        Yes
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  /* Selected state with ability to change */
                                  <div className={`flex items-center justify-between p-6 sm:p-4 rounded-lg transition-all duration-300 ${
                                    touchedFields.has(item.key) 
                                      ? 'bg-primary/10 border-2 border-primary/30' 
                                      : 'bg-muted/50 border-2 border-transparent'
                                  }`}>
                                    <span className={`text-xl sm:text-lg font-medium transition-colors duration-300 ${
                                      touchedFields.has(item.key) ? 'text-foreground' : 'text-muted-foreground'
                                    }`}>
                                      {field.value ? 'Yes' : 'No'}
                                    </span>
                                    <div className="flex gap-2">
                                      <Button
                                        type="button"
                                        variant={field.value === false ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => {
                                          field.onChange(false);
                                          handleFieldTouch(item.key);
                                        }}
                                        data-testid={`button-change-no-${item.key}`}
                                      >
                                        No
                                      </Button>
                                      <Button
                                        type="button"
                                        variant={field.value === true ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => {
                                          field.onChange(true);
                                          handleFieldTouch(item.key);
                                        }}
                                        data-testid={`button-change-yes-${item.key}`}
                                      >
                                        Yes
                                      </Button>
                                    </div>
                                  </div>
                                )}
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
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div className="flex justify-between sm:justify-start items-center">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentScreen === 0}
              className="flex items-center space-x-2 font-ui"
              data-testid="button-previous"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>
            
            <div className="text-center sm:hidden">
              <p className="text-sm text-muted-foreground font-ui">
                {currentScreenAnswers} of {currentScreenTotal} answered
              </p>
            </div>
            
            {isLastScreen ? (
              <Button 
                onClick={form.handleSubmit(onSubmit)}
                disabled={createAssessment.isPending}
                size="lg"
                className="flex items-center space-x-2 sm:hidden font-ui"
                data-testid="button-view-context-overview-mobile"
              >
                <span>{createAssessment.isPending ? "Creating..." : "View Overview"}</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleNext}
                size="lg"
                className="flex items-center space-x-2 sm:hidden font-ui"
                data-testid="button-next-mobile"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="text-center hidden sm:block">
            <p className="text-sm text-muted-foreground">
              {currentScreenAnswers} of {currentScreenTotal} questions answered
            </p>
          </div>
          
          <div className="hidden sm:block">
            {isLastScreen ? (
              <Button 
                onClick={form.handleSubmit(onSubmit)}
                disabled={createAssessment.isPending}
                size="lg"
                className="flex items-center space-x-2"
                data-testid="button-view-context-overview"
              >
                <span>{createAssessment.isPending ? "Creating..." : "View Context Overview"}</span>
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
        </div>
      </main>
      </div>
    </ProtectedRoute>
  );
}