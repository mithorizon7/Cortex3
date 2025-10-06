import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppHeader } from "@/components/navigation/app-header";
import ProgressHeader from "@/components/progress-header";
import { QuestionSkeleton } from "@/components/skeleton-loader";
import { PULSE_QUESTIONS } from "@/lib/cortex";
import { Target, Clock } from "lucide-react";

const DOMAIN_ORDER = ['C', 'O', 'R', 'T', 'E', 'X'];

// Group questions by pillar for domain-based flow
const DOMAIN_GROUPS = [
  { pillar: 'C', questions: PULSE_QUESTIONS.filter(q => q.pillar === 'C') },
  { pillar: 'O', questions: PULSE_QUESTIONS.filter(q => q.pillar === 'O') },
  { pillar: 'R', questions: PULSE_QUESTIONS.filter(q => q.pillar === 'R') },
  { pillar: 'T', questions: PULSE_QUESTIONS.filter(q => q.pillar === 'T') },
  { pillar: 'E', questions: PULSE_QUESTIONS.filter(q => q.pillar === 'E') },
  { pillar: 'X', questions: PULSE_QUESTIONS.filter(q => q.pillar === 'X') }
];

/**
 * Legacy Pulse Check Redirect Page
 * 
 * This page exists solely to redirect users from the old /pulse/:id route
 * to the new domain-based flow (/pulse/:domain/intro/:id or /pulse/:domain/questions/:id).
 * 
 * It intelligently determines the starting domain based on:
 * - Previously answered questions (continues where user left off)
 * - User's skip intros preference
 */
export default function PulseCheckRedirect() {
  const [, navigate] = useLocation();
  const { id: assessmentId } = useParams();
  
  const { data: assessment, isLoading } = useQuery({
    queryKey: ['/api/assessments', assessmentId],
    enabled: !!assessmentId,
  });

  // Redirect to domain-based flow on load
  useEffect(() => {
    if (assessment && assessmentId) {
      const skipIntros = sessionStorage.getItem('cortex_skip_intros') === 'true';
      
      // Determine starting domain (first domain with incomplete responses or first domain)
      let startingDomain = 'C';
      const existingResponses = (assessment as any)?.pulseResponses || {};
      
      for (const group of DOMAIN_GROUPS) {
        const domainAnswers = group.questions.filter(q => existingResponses[q.id] !== undefined).length;
        if (domainAnswers < group.questions.length) {
          startingDomain = group.pillar;
          break;
        }
      }
      
      // Redirect to appropriate flow
      if (skipIntros) {
        navigate(`/pulse/${startingDomain}/questions/${assessmentId}`);
      } else {
        navigate(`/pulse/${startingDomain}/intro/${assessmentId}`);
      }
    }
  }, [assessment, assessmentId, navigate]);

  // Show loading state while redirecting
  return (
    <ProtectedRoute requireAuth>
      <div className="min-h-screen bg-background">
        <AppHeader />
        <ProgressHeader currentStep={3} />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Target className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-display font-bold text-foreground">Preparing Pulse Check...</h1>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-lg text-muted-foreground mb-4 font-ui">
              {isLoading ? "Loading your assessment..." : "Redirecting to domain flow..."}
            </p>
          </div>
          <div className="space-y-8">
            <QuestionSkeleton />
            <QuestionSkeleton />
            <QuestionSkeleton />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
