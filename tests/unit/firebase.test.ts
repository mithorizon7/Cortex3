import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAuthErrorMessage } from '../../client/src/lib/firebase';
import type { AuthError } from 'firebase/auth';

// Mock Firebase modules
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  GoogleAuthProvider: vi.fn().mockImplementation(() => ({
    addScope: vi.fn(),
  })),
  signInWithRedirect: vi.fn(),
  signInWithPopup: vi.fn(),
  getRedirectResult: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

describe('Firebase Utilities', () => {
  describe('getAuthErrorMessage', () => {
    it('should return correct message for popup-blocked error', () => {
      const error = { code: 'auth/popup-blocked' } as AuthError;
      expect(getAuthErrorMessage(error)).toBe('Sign-in popup was blocked. Please allow popups and try again.');
    });

    it('should return correct message for popup-closed-by-user error', () => {
      const error = { code: 'auth/popup-closed-by-user' } as AuthError;
      expect(getAuthErrorMessage(error)).toBe('Sign-in was cancelled. Please try again.');
    });

    it('should return correct message for network-request-failed error', () => {
      const error = { code: 'auth/network-request-failed' } as AuthError;
      expect(getAuthErrorMessage(error)).toBe('Network error. Please check your connection and try again.');
    });

    it('should return correct message for too-many-requests error', () => {
      const error = { code: 'auth/too-many-requests' } as AuthError;
      expect(getAuthErrorMessage(error)).toBe('Too many sign-in attempts. Please try again later.');
    });

    it('should return correct message for user-disabled error', () => {
      const error = { code: 'auth/user-disabled' } as AuthError;
      expect(getAuthErrorMessage(error)).toBe('This account has been disabled. Please contact support.');
    });

    it('should return correct message for operation-not-allowed error', () => {
      const error = { code: 'auth/operation-not-allowed' } as AuthError;
      expect(getAuthErrorMessage(error)).toBe('Google sign-in is not enabled. Please contact support.');
    });

    it('should return generic message for unknown error', () => {
      const error = { code: 'auth/unknown-error' } as AuthError;
      expect(getAuthErrorMessage(error)).toBe('Sign-in failed. Please try again.');
    });

    it('should handle missing error code', () => {
      const error = {} as AuthError;
      expect(getAuthErrorMessage(error)).toBe('Sign-in failed. Please try again.');
    });
  });
});