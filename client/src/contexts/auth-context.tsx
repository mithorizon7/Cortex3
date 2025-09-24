import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from 'firebase/auth';
import { 
  auth, 
  onAuthStateChange, 
  signInWithGoogle, 
  signInWithEmail as firebaseSignInWithEmail,
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
  signInWithEmail: (email: string, password: string) => Promise<void>;
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
      // Don't set loading to false here - let the auth state listener handle it
    } catch (error: any) {
      console.error('Sign-in error:', error);
      if (error.message !== 'Redirect initiated - result will be available after redirect') {
        setError(getAuthErrorMessage(error));
        setLoading(false); // Only set loading to false on error
      }
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!isFirebaseConfigured()) {
      setError('Authentication is not available. Please configure Firebase.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      await firebaseSignInWithEmail(email, password);
      // Don't set loading to false here - let the auth state listener handle it
    } catch (error: any) {
      console.error('Email sign-in error:', error);
      setError(getAuthErrorMessage(error));
      setLoading(false); // Only set loading to false on error
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
          setUser(result.user);
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
    signInWithEmail,
    signOut,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};