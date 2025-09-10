import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { AppHeader } from "@/components/navigation/app-header";
import { 
  ArrowRight,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Shield,
  Users,
  HelpCircle,
  BookOpen
} from "lucide-react";

const METHODOLOGY_CONTENT = {
  title: "CORTEX in one page",
  sections: [
    {
      title: "What it measures",
      content: "Six executive domains (Clarity, Operations, Risk, Talent, Ecosystem, Experimentation)."
    },
    {
      title: "How scoring works", 
      content: "Each pillar is 0–3 based on three binary statements."
    },
    {
      title: "What the context profile does",
      content: "Tailors guidance and flags non-negotiables (\"gates\") in higher-risk environments; never changes your scores."
    },
    {
      title: "What you should expect today",
      content: "A snapshot to align leadership on where to focus next, plus an export you can share."
    },
    {
      title: "What it is not",
      content: "Not a compliance rating, not a vendor evaluation."
    },
    {
      title: "How to interpret \"gates\"",
      content: "They are prerequisites (e.g., human-in-the-loop for safety-critical use-cases) to satisfy before scaling."
    }
  ]
};

export default function HomePage() {
  const [, navigate] = useLocation();
  const [methodologyOpen, setMethodologyOpen] = useState(false);

  // Set document title for SEO
  useEffect(() => {
    document.title = "CORTEX™ Executive AI-Readiness Assessment | MIT Open Learning";
    
    // Set meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 
        'A focused, two-step assessment to align leadership and surface your next best moves in AI readiness. Complete context profile and pulse check in ~15 minutes.'
      );
    }
  }, []);

  const startAssessment = () => {
    navigate('/context-profile');
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      {/* MIT Identity Strip */}
      <div className="border-b border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">CORTEX™</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">MIT Open Learning</span>
          </div>
          <Sheet open={methodologyOpen} onOpenChange={setMethodologyOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-foreground"
                data-testid="button-help"
              >
                <HelpCircle className="h-4 w-4 mr-1" />
                Help
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>{METHODOLOGY_CONTENT.title}</SheetTitle>
                <SheetDescription>
                  Understanding the CORTEX methodology and what to expect from your assessment.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {METHODOLOGY_CONTENT.sections.map((section, index) => (
                  <div key={index}>
                    <h4 className="font-semibold text-sm mb-2">{section.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Hero Section - Above the fold */}
      <section className="mx-auto max-w-6xl px-6 py-14 md:py-20 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="space-y-6">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight" data-testid="text-main-title">
            CORTEX™ — Executive AI‑Readiness Snapshot
          </h1>
          <p className="text-base text-muted-foreground" data-testid="text-main-description">
            A focused, two‑step assessment to align leadership and surface your next best moves.
          </p>

          <ol className="space-y-4" data-testid="list-assessment-steps">
            <li>
              <div className="font-medium">Step 1 — Context (4–5 minutes)</div>
              <div className="text-sm text-muted-foreground">
                A short profile of your operating environment. Tailors guidance; does not change scores.
              </div>
            </li>
            <li>
              <div className="font-medium">Step 2 — Pulse Check (6–8 minutes)</div>
              <div className="text-sm text-muted-foreground">
                18 binary questions across six pillars. Answer "Yes" only if fully true today.
              </div>
            </li>
            <li>
              <div className="font-medium">Step 3 — Results (5–10 minutes)</div>
              <div className="text-sm text-muted-foreground">
                Honeycomb snapshot, context gates, and practical guidance. Export as PDF/JSON.
              </div>
            </li>
          </ol>

          <div className="flex items-center gap-4 pt-2">
            <Button 
              size="lg" 
              className="px-6" 
              onClick={startAssessment}
              data-testid="button-begin-assessment"
            >
              Begin Assessment
            </Button>
            <button 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors" 
              onClick={() => setMethodologyOpen(true)}
              data-testid="button-view-methodology"
            >
              View methodology
            </button>
          </div>

          <div className="text-xs text-muted-foreground" data-testid="text-time-estimate">
            ~15 minutes total • No PII collected
          </div>
        </div>

        <div className="relative hidden md:block">
          {/* Static honeycomb motif */}
          <div 
            className="aspect-[4/3] rounded-md border border-border bg-gradient-to-b from-muted to-transparent flex items-center justify-center"
            data-testid="visual-honeycomb-preview"
          >
            <div className="text-center space-y-2">
              <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
                {["C", "O", "R", "T", "E", "X"].map((letter, index) => (
                  <div 
                    key={letter} 
                    className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-sm font-semibold text-primary"
                  >
                    {letter}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Decorative preview of the six-pillar maturity view</p>
            </div>
          </div>
        </div>
      </section>

      {/* Below the fold - Reassurance cards */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          
          {/* What you'll get today */}
          <Card data-testid="card-what-youll-get">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Your CORTEX Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                <span>A <strong>honeycomb maturity view</strong> across six executive domains</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                <span><strong>Context "gates"</strong> (non‑negotiables) if you operate in higher‑risk settings</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                <span><strong>Guidance cards</strong> per domain: why it matters, what good looks like, how to improve</span>
              </div>
              <div className="flex items-start gap-2">
                <Download className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                <span><strong>Export</strong> (PDF/JSON) — suitable for the executive team or board materials</span>
              </div>
              <p className="text-xs text-muted-foreground italic mt-3">
                No vendor pitching; no benchmarks unless a cohort study is explicitly enabled.
              </p>
            </CardContent>
          </Card>

          {/* Your data & privacy */}
          <Card data-testid="card-data-privacy">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-primary" />
                Your Data & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                <span>We collect <strong>only</strong> small integers/booleans (no free‑text PII).</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                <span>Results are <strong>yours</strong>: export/download is available at the end.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                <span>If you provided an organization name, it appears only on your export.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                <span>Optional cohort comparisons are disabled by default.</span>
              </div>
            </CardContent>
          </Card>

          {/* How this will be used */}
          <Card data-testid="card-how-used">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                How This Will Be Used in Today's Session
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                <span>We'll use your results to <strong>focus discussion</strong> on the weakest domains.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                <span>"Gates" ensure we don't scale with blind spots (e.g., safety, compliance).</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                <span>We'll highlight <strong>two moves</strong> most likely to raise value in the next quarter.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                <span>No one is graded. This is a <strong>snapshot</strong>, not a compliance score.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Facilitator note */}
      <section className="py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-muted/50 border border-border rounded-md p-4">
            <h4 className="text-sm font-medium mb-2">Facilitator Note</h4>
            <p className="text-xs text-muted-foreground">
              If you are completing this on behalf of a team, gather input from: your technology lead, 
              a risk/assurance contact, and one business unit owner. You can amend answers during the discussion.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            CORTEX™ v3.2 Executive AI-Readiness Program • Built for C-suite leaders and senior executives
          </p>
        </div>
      </footer>
    </div>
  );
}