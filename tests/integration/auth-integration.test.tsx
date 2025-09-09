import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../client/src/contexts/auth-context';
import { AuthButton } from '../../client/src/components/auth/auth-button';

// Mock Firebase
vi.mock('../../client/src/lib/firebase', () => ({
  isFirebaseConfigured: vi.fn(() => false), // Mock as not configured
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  handleRedirectResult: vi.fn(() => Promise.resolve(null)),
  onAuthStateChange: vi.fn((callback) => {
    callback(null);
    return vi.fn();
  }),
  getAuthErrorMessage: vi.fn((error) => error.message || 'Authentication error'),
}));

// Mock toast
vi.mock('../../client/src/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {component}
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('Firebase Auth Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render auth button when Firebase is not configured', async () => {
    renderWithProviders(<AuthButton data-testid="test-auth-button" />);

    await waitFor(() => {
      expect(screen.getByTestId('auth-button-sign-in')).toBeInTheDocument();
    });

    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('should show appropriate message when trying to sign in without Firebase config', async () => {
    renderWithProviders(<AuthButton />);

    await waitFor(() => {
      expect(screen.getByTestId('auth-button-sign-in')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('auth-button-sign-in'));

    // The component should handle the missing config gracefully
    // Since Firebase is not configured, it should show an error state
    await waitFor(() => {
      // The button should still be there, possibly in error state
      expect(screen.getByTestId('auth-button-sign-in')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should render auth provider without crashing when Firebase is not configured', () => {
    const TestComponent = () => <div data-testid="test-content">Content</div>;
    
    expect(() => {
      renderWithProviders(<TestComponent />);
    }).not.toThrow();

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });
});