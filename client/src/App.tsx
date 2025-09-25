import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import ContextProfile from "@/pages/context-profile";
import ContextInsight from "@/pages/context-insight";
import ProfileSummary from "@/pages/profile-summary";
import PulseCheck from "@/pages/pulse-check";
import DomainIntro from "@/pages/domain-intro";
import DomainQuestions from "@/pages/domain-questions";
import Results from "@/pages/results";
import OptionsStudio from "@/pages/options-studio";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/context-profile">
        {() => (
          <ProtectedRoute>
            <ContextProfile />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/context-insight/:id">
        {() => (
          <ProtectedRoute>
            <ContextInsight />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/profile-summary/:id">
        {() => (
          <ProtectedRoute>
            <ProfileSummary />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/pulse/:domain/intro/:id">
        {() => (
          <ProtectedRoute>
            <DomainIntro />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/pulse/:domain/questions/:id">
        {() => (
          <ProtectedRoute>
            <DomainQuestions />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/pulse/:id">
        {() => (
          <ProtectedRoute>
            <PulseCheck />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/results/:id">
        {() => (
          <ProtectedRoute>
            <Results />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/decide/:id">
        {() => (
          <ProtectedRoute>
            <OptionsStudio />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/decide">
        {() => (
          <ProtectedRoute>
            <OptionsStudio />
          </ProtectedRoute>
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          {/* Skip to main content for screen readers */}
          <a 
            href="#main-content" 
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md"
            data-testid="skip-to-main"
          >
            Skip to main content
          </a>
          <Toaster />
          <main id="main-content" role="main">
            <Router />
          </main>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
