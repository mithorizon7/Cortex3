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
        // Show actual values for Firebase support diagnosis
        actualProjectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        actualAppId: import.meta.env.VITE_FIREBASE_APP_ID,
        actualApiKey: import.meta.env.VITE_FIREBASE_API_KEY ? `${import.meta.env.VITE_FIREBASE_API_KEY.substring(0, 10)}...` : 'Not set',
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
    console.log('🔍 FIREBASE SUPPORT DEBUG: Starting Google login test...');
    console.log('📊 Environment Values for Firebase Support Review:');
    console.log('  - VITE_FIREBASE_PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
    console.log('  - VITE_FIREBASE_APP_ID:', import.meta.env.VITE_FIREBASE_APP_ID);
    console.log('  - VITE_FIREBASE_API_KEY (first 10 chars):', import.meta.env.VITE_FIREBASE_API_KEY?.substring(0, 10) + '...');
    console.log('  - Current Domain:', window.location.hostname);
    console.log('  - Auth Domain:', getDynamicAuthDomain());
    console.log('  - Full URL:', window.location.href);
    
    // Monitor network requests for Firebase support
    console.log('🌐 NETWORK MONITORING INSTRUCTIONS:');
    console.log('  1. Open DevTools → Network tab');
    console.log('  2. Clear existing requests');
    console.log('  3. Watch for these request patterns:');
    console.log('     - accounts.google.com (Google OAuth)');
    console.log('     - identitytoolkit.googleapis.com (Firebase Auth)');
    console.log('     - Any 4xx or 5xx status codes (THESE ARE KEY!)');
    console.log('  4. Click on failed requests → Response tab for error details');
    
    try {
      clearError();
      console.log('🚀 Initiating Google sign-in...');
      await signIn(true);
      console.log('✅ Google login test succeeded');
    } catch (error) {
      console.error('❌ GOOGLE LOGIN FAILED - Firebase Support Analysis:');
      console.error('Error code:', (error as any)?.code);
      console.error('Error message:', (error as any)?.message);
      console.error('Full error object:', error);
      console.error('Stack trace:', (error as any)?.stack);
      
      // Additional context for Firebase support
      console.log('🔍 Additional Context for Firebase Support:');
      console.log('  - Browser:', navigator.userAgent);
      console.log('  - Cookies enabled:', navigator.cookieEnabled);
      console.log('  - Timestamp:', new Date().toISOString());
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

                <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      🔍 Firebase Config Values
                      <Badge variant="secondary" className="text-xs">For Firebase Support</Badge>
                    </CardTitle>
                    <CardDescription className="text-sm">
                      <strong>Critical:</strong> Compare these values to your Firebase Console → Project Settings → General → Your apps
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium">Project ID:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded border">{diagnosticResults.envVars.actualProjectId}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(diagnosticResults.envVars.actualProjectId)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium">App ID:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded border break-all max-w-md">{diagnosticResults.envVars.actualAppId}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(diagnosticResults.envVars.actualAppId)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium">API Key:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded border">{diagnosticResults.envVars.actualApiKey}</code>
                        </div>
                      </div>
                    </div>
                    
                    <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                      <AlertTriangle className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Step 1:</strong> Verify the App ID above exactly matches your Firebase Console App ID.
                        <br />
                        <strong>Go to:</strong> Firebase Console → Project Settings → General → Your apps → Web app
                      </AlertDescription>
                    </Alert>
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

              <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    🧪 Network Trace Test
                    <Badge variant="destructive" className="text-xs">Critical for Firebase Support</Badge>
                  </CardTitle>
                  <CardDescription>
                    Follow these steps exactly to capture the network data Firebase support needs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-sm">
                      <strong>BEFORE clicking "Test Google Login":</strong>
                      <ol className="list-decimal list-inside mt-2 space-y-1">
                        <li><strong>Open Browser DevTools</strong> (F12 or Cmd+Option+I)</li>
                        <li><strong>Click "Network" tab</strong></li>
                        <li><strong>Clear existing requests</strong> (trash can icon)</li>
                        <li><strong>Keep DevTools open</strong> and watch during sign-in</li>
                      </ol>
                    </AlertDescription>
                  </Alert>
                  
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                    <h4 className="font-medium mb-2">What to Look For in Network Tab:</h4>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li><strong>accounts.google.com</strong> requests (Google OAuth)</li>
                      <li><strong>identitytoolkit.googleapis.com</strong> requests (Firebase Auth)</li>
                      <li><strong>__/auth/handler</strong> requests (Firebase redirects)</li>
                      <li><strong>Any requests with 4xx or 5xx status codes</strong> ← Key for diagnosis!</li>
                    </ul>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      onClick={testGoogleLogin} 
                      variant="destructive" 
                      size="lg"
                      data-testid="button-test-google"
                      className="flex-1"
                    >
                      🚀 Test Google Login (Network Monitored)
                    </Button>
                    <Button onClick={testEmailLogin} variant="outline" data-testid="button-test-email">
                      Test Email Login
                    </Button>
                  </div>
                  
                  <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-sm text-green-800 dark:text-green-200">
                      <strong>After clicking:</strong> Detailed debugging info will appear in the browser console. 
                      Copy this along with any network failures to share with Firebase support.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

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