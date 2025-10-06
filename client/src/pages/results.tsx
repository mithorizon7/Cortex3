import React, { useState, useCallback } from "react";
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
    'build_readiness_gate': {
      'build_readiness': '≤1'
    },
    'procurement_compliance': {
      'procurement_constraints': 'True'
    },
    'edge_operations_security': {
      'edge_operations': 'True'
    }
  };
  
  return thresholds[gateId]?.[dimension] || null;
}


export default function ResultsPage() {
  const { toast } = useToast();
  const { id: assessmentId } = useParams();
  const [showDetailedView, setShowDetailedView] = useState(false);
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
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Target className="h-6 sm:h-8 w-6 sm:w-8 text-primary" />
            <h1 className="text-2xl sm:text-4xl font-display font-bold text-foreground">Your Strategic Maturity Profile</h1>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-6">
            <Badge variant="outline" className="text-sm sm:text-lg px-3 sm:px-4 py-1 sm:py-2">
              Overall Maturity: {maturityLevel}
            </Badge>
            <Badge variant="secondary" className="text-sm sm:text-lg px-3 sm:px-4 py-1 sm:py-2">
              {triggeredGates.length} Critical Requirements
            </Badge>
          </div>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto font-ui">
            Below is your CORTEX profile: six domains, each scored 0–3. The <strong>honeycomb</strong> shows where you are strong and where you have room to build. Scores reflect today's practices, not potential.
          </p>
        </div>

        {/* Value Snapshot */}
        <ValueSnapshot 
          valueOverlay={valueOverlay}
          totalPillars={Object.keys(CORTEX_PILLARS).length}
        />

        {/* Executive Summary */}
        <Card className="mb-8 border-2 border-primary/20">
          <CardHeader className="bg-primary/5 p-4 sm:p-6">
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 sm:h-6 w-5 sm:w-6 text-primary" />
              <span className="text-xl sm:text-2xl font-display">Executive Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Key Insights */}
              <div>
                <h3 className="text-xl font-display font-semibold mb-6 flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5 text-info" />
                  <span>Key Insights</span>
                </h3>
                <div className="space-y-4">
                  {insights.map((insight, index) => (
                    <div key={index} className="border-l-4 border-primary pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-lg font-ui">{insight.title}</h4>
                        <Badge variant={insight.urgency === 'high' ? 'destructive' : insight.urgency === 'medium' ? 'secondary' : 'outline'} className="text-xs">
                          {insight.urgency} priority
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-2 font-ui">{insight.description} <span className="italic text-sm">{insight.reasoning}</span></p>
                      <p className="text-sm font-medium text-primary mb-2 font-ui">{insight.action}</p>
                      <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded font-ui">
                        <strong>Business Impact:</strong> {insight.businessImpact}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next 90 Days */}
              <div>
                <h3 className="text-xl font-display font-semibold mb-6 flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-info" />
                  <span>Your Next 90 Days</span>
                </h3>
                <div className="space-y-4">
                  {priorities.map((priority, index) => (
                    <div key={index} className="flex items-start space-x-3 p-4 sm:p-4 bg-muted/50 rounded-lg">
                      <div className="bg-primary text-primary-foreground rounded-full w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center font-bold text-base sm:text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium font-ui">{priority.title}</p>
                          <Badge variant={priority.urgency === 'high' ? 'destructive' : priority.urgency === 'medium' ? 'secondary' : 'outline'} className="text-xs">
                            {priority.timeframe}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground font-ui">{priority.description}</p>
                        <p className="text-xs text-muted-foreground mt-1 font-ui">{priority.reasoning}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t border-border">
                  <Button size="lg" className="w-full" onClick={handleExportPDF}>
                    <ArrowRight className="h-5 w-5 mr-2" />
                    Generate Executive Brief
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Visual Scorecard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span className="font-display text-lg sm:text-xl">CORTEX Maturity Radar</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center p-4 sm:p-6">
              <HoneycombRadar 
                pillarScores={pillarScores} 
                className="max-w-md mx-auto"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display">Domain Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(pillarScores).map(([pillar, score]) => {
                const pillarInfo = CORTEX_PILLARS[pillar.toUpperCase() as keyof typeof CORTEX_PILLARS];
                if (!pillarInfo) return null;
                
                const percentage = (score / 3) * 100;
                
                return (
                  <div key={pillar} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: pillarInfo.color }}
                        />
                        <span className="font-medium font-ui">{pillarInfo.name}</span>
                      </div>
                      <Badge variant={score < 1.5 ? "destructive" : score < 2.5 ? "secondary" : "default"}>
                        {score < 1 ? 'Nascent' : score < 2 ? 'Emerging' : score < 3 ? 'Integrated' : 'Leading'}
                      </Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-500" 
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
          <Card className="mb-8 border-warning/50">
            <CardHeader className="bg-warning/10">
              <CardTitle className="flex items-center space-x-2 text-warning-foreground font-display">
                <Shield className="h-6 w-6" />
                <span>Critical Requirements for Your Context</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-6 font-ui">
                Because of your context, some safeguards are <strong>non-negotiable before scale</strong>. These aren't bureaucratic hurdles; they prevent avoidable harm and build trust. Expand each callout to learn what it is, why it applies, and simple ways to satisfy it.
              </p>
              
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="mb-4">
                    <ChevronDown className="h-4 w-4 mr-2" />
                    View Requirements Details
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4">
                  {triggeredGates.map((gate: any) => (
                    <Card key={gate.id} className="border-l-4 border-l-warning">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="bg-warning text-warning-foreground p-2 rounded-full flex-shrink-0">
                            <AlertTriangle className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1 font-ui">{gate.title}</h3>
                            <p className="text-sm text-muted-foreground mb-4 font-ui">{gate.reason}</p>
                            
                            {gate.explain && (
                              <div className="bg-warning/10 p-3 rounded text-xs mb-4">
                                <div className="space-y-2">
                                  <div><strong>Why this gate was triggered:</strong></div>
                                  {Object.entries(gate.explain).map(([key, value]) => {
                                    const threshold = getGateThreshold(gate.id, key);
                                    return (
                                      <div key={key} className="flex justify-between items-center">
                                        <span>{key.replace(/_/g, ' ')}: </span>
                                        <span className="font-medium">
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
                                <h4 className="font-medium mb-2 text-sm font-ui">Recommended Actions:</h4>
                                <ul className="text-sm space-y-1 text-muted-foreground font-ui">
                                  {gate.actions.map((action: string, index: number) => (
                                    <li key={index} className="flex items-start space-x-2">
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
        <Card className="mb-8 bg-primary/5 border-primary/15">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-primary font-display">
              <BookOpen className="h-5 w-5" />
              <span>How to Read the Guidance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-foreground/90 mb-4 font-ui">
              For each domain you'll see:
            </p>
            <ul className="text-foreground/90 space-y-2 font-ui">
              <li className="flex items-start space-x-2">
                <span className="font-semibold min-w-fit">• Why this matters</span>
                <span className="text-sm">— business impact in plain language</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-semibold min-w-fit">• What good looks like</span>
                <span className="text-sm">— observable practices</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-semibold min-w-fit">• How it typically improves</span>
                <span className="text-sm">— common pathways, options, and trade-offs</span>
              </li>
            </ul>
            <p className="text-foreground/80 mt-4 text-sm italic font-ui">
              Use these as teaching notes and talking points. They are <strong>not mandates</strong>.
            </p>
          </CardContent>
        </Card>

        <Collapsible open={showDetailedView} onOpenChange={setShowDetailedView}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full mb-6 h-auto p-4 border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/40"
              data-testid="button-toggle-detailed-analysis"
              aria-expanded={showDetailedView}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary/15 text-primary p-2 rounded-lg">
                    <Compass className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-lg font-display">
                        {showDetailedView ? 'Hide' : 'View'} Detailed Domain Analysis
                      </h3>
                      <Badge variant="secondary" className="font-ui pointer-events-none">
                        6 Domains
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground font-ui">
                      In-depth guidance, improvement pathways, and context-specific recommendations
                    </p>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform flex-shrink-0 ml-4 ${showDetailedView ? 'rotate-180' : ''}`} />
              </div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {Object.entries(CORTEX_PILLARS).map(([key, pillar]) => {
                const pillarKey = key.toLowerCase();
                const score = pillarScores[pillarKey as keyof PillarScores] || 0;
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

        {/* Actions */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-center sm:justify-end">
              <div className="flex space-x-3">
                <Button variant="outline" onClick={handleExportJSON}>
                  Export Data
                </Button>
                <Button onClick={handleExportPDF}>
                  Executive Brief PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      </div>
    </ProtectedRoute>
  );
}