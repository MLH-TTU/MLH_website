import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import OnboardingPage from '../OnboardingPage';
import { apiClient } from '../../utils/api';
import { User, AuthProvider, UniversityLevel } from '../../types';

// Mock the API client
vi.mock('../../utils/api', () => ({
  apiClient: {
    user: {
      onboard: vi.fn(),
      linkAccount: vi.fn(),
      resetForLinking: vi.fn(),
    },
  },
}));

// Mock the auth context
const mockRefreshUser = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    refreshUser: mockRefreshUser,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock child components to focus on integration logic
vi.mock('../../components/onboarding/OnboardingForm', () => ({
  default: ({ onSubmit, onDuplicateDetected, loading, errors }: any) => (
    <div data-testid="onboarding-form">
      <button
        data-testid="submit-form"
        onClick={() => onSubmit({
          firstName: 'John',
          lastName: 'Doe',
          major: 'Computer Science',
          rNumber: 'R12345678',
          universityLevel: UniversityLevel.SENIOR,
          aspiredPosition: 'Software Engineer',
          technologySkills: [],
        })}
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Submit Form'}
      </button>
      <button
        data-testid="trigger-duplicate"
        onClick={() => onDuplicateDetected({
          id: '1',
          email: 'existing@ttu.edu',
          provider: AuthProvider.GOOGLE,
          hasCompletedOnboarding: true,
          rNumber: 'R12345678',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        })}
      >
        Trigger Duplicate
      </button>
      {errors.general && <div data-testid="form-error">{errors.general}</div>}
    </div>
  ),
}));

vi.mock('../../components/onboarding/AccountLinkingModal', () => ({
  default: ({ existingAccount, onLinkAccount, onCancel, loading }: any) => (
    <div data-testid="account-linking-modal">
      <div data-testid="existing-email">{existingAccount.email}</div>
      <button
        data-testid="link-with-password"
        onClick={() => onLinkAccount('password', 'testpassword123')}
        disabled={loading}
      >
        {loading ? 'Linking...' : 'Link with Password'}
      </button>
      <button
        data-testid="link-with-reset"
        onClick={() => onLinkAccount('reset')}
        disabled={loading}
      >
        Reset Password
      </button>
      <button
        data-testid="cancel-linking"
        onClick={onCancel}
        disabled={loading}
      >
        Cancel
      </button>
    </div>
  ),
}));

describe('OnboardingPage Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const renderPage = () => {
    return render(
      <BrowserRouter>
        <OnboardingPage />
      </BrowserRouter>
    );
  };

  describe('Successful Onboarding Flow', () => {
    it('should complete onboarding successfully and redirect to profile', async () => {
      const user = userEvent.setup();
      
      // Mock successful API response
      (apiClient.user.onboard as any).mockResolvedValue({
        data: { success: true },
      });

      renderPage();

      // Submit form
      await user.click(screen.getByTestId('submit-form'));

      await waitFor(() => {
        expect(apiClient.user.onboard).toHaveBeenCalledWith({
          firstName: 'John',
          lastName: 'Doe',
          major: 'Computer Science',
          rNumber: 'R12345678',
          universityLevel: UniversityLevel.SENIOR,
          aspiredPosition: 'Software Engineer',
          technologySkills: [],
        });
        expect(mockRefreshUser).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/profile');
      });
    });

    it('should handle API errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock API error
      (apiClient.user.onboard as any).mockRejectedValue({
        response: {
          data: {
            errors: { firstName: 'Invalid first name' },
          },
        },
      });

      renderPage();

      // Submit form
      await user.click(screen.getByTestId('submit-form'));

      await waitFor(() => {
        expect(apiClient.user.onboard).toHaveBeenCalled();
        // Error should be displayed (would be handled by OnboardingForm in real scenario)
      });
    });
  });

  describe('Duplicate Account Detection Flow', () => {
    it('should show account linking modal when duplicate is detected via API response', async () => {
      const user = userEvent.setup();
      
      // Mock duplicate account response
      (apiClient.user.onboard as any).mockResolvedValue({
        data: {
          success: false,
          error: 'duplicate R Number detected',
          data: {
            isDuplicate: true,
            existingAccount: {
              id: '1',
              email: 'existing@ttu.edu',
              provider: AuthProvider.GOOGLE,
              hasCompletedOnboarding: true,
              rNumber: 'R12345678',
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
            linkingToken: 'test-token-123',
          },
        },
      });

      renderPage();

      // Submit form
      await user.click(screen.getByTestId('submit-form'));

      await waitFor(() => {
        expect(screen.getByTestId('account-linking-modal')).toBeInTheDocument();
        expect(screen.getByTestId('existing-email')).toHaveTextContent('existing@ttu.edu');
      });
    });

    it('should show account linking modal when duplicate is detected via 409 error', async () => {
      const user = userEvent.setup();
      
      // Mock 409 conflict error
      (apiClient.user.onboard as any).mockRejectedValue({
        response: {
          status: 409,
          data: {
            data: {
              isDuplicate: true,
              existingAccount: {
                id: '1',
                email: 'existing@ttu.edu',
                provider: AuthProvider.GOOGLE,
                hasCompletedOnboarding: true,
                rNumber: 'R12345678',
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
              },
              linkingToken: 'test-token-123',
            },
          },
        },
      });

      renderPage();

      // Submit form
      await user.click(screen.getByTestId('submit-form'));

      await waitFor(() => {
        expect(screen.getByTestId('account-linking-modal')).toBeInTheDocument();
        expect(screen.getByTestId('existing-email')).toHaveTextContent('existing@ttu.edu');
      });
    });

    it('should show modal when duplicate is triggered directly', async () => {
      const user = userEvent.setup();
      renderPage();

      // Trigger duplicate detection directly
      await user.click(screen.getByTestId('trigger-duplicate'));

      expect(screen.getByTestId('account-linking-modal')).toBeInTheDocument();
      expect(screen.getByTestId('existing-email')).toHaveTextContent('existing@ttu.edu');
    });
  });

  describe('Account Linking Flow', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      renderPage();
      
      // Trigger duplicate detection to show modal
      await user.click(screen.getByTestId('trigger-duplicate'));
      
      await waitFor(() => {
        expect(screen.getByTestId('account-linking-modal')).toBeInTheDocument();
      });
    });

    it('should handle successful password linking', async () => {
      const user = userEvent.setup();
      
      // Mock successful linking
      (apiClient.user.linkAccount as any).mockResolvedValue({
        data: { success: true },
      });

      // Click link with password
      await user.click(screen.getByTestId('link-with-password'));

      await waitFor(() => {
        expect(apiClient.user.linkAccount).toHaveBeenCalledWith('', 'testpassword123');
        expect(mockRefreshUser).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/profile');
      });
    });

    it('should handle password linking failure', async () => {
      const user = userEvent.setup();
      
      // Mock linking failure
      (apiClient.user.linkAccount as any).mockRejectedValue({
        response: {
          status: 401,
          data: { error: 'Invalid password' },
        },
      });

      // Click link with password
      await user.click(screen.getByTestId('link-with-password'));

      await waitFor(() => {
        expect(apiClient.user.linkAccount).toHaveBeenCalled();
        expect(screen.getByTestId('form-error')).toHaveTextContent('Invalid password. Please try again or use the password reset option.');
        expect(screen.queryByTestId('account-linking-modal')).not.toBeInTheDocument();
      });
    });

    it('should handle password reset request', async () => {
      const user = userEvent.setup();
      
      // Mock successful reset request
      (apiClient.user.resetForLinking as any).mockResolvedValue({
        data: { success: true },
      });

      // Click reset password
      await user.click(screen.getByTestId('link-with-reset'));

      await waitFor(() => {
        expect(apiClient.user.resetForLinking).toHaveBeenCalledWith('existing@ttu.edu');
      });
    });

    it('should handle reset request failure', async () => {
      const user = userEvent.setup();
      
      // Mock reset failure
      (apiClient.user.resetForLinking as any).mockRejectedValue({
        response: {
          data: { error: 'Failed to send reset email' },
        },
      });

      // Click reset password
      await user.click(screen.getByTestId('link-with-reset'));

      await waitFor(() => {
        expect(apiClient.user.resetForLinking).toHaveBeenCalled();
        expect(screen.getByTestId('form-error')).toHaveTextContent('Failed to send reset email');
        expect(screen.queryByTestId('account-linking-modal')).not.toBeInTheDocument();
      });
    });

    it('should handle cancel linking', async () => {
      const user = userEvent.setup();

      // Click cancel
      await user.click(screen.getByTestId('cancel-linking'));

      await waitFor(() => {
        expect(screen.queryByTestId('account-linking-modal')).not.toBeInTheDocument();
        expect(screen.getByTestId('form-error')).toHaveTextContent('Account creation cancelled. Please contact support if you need help accessing your existing account.');
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during form submission', async () => {
      const user = userEvent.setup();
      
      // Mock delayed API response
      (apiClient.user.onboard as any).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: { success: true } }), 100))
      );

      renderPage();

      // Submit form
      await user.click(screen.getByTestId('submit-form'));

      // Should show loading state
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByTestId('submit-form')).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/profile');
      });
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock network error
      (apiClient.user.onboard as any).mockRejectedValue(new Error('Network error'));

      renderPage();

      // Submit form
      await user.click(screen.getByTestId('submit-form'));

      await waitFor(() => {
        expect(screen.getByTestId('form-error')).toHaveTextContent('An unexpected error occurred');
      });
    });

    it('should handle malformed duplicate detection response', async () => {
      const user = userEvent.setup();
      
      // Mock malformed response
      (apiClient.user.onboard as any).mockResolvedValue({
        data: {
          success: false,
          error: 'duplicate R Number detected',
          data: {
            isDuplicate: true,
            // Missing existingAccount
          },
        },
      });

      renderPage();

      // Submit form
      await user.click(screen.getByTestId('submit-form'));

      await waitFor(() => {
        // Should show general error instead of modal
        expect(screen.getByTestId('form-error')).toHaveTextContent('duplicate R Number detected');
        expect(screen.queryByTestId('account-linking-modal')).not.toBeInTheDocument();
      });
    });
  });
});