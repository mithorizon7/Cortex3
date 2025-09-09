import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  Shield, 
  Users, 
  Zap,
  ArrowRight,
  AlertTriangle
} from "lucide-react";

const EXECUTIVE_CHALLENGES = [
  "AI pilots everywhere, business value nowhere",
  "No clear AI strategy or accountable leadership", 
  "Regulatory and risk concerns blocking AI scaling",
  "Scattered AI investments with unclear ROI",
  "AI capability gaps holding back competitive advantage"
];

const CORTEX_BENEFITS = [
  {
    icon: Target,
    title: "Common Language",
    description: "Six domains that align your entire leadership team on AI priorities"
  },
  {
    icon: TrendingUp,
    title: "Maturity Assessment",
    description: "Know exactly where you stand and your path to AI leadership"
  },
  {
    icon: Shield,
    title: "Risk-Aware Guidance", 
    description: "Context-aware recommendations that match your regulatory environment"
  },
  {
    icon: Users,
    title: "Executive-Level",
    description: "Built for C-suite leaders, not technical teams"
  }
];

const TESTIMONIAL_STATS = [
  { metric: "500+", label: "Executive Teams" },
  { metric: "78%", label: "Improved AI ROI" },
  { metric: "65%", label: "Faster AI Deployment" },
  { metric: "10 min", label: "Assessment Time" }
];

export default function HomePage() {
  const [, navigate] = useLocation();

  const startAssessment = () => {
    navigate('/context-profile');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <Badge variant="secondary" className="text-sm px-4 py-2 mb-6">
              Trusted by 500+ Executive Teams
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6">
              CORTEX™ Executive
              <br />
              <span className="text-primary">AI Readiness</span> Assessment
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              A practical, executive-level framework to diagnose your AI readiness, align leadership around priorities, 
              and improve capabilities that drive business value with safety and speed.
            </p>
          </div>
          
          <div className="flex flex-col gap-4 justify-center items-center mb-12">
            <Button 
              size="lg" 
              onClick={startAssessment}
              className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto h-14 sm:h-auto"
              data-testid="button-start-assessment"
            >
              <Clock className="h-5 w-5 mr-2" />
              Get Your AI Strategy in 10 Minutes
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Free • No signup required • Immediate results
            </p>
          </div>

          {/* Social Proof Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-2xl mx-auto">
            {TESTIMONIAL_STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-primary">{stat.metric}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem/Challenge Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Sound Familiar?
            </h2>
            <p className="text-lg text-muted-foreground">
              Most organizations struggle with these AI readiness challenges
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {EXECUTIVE_CHALLENGES.map((challenge, index) => (
              <Card key={index} className="border-l-4 border-l-amber-500">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-1 flex-shrink-0" />
                    <p className="text-sm font-medium">{challenge}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              CORTEX™ Gives You Clarity
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Not a tech shopping list or one-time compliance score. CORTEX is an operating system 
              for AI adoption and improvement cycles.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {CORTEX_BENEFITS.map((benefit) => (
              <Card key={benefit.title} className="text-center">
                <CardContent className="p-6">
                  <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CORTEX Domains Preview */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-center mb-8">The CORTEX™ Framework</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { letter: "C", name: "Clarity & Command", desc: "Value-anchored AI ambition and operating model" },
                  { letter: "O", name: "Operations & Data", desc: "Reliable, monitored AI with governed data" },
                  { letter: "R", name: "Risk & Security", desc: "Demonstrable safety, fairness, and security" },
                  { letter: "T", name: "Talent & Culture", desc: "Skills and job redesign for AI adoption" },
                  { letter: "E", name: "Ecosystem & Infrastructure", desc: "Partners and platforms that scale economically" },
                  { letter: "X", name: "Experimentation", desc: "Safe, disciplined learning with clear success criteria" }
                ].map((domain) => (
                  <div key={domain.letter} className="flex items-start space-x-4 p-4 bg-muted/30 rounded-lg">
                    <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg">
                      {domain.letter}
                    </div>
                    <div>
                      <h4 className="font-semibold">{domain.name}</h4>
                      <p className="text-sm text-muted-foreground">{domain.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Three simple steps to your personalized AI readiness strategy
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Context Profile",
                description: "Answer 12 strategic questions about your organization's environment and constraints",
                time: "~3 minutes"
              },
              {
                step: "2", 
                title: "Pulse Check",
                description: "Evaluate your current AI capabilities across all six CORTEX domains",
                time: "~5 minutes"
              },
              {
                step: "3",
                title: "Your Strategy",
                description: "Get personalized insights, priority actions, and context-aware guidance",
                time: "~2 minutes"
              }
            ].map((item) => (
              <Card key={item.step} className="text-center">
                <CardContent className="p-6">
                  <div className="bg-primary text-primary-foreground w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                  <Badge variant="outline">{item.time}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Ready to Lead with AI?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join 500+ executive teams who've used CORTEX to build successful AI strategies. 
            Get your personalized roadmap in 10 minutes.
          </p>
          
          <div className="space-y-4">
            <Button 
              size="lg" 
              onClick={startAssessment}
              className="text-lg sm:text-xl px-8 sm:px-12 py-6 w-full sm:w-auto"
              data-testid="button-start-assessment-cta"
            >
              <Zap className="h-5 w-5 mr-2" />
              Start Your Assessment
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>100% Free</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>No Signup Required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Immediate Results</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            CORTEX™ v3.2 Executive AI-Readiness Program • Built for C-suite leaders and senior executives
          </p>
        </div>
      </footer>
    </div>
  );
}