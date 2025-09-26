import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Copy } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { isFirebaseConfigured } from '@/lib/firebase';

export const AuthDiagnostic = () => {
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const { signIn, signInWithEmail, error, clearError } = useAuth();

  const runDiagnostics = async () => {
    setTesting(true);
    clearError();
    
    const results = {
      currentDomain: window.location.hostname,
      currentUrl: window.location.href,
      firebaseConfigured: isFirebaseConfigured(),
      authDomain: getDynamicAuthDomain(),
      envVars: {
        apiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
        projectId: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
        appId: !!import.meta.env.VITE_FIREBASE_APP_ID,
      },
      browserInfo: {
        userAgent: navigator.userAgent,
        cookiesEnabled: navigator.cookieEnabled,
        popupBlocked: false,
      },
      errors: [] as string[],
    };

    // Test popup blocking
    try {
      const popup = window.open('', '_blank', 'width=1,height=1');
      if (!popup || popup.closed) {
        results.browserInfo.popupBlocked = true;
        results.errors.push('Popup blocker is active');
      } else {
        popup.close();
      }
    } catch (e) {
      results.browserInfo.popupBlocked = true;
      results.errors.push('Popup test failed');
    }

    setDiagnosticResults(results);
    setTesting(false);
  };

  const getDynamicAuthDomain = (): string => {
    const currentDomain = window.location.hostname;
    const productionDomains = [
      'horizoncortex.replit.app',
      'cortexindex.com',
      'www.cortexindex.com'
    ];

    if (productionDomains.includes(currentDomain)) {
      return currentDomain;
    }

    if (currentDomain === 'localhost' || currentDomain.includes('.replit.dev')) {
      return `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`;
    }

    return 'horizoncortex.replit.app';
  };

  const testGoogleLogin = async () => {
    try {
      clearError();
      await signIn(true);
    } catch (error) {
      console.error('Google login test failed:', error);
    }
  };

  const testEmailLogin = async () => {
    try {
      clearError();
      await signInWithEmail('davedxn@mit.edu', 'test123');
    } catch (error) {
      console.error('Email login test failed:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔧 Authentication Diagnostics</CardTitle>
          <CardDescription>
            This tool helps diagnose authentication issues for your superadmin account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runDiagnostics} disabled={testing} data-testid="button-run-diagnostics">
            {testing ? 'Running Diagnostics...' : 'Run Diagnostics'}
          </Button>

          {diagnosticResults && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Environment Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Current Domain:</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{diagnosticResults.currentDomain}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(diagnosticResults.currentDomain)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Auth Domain:</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{diagnosticResults.authDomain}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(diagnosticResults.authDomain)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Firebase Configured:</span>
                      {getStatusIcon(diagnosticResults.firebaseConfigured)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Browser Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Cookies Enabled:</span>
                      {getStatusIcon(diagnosticResults.browserInfo.cookiesEnabled)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Popup Blocked:</span>
                      {diagnosticResults.browserInfo.popupBlocked ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {diagnosticResults.errors.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Issues Found:</strong>
                    <ul className="list-disc list-inside mt-2">
                      {diagnosticResults.errors.map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Firebase Console Setup</CardTitle>
                  <CardDescription>
                    You need to add this domain to your Firebase Console authorized domains:
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="font-mono text-sm">{diagnosticResults.currentDomain}</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><strong>Steps:</strong></p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Go to <a href="https://console.firebase.google.com/" target="_blank" className="text-blue-600 hover:underline">Firebase Console</a></li>
                      <li>Select your project</li>
                      <li>Go to Authentication → Settings → Authorized domains</li>
                      <li>Add: <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">{diagnosticResults.currentDomain}</code></li>
                    </ol>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Test Authentication</h3>
                <div className="flex gap-3">
                  <Button onClick={testGoogleLogin} variant="outline" data-testid="button-test-google">
                    Test Google Login
                  </Button>
                  <Button onClick={testEmailLogin} variant="outline" data-testid="button-test-email">
                    Test Email Login (with davedxn@mit.edu)
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};