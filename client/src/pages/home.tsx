import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
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
import { EnhancedSignInModal } from "@/components/auth/enhanced-sign-in-modal";
import { useAuth } from "@/contexts/auth-context";
import type { Assessment, PillarScores } from "@shared/schema";
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
  Compass,
  ClipboardList,
  Activity,
  Trophy
} from "lucide-react";

const METHODOLOGY_CONTENT = {
  title: "The Design Thinking Behind CORTEX",
  sections: [
    {
      title: "Why We Separate Context from Capability",
      content: "Your organization's AI readiness has two distinct dimensions: what you're capable of doing (pulse check) and the environment you operate in (context profile). By assessing these separately, we ensure your maturity scores reflect genuine organizational capability while your context shapes the specific guidance and safeguards you receive."
    },
    {
      title: "The Intentionality of Binary Questions", 
      content: "Each pulse check item is a simple yes/no decision about observable practices. This design eliminates scoring ambiguity and focuses leadership discussions on concrete next steps rather than debating gradations. Three binary choices per domain create a clear 0-3 scale that's immediately actionable."
    },
    {
      title: "How Context and Capability Work Together",
      content: "Your context profile never changes your scores—it contextualizes them. A financial services firm and a media company might both score 2 in Risk/Trust, but their action plans will differ based on regulatory requirements, data sensitivity, and customer expectations captured in their profiles."
    },
    {
      title: "The Research Basis for Six Domains",
      content: "These domains emerged from studying successful AI transformations across industries. They represent the minimum viable set of organizational capabilities where weakness in any single domain can undermine the entire AI strategy. Each connects directly to executive decision-making rather than technical implementation."
    },
    {
      title: "Why This Approach Drives Action",
      content: "Traditional assessments often produce scores without clear next steps. By combining capability measurement with contextual interpretation, CORTEX generates specific, prioritized recommendations that respect both where you are and where you operate. The result is a discussion tool, not a report card."
    }
  ]
};

export default function HomePage() {
  const [, navigate] = useLocation();
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [intendedDestination, setIntendedDestination] = useState<string | null>(null);
  const { user, loading } = useAuth();

  // Get user's latest assessment ID from localStorage
  const latestAssessmentId = user ? localStorage.getItem(`latest-assessment-${user.uid}`) : null;

  // Fetch user's latest assessment if they have one
  const { data: userAssessment } = useQuery({
    queryKey: ['/api/assessments', latestAssessmentId],
    enabled: !!user && !!latestAssessmentId,
    retry: false, // Don't retry if assessment doesn't exist
  }) as { data?: Assessment };

  // Set document title for SEO
  useEffect(() => {
    document.title = "CORTEX™ AI Strategic Maturity Index | MIT Open Learning";
    
    // Set meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 
        'A focused, two-step assessment to align leadership and surface your next best moves in AI strategic maturity. Complete context profile and pulse check in ~15 minutes.'
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

  // Handle authentication success for the enhanced modal
  useEffect(() => {
    if (user && authModalOpen) {
      // User just authenticated and modal is open
      setAuthModalOpen(false);
      handleAuthSuccess();
    }
  }, [user, authModalOpen]);

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
      <EnhancedSignInModal 
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
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
        <div className="relative mx-auto max-w-6xl px-6 py-14 md:py-20 space-y-12">
        {/* Top section: Steps on left, graphic on right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight" data-testid="text-main-title">
            CORTEX™ — AI Strategic Maturity Index
          </h1>
          <p className="text-base text-muted-foreground" data-testid="text-main-description">
            A focused, two‑step assessment to align leadership and surface your next best moves.
          </p>
          

          <div className="space-y-5" data-testid="list-assessment-steps">
            {/* Step 1 - Context Profile */}
            <div className="group relative">
              {/* Connection line to next step */}
              <div className="absolute left-[1.875rem] top-[3.5rem] w-[2px] h-[calc(100%+1rem)] bg-gradient-to-b from-blue-500/20 to-purple-500/20 hidden sm:block"></div>
              
              <div className="relative bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-blue-500/30 overflow-hidden">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative flex gap-4">
                  {/* Step number badge */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300 group-hover:rotate-3">
                        <span className="group-hover:scale-110 transition-transform duration-300">1</span>
                      </div>
                      {/* Icon overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <ClipboardList className="h-6 w-6 text-white/20 group-hover:text-white/40 transition-colors duration-300" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <h3 className="font-semibold text-base mb-1.5 flex items-center gap-2">
                      Step 1 — Context Profile
                      <ClipboardList className="h-4 w-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Begin with a quick profile of the conditions you operate in. This information shapes the advice and highlights where extra care may be needed. It does not change your scores.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 - Pulse Check */}
            <div className="group relative">
              {/* Connection line to next step */}
              <div className="absolute left-[1.875rem] top-[3.5rem] w-[2px] h-[calc(100%+1rem)] bg-gradient-to-b from-purple-500/20 to-amber-500/20 hidden sm:block"></div>
              
              <div className="relative bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-purple-500/30 overflow-hidden">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative flex gap-4">
                  {/* Step number badge */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-purple-500/25 transition-all duration-300 group-hover:rotate-3">
                        <span className="group-hover:scale-110 transition-transform duration-300">2</span>
                      </div>
                      {/* Icon overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <Activity className="h-6 w-6 text-white/20 group-hover:text-white/40 transition-colors duration-300" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <h3 className="font-semibold text-base mb-1.5 flex items-center gap-2">
                      Step 2 — Pulse Check
                      <Activity className="h-4 w-4 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Review 18 items that reflect how your organization is operating today. The result is a straightforward score per domain that shows strengths and where there is room to improve.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 - Results */}
            <div className="group relative">
              <div className="relative bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-amber-500/30 overflow-hidden">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative flex gap-4">
                  {/* Step number badge */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-amber-500/25 transition-all duration-300 group-hover:rotate-3">
                        <span className="group-hover:scale-110 transition-transform duration-300">3</span>
                      </div>
                      {/* Icon overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <Trophy className="h-6 w-6 text-white/20 group-hover:text-white/40 transition-colors duration-300" />
                      </div>
                      {/* Glow effect for final step */}
                      <div className="absolute inset-0 rounded-full animate-pulse bg-amber-500/20 blur-xl group-hover:bg-amber-500/30 transition-colors duration-300"></div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <h3 className="font-semibold text-base mb-1.5 flex items-center gap-2">
                      Step 3 — Results
                      <Trophy className="h-4 w-4 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      View a honeycomb chart summarizing your AI maturity, along with tailored cautions where risk is higher. Each domain includes a short card that explains why it matters and typical ways organizations strengthen that area. A downloadable brief is available at the end.
                    </p>
                  </div>
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
                className="text-sm text-muted-foreground hover:text-foreground transition-colors gap-1" 
                onClick={() => setMethodologyOpen(true)}
                data-testid="button-view-methodology"
              >
                <BookOpen className="h-3 w-3" />
                Why it's designed this way
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <ExecutiveCortexHero 
              className="hidden md:block" 
              pillarScores={userAssessment?.pillarScores as PillarScores | undefined}
            />
            <p className="text-sm text-center text-muted-foreground md:block hidden">
              Once complete this will reflect your organization's AI strategic maturity
            </p>
          </div>
        </div>

        {/* Assessment Scale Section - Centered and larger below both columns */}
        <div className="flex justify-center">
          <div className="bg-card/50 border border-border rounded-lg p-8 space-y-6 max-w-4xl w-full" data-testid="scale-information">
            <div className="text-center">
              <h3 className="text-2xl font-semibold mb-3">Assessment Scale</h3>
              <p className="text-base text-muted-foreground">
                Each domain is evaluated on a four-stage maturity scale
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* Level 0 - Nascent */}
              <div className="text-center space-y-3">
                <div 
                  className="w-16 h-16 rounded-full mx-auto flex items-center justify-center font-bold text-white text-lg shadow-lg"
                  style={{ backgroundColor: "hsl(220, 15%, 60%)" }}
                >
                  0
                </div>
                <div>
                  <div className="font-semibold text-base">Nascent</div>
                  <div className="text-sm text-muted-foreground leading-tight">Trials and one-offs</div>
                </div>
              </div>
              
              {/* Level 1 - Emerging */}
              <div className="text-center space-y-3">
                <div 
                  className="w-16 h-16 rounded-full mx-auto flex items-center justify-center font-bold text-white text-lg shadow-lg"
                  style={{ backgroundColor: "hsl(217, 91%, 60%)" }}
                >
                  1
                </div>
                <div>
                  <div className="font-semibold text-base">Emerging</div>
                  <div className="text-sm text-muted-foreground leading-tight">Roles and routines forming</div>
                </div>
              </div>
              
              {/* Level 2 - Integrating */}
              <div className="text-center space-y-3">
                <div 
                  className="w-16 h-16 rounded-full mx-auto flex items-center justify-center font-bold text-white text-lg shadow-lg"
                  style={{ backgroundColor: "hsl(158, 64%, 52%)" }}
                >
                  2
                </div>
                <div>
                  <div className="font-semibold text-base">Integrating</div>
                  <div className="text-sm text-muted-foreground leading-tight">Consistent execution across teams</div>
                </div>
              </div>
              
              {/* Level 3 - Strategic */}
              <div className="text-center space-y-3">
                <div className="relative">
                  <div 
                    className="w-16 h-16 rounded-full mx-auto flex items-center justify-center font-bold text-white text-lg shadow-xl relative overflow-hidden"
                    style={{ 
                      background: "linear-gradient(135deg, hsl(45, 100%, 51%) 0%, hsl(38, 100%, 45%) 100%)",
                      boxShadow: "0 8px 25px -5px hsla(45, 100%, 51%, 0.4), 0 4px 12px -2px hsla(45, 100%, 51%, 0.2)"
                    }}
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
                    <span className="relative z-10">3</span>
                  </div>
                  <div 
                    className="absolute inset-0 w-16 h-16 rounded-full mx-auto animate-pulse"
                    style={{
                      boxShadow: "0 0 20px hsla(45, 100%, 51%, 0.3)",
                      animationDuration: "3s"
                    }}
                  ></div>
                </div>
                <div>
                  <div className="font-semibold text-base">Strategic</div>
                  <div className="text-sm text-muted-foreground leading-tight">Measured impact and continuous improvement</div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
                <span>A visual snapshot of your current AI readiness across six strategic domains.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                <span>Context-aware considerations based on your operating environment and risk profile.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                <span>Domain-specific insights with practical starting points relevant to your situation.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                <span>A discussion framework you can use to align leadership on priorities.</span>
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


      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 bg-muted/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">
              CORTEX™ v3.2 AI Strategic Maturity Program
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