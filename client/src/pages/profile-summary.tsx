import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import ProgressHeader from "@/components/progress-header";
import OfflineBanner from "@/components/offline-banner";
import { AppHeader } from "@/components/navigation/app-header";
import { CONTEXT_ITEMS } from "@/lib/cortex";
import { ChevronRight, Shield, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export default function ProfileSummaryPage() {
  const [, navigate] = useLocation();
  const { id: assessmentId } = useParams();
  
  const { data: assessment, isLoading } = useQuery({
    queryKey: ['/api/assessments', assessmentId],
    enabled: !!assessmentId,
  });

  useEffect(() => {
    if (!assessmentId) {
      navigate('/');
    }
  }, [assessmentId, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <ProgressHeader currentStep={2} />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <ProgressHeader currentStep={2} />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Assessment not found. Please start a new assessment.
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  const contextProfile = (assessment as any)?.contextProfile || {};
  const triggeredGates = (assessment as any)?.contextGuidance?.gates || [];

  const getProfileItemDisplay = (key: string, value: any) => {
    const item = CONTEXT_ITEMS.find(i => i.key === key);
    if (!item) return { label: key, displayValue: String(value) };

    if (item.type === 'slider') {
      const numValue = Number(value);
      const levelLabel = item.labels?.[numValue] || `Level ${numValue}`;
      const levelDescription = item.anchors?.[numValue] || '';
      return {
        label: item.label,
        displayValue: levelLabel,
        description: levelDescription,
        level: numValue
      };
    } else {
      return {
        label: item.label,
        displayValue: value ? 'Yes' : 'No',
        description: value ? 'This applies to your organization' : 'This does not apply to your organization'
      };
    }
  };

  const profileEntries = Object.entries(contextProfile).map(([key, value]) => 
    getProfileItemDisplay(key, value)
  );

  const highValueItems = profileEntries.filter(item => 
    item.level === 4 || item.level === 3 || (item.displayValue === 'Yes')
  );

  const continueToPulseCheck = () => {
    navigate(`/pulse-check/${assessmentId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <OfflineBanner 
        onRetry={() => window.location.reload()} 
        showRetryButton={true}
      />
      <ProgressHeader currentStep={2} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h1 className="text-3xl font-bold text-foreground">Context Profile Complete</h1>
          </div>
          <p className="text-lg text-muted-foreground mb-4">
            Here's your organizational context profile. We'll use this to tailor your assessment results.
          </p>
          <Progress value={66.7} className="w-full max-w-md mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">
            Step 2 of 4 • Ready for Pulse Check
          </p>
        </div>

        {/* Critical Requirements Alert */}
        {triggeredGates.length > 0 && (
          <Alert className="mb-8 border-amber-500/50 bg-amber-50 dark:bg-amber-950">
            <Shield className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>Important:</strong> Based on your context, we've identified {triggeredGates.length} critical requirement{triggeredGates.length !== 1 ? 's' : ''} 
              that must be addressed before scaling AI. These will be detailed in your results.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* High Priority Context */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <span>Key Context Factors</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                These factors will strongly influence your AI strategy recommendations:
              </p>
              {highValueItems.length > 0 ? (
                <div className="space-y-3">
                  {highValueItems.map((item, index) => (
                    <div key={index} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{item.label}</span>
                        <Badge variant={item.level === 4 || item.displayValue === 'Yes' ? "destructive" : "secondary"}>
                          {item.displayValue}
                        </Badge>
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Your organization has a relatively standard risk and complexity profile.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>What Happens Next</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-sm">Pulse Check (6-8 minutes)</p>
                    <p className="text-xs text-muted-foreground">Answer 18 yes/no questions about your current AI capabilities</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-muted text-muted-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-sm">Personalized Results</p>
                    <p className="text-xs text-muted-foreground">Get your radar view, domain guidance, and tailored recommendations</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-muted text-muted-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-sm">Export & Share</p>
                    <p className="text-xs text-muted-foreground">Download your executive summary and action plan</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Complete Profile Overview (Collapsible) */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Complete Context Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              {profileEntries.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-sm font-medium">{item.label}</span>
                  <Badge variant="outline" className="text-xs">
                    {item.displayValue}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Continue Button */}
        <div className="text-center">
          <Button 
            onClick={continueToPulseCheck}
            size="lg"
            className="flex items-center space-x-2"
            data-testid="button-continue-to-pulse-check"
          >
            <span>Continue to Pulse Check</span>
            <ChevronRight className="h-5 w-5" />
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            <Clock className="h-3 w-3 inline mr-1" />
            Estimated time: 6-8 minutes
          </p>
        </div>
      </main>
    </div>
  );
}