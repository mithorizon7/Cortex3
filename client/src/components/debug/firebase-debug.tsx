import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { signInWithGoogle, isFirebaseConfigured } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export const FirebaseDebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { toast } = useToast();

  const runDiagnostics = async () => {
    const info: any = {
      // Environment variables check
      envVars: {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? '✓ Present' : '✗ Missing',
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✓ Present' : '✗ Missing',
        appId: import.meta.env.VITE_FIREBASE_APP_ID ? '✓ Present' : '✗ Missing',
      },
      // Firebase configuration check
      firebaseConfigured: isFirebaseConfigured(),
      // Environment context
      isDevelopment: !import.meta.env.PROD,
      isProduction: import.meta.env.PROD,
      // Current domain
      currentDomain: window.location.hostname,
      currentUrl: window.location.href,
      // User agent for popup blocking detection
      userAgent: navigator.userAgent,
    };

    // Test Firebase initialization
    try {
      // This will throw if Firebase isn't properly configured
      await signInWithGoogle(true);
    } catch (error: any) {
      info.firebaseError = {
        code: error?.code || 'unknown',
        message: error?.message || 'Unknown error',
        toString: error?.toString() || 'No error details'
      };
    }

    setDebugInfo(info);
  };

  const testGoogleSignIn = async () => {
    try {
      await signInWithGoogle(true);
      toast({
        title: 'Sign-in Test',
        description: 'Google sign-in popup was initiated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Sign-in Test Failed',
        description: `Error: ${error.message || 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    if (status.includes('✓')) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status.includes('✗')) return <XCircle className="h-4 w-4 text-red-500" />;
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" data-testid="firebase-debug-trigger">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Firebase Debug
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <Card className="w-96 max-h-96 overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-lg">Firebase Debug Panel</CardTitle>
              <CardDescription>
                Diagnose Firebase authentication issues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Button onClick={runDiagnostics} size="sm" className="w-full">
                  Run Diagnostics
                </Button>
                <Button onClick={testGoogleSignIn} size="sm" variant="outline" className="w-full">
                  Test Google Sign-In
                </Button>
              </div>

              {debugInfo && (
                <div className="space-y-3 text-sm">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Environment:</strong> {debugInfo.isDevelopment ? 'Development' : 'Production'}
                      <br />
                      <strong>Domain:</strong> {debugInfo.currentDomain}
                    </AlertDescription>
                  </Alert>

                  <div>
                    <h4 className="font-medium mb-2">Environment Variables</h4>
                    {Object.entries(debugInfo.envVars).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between py-1">
                        <span>VITE_FIREBASE_{key.toUpperCase()}:</span>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(value as string)}
                          <Badge variant={value === '✓ Present' ? 'default' : 'destructive'}>
                            {value as string}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Firebase Status</h4>
                    <div className="flex items-center justify-between">
                      <span>Configuration:</span>
                      <Badge variant={debugInfo.firebaseConfigured ? 'default' : 'destructive'}>
                        {debugInfo.firebaseConfigured ? 'Configured' : 'Not Configured'}
                      </Badge>
                    </div>
                  </div>

                  {debugInfo.firebaseError && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Firebase Error:</strong>
                        <br />
                        <strong>Code:</strong> {debugInfo.firebaseError.code}
                        <br />
                        <strong>Message:</strong> {debugInfo.firebaseError.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  <details className="text-xs">
                    <summary className="cursor-pointer font-medium">Raw Debug Data</summary>
                    <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">
                      {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};