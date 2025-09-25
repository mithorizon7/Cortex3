import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppHeader } from "@/components/navigation/app-header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { BarChart3, Calendar, Clock, Plus, TrendingUp, Eye } from "lucide-react";
import { Assessment } from "@shared/schema";
import { Link } from "wouter";

function AssessmentCard({ assessment }: { assessment: Assessment }) {
  const isCompleted = !!assessment.completedAt;
  const createdDate = new Date(assessment.createdAt!);
  const completedDate = assessment.completedAt ? new Date(assessment.completedAt) : null;
  
  // Calculate overall maturity if assessment is completed
  let overallMaturity = null;
  if (assessment.pillarScores) {
    const scores = Object.values(assessment.pillarScores as Record<string, number>);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    overallMaturity = avgScore < 1 ? 'Nascent' : avgScore < 2 ? 'Emerging' : avgScore < 3 ? 'Integrated' : 'Leading';
  }

  return (
    <Card className="hover-elevate transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-display">
              CORTEX Assessment
            </CardTitle>
          </div>
          <Badge variant={isCompleted ? "default" : "secondary"}>
            {isCompleted ? "Completed" : "In Progress"}
          </Badge>
        </div>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>Started {createdDate.toLocaleDateString()}</span>
          </div>
          {completedDate && (
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>Completed {completedDate.toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {overallMaturity && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Maturity:</span>
            <Badge variant="outline">{overallMaturity}</Badge>
          </div>
        )}
        
        {isCompleted ? (
          <Link href={`/results/${assessment.id}`}>
            <Button className="w-full" data-testid={`button-view-results-${assessment.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              View Results
            </Button>
          </Link>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Continue where you left off
            </p>
            <Link href={`/pulse/${assessment.id}`}>
              <Button variant="outline" className="w-full" data-testid={`button-continue-${assessment.id}`}>
                <TrendingUp className="h-4 w-4 mr-2" />
                Continue Assessment
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: assessments, isLoading, error } = useQuery({
    queryKey: ['/api/assessments', user?.uid],
    enabled: !!user?.uid,
  });

  const completedAssessments = assessments?.filter(a => a.completedAt) || [];
  const inProgressAssessments = assessments?.filter(a => !a.completedAt) || [];

  return (
    <ProtectedRoute requireAuth>
      <div className="min-h-screen bg-background">
        <AppHeader 
          showIdentityInline 
          identityText="My Assessments"
          showHelp={false}
        />
        
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                  Assessment Dashboard
                </h1>
                <p className="text-lg text-muted-foreground">
                  Track your organization's AI readiness journey over time
                </p>
              </div>
              <Link href="/">
                <Button size="lg" data-testid="button-new-assessment">
                  <Plus className="h-5 w-5 mr-2" />
                  New Assessment
                </Button>
              </Link>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your assessments...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="p-6 text-center">
                <p className="text-destructive">Failed to load assessments. Please try again.</p>
              </CardContent>
            </Card>
          )}

          {/* Content */}
          {!isLoading && !error && (
            <>
              {/* In Progress Assessments */}
              {inProgressAssessments.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-display font-semibold mb-4 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-amber-500" />
                    Continue Assessment ({inProgressAssessments.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {inProgressAssessments.map((assessment) => (
                      <AssessmentCard key={assessment.id} assessment={assessment} />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Assessments */}
              {completedAssessments.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-display font-semibold mb-4 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                    Assessment History ({completedAssessments.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completedAssessments.map((assessment) => (
                      <AssessmentCard key={assessment.id} assessment={assessment} />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {assessments?.length === 0 && (
                <Card className="text-center py-12">
                  <CardContent>
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No assessments yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Start your first CORTEX assessment to evaluate your organization's AI readiness
                    </p>
                    <Link href="/">
                      <Button size="lg" data-testid="button-start-first-assessment">
                        <Plus className="h-5 w-5 mr-2" />
                        Start Your First Assessment
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}