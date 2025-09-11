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
      {/* Skip to main content - accessibility */}
      <a 
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
        data-testid="skip-to-content"
      >
        Skip to main content
      </a>
      
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
      <section id="main-content" className="relative bg-background">
        <div aria-hidden className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,rgba(0,0,0,.9),rgba(0,0,0,.2))] [-webkit-mask-image:linear-gradient(to_bottom,rgba(0,0,0,.9),rgba(0,0,0,.2))] [mask-repeat:no-repeat] [-webkit-mask-repeat:no-repeat]">
          <div className="absolute inset-0 bg-[url('/img/hex.svg')] bg-[length:180px_156px] opacity-40 dark:opacity-25"></div>
        </div>
        <div className="relative mx-auto max-w-6xl px-6 py-14 md:py-20 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
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
            <Button 
              variant="ghost"
              size="sm"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors p-0 h-auto" 
              onClick={() => setMethodologyOpen(true)}
              data-testid="button-view-methodology"
            >
              View methodology
            </Button>
          </div>

          <div className="text-xs text-muted-foreground" data-testid="text-time-estimate">
            ~15 minutes total • No PII collected
          </div>
        </div>

        <div className="relative hidden md:block">
          {/* Executive CORTEX Preview */}
          <div 
            className="aspect-[4/3] rounded-2xl border border-border/30 bg-gradient-to-br from-background via-muted/30 to-primary/8 flex items-center justify-center overflow-hidden shadow-2xl backdrop-blur-sm"
            data-testid="visual-honeycomb-preview"
          >
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Enhanced background hex pattern */}
              <div className="absolute inset-0 opacity-[0.07]">
                <svg viewBox="0 0 500 400" className="w-full h-full">
                  <defs>
                    <pattern id="hexPattern" patternUnits="userSpaceOnUse" width="45" height="39">
                      <polygon points="22.5,6 39,17 39,33 22.5,39 6,33 6,17" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.4"/>
                    </pattern>
                    <radialGradient id="patternFade" cx="50%" cy="50%">
                      <stop offset="0%" stopOpacity="0"/>
                      <stop offset="40%" stopOpacity="1"/>
                      <stop offset="100%" stopOpacity="0.2"/>
                    </radialGradient>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#hexPattern)" mask="url(#patternFade)"/>
                </svg>
              </div>
              
              {/* Premium honeycomb radar preview - much larger */}
              <div className="relative">
                <svg viewBox="0 0 400 400" className="w-[22rem] h-[22rem] drop-shadow-xl">
                  <defs>
                    <linearGradient id="centerGradient" cx="50%" cy="50%">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25"/>
                      <stop offset="70%" stopColor="hsl(var(--primary))" stopOpacity="0.12"/>
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.03"/>
                    </linearGradient>
                    <filter id="pillarGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="1.5" result="softBlur"/>
                      <feMerge>
                        <feMergeNode in="softBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                    <linearGradient id="ringGradient" cx="50%" cy="50%">
                      <stop offset="0%" stopColor="hsl(var(--border))" stopOpacity="0.6"/>
                      <stop offset="100%" stopColor="hsl(var(--border))" stopOpacity="0.2"/>
                    </linearGradient>
                  </defs>
                  
                  {/* Enhanced background rings with gradients */}
                  <g>
                    <circle cx="200" cy="200" r="40" fill="none" stroke="url(#ringGradient)" strokeWidth="1.5"/>
                    <circle cx="200" cy="200" r="80" fill="none" stroke="url(#ringGradient)" strokeWidth="1.2"/>
                    <circle cx="200" cy="200" r="120" fill="none" stroke="url(#ringGradient)" strokeWidth="1"/>
                  </g>
                  
                  {/* Enhanced spoke lines */}
                  <g opacity="0.3">
                    {[0, 1, 2, 3, 4, 5].map((i) => {
                      const angle = (i * Math.PI) / 3 - Math.PI / 2;
                      const x = 200 + 120 * Math.cos(angle);
                      const y = 200 + 120 * Math.sin(angle);
                      return (
                        <line 
                          key={i} 
                          x1="200" 
                          y1="200" 
                          x2={x} 
                          y2={y} 
                          stroke="url(#ringGradient)" 
                          strokeWidth="1"
                          filter="url(#softGlow)"
                        />
                      );
                    })}
                  </g>
                  
                  {/* Premium pillar indicators - larger and more refined */}
                  {["C", "O", "R", "T", "E", "X"].map((letter, index) => {
                    const angle = (index * Math.PI) / 3 - Math.PI / 2;
                    const radius = 92; // Position optimized for larger size
                    const x = 200 + radius * Math.cos(angle);
                    const y = 200 + radius * Math.sin(angle);
                    
                    // Enhanced maturity levels with sophisticated colors
                    const maturityLevels = [2, 3, 1, 3, 2, 1];
                    const maturity = maturityLevels[index];
                    const colors = ['hsl(220, 15%, 60%)', 'hsl(38, 92%, 50%)', 'hsl(158, 64%, 52%)']; 
                    const pilllarColor = colors[maturity - 1];
                    
                    return (
                      <g key={letter}>
                        {/* Enhanced outer ring with breathing effect */}
                        <circle 
                          cx={x} 
                          cy={y} 
                          r="24" 
                          fill={pilllarColor} 
                          fillOpacity="0.12" 
                          stroke={pilllarColor} 
                          strokeWidth="2"
                          filter="url(#softGlow)"
                          className="animate-pulse"
                          style={{animationDuration: `${3 + index * 0.4}s`}}
                        />
                        {/* Enhanced inner core */}
                        <circle 
                          cx={x} 
                          cy={y} 
                          r="16" 
                          fill={pilllarColor} 
                          fillOpacity="0.25" 
                          filter="url(#pillarGlow)"
                        />
                        {/* Premium letter styling */}
                        <text 
                          x={x} 
                          y={y + 6} 
                          textAnchor="middle" 
                          className="text-base font-bold fill-foreground"
                          style={{
                            filter: 'url(#pillarGlow)', 
                            letterSpacing: '0.5px',
                            fontFamily: 'var(--font-heading)'
                          }}
                        >
                          {letter}
                        </text>
                      </g>
                    );
                  })}
                  
                  {/* Enhanced center logo with premium styling */}
                  <circle 
                    cx="200" 
                    cy="200" 
                    r="32" 
                    fill="url(#centerGradient)" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth="1.5" 
                    opacity="0.9"
                    filter="url(#softGlow)"
                  />
                  <text 
                    x="200" 
                    y="207" 
                    textAnchor="middle" 
                    className="text-sm font-bold fill-primary"
                    style={{
                      letterSpacing: '1px',
                      fontFamily: 'var(--font-heading)',
                      filter: 'url(#softGlow)'
                    }}
                  >
                    CORTEX
                  </text>
                </svg>
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Below the fold - Reassurance cards */}
      <section className="py-16 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          
          {/* What you'll get today */}
          <Card className="hover-elevate transition-colors duration-200" data-testid="card-what-youll-get">
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
          <Card className="hover-elevate transition-colors duration-200" data-testid="card-data-privacy">
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
          <Card className="hover-elevate transition-colors duration-200" data-testid="card-how-used">
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
      <section className="py-8 px-6 bg-background">
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
      <footer className="border-t border-border py-8 px-6 bg-muted/10">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            CORTEX™ v3.2 Executive AI-Readiness Program • Built for C-suite leaders and senior executives
          </p>
        </div>
      </footer>
    </div>
  );
}