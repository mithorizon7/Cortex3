import React from 'react';
import { Link } from 'wouter';
import { AuthButton } from '@/components/auth/auth-button';
import { Button } from '@/components/ui/button';
import { Brain, Home, BarChart3 } from 'lucide-react';

export const AppHeader: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/">
            <Button variant="ghost" className="mr-6 flex items-center space-x-2" data-testid="nav-home">
              <Brain className="h-6 w-6 text-primary" />
              <span className="hidden font-bold sm:inline-block">
                CORTEX™
              </span>
            </Button>
          </Link>
        </div>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Link href="/">
              <Button variant="ghost" className="inline-flex items-center space-x-2 md:hidden" data-testid="nav-home-mobile">
                <Brain className="h-5 w-5 text-primary" />
                <span className="font-bold">CORTEX™</span>
              </Button>
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center space-x-1">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="nav-home-desktop">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            <Link href="/context-profile">
              <Button variant="ghost" size="sm" data-testid="nav-assessment">
                <BarChart3 className="h-4 w-4 mr-2" />
                Assessment
              </Button>
            </Link>
          </nav>
          
          <div className="flex items-center space-x-2">
            <AuthButton variant="outline" size="sm" />
          </div>
        </div>
      </div>
    </header>
  );
};