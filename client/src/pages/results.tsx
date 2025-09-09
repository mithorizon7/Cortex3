import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import ProgressHeader from "@/components/progress-header";
import HoneycombRadar from "@/components/honeycomb-radar";
import DomainCard from "@/components/domain-card";
import { CORTEX_PILLARS, getPriorityLevel } from "@/lib/cortex";
import { generatePDFReport, exportJSONResults } from "@/lib/pdf-generator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle, CircleOff } from "lucide-react";
import type { Assessment, PillarScores, ContextProfile } from "@shared/schema";

export default function ResultsPage() {
  const { toast } = useToast();
  const assessmentId = window.location.pathname.split('/')[2];
  const [remindQuarterly, setRemindQuarterly] = useState(false);
  
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
      completedAt: assessment.completedAt || new Date().toISOString(),
    });
    
    toast({
      title: "Export Complete",
      description: "JSON data has been downloaded.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!assessment || !assessment.pillarScores) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground mb-2">Results Not Ready</h1>
              <p className="text-muted-foreground mb-4">
                Please complete the pulse check first to see your results.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Complete assessment if not already done
  if (!assessment.triggeredGates) {
    completeAssessment.mutate();
  }

  const pillarScores = assessment.pillarScores as PillarScores;
  const triggeredGates = (assessment.triggeredGates as any[]) || [];
  const priorities = getPriorityLevel(pillarScores, assessment.contextProfile as ContextProfile);
  
  const strengths = Object.entries(pillarScores).filter(([_, score]) => score >= 2);
  const priorities3 = Object.entries(pillarScores)
    .filter(([_, score]) => score <= 1)
    .sort(([,a], [,b]) => (a as number) - (b as number));

  return (
    <div className="min-h-screen bg-background">
      <ProgressHeader currentStep={3} onExport={handleExportPDF} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-12">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Your AI Readiness Assessment Results
          </h1>
          <p className="text-muted-foreground mb-8">
            Based on your context profile and pulse responses, here are your personalized insights and recommendations.
          </p>
          
          {/* Context Gates */}
          {triggeredGates.length > 0 && (
            <div className="space-y-6 mb-8">
              <h2 className="text-xl font-semibold">Required Context Gates</h2>
              <p className="text-muted-foreground text-sm mb-4">
                Based on your organizational context, these measures must be implemented before scaling AI initiatives.
              </p>
              {triggeredGates.map((gate: any) => (
                <Card key={gate.id} className="gate-callout border-l-4 border-l-amber-500">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-amber-500 text-white p-2 rounded-full flex-shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg mb-1">{gate.title}</h3>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              <span className="bg-primary text-primary-foreground px-2 py-1 rounded">
                                {gate.pillar} Domain
                              </span>
                              <span>•</span>
                              <span>Priority: High</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">
                              <strong>Why this is required:</strong> {gate.reason}
                            </p>
                            {gate.explain && (
                              <div className="bg-muted/30 p-3 rounded text-xs">
                                <strong>Based on your profile:</strong>{' '}
                                {Object.entries(gate.explain).map(([key, value], index) => (
                                  <span key={key}>
                                    {index > 0 && ', '}
                                    {key.replace(/_/g, ' ')}: {String(value)}
                                    {typeof value === 'number' && key !== 'procurement_constraints' && key !== 'edge_operations' && '/4'}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {gate.description && (
                            <div>
                              <p className="text-sm">{gate.description}</p>
                            </div>
                          )}
                          
                          {gate.actions && gate.actions.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2 text-sm">Recommended Actions:</h4>
                              <ul className="text-sm space-y-1 text-muted-foreground">
                                {gate.actions.map((action: string, index: number) => (
                                  <li key={index}>• {action}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Main Results Layout */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Honeycomb Radar */}
          <Card>
            <CardContent className="p-6">
              <HoneycombRadar pillarScores={pillarScores} />
            </CardContent>
          </Card>
          
          {/* Key Insights */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-6">Key Insights</h2>
              
              <div className="space-y-6">
                {/* Strengths */}
                {strengths.length > 0 && (
                  <div>
                    <h3 className="font-medium text-green-700 mb-2 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Strengths
                    </h3>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      {strengths.map(([pillar, score]) => {
                        const pillarInfo = CORTEX_PILLARS[pillar as keyof typeof CORTEX_PILLARS];
                        return (
                          <li key={pillar}>
                            • <strong>{pillarInfo.name}:</strong> Leading practices established
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                
                {/* Priority Areas */}
                {priorities3.length > 0 && (
                  <div>
                    <h3 className="font-medium text-amber-700 mb-2 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Priority Areas
                    </h3>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      {priorities3.slice(0, 3).map(([pillar, score]) => {
                        const pillarInfo = CORTEX_PILLARS[pillar as keyof typeof CORTEX_PILLARS];
                        return (
                          <li key={pillar}>
                            • <strong>{pillarInfo.name}:</strong> Requires immediate attention
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                
                {/* Context Considerations */}
                <div>
                  <h3 className="font-medium text-blue-700 mb-2 flex items-center">
                    <CircleOff className="w-4 h-4 mr-2" />
                    Context Considerations
                  </h3>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    {(assessment.contextProfile as ContextProfile).regulatory_intensity >= 3 && (
                      <li>• High regulatory environment requires enhanced controls</li>
                    )}
                    {(assessment.contextProfile as ContextProfile).build_readiness >= 3 && (
                      <li>• Strong build readiness supports ambitious AI initiatives</li>
                    )}
                    {(assessment.contextProfile as ContextProfile).data_sensitivity >= 3 && (
                      <li>• Data sensitivity demands strict governance</li>
                    )}
                  </ul>
                </div>
              </div>
              
              {/* Reflection Prompts */}
              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="font-medium mb-3">Reflection Questions</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• What surprised you most about these results?</p>
                  <p>• Which two domains feel most important for your near-term priorities?</p>
                  <p>• How do these insights align with your current AI strategy?</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Domain Cards */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-8">Domain-Specific Guidance</h2>
          
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Object.entries(pillarScores)
              .sort(([pillarA, scoreA], [pillarB, scoreB]) => {
                // Sort by score (lowest first), then alphabetically
                const scoreANum = scoreA as number;
                const scoreBNum = scoreB as number;
                if (scoreANum !== scoreBNum) return scoreANum - scoreBNum;
                return pillarA.localeCompare(pillarB);
              })
              .map(([pillar, stage]) => {
                const priority = priorities.find(p => p.pillar === pillar)?.priority || 0;
                const contextReason = triggeredGates.length > 0 && (stage as number) <= 1 
                  ? "Your context profile indicates higher risk requirements"
                  : undefined;
                
                return (
                  <DomainCard
                    key={pillar}
                    pillar={pillar}
                    stage={stage as number}
                    priority={priority}
                    contextReason={contextReason}
                  />
                );
              })}
          </div>
        </section>

        {/* Export and Next Steps */}
        <Card>
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-semibold mb-4">Export Your Results</h2>
                <p className="text-muted-foreground mb-6">
                  Download your complete assessment including context profile, radar visualization, 
                  domain guidance, and prioritized recommendations.
                </p>
                
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={handleExportPDF}
                    data-testid="button-export-pdf"
                  >
                    <i className="fas fa-file-pdf mr-2"></i>
                    Download PDF Report
                  </Button>
                  <Button 
                    variant="secondary"
                    onClick={handleExportJSON}
                    data-testid="button-export-json"
                  >
                    <i className="fas fa-code mr-2"></i>
                    Export JSON Data
                  </Button>
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-semibold mb-4">Next Steps</h2>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-primary text-primary-foreground p-1 rounded text-sm font-medium min-w-[24px] text-center">1</div>
                    <div>
                      <p className="font-medium">Focus on Priority Domains</p>
                      <p className="text-sm text-muted-foreground">
                        Start with the lowest-scoring domains first
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-primary text-primary-foreground p-1 rounded text-sm font-medium min-w-[24px] text-center">2</div>
                    <div>
                      <p className="font-medium">Implement Required Gates</p>
                      <p className="text-sm text-muted-foreground">
                        Address any triggered context gates before scaling
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-primary text-primary-foreground p-1 rounded text-sm font-medium min-w-[24px] text-center">3</div>
                    <div>
                      <p className="font-medium">Schedule Quarterly Review</p>
                      <p className="text-sm text-muted-foreground">
                        Re-assess in 90 days to track progress
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-border">
                  <label className="flex items-center space-x-2 text-sm cursor-pointer">
                    <Checkbox 
                      checked={remindQuarterly}
                      onCheckedChange={(checked) => setRemindQuarterly(checked === true)}
                      data-testid="checkbox-quarterly-reminder"
                    />
                    <span>Remind me to re-take this assessment in 90 days</span>
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
