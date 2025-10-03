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
  
  // Smart navigation: go to results if completed assessment exists, otherwise start new assessment
  const assessmentPath = latestAssessment ? `/results/${latestAssessment.id}` : '/context-profile';
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 sm:h-14 max-w-screen-2xl items-center px-4 sm:px-6">
        <div className="mr-4 hidden md:flex">
          <Link href="/">
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
            <Link href="/">
              <Button variant="ghost" className="inline-flex items-center space-x-2 md:hidden" data-testid="nav-home-mobile">
                <Brain className="h-5 w-5 text-primary" />
                <span className="font-headline font-semibold tracking-tight text-foreground">CORTEX™</span>
              </Button>
            </Link>
          </div>
          
          {showNav && (
            <nav className="hidden md:flex items-center space-x-1">
              <Link href="/">
                <Button variant="ghost" size="sm" className="font-ui font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-home-desktop">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              
              {/* Prominent Strategic Profile Button */}
              {isPulseCheckCompleted ? (
                <Link href={`/results/${latestAssessment.id}`}>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="font-ui font-semibold"
                    data-testid="nav-strategic-profile"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Strategic Profile
                  </Button>
                </Link>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span 
                      role="button"
                      aria-disabled="true"
                      aria-label="Strategic Profile - Complete the pulse check to view your strategic profile"
                      tabIndex={0}
                      className="inline-flex"
                      data-testid="nav-strategic-profile-disabled-wrapper"
                    >
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        disabled
                        className="font-ui font-medium text-muted-foreground/50 cursor-not-allowed pointer-events-none"
                        data-testid="nav-strategic-profile-disabled"
                        tabIndex={-1}
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Strategic Profile
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Complete the pulse check to view your strategic profile</p>
                  </TooltipContent>
                </Tooltip>
              )}
              
              <Link href={assessmentPath}>
                <Button variant="ghost" size="sm" className="font-ui font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-assessment">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {latestAssessment ? 'My Results' : 'Assessment'}
                </Button>
              </Link>
              {(userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && (
                <>
                  <Link href="/admin-dashboard">
                    <Button variant="ghost" size="sm" className="font-ui font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-admin-dashboard">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Admin Dashboard
                    </Button>
                  </Link>
                  <Link href="/user-management">
                    <Button variant="ghost" size="sm" className="font-ui font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-user-management">
                      <Users className="h-4 w-4 mr-2" />
                      User Management
                    </Button>
                  </Link>
                </>
              )}
            </nav>
          )}
          
          <div className="flex items-center space-x-3 sm:space-x-2">
            {/* Mobile Strategic Profile Button */}
            {showNav && (
              isPulseCheckCompleted ? (
                <Link href={`/results/${latestAssessment.id}`}>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="md:hidden font-ui font-semibold"
                    data-testid="nav-strategic-profile-mobile"
                  >
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Profile
                  </Button>
                </Link>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span 
                      role="button"
                      aria-disabled="true"
                      aria-label="Strategic Profile - Complete the pulse check first"
                      tabIndex={0}
                      className="inline-flex md:hidden"
                      data-testid="nav-strategic-profile-mobile-disabled-wrapper"
                    >
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        disabled
                        className="font-ui font-medium text-muted-foreground/50 cursor-not-allowed pointer-events-none"
                        data-testid="nav-strategic-profile-mobile-disabled"
                        tabIndex={-1}
                      >
                        <TrendingUp className="h-4 w-4 mr-1" />
                        Profile
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Complete the pulse check first</p>
                  </TooltipContent>
                </Tooltip>
              )
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
                  className="hidden md:flex text-muted-foreground hover:text-foreground transition-colors"
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
                  className="md:hidden text-muted-foreground hover:text-foreground"
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