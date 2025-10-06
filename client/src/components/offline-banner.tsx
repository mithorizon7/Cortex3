import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { isOnline } from '@/lib/queryClient';

interface OfflineBannerProps {
  onRetry?: () => void;
  showRetryButton?: boolean;
}

export default function OfflineBanner({ onRetry, showRetryButton = false }: OfflineBannerProps) {
  const [online, setOnline] = useState(isOnline());
  const [showBanner, setShowBanner] = useState(!isOnline());

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      // Auto-hide banner after 2 seconds when back online
      setTimeout(() => setShowBanner(false), 2000);
    };

    const handleOffline = () => {
      setOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <Alert 
      className={`fixed top-4 left-4 right-4 z-50 ${
        online 
          ? 'border-[hsl(var(--success-border))] bg-[hsl(var(--success-lighter))] dark:bg-[hsl(var(--success-light))] text-[hsl(var(--success-text))] dark:text-[hsl(var(--success-text))]' 
          : 'border-amber-200 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200'
      }`}
      data-testid="offline-banner"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {online ? (
            <Wifi className="h-4 w-4" />
          ) : (
            <WifiOff className="h-4 w-4" />
          )}
          <AlertDescription>
            {online 
              ? 'Connection restored' 
              : 'No internet connection - some features may not work'
            }
          </AlertDescription>
        </div>
        
        {!online && showRetryButton && onRetry && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onRetry}
            className="text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900"
            data-testid="button-retry-connection"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        )}
        
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowBanner(false)}
          className={online 
            ? "text-[hsl(var(--success-text))] dark:text-[hsl(var(--success-text))] hover:bg-[hsl(var(--success-light))] dark:hover:bg-[hsl(var(--success-lighter))]"
            : "text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900"
          }
          data-testid="button-dismiss-banner"
        >
          ×
        </Button>
      </div>
    </Alert>
  );
}