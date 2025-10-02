import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AppHeader } from "@/components/navigation/app-header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import ProgressHeader from "@/components/progress-header";
import OfflineBanner from "@/components/offline-banner";
import { DOMAIN_INTROS, FOOTER_COPY } from "@/lib/domain-intros";
import { ChevronRight, ChevronDown, BookOpen, Target, Lightbulb, CheckSquare, FileText, AlertCircle, AlertTriangle } from "lucide-react";

const DOMAIN_ORDER = ['C', 'O', 'R', 'T', 'E', 'X'];

export default function DomainIntroPage() {
  const [, navigate] = useLocation();
  const { domain, id: assessmentId } = useParams();
  const [skipIntros, setSkipIntros] = useState(false);
  const [showDeepDive, setShowDeepDive] = useState(false);

  // Load skip preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('cortex_skip_intros');
    setSkipIntros(stored === 'true');
  }, []);

  const { data: assessment, isLoading } = useQuery({
    queryKey: ['/api/assessments', assessmentId],
    enabled: !!assessmentId,
  });

  const domainData = DOMAIN_INTROS[domain as string];
  const currentIndex = DOMAIN_ORDER.indexOf(domain as string);
  const progress = ((currentIndex + 1) / DOMAIN_ORDER.length) * 100;

  // Helper function to evaluate complex conditions
  const evaluateCondition = (condition: string, profile: any): boolean => {
    if (!profile) return false;
    
    // Map friendly names to canonical names
    const friendlyToCanonical: Record<string, string> = {
      'regulated': 'regulatory_intensity',
      'sensitivity': 'data_sensitivity',
      'safety': 'safety_criticality',
      'brand': 'brand_exposure',
      'scale': 'scale_throughput'
    };
    
    // All canonical field names
    const canonicalFields = [
      'regulatory_intensity', 'data_sensitivity', 'safety_criticality',
      'brand_exposure', 'clock_speed', 'latency_edge', 'scale_throughput',
      'data_advantage', 'build_readiness', 'finops_priority',
      'procurement_constraints', 'edge_operations'
    ];
    
    // Start with the original condition
    let evaluableCondition = condition;
    
    // First, replace friendly names with canonical names
    for (const [friendly, canonical] of Object.entries(friendlyToCanonical)) {
      // Use word boundaries to avoid partial matches
      const regex = new RegExp(`\\b${friendly}\\b`, 'g');
      evaluableCondition = evaluableCondition.replace(regex, canonical);
    }
    
    // Then, add 'profile.' prefix to all canonical field names
    // Sort by length descending to avoid replacing partial matches
    const sortedFields = [...canonicalFields].sort((a, b) => b.length - a.length);
    for (const fieldName of sortedFields) {
      // Replace field names that aren't already prefixed with 'profile.'
      const regex = new RegExp(`\\b${fieldName}\\b`, 'g');
      evaluableCondition = evaluableCondition.replace(regex, (match, offset, str) => {
        // Check if already prefixed by looking at previous characters
        const beforeMatch = str.substring(Math.max(0, offset - 8), offset);
        if (beforeMatch.endsWith('profile.')) {
          return match; // Already prefixed, don't replace
        }
        return `profile.${fieldName}`;
      });
    }
    
    // Safely evaluate the condition
    try {
      // Create a function that evaluates the condition with profile in scope
      const evalFunc = new Function('profile', `return ${evaluableCondition};`);
      return evalFunc(profile);
    } catch (e) {
      console.warn(`Failed to evaluate condition: ${condition}`, e);
      return false;
    }
  };

  // Determine which context notes to show based on assessment profile
  const contextNotesToShow = domainData?.contextNotes?.filter(note => {
    if (!assessment || !(assessment as any)?.contextProfile) return false;
    const profile = (assessment as any).contextProfile;
    return evaluateCondition(note.condition, profile);
  }) || [];
  
  // Separate critical and awareness notes
  const criticalNotes = contextNotesToShow.filter(note => note.severity === 'critical');
  const awarenessNotes = contextNotesToShow.filter(note => note.severity !== 'critical');

  const handleSkipToggle = (checked: boolean) => {
    setSkipIntros(checked);
    localStorage.setItem('cortex_skip_intros', checked.toString());
  };

  const handleStartQuestions = () => {
    // Track telemetry
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'pulse.intro.start', {
        domain: domain,
        assessment_id: assessmentId
      });
    }
    
    navigate(`/pulse/${domain}/questions/${assessmentId}`);
  };

  const handleSkipToQuestions = () => {
    navigate(`/pulse/${domain}/questions/${assessmentId}`);
  };

  if (isLoading || !domainData) {
    return (
      <ProtectedRoute requireAuth>
        <div className="min-h-screen bg-background">
          <AppHeader />
          <ProgressHeader currentStep={3} />
          <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-muted rounded w-64 mx-auto" />
                <div className="h-4 bg-muted rounded w-48 mx-auto" />
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  // Track page view
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'pulse.intro.viewed', {
        domain: domain,
        assessment_id: assessmentId
      });
    }
  }, [domain, assessmentId]);

  return (
    <ProtectedRoute requireAuth>
      <div className="min-h-screen bg-background">
        <AppHeader />
        <OfflineBanner 
          onRetry={() => window.location.reload()} 
          showRetryButton={true}
        />
        <ProgressHeader currentStep={3} />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Skip to questions for power users */}
          <div className="flex justify-end mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkipToQuestions}
              className="text-muted-foreground hover:text-foreground"
              data-testid="skip-to-questions"
            >
              Skip to questions →
            </Button>
          </div>

          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground font-ui">
                Domain {currentIndex + 1} of {DOMAIN_ORDER.length}
              </div>
              <div className="text-sm text-muted-foreground font-ui">
                Before {domainData.code} questions
              </div>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="bg-primary text-primary-foreground p-4 rounded-full">
                    <span className="text-2xl font-bold">{domainData.code}</span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">
                      {domainData.code} · {domainData.title}
                    </h1>
                  </div>
                </div>
              </div>

              {/* Why This Matters */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Target className="h-5 w-5 text-primary" />
                    <span>Why This Matters</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed font-ui">{domainData.why}</p>
                </CardContent>
              </Card>

              {/* Principles */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    <span>Principles</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {domainData.principles.map((principle, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <div className="bg-primary/10 text-primary p-1 rounded-full mt-0.5">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                        </div>
                        <span className="text-foreground font-ui leading-relaxed">{principle}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* What Good Looks Like */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <CheckSquare className="h-5 w-5 text-primary" />
                    <span>What Good Can Look Like</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {domainData.signals.map((signal, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="text-green-600 dark:text-green-400 mt-0.5">
                          <CheckSquare className="h-4 w-4" />
                        </div>
                        <span className="text-foreground font-ui leading-relaxed">{signal}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Critical Context Notes */}
              {criticalNotes.length > 0 && (
                <Card className="mb-6 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-lg text-red-800 dark:text-red-200">
                      <AlertTriangle className="h-5 w-5" />
                      <span>Critical Context for Your Organization</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {criticalNotes.map((note, index) => (
                        <div key={index} className="border-l-4 border-red-500 pl-4 py-2">
                          <p className="text-red-800 dark:text-red-200 font-ui leading-relaxed">
                            {note.note}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Awareness Context Notes */}
              {awarenessNotes.length > 0 && (
                <Card className="mb-8 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-lg text-amber-800 dark:text-amber-200">
                      <AlertCircle className="h-5 w-5" />
                      <span>Context Guidance for Your Organization</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {awarenessNotes.map((note, index) => (
                        <p key={index} className="text-amber-800 dark:text-amber-200 font-ui leading-relaxed">
                          {note.note}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* How to Answer */}
              <Card className="mb-8 border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg text-primary">{FOOTER_COPY.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {FOOTER_COPY.instructions.map((instruction, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-primary font-bold mt-1">•</span>
                        <span className="text-foreground font-ui">{instruction}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Right Rail */}
            <div className="lg:col-span-1">
              <div className="space-y-6 lg:sticky lg:top-8">
                {/* Key Terms */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Key Terms</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {domainData.terms.map((term, index) => (
                      <div key={index} className="space-y-1">
                        <div className="font-semibold text-sm text-primary">{term.term}</div>
                        <div className="text-xs text-muted-foreground font-ui leading-relaxed">
                          {term.definition}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Evidence You Could Point To */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>Evidence You Could Point To</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {domainData.evidence.map((item, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-muted-foreground text-xs mt-1">•</span>
                          <span className="text-sm text-foreground font-ui">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Deep Dive (Collapsible) */}
                <Collapsible open={showDeepDive} onOpenChange={setShowDeepDive}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span>Need detail?</span>
                      {showDeepDive ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground font-ui">
                          Deep dive content would be available here - detailed methodology, examples, and implementation guidance for the {domainData.title} domain.
                        </p>
                      </CardContent>
                    </Card>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-12 border-t border-border pt-8">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              {/* Skip preference */}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="skip-intros"
                  checked={skipIntros}
                  onCheckedChange={handleSkipToggle}
                  data-testid="checkbox-skip-intros"
                />
                <label 
                  htmlFor="skip-intros" 
                  className="text-sm text-muted-foreground font-ui cursor-pointer"
                >
                  Skip intros next time
                </label>
              </div>

              {/* Primary action */}
              <Button 
                size="lg"
                onClick={handleStartQuestions}
                className="flex items-center space-x-2 px-8"
                data-testid="button-start-questions"
              >
                <span>Start these 3 questions</span>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}