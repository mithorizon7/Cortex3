import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { signInWithGoogle } from '@/lib/firebase';

export function AuthDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testAuth = async () => {
    setIsLoading(true);
    setDebugInfo(null);

    try {
      console.log('🔧 Testing Firebase Auth...');
      
      // Log current environment
      const env = {
        isDev: !import.meta.env.PROD,
        currentDomain: window.location.hostname,
        currentOrigin: window.location.origin,
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? 'Set' : 'Missing',
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'Missing',
        appId: import.meta.env.VITE_FIREBASE_APP_ID ? 'Set' : 'Missing',
        expectedAuthDomain: window.location.hostname,
        expectedRedirectURI: `${window.location.origin}/__/auth/handler`,
        geminiModel: 'gemini-2.5-flash'
      };
      
      console.log('🔧 Environment:', env);

      // Test authentication
      const result = await signInWithGoogle(true);
      
      setDebugInfo({
        success: true,
        env,
        user: {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName
        }
      });
      
    } catch (error: any) {
      console.error('🔧 Auth Error:', error);
      
      setDebugInfo({
        success: false,
        env: {
          isDev: !import.meta.env.PROD,
          currentDomain: window.location.hostname,
          currentOrigin: window.location.origin,
          apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? 'Set' : 'Missing',
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'Missing',
          appId: import.meta.env.VITE_FIREBASE_APP_ID ? 'Set' : 'Missing'
        },
        error: {
          code: error.code,
          message: error.message,
          stack: error.stack?.substring(0, 200)
        }
      });
    }
    
    setIsLoading(false);
  };

  return (
    <Card className="fixed bottom-4 right-4 w-96 z-50 bg-white dark:bg-gray-800">
      <CardHeader>
        <h3 className="text-sm font-medium">🔧 Auth Debug</h3>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button 
          onClick={testAuth} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Testing...' : 'Test Firebase Auth'}
        </Button>
        
        {debugInfo && (
          <div className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto max-h-64">
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}