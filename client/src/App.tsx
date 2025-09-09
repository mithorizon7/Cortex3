import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import ContextProfile from "@/pages/context-profile";
import ProfileSummary from "@/pages/profile-summary";
import PulseCheck from "@/pages/pulse-check";
import Results from "@/pages/results";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/context-profile" component={ContextProfile} />
      <Route path="/profile-summary/:id" component={ProfileSummary} />
      <Route path="/pulse-check/:id" component={PulseCheck} />
      <Route path="/results/:id" component={Results} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
