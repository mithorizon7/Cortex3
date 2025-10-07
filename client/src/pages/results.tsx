import React, { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ProgressHeader from "@/components/progress-header";
import OfflineBanner from "@/components/offline-banner";
import { ErrorFallback } from "@/components/error-boundary";
import { ResultsSkeleton } from "@/components/skeleton-loader";
import { ExecutiveCortexHero } from "@/components/executive-cortex-hero";
import HoneycombRadar from "@/components/honeycomb-radar";
import DomainCard from "@/components/domain-card";
import { AppHeader } from "@/components/navigation/app-header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ValueSnapshot } from "@/components/value-overlay";
import { ValueOverlayTutorial } from "@/components/value-overlay-tutorial";
import { initializeValueOverlay } from "@/lib/value-overlay";
import { CORTEX_PILLARS, getPriorityLevel } from "@/lib/cortex";
import { exportJSONResults, generateExecutiveBriefPDF, type EnhancedAssessmentResults } from "@/lib/pdf-generator";
import { getNetworkError, queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { generateEnhancedExecutiveInsights, getBusinessImpactSummary } from "@/lib/insight-engine";
import { 
  AlertTriangle, 
  CheckCircle, 
  CircleOff, 
  Target, 
  TrendingUp, 
  Clock, 
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Star,
  Zap,
  Shield,
  Users,
  Settings,
  Lightbulb,
  BookOpen,
  Compass,
  Brain,
  ExternalLink
} from "lucide-react";
import type { Assessment, PillarScores, ContextProfile, ValueOverlay, ValueOverlayPillar } from "@shared/schema";

// Helper function to get gate thresholds for transparency
function getGateThreshold(gateId: string, dimension: string): string | null {
  const thresholds: Record<string, Record<string, string>> = {
    'require_hitl': {
      'regulatory_intensity': '≥3',
      'safety_criticality': '≥3'
    },
    'assurance_cadence': {
      'regulatory_intensity': '≥3'
    },
    'data_residency': {
      'data_sensitivity': '≥3'
    },
    'latency_fallback': {
      'latency_edge': '≥3'
    },
    'scale_hardening': {
      'scale_throughput': '≥3'
    },
    'build_readiness': {
      'build_readiness': '≤1'
    },
    'procurement_compliance': {
      'procurement_constraints': 'True'
    },
    'edge_ops': {
      'edge_operations': 'True'
    }
  };
  
  return thresholds[gateId]?.[dimension] || null;
}


const VALUE_OVERLAY_TUTORIAL_KEY = 'cortex_value_overlay_tutorial_seen';

export default function ResultsPage() {
  const { toast } = useToast();
  const { id: assessmentId } = useParams();
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [valueOverlay, setValueOverlay] = useState<ValueOverlay | null>(null);
  const hasAttemptedCompletion = React.useRef(false);
  
  const { data: assessment, isLoading } = useQuery<Assessment>({
    queryKey: ['/api/assessments', assessmentId],
    enabled: !!assessmentId,
  });

  const completeAssessment = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/assessments/${assessmentId}/complete`);
      return response.json();
    },
    onSuccess: (data) => {
      // Immediately update cache with completed assessment to prevent re-triggering
      queryClient.setQueryData(['/api/assessments', assessmentId], data);
      // Also invalidate to ensure fresh data (backup in case setQueryData fails)
      queryClient.invalidateQueries({ queryKey: ['/api/assessments', assessmentId] });
    },
    onError: (error) => {
      // Keep flag set to prevent infinite retries - user must refresh to retry
      // Show error feedback to user
      toast({
        title: "Completion Failed",
        description: "Unable to mark assessment as complete. Please refresh the page to try again.",
        variant: "destructive",
      });
    },
  });

  const updateValueOverlay = useMutation({
    mutationFn: async (overlay: ValueOverlay) => {
      const response = await apiRequest("PATCH", `/api/assessments/${assessmentId}`, {
        valueOverlay: overlay,
      });
      return response.json();
    },
  });

  // Initialize value overlay from assessment data or context profile
  const initializeValueOverlayFromAssessment = useCallback((assessment: Assessment) => {
    if (assessment.valueOverlay) {
      setValueOverlay(assessment.valueOverlay as ValueOverlay);
    } else if (assessment.contextProfile) {
      const initialOverlay = initializeValueOverlay(assessment.contextProfile as ContextProfile);
      setValueOverlay(initialOverlay);
    }
  }, []);

  // Auto-complete assessment if pulse check is done but assessment not marked complete
  React.useEffect(() => {
    if (!assessment || completeAssessment.isPending || hasAttemptedCompletion.current) return;
    
    // Check if assessment has pillar scores with all 6 domains
    const pillarScores = assessment.pillarScores as PillarScores | undefined;
    if (pillarScores) {
      const scoredCount = Object.values(pillarScores).filter(score => score !== undefined && score !== null).length;
      const hasAllDomains = scoredCount === 6;
      const isNotCompleted = !assessment.completedAt;
      
      // If all domains are scored but assessment isn't marked complete, attempt completion once
      // Set flag immediately to prevent retries (even on error - user must refresh to retry)
      if (hasAllDomains && isNotCompleted) {
        hasAttemptedCompletion.current = true;
        completeAssessment.mutate();
      }
    }
  }, [assessment, completeAssessment]);

  // Initialize value overlay when assessment data loads
  React.useEffect(() => {
    if (assessment && !valueOverlay) {
      initializeValueOverlayFromAssessment(assessment);
    }
  }, [assessment, valueOverlay, initializeValueOverlayFromAssessment]);

  // Show tutorial when detailed view is opened for the first time
  useEffect(() => {
    if (showDetailedView) {
      const hasSeenTutorial = localStorage.getItem(VALUE_OVERLAY_TUTORIAL_KEY);
      if (!hasSeenTutorial) {
        setShowTutorial(true);
      }
    }
  }, [showDetailedView]);

  // Handle tutorial close
  const handleTutorialClose = () => {
    setShowTutorial(false);
    localStorage.setItem(VALUE_OVERLAY_TUTORIAL_KEY, 'true');
  };

  // Handle value overlay updates
  const handleValueOverlayUpdate = useCallback((pillar: string, updates: Partial<ValueOverlayPillar>) => {
    setValueOverlay(prev => {
      if (!prev) return prev;
      
      const currentPillarData = prev[pillar as keyof ValueOverlay];
      const updated = {
        ...prev,
        [pillar]: {
          ...currentPillarData,
          ...updates
        }
      };
      
      // Persist to backend
      updateValueOverlay.mutate(updated);
      
      return updated;
    });
  }, [updateValueOverlay]);

  const handleExportPDF = async () => {
    if (!assessment) return;
    
    // Validate that pillar scores exist
    if (!assessment.pillarScores) {
      toast({
        title: "Incomplete Assessment",
        description: "Please complete the pulse check before generating the executive brief.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate that all domains are scored (no partial assessments in PDF)
    const scoredCount = Object.values(assessment.pillarScores).filter(score => score !== undefined && score !== null).length;
    if (scoredCount < 6) {
      toast({
        title: "Incomplete Assessment",
        description: `Please complete all ${6 - scoredCount} remaining domains before generating the executive brief.`,
        variant: "destructive",
      });
      return;
    }
    
    // Validate that context profile exists
    if (!assessment.contextProfile) {
      toast({
        title: "Missing Context Profile",
        description: "Assessment data is incomplete. Please start a new assessment.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Generate enhanced insights for executive PDF
      const enhancedInsights = generateEnhancedExecutiveInsights(
        assessment.pillarScores as PillarScores,
        (assessment.triggeredGates as any[]) || [],
        assessment.contextProfile as ContextProfile
      );

      // Calculate maturity metrics (only from answered domains)
      const scoredPillarValues = Object.values(assessment.pillarScores as PillarScores).filter(score => score !== undefined && score !== null);
      const avgScore = scoredPillarValues.length > 0 
        ? scoredPillarValues.reduce((sum, score) => sum + score, 0) / scoredPillarValues.length 
        : 0;
      const maturityLevel = avgScore < 1 ? 'Nascent' : avgScore < 2 ? 'Emerging' : avgScore < 3 ? 'Integrated' : 'Leading';

      // Prepare enhanced assessment data
      const enhancedData: EnhancedAssessmentResults = {
        contextProfile: assessment.contextProfile as ContextProfile,
        pillarScores: assessment.pillarScores as PillarScores,
        triggeredGates: (assessment.triggeredGates as any[]) || [],
        completedAt: assessment.completedAt || new Date().toISOString(),
        priorityMoves: (assessment as any).priorityMoves || null,
        insights: enhancedInsights.insights,
        priorities: enhancedInsights.priorities,
        maturityLevel,
        averageScore: avgScore
      };

      // Generate executive PDF
      await generateExecutiveBriefPDF(enhancedData, assessment.id);
      
      toast({
        title: "Executive Brief Generated",
        description: "Your professional AI readiness executive brief has been downloaded.",
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Export Failed", 
        description: error instanceof Error ? error.message : "Failed to generate executive brief. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportJSON = () => {
    if (!assessment) return;
    
    // Validate that pillar scores exist
    if (!assessment.pillarScores) {
      toast({
        title: "Incomplete Assessment",
        description: "Please complete the pulse check before exporting data.",
        variant: "destructive",
      });
      return;
    }
    
    exportJSONResults({
      contextProfile: assessment.contextProfile as ContextProfile,
      pillarScores: assessment.pillarScores as PillarScores,
      triggeredGates: (assessment.triggeredGates as any[]) || [],
      priorityMoves: (assessment as any).priorityMoves || null,
      valueOverlay: valueOverlay,
      completedAt: assessment.completedAt || new Date().toISOString(),
    });
    
    toast({
      title: "Export Complete",
      description: "JSON data has been downloaded.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <ProgressHeader currentStep={4} />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ResultsSkeleton />
        </main>
      </div>
    );
  }

  if (!assessment) {
    return (
      <ProtectedRoute requireAuth>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground mb-2 font-display">Assessment Not Found</h1>
                <p className="text-muted-foreground mb-4">
                  The assessment you're looking for doesn't exist or has been removed.
                </p>
                <Button onClick={() => window.location.href = "/"} data-testid="button-start-new">
                  Start New Assessment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  // Use partial pillar scores from assessment (don't fill missing ones with 0)
  const pillarScores = (assessment.pillarScores as PillarScores) || {};
  const triggeredGates = (assessment.triggeredGates as any[]) || [];
  const contextProfile = assessment.contextProfile as ContextProfile;
  const priorityMoves = (assessment as any).priorityMoves?.moves || [];
  const contextGuidance = (assessment as any).contextGuidance || {};
  const contentTags = (assessment as any).contentTags || [];
  
  // Check if assessment data is incomplete
  // An assessment is incomplete if:
  // 1. No pillar scores exist at all, OR
  // 2. Some domains are not scored (undefined/null values), OR
  // 3. Less than all 6 domains have scores
  const totalDomains = 6;
  const scoredDomainCount = Object.values(pillarScores).filter(score => score !== undefined && score !== null).length;
  const isDataIncomplete = !assessment.pillarScores || scoredDomainCount === 0 || scoredDomainCount < totalDomains;
  
  const { insights, priorities } = generateEnhancedExecutiveInsights(pillarScores, triggeredGates, contextProfile);
  
  // Calculate average score only from answered domains
  const scoredValues = Object.values(pillarScores).filter(score => score !== undefined && score !== null);
  const avgScore = scoredValues.length > 0 
    ? scoredValues.reduce((sum, score) => sum + score, 0) / scoredValues.length 
    : 0;
  const maturityLevel = avgScore < 1 ? 'Nascent' : avgScore < 2 ? 'Emerging' : avgScore < 3 ? 'Integrated' : 'Leading';

  return (
    <ProtectedRoute requireAuth>
      <div className="min-h-screen bg-background">
        <AppHeader />
        <OfflineBanner 
          onRetry={() => window.location.reload()} 
          showRetryButton={true}
        />
        <ProgressHeader currentStep={4} />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Data Incomplete Warning */}
        {isDataIncomplete && (
          <Card className="mb-8 border-warning/50 bg-warning/10">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-warning flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-warning-foreground mb-2">Assessment Data Incomplete</h3>
                  <p className="text-sm text-muted-foreground">
                    Your assessment appears to be missing pulse check data. The results shown below use default values. 
                    Please complete your pulse check assessment to see accurate results.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => window.location.href = "/pulse-check"}
                    data-testid="button-complete-pulse-check"
                  >
                    Complete Pulse Check
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Executive Header */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-4">
            <Target className="h-6 sm:h-7 lg:h-8 w-6 sm:w-7 lg:w-8 text-primary flex-shrink-0" />
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-display font-bold text-foreground leading-tight">Your Strategic Maturity Profile</h1>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
            <Badge variant="outline" className="text-xs sm:text-sm lg:text-lg px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 whitespace-nowrap">
              Overall Maturity: {maturityLevel}
            </Badge>
            <Badge variant="secondary" className="text-xs sm:text-sm lg:text-lg px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 whitespace-nowrap">
              {triggeredGates.length} Critical Requirements
            </Badge>
          </div>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto font-ui px-2 sm:px-4">
            Below is your CORTEX profile: six domains, each scored 0–3. The <strong>honeycomb</strong> shows where you are strong and where you have room to build. Scores reflect today's practices, not potential.
          </p>
        </div>

        {/* Value Snapshot */}
        <ValueSnapshot 
          valueOverlay={valueOverlay}
          totalPillars={Object.keys(CORTEX_PILLARS).length}
        />

        {/* Executive Summary */}
        <Card className="mb-6 sm:mb-8 border-2 border-primary/20">
          <CardHeader className="bg-primary/5 p-3 sm:p-4 lg:p-6">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-4 sm:h-5 lg:h-6 w-4 sm:w-5 lg:w-6 text-primary flex-shrink-0" />
              <span className="text-lg sm:text-xl lg:text-2xl font-display">Executive Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {/* Key Insights */}
              <div>
                <h3 className="text-base sm:text-lg lg:text-xl font-display font-semibold mb-4 sm:mb-6 flex items-center gap-2">
                  <Lightbulb className="h-4 sm:h-5 w-4 sm:w-5 text-info flex-shrink-0" />
                  <span>Key Insights</span>
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  {insights.map((insight, index) => (
                    <div key={index} className="border-l-4 border-primary pl-3 sm:pl-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-2">
                        <h4 className="font-semibold text-sm sm:text-base lg:text-lg font-ui">{insight.title}</h4>
                        <Badge variant={insight.urgency === 'high' ? 'destructive' : insight.urgency === 'medium' ? 'secondary' : 'outline'} className="text-xs self-start sm:self-auto whitespace-nowrap">
                          {insight.urgency} priority
                        </Badge>
                      </div>
                      <p className="text-sm sm:text-base text-muted-foreground mb-2 font-ui">{insight.description} <span className="italic text-xs sm:text-sm">{insight.reasoning}</span></p>
                      <p className="text-xs sm:text-sm font-medium text-primary mb-2 font-ui">{insight.action}</p>
                      <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded font-ui">
                        <strong>Business Impact:</strong> {insight.businessImpact}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next 90 Days */}
              <div>
                <h3 className="text-base sm:text-lg lg:text-xl font-display font-semibold mb-4 sm:mb-6 flex items-center gap-2">
                  <Clock className="h-4 sm:h-5 w-4 sm:w-5 text-info flex-shrink-0" />
                  <span>Your Next 90 Days</span>
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  {priorities.map((priority, index) => (
                    <div key={index} className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-muted/50 rounded-lg">
                      <div className="bg-primary text-primary-foreground rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-1 sm:mb-2">
                          <p className="font-medium text-sm sm:text-base font-ui">{priority.title}</p>
                          <Badge variant={priority.urgency === 'high' ? 'destructive' : priority.urgency === 'medium' ? 'secondary' : 'outline'} className="text-xs self-start sm:self-auto whitespace-nowrap">
                            {priority.timeframe}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground font-ui">{priority.description}</p>
                        <p className="text-xs text-muted-foreground mt-1 font-ui">{priority.reasoning}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
                  <Button size="lg" className="w-full text-sm sm:text-base" onClick={handleExportPDF}>
                    <ArrowRight className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
                    Generate Executive Brief
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Visual Scorecard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 sm:h-5 w-4 sm:w-5 flex-shrink-0" />
                <span className="font-display text-base sm:text-lg lg:text-xl">CORTEX Maturity Radar</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center p-3 sm:p-4 lg:p-6">
              <HoneycombRadar 
                pillarScores={pillarScores} 
                className="max-w-[280px] sm:max-w-sm md:max-w-md mx-auto w-full"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="font-display text-base sm:text-lg lg:text-xl">Domain Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 lg:p-6">
              {Object.entries(pillarScores).map(([pillar, score]) => {
                const pillarInfo = CORTEX_PILLARS[pillar.toUpperCase() as keyof typeof CORTEX_PILLARS];
                if (!pillarInfo) return null;
                
                const percentage = (score / 3) * 100;
                
                return (
                  <div key={pillar} className="space-y-1.5 sm:space-y-2">
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div 
                          className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: pillarInfo.color }}
                        />
                        <span className="font-medium text-sm sm:text-base font-ui truncate">{pillarInfo.name}</span>
                      </div>
                      <Badge variant={score < 1.5 ? "destructive" : score < 2.5 ? "secondary" : "default"} className="text-xs whitespace-nowrap flex-shrink-0">
                        {score < 1 ? 'Nascent' : score < 2 ? 'Emerging' : score < 3 ? 'Integrated' : 'Leading'}
                      </Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 sm:h-2">
                      <div 
                        className="h-1.5 sm:h-2 rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: pillarInfo.color 
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Critical Requirements */}
        {triggeredGates.length > 0 && (
          <Card className="mb-6 sm:mb-8 border-warning/50">
            <CardHeader className="bg-warning/10 p-3 sm:p-4 lg:p-6">
              <CardTitle className="flex items-center gap-2 text-warning-foreground font-display text-base sm:text-lg lg:text-xl">
                <Shield className="h-5 sm:h-6 w-5 sm:w-6 flex-shrink-0" />
                <span>Critical Requirements for Your Context</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 font-ui">
                Because of your context, some safeguards are <strong>non-negotiable before scale</strong>. These aren't bureaucratic hurdles; they prevent avoidable harm and build trust. Expand each callout to learn what it is, why it applies, and simple ways to satisfy it.
              </p>
              
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="mb-3 sm:mb-4 w-full sm:w-auto text-sm sm:text-base">
                    <ChevronDown className="h-4 w-4 mr-2" />
                    View Requirements Details
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 sm:space-y-4">
                  {triggeredGates.map((gate: any) => (
                    <Card key={gate.id} className="border-l-4 border-l-warning">
                      <CardContent className="p-3 sm:p-4 lg:p-6">
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className="bg-warning text-warning-foreground p-1.5 sm:p-2 rounded-full flex-shrink-0">
                            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {gate.pillar && CORTEX_PILLARS[gate.pillar as keyof typeof CORTEX_PILLARS] && (
                                <Badge 
                                  variant="outline" 
                                  className="text-xs font-medium"
                                  style={{ 
                                    borderColor: CORTEX_PILLARS[gate.pillar as keyof typeof CORTEX_PILLARS].color,
                                    color: CORTEX_PILLARS[gate.pillar as keyof typeof CORTEX_PILLARS].color
                                  }}
                                >
                                  {gate.pillar} - {CORTEX_PILLARS[gate.pillar as keyof typeof CORTEX_PILLARS].name}
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-semibold text-base sm:text-lg mb-1 font-ui">{gate.title}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 font-ui">{gate.reason}</p>
                            
                            {gate.explain && (
                              <div className="bg-warning/10 p-2 sm:p-3 rounded text-xs mb-3 sm:mb-4">
                                <div className="space-y-1.5 sm:space-y-2">
                                  <div><strong>Why this gate was triggered:</strong></div>
                                  {Object.entries(gate.explain).map(([key, value]) => {
                                    const threshold = getGateThreshold(gate.id, key);
                                    return (
                                      <div key={key} className="flex justify-between items-center gap-2">
                                        <span className="text-xs">{key.replace(/_/g, ' ')}: </span>
                                        <span className="font-medium text-xs whitespace-nowrap">
                                          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                                          {typeof value === 'number' && '/4'}
                                          {threshold && ` (requires ${threshold})`}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            
                            {gate.actions && gate.actions.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2 text-xs sm:text-sm font-ui">Recommended Actions:</h4>
                                <ul className="text-xs sm:text-sm space-y-1 text-muted-foreground font-ui">
                                  {gate.actions.map((action: string, index: number) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <ChevronRight className="h-3 w-3 mt-0.5 text-warning flex-shrink-0" />
                                      <span>{action}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        )}

        {/* Detailed Analysis */}
        {/* How to Read the Guidance */}
        <Card className="mb-6 sm:mb-8 bg-primary/5 border-primary/15">
          <CardHeader className="p-3 sm:p-4 lg:p-6">
            <CardTitle className="flex items-center gap-2 text-primary font-display text-base sm:text-lg lg:text-xl">
              <BookOpen className="h-4 sm:h-5 w-4 sm:w-5 flex-shrink-0" />
              <span>How to Read the Guidance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <p className="text-foreground/90 mb-3 sm:mb-4 text-sm sm:text-base font-ui">
              For each domain you'll see:
            </p>
            <ul className="text-foreground/90 space-y-1.5 sm:space-y-2 font-ui">
              <li className="flex items-start gap-2">
                <span className="font-semibold min-w-fit text-sm sm:text-base">• Why this matters</span>
                <span className="text-xs sm:text-sm">— business impact in plain language</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold min-w-fit text-sm sm:text-base">• What good looks like</span>
                <span className="text-xs sm:text-sm">— observable practices</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold min-w-fit text-sm sm:text-base">• How it typically improves</span>
                <span className="text-xs sm:text-sm">— common pathways, options, and trade-offs</span>
              </li>
            </ul>
            <p className="text-foreground/80 mt-3 sm:mt-4 text-xs sm:text-sm italic font-ui">
              Use these as teaching notes and talking points. They are <strong>not mandates</strong>.
            </p>
          </CardContent>
        </Card>

        <Collapsible open={showDetailedView} onOpenChange={setShowDetailedView}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full mb-4 sm:mb-6 h-auto p-3 sm:p-4 lg:p-5 border-2 border-primary/50 bg-primary/10 shadow-md transition-all"
              data-testid="button-toggle-detailed-analysis"
              aria-expanded={showDetailedView}
            >
              <div className="flex items-center justify-between w-full gap-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="bg-primary text-primary-foreground p-2 sm:p-2.5 rounded-lg flex-shrink-0 shadow-sm">
                    <Compass className="h-5 sm:h-6 w-5 sm:w-6" />
                  </div>
                  <div className="text-left min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <h3 className="font-semibold text-base sm:text-lg lg:text-xl font-display text-foreground">
                        {showDetailedView ? 'Hide' : 'View'} Detailed Domain Analysis
                      </h3>
                      <Badge variant="default" className="font-ui pointer-events-none text-xs self-start sm:self-auto">
                        6 Domains
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-foreground/70 font-ui">
                      In-depth guidance, improvement pathways, and context-specific recommendations
                    </p>
                  </div>
                </div>
                <ChevronDown className={`h-5 sm:h-6 w-5 sm:w-6 text-foreground/60 transition-transform flex-shrink-0 ${showDetailedView ? 'rotate-180' : ''}`} />
              </div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {Object.entries(CORTEX_PILLARS).map(([key, pillar]) => {
                const score = pillarScores[key as keyof PillarScores] || 0;
                const pillarMoves = priorityMoves.filter((move: any) => move.pillar === key);
                const pillarValueData = valueOverlay?.[key as keyof ValueOverlay];
                return (
                  <DomainCard 
                    key={key} 
                    pillar={key} 
                    stage={score}
                    contextProfile={contextProfile}
                    valueOverlay={pillarValueData}
                    onValueOverlayUpdate={handleValueOverlayUpdate}
                    priorityMoves={pillarMoves}
                    contextGuidance={contextGuidance}
                  />
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Navigation Actions */}
        <Card className="mb-4 sm:mb-6" data-testid="navigation-actions">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="space-y-0.5 sm:space-y-1">
                <h3 className="text-sm sm:text-base font-semibold text-foreground">Review or Update</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Make changes to your pulse check responses or recalculate results
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <Link to={`/pulse/${assessmentId}`} data-testid="link-edit-pulse-answers" className="w-full sm:w-auto">
                  <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto text-sm">
                    <ArrowRight className="h-3.5 sm:h-4 w-3.5 sm:w-4 rotate-180" />
                    Edit Answers
                  </Button>
                </Link>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => {
                    // Trigger a refetch of the assessment data to recalculate results
                    queryClient.invalidateQueries({ queryKey: ['/api/assessments', assessmentId] });
                  }}
                  data-testid="button-recalculate-strategic"
                  className="gap-2 w-full sm:w-auto text-sm"
                >
                  <TrendingUp className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                  Recalculate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row justify-stretch sm:justify-end gap-2 sm:gap-3">
              <Button variant="outline" onClick={handleExportJSON} className="w-full sm:w-auto text-sm">
                Export Data
              </Button>
              <Button onClick={handleExportPDF} className="w-full sm:w-auto text-sm">
                Executive Brief PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      
      {/* Value Overlay Tutorial Modal */}
      <ValueOverlayTutorial open={showTutorial} onClose={handleTutorialClose} />
      </div>
    </ProtectedRoute>
  );
}