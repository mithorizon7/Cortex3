import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ProgressHeader from "@/components/progress-header";
import OfflineBanner from "@/components/offline-banner";
import { ErrorFallback } from "@/components/error-boundary";
import { ResultsSkeleton } from "@/components/skeleton-loader";
import HoneycombRadar from "@/components/honeycomb-radar";
import DomainCard from "@/components/domain-card";
import { AppHeader } from "@/components/navigation/app-header";
import { CORTEX_PILLARS, getPriorityLevel } from "@/lib/cortex";
import { generatePDFReport, exportJSONResults } from "@/lib/pdf-generator";
import { getNetworkError } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  Lightbulb
} from "lucide-react";
import type { Assessment, PillarScores, ContextProfile } from "@shared/schema";

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

// Generate executive insights based on assessment data
function generateExecutiveInsights(pillarScores: PillarScores, gates: any[], contextProfile: any) {
  const insights = [];
  const priorities = [];
  
  // Analyze overall maturity
  const avgScore = Object.values(pillarScores).reduce((sum, score) => sum + score, 0) / 6;
  const weakestPillars = Object.entries(pillarScores)
    .sort(([,a], [,b]) => a - b)
    .slice(0, 2);
  
  if (avgScore < 1.5) {
    insights.push({
      type: 'foundation',
      title: 'Focus on AI Readiness Foundations',
      description: 'Your organization needs foundational AI capabilities before scaling initiatives.',
      action: 'Invest in data infrastructure, governance, and talent development first.'
    });
    priorities.push('Build foundational AI capabilities');
  } else if (avgScore < 2.5) {
    insights.push({
      type: 'development',
      title: 'Develop Systematic AI Practices',
      description: 'You have basic capabilities but need systematic approaches to scale effectively.',
      action: 'Establish AI governance, standardize processes, and expand pilot programs.'
    });
    priorities.push('Systematize AI development practices');
  } else {
    insights.push({
      type: 'optimization',
      title: 'Optimize and Scale AI Operations',
      description: 'Strong AI foundations enable focus on optimization and strategic scaling.',
      action: 'Enhance monitoring, expand use cases, and drive competitive advantage through AI.'
    });
    priorities.push('Optimize existing AI systems for scale');
  }

  // Critical gates insight
  if (gates.length > 0) {
    insights.push({
      type: 'compliance',
      title: `${gates.length} Critical Requirements Must Be Addressed`,
      description: 'Your risk profile requires specific measures before AI scaling.',
      action: `Prioritize ${gates[0]?.title} and related compliance requirements.`
    });
    priorities.push('Address critical compliance requirements');
  } else {
    insights.push({
      type: 'acceleration',
      title: 'Clear to Accelerate AI Adoption',
      description: 'No major compliance blockers - focus on capability development.',
      action: 'Accelerate AI initiatives while maintaining good governance practices.'
    });
  }

  // Weak areas insight  
  const [weakestName] = weakestPillars;
  const pillarName = CORTEX_PILLARS[weakestName[0].toUpperCase() as keyof typeof CORTEX_PILLARS]?.name;
  if (pillarName) {
    insights.push({
      type: 'improvement',
      title: `Strengthen ${pillarName}`,
      description: 'This is your biggest opportunity for AI capability improvement.',
      action: `Invest in ${pillarName.toLowerCase()} capabilities to unlock broader AI value.`
    });
    priorities.push(`Strengthen ${pillarName}`);
  }

  return { insights: insights.slice(0, 3), priorities: priorities.slice(0, 3) };
}

export default function ResultsPage() {
  const { toast } = useToast();
  const assessmentId = window.location.pathname.split('/')[2];
  const [remindQuarterly, setRemindQuarterly] = useState(false);
  const [showDetailedView, setShowDetailedView] = useState(false);
  
  const { data: assessment, isLoading } = useQuery<Assessment>({
    queryKey: ['/api/assessments', assessmentId],
    enabled: !!assessmentId,
  });

  const completeAssessment = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/assessments/${assessmentId}/complete`);
      return response.json();
    },
  });

  const handleExportPDF = async () => {
    if (!assessment) return;
    
    try {
      const blob = await generatePDFReport({
        contextProfile: assessment.contextProfile as ContextProfile,
        pillarScores: assessment.pillarScores as PillarScores,
        triggeredGates: (assessment.triggeredGates as any[]) || [],
        priorityMoves: (assessment as any).priorityMoves || null,
        completedAt: assessment.completedAt || new Date().toISOString(),
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cortex-assessment-${Date.now()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: "Your assessment results have been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportJSON = () => {
    if (!assessment) return;
    
    exportJSONResults({
      contextProfile: assessment.contextProfile as ContextProfile,
      pillarScores: assessment.pillarScores as PillarScores,
      triggeredGates: (assessment.triggeredGates as any[]) || [],
      priorityMoves: (assessment as any).priorityMoves || null,
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground mb-2">Assessment Not Found</h1>
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
    );
  }

  const pillarScores = assessment.pillarScores as PillarScores;
  const triggeredGates = (assessment.triggeredGates as any[]) || [];
  const contextProfile = assessment.contextProfile as ContextProfile;
  const priorityMoves = (assessment as any).priorityMoves?.moves || [];
  const contextGuidance = (assessment as any).contextGuidance || {};
  const contentTags = (assessment as any).contentTags || [];
  const { insights, priorities } = generateExecutiveInsights(pillarScores, triggeredGates, contextProfile);
  
  const avgScore = Object.values(pillarScores).reduce((sum, score) => sum + score, 0) / 6;
  const maturityLevel = avgScore < 1 ? 'Nascent' : avgScore < 2 ? 'Emerging' : avgScore < 3 ? 'Integrated' : 'Leading';

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <OfflineBanner 
        onRetry={() => window.location.reload()} 
        showRetryButton={true}
      />
      <ProgressHeader currentStep={4} />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Executive Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Target className="h-6 sm:h-8 w-6 sm:w-8 text-primary" />
            <h1 className="text-2xl sm:text-4xl font-bold text-foreground">Your AI Readiness Results</h1>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-6">
            <Badge variant="outline" className="text-sm sm:text-lg px-3 sm:px-4 py-1 sm:py-2">
              Overall Maturity: {maturityLevel}
            </Badge>
            <Badge variant="secondary" className="text-sm sm:text-lg px-3 sm:px-4 py-1 sm:py-2">
              {triggeredGates.length} Critical Requirements
            </Badge>
          </div>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Based on your organizational context and current capabilities, here's your personalized AI strategy.
          </p>
        </div>

        {/* Executive Summary */}
        <Card className="mb-8 border-2 border-primary/20">
          <CardHeader className="bg-primary/5 p-4 sm:p-6">
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 sm:h-6 w-5 sm:w-6 text-primary" />
              <span className="text-xl sm:text-2xl">Executive Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-8">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Key Insights */}
              <div>
                <h3 className="text-xl font-semibold mb-6 flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  <span>Key Insights</span>
                </h3>
                <div className="space-y-4">
                  {insights.map((insight, index) => (
                    <div key={index} className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold text-lg mb-2">{insight.title}</h4>
                      <p className="text-muted-foreground mb-2">{insight.description}</p>
                      <p className="text-sm font-medium text-primary">{insight.action}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next 90 Days */}
              <div>
                <h3 className="text-xl font-semibold mb-6 flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <span>Your Next 90 Days</span>
                </h3>
                <div className="space-y-4">
                  {priorities.map((priority, index) => (
                    <div key={index} className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
                      <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{priority}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t border-border">
                  <Button size="lg" className="w-full" onClick={handleExportPDF}>
                    <ArrowRight className="h-5 w-5 mr-2" />
                    Get Detailed Action Plan
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visual Scorecard */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>CORTEX Maturity Radar</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center p-6">
              <HoneycombRadar pillarScores={pillarScores} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Domain Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(pillarScores).map(([pillar, score]) => {
                const pillarInfo = CORTEX_PILLARS[pillar.toUpperCase() as keyof typeof CORTEX_PILLARS];
                if (!pillarInfo) return null;
                
                const percentage = (score / 3) * 100;
                
                return (
                  <div key={pillar} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{pillarInfo.name}</span>
                      <Badge variant={score < 1.5 ? "destructive" : score < 2.5 ? "secondary" : "default"}>
                        {score < 1 ? 'Nascent' : score < 2 ? 'Emerging' : score < 3 ? 'Integrated' : 'Leading'}
                      </Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
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
          <Card className="mb-8 border-amber-500/50">
            <CardHeader className="bg-amber-50 dark:bg-amber-950">
              <CardTitle className="flex items-center space-x-2 text-amber-800 dark:text-amber-200">
                <Shield className="h-6 w-6" />
                <span>Critical Requirements ({triggeredGates.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-6">
                Based on your organizational context, these measures must be implemented before scaling AI initiatives.
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
                    <Card key={gate.id} className="border-l-4 border-l-amber-500">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="bg-amber-500 text-white p-2 rounded-full flex-shrink-0">
                            <AlertTriangle className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{gate.title}</h3>
                            <p className="text-sm text-muted-foreground mb-4">{gate.reason}</p>
                            
                            {gate.explain && (
                              <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded text-xs mb-4">
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
                                <h4 className="font-medium mb-2 text-sm">Recommended Actions:</h4>
                                <ul className="text-sm space-y-1 text-muted-foreground">
                                  {gate.actions.map((action: string, index: number) => (
                                    <li key={index} className="flex items-start space-x-2">
                                      <ChevronRight className="h-3 w-3 mt-0.5 text-amber-500 flex-shrink-0" />
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
        <Collapsible open={showDetailedView} onOpenChange={setShowDetailedView}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="lg" className="w-full mb-6">
              <ChevronDown className={`h-4 w-4 mr-2 transition-transform ${showDetailedView ? 'rotate-180' : ''}`} />
              {showDetailedView ? 'Hide' : 'Show'} Detailed Domain Analysis
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {Object.entries(CORTEX_PILLARS).map(([key, pillar]) => {
                const pillarKey = key.toLowerCase();
                const score = pillarScores[pillarKey as keyof PillarScores] || 0;
                const pillarMoves = priorityMoves.filter((move: any) => move.pillar === key);
                return (
                  <DomainCard 
                    key={key} 
                    pillar={key} 
                    stage={score}
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
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="quarterly-reminder"
                  checked={remindQuarterly}
                  onCheckedChange={(checked) => setRemindQuarterly(checked === true)}
                />
                <label htmlFor="quarterly-reminder" className="text-sm">
                  Email me quarterly AI readiness updates
                </label>
              </div>
              
              <div className="flex space-x-3">
                <Button variant="outline" onClick={handleExportJSON}>
                  Export Data
                </Button>
                <Button onClick={handleExportPDF}>
                  Download Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}