import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../client/src/contexts/auth-context';

// Mock Firebase modules
vi.mock('../../client/src/lib/firebase', () => ({
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  handleRedirectResult: vi.fn().mockResolvedValue(null),
  onAuthStateChange: vi.fn((callback) => {
    setTimeout(() => callback(null), 0);
    return vi.fn();
  }),
  getAuthErrorMessage: (error: any) => error.message || 'Generic error',
  isFirebaseConfigured: vi.fn(() => true),
}));

// Test component to access auth context
const TestComponent = () => {
  const { user, loading, error, signIn, signOut, clearError } = useAuth();
  
  return (
    <div>
      <div data-testid="auth-state">
        {loading && <span>loading</span>}
        {error && <span>error: {error}</span>}
        {user && <span>user: {user.email}</span>}
        {!user && !loading && <span>no-user</span>}
      </div>
      <button onClick={() => signIn()} data-testid="sign-in-btn">Sign In</button>
      <button onClick={signOut} data-testid="sign-out-btn">Sign Out</button>
      <button onClick={clearError} data-testid="clear-error-btn">Clear Error</button>
    </div>
  );
};

describe('AuthContext', () => {
  let mockSignInWithGoogle: any;
  let mockSignOut: any;
  let mockHandleRedirectResult: any;
  let mockOnAuthStateChange: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Get mocked functions after they're set up
    const firebase = await import('../../client/src/lib/firebase');
    mockSignInWithGoogle = firebase.signInWithGoogle;
    mockSignOut = firebase.signOut;
    mockHandleRedirectResult = firebase.handleRedirectResult;
    mockOnAuthStateChange = firebase.onAuthStateChange;
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should provide authentication context to children', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initially loading should be true
    expect(screen.getByText('loading')).toBeInTheDocument();

    // Wait for auth state to settle
    await waitFor(() => {
      expect(screen.getByText('no-user')).toBeInTheDocument();
    });
  });

  it('should handle successful sign in', async () => {
    mockSignInWithGoogle.mockResolvedValue({ user: { email: 'test@example.com' } });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('no-user')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('sign-in-btn'));

    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalledWith(true);
    });
  });

  it('should handle sign in error', async () => {
    const errorMessage = 'Sign in failed';
    mockSignInWithGoogle.mockRejectedValue(new Error(errorMessage));
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('no-user')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('sign-in-btn'));

    await waitFor(() => {
      expect(screen.getByText(`error: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  it('should handle sign out', async () => {
    mockSignOut.mockResolvedValue(undefined);
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('no-user')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('sign-out-btn'));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  it('should clear error state', async () => {
    const errorMessage = 'Test error';
    mockSignInWithGoogle.mockRejectedValue(new Error(errorMessage));
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('no-user')).toBeInTheDocument();
    });

    // Trigger error
    fireEvent.click(screen.getByTestId('sign-in-btn'));

    await waitFor(() => {
      expect(screen.getByText(`error: ${errorMessage}`)).toBeInTheDocument();
    });

    // Clear error
    fireEvent.click(screen.getByTestId('clear-error-btn'));

    await waitFor(() => {
      expect(screen.queryByText(`error: ${errorMessage}`)).not.toBeInTheDocument();
    });
  });

  it('should handle auth state changes', async () => {
    const mockUser = { uid: 'test-uid', email: 'test@example.com' };
    
    mockOnAuthStateChange.mockImplementation((callback) => {
      // Simulate user sign in
      setTimeout(() => callback(mockUser), 0);
      return vi.fn();
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('user: test@example.com')).toBeInTheDocument();
    });
  });

  it('should throw error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');
    
    consoleSpy.mockRestore();
  });
});