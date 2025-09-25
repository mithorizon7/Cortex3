import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { LogIn, Loader2, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface EnhancedSignInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EnhancedSignInModal: React.FC<EnhancedSignInModalProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const { signIn, signInWithEmail, signUpWithEmail, loading, error, clearError } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      clearError();
      await signIn(true);
      // Success toast and modal closing will be handled by auth state change
      toast({
        title: 'Welcome!',
        description: 'You have been successfully signed in.',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast({
        title: 'Sign In Failed',
        description: 'There was a problem signing you in with Google. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setEmailLoading(true);
      clearError();
      
      if (isSignUp) {
        await signUpWithEmail(email, password, displayName || undefined);
        toast({
          title: 'Account Created!',
          description: 'Your account has been created successfully and you are now signed in.',
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
    } catch (error) {
      console.error('Email authentication error:', error);
      
      if (isSignUp) {
        toast({
          title: 'Sign Up Failed',
          description: 'Unable to create your account. Please check your information and try again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Sign In Failed',
          description: 'Invalid email or password. Please check your credentials and try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setEmailLoading(false);
    }
  };

  const fillTestCredentials = () => {
    setEmail('test.user@cortexapp.dev');
    setPassword('TestUser2024!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]" data-testid="enhanced-sign-in-modal">
        <DialogHeader>
          <DialogTitle>Access CORTEX</DialogTitle>
          <DialogDescription>
            Sign in to your existing account or create a new one to access your AI readiness assessments.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="google" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="google" data-testid="google-signin-tab">Google</TabsTrigger>
            <TabsTrigger value="email" data-testid="email-signin-tab">Email</TabsTrigger>
          </TabsList>

          <TabsContent value="google" className="mt-6">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-lg">Sign in with Google</CardTitle>
                <CardDescription>
                  Use your Google account for quick and secure access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                  data-testid="google-signin-button"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  {loading ? 'Signing in...' : 'Continue with Google'}
                </Button>
                
                {error && (
                  <p className="text-sm text-destructive text-center" data-testid="auth-error">
                    {error}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="mt-6">
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
                {!isSignUp && (
                  <div className="flex items-center gap-2 pt-2">
                    <Badge variant="secondary" className="text-xs">Test Account Available</Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={fillTestCredentials}
                      className="h-auto p-0 text-xs hover:bg-transparent text-primary underline-offset-4 hover:underline"
                      data-testid="fill-test-credentials-button"
                    >
                      Use Test Account
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  {isSignUp && (
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Name (Optional)</Label>
                      <Input
                        id="displayName"
                        type="text"
                        placeholder="Enter your full name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        disabled={emailLoading}
                        data-testid="display-name-input"
                      />
                    </div>
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
                    <Label htmlFor="password">Password</Label>
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
                    disabled={emailLoading || !email || !password || (isSignUp && password.length < 6)}
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
                  
                  <div className="text-center">
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="sm"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-sm hover:bg-transparent text-primary underline-offset-4 hover:underline"
                      data-testid="toggle-signup-mode"
                    >
                      {isSignUp 
                        ? 'Already have an account? Sign in instead' 
                        : 'Need an account? Create one here'
                      }
                    </Button>
                  </div>
                </form>
                
                {error && (
                  <p className="text-sm text-destructive text-center mt-4" data-testid="auth-error">
                    {error}
                  </p>
                )}

                <div className="mt-6 p-3 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground font-medium mb-2">
                    Test Account Credentials:
                  </p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><strong>Email:</strong> test.user@cortexapp.dev</p>
                    <p><strong>Password:</strong> TestUser2024!</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};