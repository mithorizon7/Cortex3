import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, getAdditionalUserInfo } from 'firebase/auth';
import { 
  auth, 
  onAuthStateChange, 
  signInWithGoogle, 
  signInWithEmail as firebaseSignInWithEmail,
  signUpWithEmail as firebaseSignUpWithEmail,
  signOut as firebaseSignOut,
  resetPassword as firebaseResetPassword,
  handleRedirectResult,
  getAuthErrorMessage,
  isFirebaseConfigured
} from '@/lib/firebase';

// User profile from our database
interface UserProfile {
  userId: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  cohortId: string | null;
  cohort?: {
    id: string;
    code: string;
    name: string;
  } | null;
  lastActiveAt?: string;
  invitedBy?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signIn: (usePopup?: boolean) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  signUpWithCohort: (email: string, password: string, cohortAccessCode: string, displayName?: string) => Promise<void>;
  signUpWithGoogleAndCohort: (cohortAccessCode: string, usePopup?: boolean) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  isAdmin: boolean;
  isSuperAdmin: boolean;
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to fetch user profile from our database
  const fetchUserProfile = useCallback(async (firebaseUser: User) => {
    try {
      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${await firebaseUser.getIdToken()}`
        }
      });
      
      if (response.ok) {
        const profile = await response.json();
        setUserProfile(profile);
      } else if (response.status === 404) {
        // User profile not found in database - they are a new user
        // This can happen if they sign in without going through cohort signup
        setUserProfile(null);
        
        // If they're trying to sign in as a new user, show error and sign them out
        if (firebaseUser) {
          const errorMsg = 'New users must create an account with a cohort access code. Please sign up first.';
          setError(errorMsg);
          
          // Sign them out since they can't proceed without a cohort
          try {
            await firebaseUser.delete();
          } catch (deleteError) {
            console.error('Failed to delete new user account:', deleteError);
          }
          
          throw new Error(errorMsg);
        }
      } else {
        // Other error (server error, etc.)
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setUserProfile(null);
      throw error; // Re-throw to trigger error handling
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const signIn = useCallback(async (usePopup = true) => {
    if (!isFirebaseConfigured()) {
      const errorMsg = 'Authentication is not available. Please configure Firebase.';
      setError(errorMsg);
      throw new Error(errorMsg);
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
        throw error; // Re-throw so UI components can handle the error
      }
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!isFirebaseConfigured()) {
      const errorMsg = 'Authentication is not available. Please configure Firebase.';
      setError(errorMsg);
      throw new Error(errorMsg);
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
      throw error; // Re-throw so UI components can handle the error
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string, displayName?: string) => {
    if (!isFirebaseConfigured()) {
      const errorMsg = 'Authentication is not available. Please configure Firebase.';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
    
    try {
      setLoading(true);
      setError(null);
      await firebaseSignUpWithEmail(email, password, displayName);
      // Don't set loading to false here - let the auth state listener handle it
    } catch (error: any) {
      console.error('Email sign-up error:', error);
      setError(getAuthErrorMessage(error));
      setLoading(false); // Only set loading to false on error
      throw error; // Re-throw so UI components can handle the error
    }
  }, []);

  const signUpWithCohort = useCallback(async (email: string, password: string, cohortAccessCode: string, displayName?: string) => {
    if (!isFirebaseConfigured()) {
      const errorMsg = 'Authentication is not available. Please configure Firebase.';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // First, validate the cohort access code
      const validateResponse = await fetch('/api/cohorts/validate-access-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessCode: cohortAccessCode }),
      });
      
      const validationResult = await validateResponse.json();
      
      if (!validationResult.valid) {
        throw new Error(validationResult.error || 'Invalid cohort access code');
      }
      
      // Create Firebase user account
      const userCredential = await firebaseSignUpWithEmail(email, password, displayName);
      const firebaseUser = userCredential.user;
      
      try {
        // Get Firebase ID token for authentication with our API
        const idToken = await firebaseUser.getIdToken();
        
        // Join the cohort using the validated access code
        const joinResponse = await fetch('/api/cohorts/join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({ code: cohortAccessCode }),
        });
        
        if (!joinResponse.ok) {
          const joinError = await joinResponse.json();
          throw new Error(joinError.error || 'Failed to join cohort');
        }
      } catch (joinError) {
        // If cohort join fails, delete the Firebase account to prevent orphaning
        try {
          await firebaseUser.delete();
          console.log('Deleted Firebase account after failed cohort join');
        } catch (deleteError) {
          console.error('Failed to delete Firebase account after cohort join failure:', deleteError);
          // Note: We still throw the original join error, not the delete error
        }
        
        // Re-throw the original cohort join error
        throw joinError;
      }
      
      // Don't set loading to false here - let the auth state listener handle it
    } catch (error: any) {
      console.error('Cohort sign-up error:', error);
      setError(getAuthErrorMessage(error));
      setLoading(false); // Only set loading to false on error
      throw error; // Re-throw so UI components can handle the error
    }
  }, []);

  const signUpWithGoogleAndCohort = useCallback(async (cohortAccessCode: string, usePopup = true) => {
    if (!isFirebaseConfigured()) {
      const errorMsg = 'Authentication is not available. Please configure Firebase.';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // First, validate the cohort access code
      const validateResponse = await fetch('/api/cohorts/validate-access-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessCode: cohortAccessCode }),
      });
      
      const validationResult = await validateResponse.json();
      
      if (!validationResult.valid) {
        throw new Error(validationResult.error || 'Invalid cohort access code');
      }
      
      // Create Firebase user account with Google OAuth
      const userCredential = await signInWithGoogle(usePopup);
      const firebaseUser = userCredential.user;
      // Use Firebase's official API to determine if this is a new user account
      const additionalUserInfo = getAdditionalUserInfo(userCredential);
      const isNewUser = additionalUserInfo?.isNewUser ?? false;
      
      try {
        // Get Firebase ID token for authentication with our API
        const idToken = await firebaseUser.getIdToken();
        
        // Join the cohort using the validated access code
        const joinResponse = await fetch('/api/cohorts/join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({ code: cohortAccessCode }),
        });
        
        if (!joinResponse.ok) {
          const joinError = await joinResponse.json();
          throw new Error(joinError.error || 'Failed to join cohort');
        }
      } catch (joinError) {
        // Only delete the Firebase account if it's a newly created account
        // Do NOT delete existing accounts that just failed to join a cohort
        if (isNewUser) {
          try {
            await firebaseUser.delete();
            console.log('Deleted newly created Firebase account after failed cohort join');
          } catch (deleteError) {
            console.error('Failed to delete Firebase account after cohort join failure:', deleteError);
            // Note: We still throw the original join error, not the delete error
          }
        } else {
          console.log('Cohort join failed for existing account - not deleting Firebase account');
        }
        
        // Re-throw the original cohort join error
        throw joinError;
      }
      
      // Don't set loading to false here - let the auth state listener handle it
    } catch (error: any) {
      console.error('Google cohort sign-up error:', error);
      setError(getAuthErrorMessage(error));
      setLoading(false); // Only set loading to false on error
      throw error; // Re-throw so UI components can handle the error
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!isFirebaseConfigured()) {
      const errorMsg = 'Authentication is not available. Please configure Firebase.';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
    
    try {
      setLoading(true);
      setError(null);
      await firebaseResetPassword(email);
      // Don't set loading to false here - keep it true until user navigates away
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError(getAuthErrorMessage(error));
      setLoading(false); // Only set loading to false on error
      throw error; // Re-throw so UI components can handle the error
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
    const unsubscribe = onAuthStateChange(async (user) => {
      setUser(user);
      
      if (user) {
        // Fetch user profile from our database
        await fetchUserProfile(user);
      } else {
        // Clear user profile when logged out
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [fetchUserProfile]);

  // Computed properties for convenience
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';
  const isSuperAdmin = userProfile?.role === 'super_admin';

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    error,
    signIn,
    signInWithEmail,
    signUpWithEmail,
    signUpWithCohort,
    signUpWithGoogleAndCohort,
    resetPassword,
    signOut,
    clearError,
    isAdmin,
    isSuperAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};