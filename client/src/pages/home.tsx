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
import { ExecutiveCortexHero } from "@/components/executive-cortex-hero";
import { AuthRequiredModal } from "@/components/auth-required-modal";
import { useAuth } from "@/contexts/auth-context";
import { 
  ArrowRight,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Shield,
  Users,
  HelpCircle,
  BookOpen,
  Compass
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
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [intendedDestination, setIntendedDestination] = useState<string | null>(null);
  const { user, loading } = useAuth();

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

  // Effect to handle deep-link authentication
  useEffect(() => {
    // Check URL parameters for deep-link auth flow
    const urlParams = new URLSearchParams(window.location.search);
    const authRequired = urlParams.get('auth') === 'required';
    const destination = urlParams.get('destination');

    if (authRequired && destination) {
      // Store the intended destination
      setIntendedDestination(decodeURIComponent(destination));
      
      // Clean up the URL without reloading the page
      window.history.replaceState({}, '', '/');
      
      // Automatically open auth modal for deep links
      if (!user && !loading) {
        setAuthModalOpen(true);
      }
    }
  }, [user, loading]);

  // Effect to handle successful authentication for deep links
  useEffect(() => {
    // If user authenticates and we have an intended destination, redirect
    if (user && intendedDestination) {
      navigate(intendedDestination);
      setIntendedDestination(null); // Clear the destination
    }
  }, [user, intendedDestination, navigate]);

  const startAssessment = () => {
    // Don't allow navigation while auth is loading
    if (loading) {
      return;
    }
    
    // Check if user is authenticated
    if (!user) {
      // Show authentication modal if not logged in
      setAuthModalOpen(true);
      return;
    }
    
    // Proceed to assessment if authenticated
    navigate('/context-profile');
  };

  const handleAuthSuccess = () => {
    // Called when user successfully authenticates
    if (intendedDestination) {
      // If we have a deep-link destination, navigate there
      navigate(intendedDestination);
      setIntendedDestination(null);
    } else {
      // Default behavior for normal home page start button
      navigate('/context-profile');
    }
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
      
      <AppHeader 
        showIdentityInline={true}
        identityText="MIT Open Learning"
        showHelp={true}
        onHelpClick={() => setMethodologyOpen(true)}
      />
      
      {/* Authentication Required Modal */}
      <AuthRequiredModal 
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        onAuthSuccess={handleAuthSuccess}
      />
      
      {/* Methodology Sheet - moved from identity strip */}
      <Sheet open={methodologyOpen} onOpenChange={setMethodologyOpen}>
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
              <div className="font-medium">Step 1 — Context</div>
              <div className="text-sm text-muted-foreground">
                Begin with a quick profile of the conditions you operate in. This information shapes the advice and highlights where extra care may be needed. It does not change your scores.
              </div>
            </li>
            <li>
              <div className="font-medium">Step 2 — Pulse Check</div>
              <div className="text-sm text-muted-foreground">
                Review 18 items that reflect how your organization is operating today. The result is a straightforward score per domain that shows strengths and where there is room to improve.
              </div>
            </li>
            <li>
              <div className="font-medium">Step 3 — Results</div>
              <div className="text-sm text-muted-foreground">
                View a honeycomb chart summarizing your AI maturity, along with tailored cautions where risk is higher. Each domain includes a short card that explains why it matters and typical ways organizations strengthen that area. A downloadable brief is available at the end.
              </div>
            </li>
          </ol>

          {/* Enhanced 0-3 Scale Section - Using maturity color system */}
          <div className="bg-card/50 border border-border rounded-lg p-6 space-y-4" data-testid="scale-information">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Assessment Scale</h3>
              <p className="text-sm text-muted-foreground">
                Each domain is evaluated on a four-stage maturity scale
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Level 0 - Nascent */}
              <div className="text-center space-y-2">
                <div 
                  className="w-10 h-10 rounded-full mx-auto flex items-center justify-center font-bold text-white text-sm shadow-md"
                  style={{ backgroundColor: "hsl(220, 15%, 60%)" }}
                >
                  0
                </div>
                <div>
                  <div className="font-semibold text-sm">Nascent</div>
                  <div className="text-xs text-muted-foreground leading-tight">Trials and one-offs</div>
                </div>
              </div>
              
              {/* Level 1 - Emerging */}
              <div className="text-center space-y-2">
                <div 
                  className="w-10 h-10 rounded-full mx-auto flex items-center justify-center font-bold text-white text-sm shadow-md"
                  style={{ backgroundColor: "hsl(38, 92%, 50%)" }}
                >
                  1
                </div>
                <div>
                  <div className="font-semibold text-sm">Emerging</div>
                  <div className="text-xs text-muted-foreground leading-tight">Roles and routines forming</div>
                </div>
              </div>
              
              {/* Level 2 - Integrated */}
              <div className="text-center space-y-2">
                <div 
                  className="w-10 h-10 rounded-full mx-auto flex items-center justify-center font-bold text-white text-sm shadow-md"
                  style={{ backgroundColor: "hsl(158, 64%, 52%)" }}
                >
                  2
                </div>
                <div>
                  <div className="font-semibold text-sm">Integrating</div>
                  <div className="text-xs text-muted-foreground leading-tight">Consistent execution across teams</div>
                </div>
              </div>
              
              {/* Level 3 - Leading */}
              <div className="text-center space-y-2">
                <div 
                  className="w-10 h-10 rounded-full mx-auto flex items-center justify-center font-bold text-white text-sm shadow-md ring-2 ring-primary/20"
                  style={{ backgroundColor: "hsl(158, 64%, 52%)" }}
                >
                  3
                </div>
                <div>
                  <div className="font-semibold text-sm">Strategic</div>
                  <div className="text-xs text-muted-foreground leading-tight">Measured impact and continuous improvement</div>
                </div>
              </div>
            </div>
          </div>

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

        </div>

        <ExecutiveCortexHero className="hidden md:block" />
        </div>
      </section>

      {/* Below the fold - Reassurance cards */}
      <section className="py-16 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          
          {/* What you'll get today */}
          <Card className="hover-elevate transition-colors duration-200" data-testid="card-what-youll-get">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                What You'll Get Today
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                <span>A single-page view of where you stand across six ai-readiness domains (0–3 scale).</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                <span>Context-specific safeguards to satisfy before scaling (e.g., human checks, basic testing, data handling rules).</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                <span>Guidance cards for each domain: why it matters, what good looks like, and practical ways to improve.</span>
              </div>
              <div className="flex items-start gap-2">
                <Download className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                <span>A downloadable brief (PDF/JSON) you can share with your executive team.</span>
              </div>
            </CardContent>
          </Card>

          {/* How this will be used */}
          <Card className="hover-elevate transition-colors duration-200" data-testid="card-how-used">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                How This Fits Into Today's Session
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                <span>You'll use your snapshot to choose areas with the most headroom.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                <span>Safeguards help you scale responsibly where risk is higher.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                <span>We'll point to common first steps leaders take in similar situations.</span>
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
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">
              CORTEX™ v3.2 Executive AI-Readiness Program
            </p>
          </div>
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/decide')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1 h-auto"
              data-testid="link-options-studio"
            >
              <Compass className="h-3 w-3 mr-1" />
              Explore AI Options
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}