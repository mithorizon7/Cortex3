import React from 'react';
import { Link } from 'wouter';
import { AuthButton } from '@/components/auth/auth-button';
import { Button } from '@/components/ui/button';
import { Brain, Home, BarChart3, HelpCircle, Users, LayoutDashboard, TrendingUp } from 'lucide-react';
import { useLatestAssessment } from '@/hooks/useLatestAssessment';
import { useAuth } from '@/contexts/auth-context';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface AppHeaderProps {
  showIdentityInline?: boolean;
  identityText?: string;
  showHelp?: boolean;
  onHelpClick?: () => void;
  showNav?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  showIdentityInline = false,
  identityText = 'MIT Open Learning',
  showHelp = false,
  onHelpClick,
  showNav = true
}) => {
  const { data: latestAssessment } = useLatestAssessment();
  const { userProfile } = useAuth();
  
  // Check if pulse check is completed (pillarScores indicates completion)
  const isPulseCheckCompleted = Boolean(latestAssessment && (latestAssessment as any)?.pillarScores);
  
  // Smart navigation based on assessment state
  const getAssessmentPath = () => {
    if (!latestAssessment) return '/context-profile'; // No assessment - start new
    if (isPulseCheckCompleted) return `/results/${latestAssessment.id}`; // Completed - view results
    
    // Incomplete assessment - continue where left off
    const hasContextProfile = Boolean((latestAssessment as any)?.contextProfile);
    if (!hasContextProfile) return `/context-profile`;
    
    // Has context profile, need to continue pulse check
    return `/pulse/${latestAssessment.id}`;
  };
  
  const assessmentPath = getAssessmentPath();
  const assessmentButtonText = !latestAssessment 
    ? 'Start Assessment' 
    : isPulseCheckCompleted 
      ? 'My Results' 
      : 'Continue Assessment';
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 sm:h-14 max-w-screen-2xl items-center px-4 sm:px-6">
        <div className="mr-4 hidden md:flex">
          <Link to="/">
            <Button variant="ghost" className="mr-6 flex items-center space-x-2" data-testid="nav-home">
              <Brain className="h-6 w-6 text-primary" />
              <div className="hidden sm:flex flex-col">
                <span className="font-headline text-lg font-semibold tracking-tight text-foreground">
                  CORTEX™
                </span>
                {showIdentityInline && (
                  <span className="text-xs text-muted-foreground -mt-1" data-testid="text-identity">
                    • {identityText}
                  </span>
                )}
              </div>
            </Button>
          </Link>
        </div>
        
        <div className="flex flex-1 items-center justify-between space-x-3 sm:space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Link to="/">
              <Button variant="ghost" className="inline-flex items-center space-x-2 md:hidden" data-testid="nav-home-mobile">
                <Brain className="h-5 w-5 text-primary" />
                <span className="font-headline font-semibold tracking-tight text-foreground">CORTEX™</span>
              </Button>
            </Link>
          </div>
          
          {showNav && (
            <nav className="hidden md:flex items-center space-x-1">
              <Link to="/">
                <Button variant="ghost" size="sm" className="font-ui font-medium transition-colors" style={{ color: '#011627' }} data-testid="nav-home-desktop">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              
              {/* Smart Assessment Button - adapts based on state */}
              <Link to={assessmentPath}>
                <Button 
                  variant={isPulseCheckCompleted ? "default" : "ghost"}
                  size="sm" 
                  className={isPulseCheckCompleted ? "font-ui font-semibold" : "font-ui font-medium transition-colors"}
                  style={!isPulseCheckCompleted ? { color: '#011627' } : undefined}
                  data-testid="nav-assessment"
                >
                  {isPulseCheckCompleted ? (
                    <BarChart3 className="h-4 w-4 mr-2" />
                  ) : (
                    <TrendingUp className="h-4 w-4 mr-2" />
                  )}
                  {assessmentButtonText}
                </Button>
              </Link>
              {(userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && (
                <>
                  <Link to="/admin-dashboard">
                    <Button variant="ghost" size="sm" className="font-ui font-medium transition-colors" style={{ color: '#011627' }} data-testid="nav-admin-dashboard">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Admin Dashboard
                    </Button>
                  </Link>
                  <Link to="/user-management">
                    <Button variant="ghost" size="sm" className="font-ui font-medium transition-colors" style={{ color: '#011627' }} data-testid="nav-user-management">
                      <Users className="h-4 w-4 mr-2" />
                      User Management
                    </Button>
                  </Link>
                </>
              )}
            </nav>
          )}
          
          <div className="flex items-center space-x-3 sm:space-x-2">
            {/* Mobile Assessment Button */}
            {showNav && (
              <Link to={assessmentPath}>
                <Button 
                  variant={isPulseCheckCompleted ? "default" : "ghost"}
                  size="sm" 
                  className={`md:hidden ${isPulseCheckCompleted ? 'font-ui font-semibold' : 'font-ui font-medium'}`}
                  data-testid="nav-assessment-mobile"
                >
                  {isPulseCheckCompleted ? (
                    <BarChart3 className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  )}
                  <span className="hidden sm:inline">{assessmentButtonText}</span>
                  <span className="sm:hidden">{isPulseCheckCompleted ? 'Results' : 'Assessment'}</span>
                </Button>
              </Link>
            )}
            
            {/* Cohort Display */}
            {userProfile?.cohort && (
              <Badge 
                variant="secondary" 
                className="hidden sm:flex font-mono text-xs"
                data-testid="cohort-display"
              >
                Cohort: {userProfile.cohort.code}
              </Badge>
            )}
            
            {showHelp && (
              <>
                {/* Desktop Help Button */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onHelpClick}
                  className="hidden md:flex transition-colors"
                  style={{ color: '#011627' }}
                  aria-haspopup="dialog"
                  data-testid="button-help-header"
                >
                  <HelpCircle className="h-4 w-4 mr-1" />
                  Help
                </Button>
                {/* Mobile Help Button */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onHelpClick}
                  className="md:hidden transition-colors"
                  style={{ color: '#011627' }}
                  aria-haspopup="dialog"
                  aria-label="Help and methodology"
                  data-testid="button-help-icon-header"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </>
            )}
            <AuthButton variant="outline" size="sm" />
          </div>
        </div>
      </div>
    </header>
  );
};