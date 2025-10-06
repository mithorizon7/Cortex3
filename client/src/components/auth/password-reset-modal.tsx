import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { Mail, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PasswordResetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBackToSignIn?: () => void;
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({ 
  open, 
  onOpenChange,
  onBackToSignIn
}) => {
  const { resetPassword, loading, error, clearError } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      clearError();
      await resetPassword(email);
      setResetSent(true);
      toast({
        title: 'Password Reset Email Sent!',
        description: `We've sent a password reset link to ${email}. Please check your email.`,
      });
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: 'Password Reset Failed',
        description: 'Unable to send password reset email. Please check your email address and try again.',
        variant: 'destructive',
      });
    }
  };

  const handleBackToSignIn = () => {
    setEmail('');
    setResetSent(false);
    clearError();
    if (onBackToSignIn) {
      onBackToSignIn();
    } else {
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setResetSent(false);
    clearError();
    onOpenChange(false);
  };

  if (resetSent) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[400px]" data-testid="password-reset-success-modal">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-center flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5 text-[hsl(var(--success))]" />
              Email Sent Successfully
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              Check your email for password reset instructions
            </DialogDescription>
          </DialogHeader>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-lg">Check Your Email</CardTitle>
              <CardDescription>
                We've sent a password reset link to <strong>{email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-[hsl(var(--success-lighter))] dark:bg-[hsl(var(--success-light))] border-[hsl(var(--success-border))] dark:border-[hsl(var(--success-border))]">
                <Mail className="h-4 w-4 text-[hsl(var(--success-text))]" />
                <AlertDescription className="text-sm text-[hsl(var(--success-text))] dark:text-[hsl(var(--success-text))]">
                  <strong>Next steps:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Check your email inbox (and spam folder)</li>
                    <li>Click the password reset link in the email</li>
                    <li>Create a new password</li>
                    <li>Return here to sign in with your new password</li>
                  </ol>
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-3">
                <Button 
                  onClick={handleBackToSignIn}
                  variant="outline"
                  className="flex-1"
                  data-testid="back-to-signin-button"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sign In
                </Button>
                <Button 
                  onClick={handleClose}
                  variant="default"
                  className="flex-1"
                  data-testid="close-modal-button"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]" data-testid="password-reset-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">
            Reset Your Password
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Enter your email address and we'll send you a link to reset your password
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Password Reset</CardTitle>
            <CardDescription>
              We'll send a secure link to your email address
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email Address</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  disabled={loading}
                  data-testid="reset-email-input"
                />
              </div>
              
              <Button 
                type="submit"
                disabled={loading || !email}
                className="w-full"
                size="lg"
                data-testid="send-reset-email-button"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                {loading ? 'Sending Reset Email...' : 'Send Reset Email'}
              </Button>
              
              <div className="text-center">
                <Button 
                  type="button"
                  variant="ghost" 
                  size="sm"
                  onClick={handleBackToSignIn}
                  className="text-sm hover:bg-transparent text-primary underline-offset-4 hover:underline"
                  data-testid="back-to-signin-link"
                >
                  <ArrowLeft className="h-3 w-3 mr-1" />
                  Back to Sign In
                </Button>
              </div>
            </form>
            
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};