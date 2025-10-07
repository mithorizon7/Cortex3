import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { LogIn, LogOut, User, Loader2, Settings, Shield } from 'lucide-react';
import { Link } from 'wouter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { EnhancedSignInModal } from './enhanced-sign-in-modal';

interface AuthButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export const AuthButton: React.FC<AuthButtonProps> = ({ 
  variant = 'default', 
  size = 'default',
  className = ''
}) => {
  const { user, userProfile, loading, error, signOut, clearError, isAdmin } = useAuth();
  const { toast } = useToast();
  const [showSignInModal, setShowSignInModal] = useState(false);

  const handleSignInClick = () => {
    clearError();
    setShowSignInModal(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out.',
      });
    } catch (error) {
      toast({
        title: 'Sign Out Failed',
        description: 'There was a problem signing you out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Show loading state
  if (loading) {
    return (
      <Button 
        variant={variant} 
        size={size} 
        disabled 
        className={className}
        data-testid="auth-button-loading"
      >
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading...
      </Button>
    );
  }

  // Show error state
  if (error) {
    return (
      <Button 
        variant="destructive" 
        size={size} 
        onClick={() => clearError()}
        className={className}
        data-testid="auth-button-error"
      >
        <LogIn className="h-4 w-4 mr-2" />
        Try Again
      </Button>
    );
  }

  // User is signed in - show user menu
  if (user) {
    const initials = user.displayName
      ?.split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase() || user.email?.[0]?.toUpperCase() || 'U';

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className={`relative h-8 w-8 rounded-full ${className}`}
            data-testid="auth-button-user-menu"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user.displayName || 'User'}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
              {userProfile && (
                <div className="flex items-center gap-1 mt-1">
                  <Shield className="h-3 w-3" />
                  <span className="text-xs font-medium text-primary">
                    {userProfile.role === 'super_admin' ? 'Super Admin' : 
                     userProfile.role === 'admin' ? 'Admin' : 'User'}
                  </span>
                </div>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isAdmin && (
            <>
              <DropdownMenuItem asChild data-testid="admin-dashboard-menu-item">
                <Link to="/admin">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Admin Dashboard</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={handleSignOut} data-testid="sign-out-menu-item">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // User is not signed in - show sign in button
  return (
    <>
      <Button 
        variant={variant} 
        size={size} 
        onClick={handleSignInClick}
        className={className}
        data-testid="auth-button-sign-in"
      >
        <LogIn className="h-4 w-4 mr-2" />
        Sign In
      </Button>
      
      <EnhancedSignInModal 
        open={showSignInModal}
        onOpenChange={setShowSignInModal}
      />
    </>
  );
};