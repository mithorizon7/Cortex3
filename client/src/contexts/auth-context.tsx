import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from 'firebase/auth';
import { 
  auth, 
  onAuthStateChange, 
  signInWithGoogle, 
  signOut as firebaseSignOut,
  handleRedirectResult,
  getAuthErrorMessage,
  isFirebaseConfigured
} from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (usePopup?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const signIn = useCallback(async (usePopup = true) => {
    if (!isFirebaseConfigured()) {
      setError('Authentication is not available. Please configure Firebase.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle(usePopup);
    } catch (error: any) {
      console.error('Sign-in error:', error);
      if (error.message !== 'Redirect initiated - result will be available after redirect') {
        setError(getAuthErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!isFirebaseConfigured()) {
      setError('Authentication is not available. Please configure Firebase.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      await firebaseSignOut();
    } catch (error: any) {
      console.error('Sign-out error:', error);
      setError('Failed to sign out. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // If Firebase is not configured, just set loading to false
    if (!isFirebaseConfigured()) {
      setLoading(false);
      console.warn('Firebase not configured - authentication disabled');
      return;
    }

    // Handle redirect result on app load
    handleRedirectResult()
      .then((result) => {
        if (result) {
          console.log('Successfully signed in via redirect');
        }
      })
      .catch((error) => {
        console.error('Redirect result error:', error);
        setError(getAuthErrorMessage(error));
      });

    // Set up auth state listener
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
      
      // Log authentication events for monitoring
      if (user) {
        console.log('User authenticated:', {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        });
      } else {
        console.log('User signed out');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signOut,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};