import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { 
  Shield, 
  Save, 
  Clock, 
  Users, 
  FileText,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface AuthRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthSuccess?: () => void;
}

export const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({ 
  open, 
  onOpenChange, 
  onAuthSuccess 
}) => {
  const { user, loading, error, signIn, clearError } = useAuth();

  // Auto-close modal and trigger success callback when user becomes authenticated
  React.useEffect(() => {
    if (user && open) {
      onOpenChange(false);
      onAuthSuccess?.();
    }
  }, [user, open, onOpenChange, onAuthSuccess]);

  const handleSignIn = async () => {
    try {
      clearError();
      await signIn(true); // Use popup
    } catch (error) {
      // Error handling is done in auth context
      console.error('Sign-in error:', error);
    }
  };

  const benefits = [
    {
      icon: Save,
      title: "Save Your Progress",
      description: "Resume your assessment anytime, even if you close your browser or switch devices."
    },
    {
      icon: FileText,
      title: "Export & Share Results", 
      description: "Download your personalized AI readiness report as PDF or JSON to share with your team."
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your assessment data is encrypted and only accessible to you. We never share your responses."
    },
    {
      icon: Clock,
      title: "Return Later",
      description: "Take breaks during the assessment and pick up exactly where you left off."
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[500px] p-0"
        data-testid="auth-required-modal"
      >
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl font-semibold text-center">
            Create Account to Get Started
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Sign in to save your progress and access your personalized AI readiness results
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          {/* Benefits Grid */}
          <div className="grid grid-cols-1 gap-3">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-border/50" data-testid={`benefit-${index}`}>
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <benefit.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{benefit.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Auth Action */}
          <div className="space-y-3">
            {error && (
              <div className="text-sm text-destructive text-center p-3 bg-destructive/10 rounded-md border border-destructive/20">
                {error}
              </div>
            )}
            
            <Button 
              onClick={handleSignIn}
              disabled={loading}
              className="w-full"
              size="lg"
              data-testid="button-sign-in"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  Sign in with Google
                </>
              )}
            </Button>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                By signing in, you agree to securely store your assessment data and receive your personalized results.
              </p>
            </div>
          </div>

          {/* Quick Benefits Summary */}
          <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">What happens next?</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Complete your organizational context profile, take the pulse check assessment, 
              and receive your executive AI readiness snapshot with actionable guidance.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};