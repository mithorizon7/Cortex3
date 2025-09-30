import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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
import { useLocation } from 'wouter';

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
  const [isNewLogin, setIsNewLogin] = useState(false);
  const isNewLoginRef = useRef(false); // Ref to track new login without dependency issues
  const isProcessingRedirectCohortRef = useRef(false);
  const signOutRef = useRef<(() => Promise<void>) | null>(null); // Ref to signOut function for use before definition
  const [, setLocation] = useLocation();

  // Helper function to handle post-login navigation
  const handlePostLoginNavigation = useCallback((profile: UserProfile | null, isNewLogin: boolean = false) => {
    console.log('[Auth] handlePostLoginNavigation called:', {
      isNewLogin,
      currentPath: window.location.pathname,
      profileEmail: profile?.email,
      profileRole: profile?.role
    });
    
    // Only handle navigation for new logins, not every profile fetch
    if (!isNewLogin) {
      console.log('[Auth] Skipping navigation - not a new login');
      return;
    }
    
    const currentPath = window.location.pathname;
    
    // Only redirect from specific auth entry points
    const authEntryPaths = ['/', '/sign-in', '/sign-up'];
    if (!authEntryPaths.includes(currentPath)) {
      console.log('[Auth] Skipping navigation - current path not an auth entry point:', currentPath);
      return;
    }
    
    if (profile?.role === 'admin' || profile?.role === 'super_admin') {
      // Redirect admin users to admin dashboard
      console.log('[Auth] Navigating admin user to /admin');
      setLocation('/admin');
    } else {
      // Redirect regular users to assessment
      console.log('[Auth] Navigating regular user to /context-profile');
      setLocation('/context-profile');
    }
  }, [setLocation]);

  // Helper function to fetch user profile from our database
  const fetchUserProfile = useCallback(async (firebaseUser: User) => {
    console.log('[Auth] fetchUserProfile called for user:', firebaseUser.email, 'isNewLogin:', isNewLoginRef.current);
    try {
      const idToken = await firebaseUser.getIdToken();
      console.log('[Auth] Got ID token, fetching profile from /api/users/profile');
      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      console.log('[Auth] Profile API response status:', response.status);
      
      if (response.ok) {
        const profile = await response.json();
        console.log('[Auth] Profile fetched successfully:', profile.email, 'role:', profile.role);
        setUserProfile(profile);
        // Handle post-login navigation after profile is loaded (only for new logins)
        console.log('[Auth] Calling handlePostLoginNavigation with isNewLogin:', isNewLoginRef.current);
        handlePostLoginNavigation(profile, isNewLoginRef.current);
      } else if (response.status === 404) {
        // User profile not found in database - create one automatically
        console.log('User profile not found in database - creating new user record');
        
        // Validate required fields before attempting user creation
        if (!firebaseUser.email) {
          console.error('Cannot create user profile: email is required but missing from Firebase user');
          setError('Unable to create account: email address is required. Please sign in with a provider that includes your email address.');
          setUserProfile(null);
          // Sign out to prevent access to protected routes without valid profile
          if (signOutRef.current) {
            await signOutRef.current();
          }
          return;
        }
        
        try {
          const createResponse = await fetch('/api/users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              userId: firebaseUser.uid,
              email: firebaseUser.email,
              role: 'user'
            })
          });
          
          if (createResponse.ok) {
            const newProfile = await createResponse.json();
            console.log('Successfully created user profile:', newProfile);
            setUserProfile(newProfile);
            // Handle post-login navigation after profile is created
            handlePostLoginNavigation(newProfile, isNewLoginRef.current);
          } else {
            const errorText = await createResponse.text().catch(() => 'Unknown error');
            console.warn(`Failed to create user profile: ${createResponse.status} - ${errorText}`);
            setError('Unable to create account. Please try signing in again or contact support if the problem persists.');
            setUserProfile(null);
            // Sign out to prevent access to protected routes without valid profile
            if (signOutRef.current) {
              await signOutRef.current();
            }
            return;
          }
        } catch (createError) {
          console.error('Error creating user profile:', createError);
          // Check if it's a network error
          const isNetworkError = createError instanceof TypeError && 
            (createError.message.includes('fetch') || createError.message.includes('network'));
          
          if (isNetworkError) {
            setError('Network error: Unable to connect to the server. Please check your internet connection and try again.');
          } else {
            setError('Unable to create account due to a technical error. Please try again or contact support.');
          }
          setUserProfile(null);
          // Sign out to prevent access to protected routes without valid profile  
          if (signOutRef.current) {
            await signOutRef.current();
          }
          return;
        }
      } else if (response.status === 401 || response.status === 403) {
        // Authorization/authentication errors - force sign out
        console.warn(`Authorization failed with status ${response.status}`);
        setError('Your session has expired or you do not have permission to access this account. Please sign in again.');
        setUserProfile(null);
        // Sign out to clear invalid session
        if (signOutRef.current) {
          await signOutRef.current();
        }
        return;
      } else {
        // Other error (server error, etc.)
        console.warn(`Profile fetch failed with status ${response.status}`);
        const errorText = await response.text().catch(() => '');
        if (response.status >= 500) {
          setError('Server error: Unable to load your profile. Please try refreshing the page.');
        } else {
          // Other client errors (400, etc.)
          setError('Unable to load your profile. Please try signing in again or contact support if the problem persists.');
        }
        setUserProfile(null);
      }
      
      // Reset the new login flag and clean up sessionStorage after handling navigation
      if (isNewLoginRef.current) {
        setIsNewLogin(false);
        isNewLoginRef.current = false;
        // Clean up any remaining sessionStorage flags after successful processing
        sessionStorage.removeItem('cortex_new_login');
        sessionStorage.removeItem('cortex_cohort_code');
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // Check if it's a network error
      const isNetworkError = error instanceof TypeError && 
        (error.message.includes('fetch') || error.message.includes('network'));
      
      if (isNetworkError) {
        setError('Network error: Unable to connect to the server. Please check your internet connection and try again.');
      }
      setUserProfile(null);
      // Reset the new login flag even on error
      if (isNewLoginRef.current) {
        setIsNewLogin(false);
        isNewLoginRef.current = false;
      }
      // Don't throw errors for profile fetch issues - just log them
    }
  }, [handlePostLoginNavigation]);

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
      setIsNewLogin(true); // Mark as new login for navigation
      isNewLoginRef.current = true; // Sync ref with state
      
      // Always persist the new login flag for redirect flows
      sessionStorage.setItem('cortex_new_login', 'true');
      
      await signInWithGoogle(usePopup);
      // Don't set loading to false here - let the auth state listener handle it
    } catch (error: any) {
      console.error('Sign-in error:', error);
      // Check if this is a redirect flow initiation
      if (error.message === 'REDIRECT_FLOW_INITIATED') {
        // This is expected for redirect flows - don't show error
        // Keep loading state and isNewLogin flag for when user returns
        return;
      }
      
      // For actual errors, reset state and show error
      setIsNewLogin(false);
      isNewLoginRef.current = false; // Sync ref with state
      setError(getAuthErrorMessage(error));
      setLoading(false);
      throw error; // Re-throw so UI components can handle the error
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
      setIsNewLogin(true); // Mark as new login for navigation
      isNewLoginRef.current = true; // Sync ref with state
      await firebaseSignInWithEmail(email, password);
      // Don't set loading to false here - let the auth state listener handle it
    } catch (error: any) {
      console.error('Email sign-in error:', error);
      setIsNewLogin(false); // Reset flag on error
      isNewLoginRef.current = false; // Sync ref with state
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
      setIsNewLogin(true); // Mark as new login for navigation
      isNewLoginRef.current = true; // Sync ref with state
      await firebaseSignUpWithEmail(email, password, displayName);
      // Don't set loading to false here - let the auth state listener handle it
    } catch (error: any) {
      console.error('Email sign-up error:', error);
      setIsNewLogin(false); // Reset flag on error
      isNewLoginRef.current = false; // Sync ref with state
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
      setIsNewLogin(true); // Mark as new login for navigation
      isNewLoginRef.current = true; // Sync ref with state
      
      // Clear any previous errors and prepare for signup
      
      // First, validate the cohort access code
      console.log('Validating cohort access code:', cohortAccessCode);
      const validateResponse = await fetch('/api/cohorts/validate-access-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessCode: cohortAccessCode }),
      });
      
      console.log('Validation response status:', validateResponse.status);
      const validationResult = await validateResponse.json();
      console.log('Validation result:', validationResult);
      
      if (!validateResponse.ok || !validationResult.valid) {
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
        
        // Signup completed successfully
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
      setIsNewLogin(false); // Reset flag on error
      isNewLoginRef.current = false; // Sync ref with state
      setError(getAuthErrorMessage(error));
      setLoading(false); // Only set loading to false on error
      
      // Signup failed, error already set
      
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
      setIsNewLogin(true); // Mark as new login for navigation
      isNewLoginRef.current = true; // Sync ref with state
      
      // First, validate the cohort access code before proceeding
      const validateResponse = await fetch('/api/cohorts/validate-access-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessCode: cohortAccessCode }),
      });
      
      const validationResult = await validateResponse.json();
      
      if (!validateResponse.ok || !validationResult.valid) {
        throw new Error(validationResult.error || 'Invalid cohort access code');
      }
      
      // Persist both the new login flag and cohort code for post-redirect/auth processing
      sessionStorage.setItem('cortex_new_login', 'true');
      sessionStorage.setItem('cortex_cohort_code', cohortAccessCode);
      
      // Initiate Google sign-in (will use redirect in production)
      try {
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
          
          // Signup completed successfully - clean up session storage
          sessionStorage.removeItem('cortex_cohort_code');
        } catch (joinError) {
          // Only delete the Firebase account if it's a newly created account
          // Do NOT delete existing accounts that just failed to join a cohort
          if (isNewUser) {
            try {
              await firebaseUser.delete();
              console.log('Deleted newly created Firebase account after failed cohort join');
            } catch (deleteError) {
              console.error('Failed to delete Firebase account after cohort join failure:', deleteError);
            }
          } else {
            console.log('Cohort join failed for existing account - not deleting Firebase account');
          }
          
          // Re-throw the original cohort join error
          throw joinError;
        }
      } catch (signInError: any) {
        // Check if this is a redirect flow initiation
        if (signInError.message === 'REDIRECT_FLOW_INITIATED') {
          // This is expected for redirect flows - don't show error
          // Cohort join will happen after redirect completes via the auth state listener
          return;
        }
        throw signInError;
      }
      
      // Don't set loading to false here - let the auth state listener handle it
    } catch (error: any) {
      console.error('Google cohort sign-up error:', error);
      setIsNewLogin(false); // Reset flag on error
      isNewLoginRef.current = false; // Sync ref with state
      sessionStorage.removeItem('cortex_cohort_code'); // Clean up
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

  // Populate the signOut ref so it can be used in fetchUserProfile
  signOutRef.current = signOut;

  useEffect(() => {
    // If Firebase is not configured, just set loading to false
    if (!isFirebaseConfigured()) {
      setLoading(false);
      console.warn('Firebase not configured - authentication disabled');
      return;
    }

    // Check for persisted new login flag and cohort code from redirect flows
    const wasNewLogin = sessionStorage.getItem('cortex_new_login') === 'true';
    const cohortCode = sessionStorage.getItem('cortex_cohort_code');
    
    // Set processing flag BEFORE setting up auth listener to prevent race condition
    if (wasNewLogin && cohortCode) {
      isProcessingRedirectCohortRef.current = true;
    }

    // Set up auth state listener FIRST
    const unsubscribe = onAuthStateChange(async (user) => {
      console.log('[Auth] Auth state changed:', user ? `User: ${user.email}` : 'No user');
      
      // Don't process auth changes while we're handling redirect cohort signup
      if (isProcessingRedirectCohortRef.current) {
        console.log('[Auth] Skipping auth state change - processing redirect cohort');
        return;
      }
      
      setUser(user);
      
      try {
        if (user) {
          // Fetch user profile from our database
          console.log('[Auth] Fetching profile from auth state listener');
          await fetchUserProfile(user);
        } else {
          // Clear user profile when logged out
          console.log('[Auth] Clearing user profile');
          setUserProfile(null);
        }
      } catch (error) {
        console.error('[Auth] Error in auth state change handler:', error);
        // Don't throw - just log the error and continue
      } finally {
        // Always set loading to false, even if profile fetch fails
        console.log('[Auth] Auth state listener setting loading to false');
        setLoading(false);
      }
    });

    // Handle redirect result AFTER auth listener is set up
    handleRedirectResult()
      .then(async (result) => {
        if (result && wasNewLogin && cohortCode) {
          // This is a Google cohort signup redirect completion
          setUser(result.user);
          setIsNewLogin(true);
          isNewLoginRef.current = true; // Sync ref with state
          
          try {
            // Complete the cohort join process that was interrupted by redirect
            const idToken = await result.user.getIdToken();
            
            const joinResponse = await fetch('/api/cohorts/join', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
              },
              body: JSON.stringify({ code: cohortCode }),
            });
            
            if (!joinResponse.ok) {
              const joinError = await joinResponse.json();
              throw new Error(joinError.error || 'Failed to join cohort after redirect');
            }
            
            console.log('Successfully completed cohort join after redirect');
            
            // Allow auth listener to proceed with profile fetch and navigation
            isProcessingRedirectCohortRef.current = false;
            
            // Manually trigger profile fetch since auth listener was blocked
            await fetchUserProfile(result.user);
            
            // Ensure loading is set to false after successful processing
            setLoading(false);
            
          } catch (error) {
            console.error('Failed to complete cohort join after redirect:', error);
            
            // Critical failure - sign out user using proper Firebase method
            try {
              await firebaseSignOut();
              console.log('Signed out user due to cohort join failure');
            } catch (signOutError) {
              console.error('Failed to sign out user after cohort join failure:', signOutError);
            }
            
            setError(getAuthErrorMessage(error as any));
            setIsNewLogin(false);
            isNewLoginRef.current = false; // Sync ref with state
            setUser(null);
            
            // Reset processing state on error
            isProcessingRedirectCohortRef.current = false;
            
            // Ensure loading is set to false even on error
            setLoading(false);
          } finally {
            // Always clean up sessionStorage after processing completes (success or failure)
            sessionStorage.removeItem('cortex_new_login');
            sessionStorage.removeItem('cortex_cohort_code');
          }
        } else if (result && wasNewLogin) {
          // Regular Google signin redirect completion
          console.log('[Auth] Processing regular Google signin redirect for user:', result.user.email);
          setUser(result.user);
          setIsNewLogin(true);
          isNewLoginRef.current = true; // Sync ref with state
          sessionStorage.removeItem('cortex_new_login');
          
          // Manually fetch profile and complete auth flow
          try {
            console.log('[Auth] Fetching user profile after redirect...');
            await fetchUserProfile(result.user);
            console.log('[Auth] Profile fetch completed successfully');
          } catch (error) {
            console.error('[Auth] Failed to fetch profile after redirect:', error);
            setError(getAuthErrorMessage(error as any));
          } finally {
            console.log('[Auth] Setting loading to false after redirect processing');
            setLoading(false);
          }
        } else if (result) {
          // Regular redirect result without new login flag
          console.log('[Auth] Processing redirect result without new login flag for user:', result.user.email);
          setUser(result.user);
          
          // Fetch profile for any redirect result
          try {
            console.log('[Auth] Fetching user profile...');
            await fetchUserProfile(result.user);
            console.log('[Auth] Profile fetch completed');
          } catch (error) {
            console.error('[Auth] Failed to fetch profile after redirect:', error);
          } finally {
            console.log('[Auth] Setting loading to false');
            setLoading(false);
          }
        }
      })
      .catch((error) => {
        console.error('Redirect result error:', error);
        setError(getAuthErrorMessage(error));
        isProcessingRedirectCohortRef.current = false;
        // Clean up sessionStorage on error
        if (wasNewLogin) {
          setIsNewLogin(false);
          isNewLoginRef.current = false; // Sync ref with state
          sessionStorage.removeItem('cortex_new_login');
        }
        if (cohortCode) {
          sessionStorage.removeItem('cortex_cohort_code');
        }
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