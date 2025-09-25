import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { signInWithGoogle, auth, isFirebaseConfigured } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';

export function AuthDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { user, loading } = useAuth();

  const gatherDiagnosticInfo = () => {
    const timestamp = new Date().toISOString();
    const userAgent = navigator.userAgent;
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    return {
      timestamp,
      browser: {
        userAgent,
        cookiesEnabled: navigator.cookieEnabled,
        language: navigator.language,
        platform: navigator.platform,
        onLine: navigator.onLine,
        connection: connection ? {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        } : 'not available'
      },
      environment: {
        isDev: !import.meta.env.PROD,
        currentDomain: window.location.hostname,
        currentOrigin: window.location.origin,
        currentURL: window.location.href,
        protocol: window.location.protocol,
        port: window.location.port,
        pathname: window.location.pathname
      },
      firebase: {
        configured: isFirebaseConfigured(),
        authState: auth?.currentUser ? 'authenticated' : 'not authenticated',
        apiKeySet: import.meta.env.VITE_FIREBASE_API_KEY ? 'Set' : 'Missing',
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'Missing',
        appIdSet: import.meta.env.VITE_FIREBASE_APP_ID ? 'Set' : 'Missing',
        expectedAuthDomain: window.location.hostname,
        expectedRedirectURI: `${window.location.origin}/__/auth/handler`
      },
      localStorage: {
        available: typeof Storage !== 'undefined',
        firebaseKeys: Object.keys(localStorage).filter(key => 
          key.startsWith('firebase:') || key.includes('authUser')
        ).length
      },
      context: {
        user: user ? {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified
        } : null,
        loading
      }
    };
  };

  const testAuth = async () => {
    setIsLoading(true);
    setDebugInfo(null);

    try {
      console.log('🔧 Testing Firebase Auth...');
      const diagnostics = gatherDiagnosticInfo();
      console.log('🔧 Pre-test diagnostics:', diagnostics);

      // Test authentication
      const result = await signInWithGoogle(true);
      
      setDebugInfo({
        success: true,
        diagnostics,
        authResult: {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          emailVerified: result.user.emailVerified,
          providerId: result.providerId,
          operationType: result.operationType
        }
      });
      
    } catch (error: any) {
      console.error('🔧 Auth Error:', error);
      
      setDebugInfo({
        success: false,
        diagnostics: gatherDiagnosticInfo(),
        error: {
          code: error.code,
          message: error.message,
          stack: error.stack?.substring(0, 300),
          name: error.name,
          customData: error.customData
        }
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-2 left-2 z-40">
      {!isExpanded ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="text-xs text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100 transition-opacity"
          data-testid="button-auth-debug-expand"
        >
          ⚙️ Auth
        </Button>
      ) : (
        <Card className="w-96 bg-background/95 backdrop-blur-sm border shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-muted-foreground">🔧 Authentication Debug</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                data-testid="button-auth-debug-collapse"
              >
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div className="flex gap-2">
              <Button 
                onClick={testAuth} 
                disabled={isLoading}
                size="sm"
                className="flex-1 text-xs"
                data-testid="button-test-auth"
              >
                {isLoading ? 'Testing...' : 'Test Auth'}
              </Button>
              <Button 
                onClick={() => setDebugInfo(gatherDiagnosticInfo())} 
                variant="outline"
                size="sm"
                className="text-xs"
                data-testid="button-gather-diagnostics"
              >
                Diagnostics
              </Button>
            </div>
            
            {debugInfo && (
              <div className="text-xs bg-muted/50 p-2 rounded-md overflow-auto max-h-64 border">
                <pre className="whitespace-pre-wrap text-xs">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}