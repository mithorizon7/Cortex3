import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { LogIn, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PasswordResetModal } from './password-reset-modal';

interface EnhancedSignInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EnhancedSignInModal: React.FC<EnhancedSignInModalProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const { signInWithEmail, signUpWithCohort, loading, error, clearError } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [cohortAccessCode, setCohortAccessCode] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setEmailLoading(true);
      clearError();
      
      if (isSignUp) {
        // ALL new sign-ups must provide a valid cohort access code
        if (!cohortAccessCode || cohortAccessCode.trim().length === 0) {
          toast({
            title: 'Cohort Access Code Required',
            description: 'You must provide a valid cohort access code to create an account.',
            variant: 'destructive',
          });
          return; // Stop the signup process
        }
        
        await signUpWithCohort(email, password, cohortAccessCode, displayName || undefined);
        toast({
          title: 'Account Created!',
          description: 'Your account has been created successfully and you have joined the cohort.',
        });
      } else {
        await signInWithEmail(email, password);
        toast({
          title: 'Welcome!',
          description: 'You have been successfully signed in.',
        });
      }
      
      onOpenChange(false);
      // Clear form
      setEmail('');
      setPassword('');
      setDisplayName('');
      setCohortAccessCode('');
    } catch (error: any) {
      console.error('Email authentication error:', error);
      
      // Get user-friendly error message - never show raw Firebase errors
      let errorMessage = '';
      if (error.code && error.code.includes('auth/')) {
        // Firebase errors - provide user-friendly messages
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'An account with this email already exists. Please sign in instead.';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'Password should be at least 6 characters long.';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Please enter a valid email address.';
        } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.code === 'auth/invalid-credential') {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else {
          errorMessage = isSignUp ? 
            'Unable to create your account. Please check your information and try again.' :
            'Sign-in failed. Please check your credentials and try again.';
        }
      } else if (error.message && !error.message.includes('auth/')) {
        // Non-Firebase error with a message
        errorMessage = error.message;
      } else {
        // Fallback message
        errorMessage = isSignUp ? 
          'Unable to create your account. Please check your information and try again.' :
          'Invalid email or password. Please check your credentials and try again.';
      }
      
      toast({
        title: isSignUp ? 'Sign Up Failed' : 'Sign In Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setShowPasswordReset(true);
  };

  const handleBackToSignIn = () => {
    setShowPasswordReset(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]" data-testid="enhanced-sign-in-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">
            Create Account to Get Started
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Sign up to save your progress and access your personalized strategic maturity results
          </DialogDescription>
        </DialogHeader>

        <div className="w-full mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {isSignUp ? 'Create Account' : 'Sign in with Email'}
                </CardTitle>
                <CardDescription>
                  {isSignUp 
                    ? 'Create a new account with your email and password'
                    : 'Use your email and password to sign in'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  {isSignUp && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Name</Label>
                        <Input
                          id="displayName"
                          type="text"
                          placeholder="Enter your full name"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          disabled={emailLoading}
                          required
                          data-testid="display-name-input"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cohortAccessCode">Cohort Access Code *</Label>
                        <Input
                          id="cohortAccessCode"
                          type="text"
                          placeholder="Enter 6-8 digit access code"
                          value={cohortAccessCode}
                          onChange={(e) => setCohortAccessCode(e.target.value.toUpperCase())}
                          disabled={emailLoading}
                          maxLength={8}
                          required
                          data-testid="cohort-access-code-input"
                        />
                        <p className="text-xs text-muted-foreground">
                          You must have a valid access code to join CORTEX assessments
                        </p>
                      </div>
                    </>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      required
                      disabled={emailLoading}
                      data-testid="email-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      {!isSignUp && (
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="sm"
                          onClick={handleForgotPassword}
                          className="h-auto p-0 text-xs hover:bg-transparent text-primary underline-offset-4 hover:underline"
                          data-testid="forgot-password-link"
                        >
                          Forgot Password?
                        </Button>
                      )}
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isSignUp ? "Create a password (min 6 characters)" : "Enter your password"}
                      minLength={isSignUp ? 6 : undefined}
                      required
                      disabled={emailLoading}
                      data-testid="password-input"
                    />
                  </div>
                  
                  <Button 
                    type="submit"
                    disabled={emailLoading || !email || !password || (isSignUp && (password.length < 6 || !cohortAccessCode || cohortAccessCode.length < 6 || cohortAccessCode.length > 8))}
                    className="w-full"
                    size="lg"
                    data-testid={isSignUp ? "email-signup-button" : "email-signin-button"}
                  >
                    {emailLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <LogIn className="h-4 w-4 mr-2" />
                    )}
                    {emailLoading 
                      ? (isSignUp ? 'Creating Account...' : 'Signing in...') 
                      : (isSignUp ? 'Create Account' : 'Sign in')
                    }
                  </Button>
                </form>
                
                <div className="pt-4 border-t">
                  <p className="text-center text-sm text-muted-foreground mb-2">
                    {isSignUp ? 'Already have an account?' : 'Need an account?'}
                  </p>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="default"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="w-full"
                    data-testid="toggle-signup-mode"
                  >
                    {isSignUp 
                      ? 'Sign in to Existing Account' 
                      : 'Create New Account'
                    }
                  </Button>
                </div>
                
                {error && (
                  <p className="text-sm text-destructive text-center mt-4" data-testid="auth-error">
                    {error}
                  </p>
                )}
              </CardContent>
            </Card>
        </div>
      </DialogContent>
    </Dialog>
    
    <PasswordResetModal 
      open={showPasswordReset}
      onOpenChange={setShowPasswordReset}
      onBackToSignIn={handleBackToSignIn}
    />
    </>
  );
};