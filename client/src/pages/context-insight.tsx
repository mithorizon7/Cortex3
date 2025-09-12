import { useParams, Link } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useContextMirror } from "@/hooks/useContextMirror";
import { useToast } from "@/hooks/use-toast";
import type { Assessment } from "../../../shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Download, Loader2 } from "lucide-react";
import { generateContextBrief } from "@/lib/pdf-generator";

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-muted rounded ${className}`} />;
}

interface SectionProps {
  title: string;
  items: string[];
}

function Section({ title, items }: SectionProps) {
  return (
    <div className="space-y-3" data-testid={`section-${title.toLowerCase()}`}>
      <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      <div className="border-l-2 border-muted pl-4">
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li 
              key={index} 
              className="text-sm text-muted-foreground leading-relaxed"
              data-testid={`item-${title.toLowerCase()}-${index}`}
            >
              • {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SkeletonList({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  );
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
      <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
      <AlertDescription className="text-orange-700 dark:text-orange-300">
        We couldn't generate the insight. Showing a concise rule-based summary.
        <br />
        <span className="text-xs opacity-75">Error: {error.message}</span>
      </AlertDescription>
    </Alert>
  );
}

export default function ContextInsightPage() {
  const { id } = useParams();
  const { data, loading, error } = useContextMirror(id!);
  const { toast } = useToast();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // Fetch the full assessment data to get contextProfile
  const { data: assessmentData, isLoading: assessmentLoading } = useQuery<Assessment>({
    queryKey: ['/api/assessments', id],
    enabled: !!id,
  });

  const handleDownloadBrief = async () => {
    if (!data || !assessmentData || !id) {
      toast({
        title: "Cannot generate PDF",
        description: "Missing required data. Please try refreshing the page.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingPDF(true);
    
    try {
      await generateContextBrief({
        strengths: data.strengths,
        fragilities: data.fragilities,
        whatWorks: data.whatWorks,
        disclaimer: data.disclaimer,
        contextProfile: assessmentData.contextProfile,
        assessmentId: id,
      });
      
      toast({
        title: "PDF downloaded successfully",
        description: "Your CORTEX context brief has been saved to your downloads folder.",
      });
    } catch (error) {
      console.error('Failed to generate context brief:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred';
        
      toast({
        title: "Failed to generate PDF",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <section 
      className="max-w-7xl mx-auto px-6 py-10 space-y-8"
      data-testid="context-insight-page"
    >
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
          Context Insight
        </h1>
        <p className="text-sm text-muted-foreground">
          A brief reflection based on your context. Educational, not prescriptive.
        </p>
      </header>

      {/* Main Content */}
      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* Left Card: What your profile signals */}
        <Card className="h-fit" data-testid="card-profile-signals">
          <CardHeader>
            <CardTitle className="text-xl">What your profile signals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <SkeletonList rows={8} />
            ) : error ? (
              <ErrorFallback error={error} />
            ) : data ? (
              <>
                <Section title="Strengths" items={data.strengths} />
                <Section title="Fragilities" items={data.fragilities} />
                <Section title="What usually works first" items={data.whatWorks} />
              </>
            ) : null}
            
            {data?.disclaimer && (
              <p className="text-xs text-muted-foreground pt-4 border-t">
                {data.disclaimer}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Right Card: Notes for discussion */}
        <Card className="h-fit" data-testid="card-discussion-notes">
          <CardHeader>
            <CardTitle className="text-xl">Notes for your discussion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="list-disc ml-5 space-y-3 text-sm text-muted-foreground">
              <li data-testid="discussion-note-1">
                Underline one strength and one fragility that surprised you.
              </li>
              <li data-testid="discussion-note-2">
                Which item would most affect customers or reputation if mishandled?
              </li>
              <li data-testid="discussion-note-3">
                What's the smallest next step to de-risk a fragility?
              </li>
            </ul>
            
            <div className="pt-3 flex flex-wrap gap-2">
              <Badge variant="outline" data-testid="badge-no-pii">No PII</Badge>
              <Badge variant="outline" data-testid="badge-no-benchmarks">No benchmarks</Badge>
              <Badge variant="outline" data-testid="badge-context-based">Context-based reflection</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Actions */}
      <footer className="flex items-center justify-end gap-3 pt-6" data-testid="footer-actions">
        <Button 
          variant="ghost" 
          onClick={handleDownloadBrief}
          disabled={!data || loading || !assessmentData || assessmentLoading || isGeneratingPDF}
          data-testid="button-download-brief"
        >
          {isGeneratingPDF ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download context brief
            </>
          )}
        </Button>
        <Link to={`/pulse/${id}`} data-testid="link-proceed-pulse">
          <Button data-testid="button-proceed-pulse">
            Proceed to Pulse
          </Button>
        </Link>
      </footer>
    </section>
  );
}