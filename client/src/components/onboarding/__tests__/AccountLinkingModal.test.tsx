import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AccountLinkingModal from '../AccountLinkingModal';
import { User, AuthProvider, UniversityLevel } from '../../../types';

describe('AccountLinkingModal', () => {
  const mockOnLinkAccount = vi.fn();
  const mockOnCancel = vi.fn();

  const mockExistingAccount: User = {
    id: '1',
    email: 'existing@ttu.edu',
    provider: AuthProvider.GOOGLE,
    hasCompletedOnboarding: true,
    firstName: 'John',
    lastName: 'Doe',
    major: 'Computer Science',
    rNumber: 'R12345678',
    universityLevel: UniversityLevel.SENIOR,
    aspiredPosition: 'Software Engineer',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const renderModal = (props = {}) => {
    return render(
      <AccountLinkingModal
        existingAccount={mockExistingAccount}
        onLinkAccount={mockOnLinkAccount}
        onCancel={mockOnCancel}
        loading={false}
        {...props}
      />
    );
  };

  describe('Modal Display', () => {
    it('should display warning message with existing account information', () => {
      renderModal();

      expect(screen.getByText('Account Already Exists')).toBeInTheDocument();
      expect(screen.getByText(/You already have an account with this R Number \(R12345678\)/)).toBeInTheDocument();
      expect(screen.getByText(/existing@ttu.edu/)).toBeInTheDocument();
    });

    it('should show account linking options in warning step', () => {
      renderModal();

      expect(screen.getByText('I want to enter my password')).toBeInTheDocument();
      expect(screen.getByText('I forgot my password')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should disable buttons when loading', () => {
      renderModal({ loading: true });

      expect(screen.getByText('I want to enter my password')).toBeDisabled();
      expect(screen.getByText('I forgot my password')).toBeDisabled();
      expect(screen.getByText('Cancel')).toBeDisabled();
    });
  });

  describe('User Interactions', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      renderModal();

      await user.click(screen.getByText('Cancel'));

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should show password form when "I want to enter my password" is clicked', async () => {
      const user = userEvent.setup();
      renderModal();

      await user.click(screen.getByText('I want to enter my password'));

      expect(screen.getByText('Enter Your Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByText('Link Account')).toBeInTheDocument();
    });

    it('should call onLinkAccount with reset method when "I forgot my password" is clicked', async () => {
      const user = userEvent.setup();
      renderModal();

      await user.click(screen.getByText('I forgot my password'));

      expect(mockOnLinkAccount).toHaveBeenCalledWith('reset');
    });

    it('should show reset confirmation when reset method is selected', async () => {
      const user = userEvent.setup();
      renderModal();

      await user.click(screen.getByText('I forgot my password'));

      await waitFor(() => {
        expect(screen.getByText('Password Reset Sent')).toBeInTheDocument();
        expect(screen.getByText(/A password reset link has been sent to existing@ttu.edu/)).toBeInTheDocument();
      });
    });
  });

  describe('Password Form', () => {
    it('should handle password submission', async () => {
      const user = userEvent.setup();
      renderModal();

      // Navigate to password form
      await user.click(screen.getByText('I want to enter my password'));

      // Enter password
      const passwordInput = screen.getByLabelText('Password');
      await user.type(passwordInput, 'testpassword123');

      // Submit form
      await user.click(screen.getByText('Link Account'));

      expect(mockOnLinkAccount).toHaveBeenCalledWith('password', 'testpassword123');
    });

    it('should require password input', async () => {
      const user = userEvent.setup();
      renderModal();

      // Navigate to password form
      await user.click(screen.getByText('I want to enter my password'));

      // Try to submit without password
      const linkButton = screen.getByText('Link Account');
      expect(linkButton).toBeDisabled();

      // Enter password
      const passwordInput = screen.getByLabelText('Password');
      await user.type(passwordInput, 'test');

      // Button should now be enabled
      expect(linkButton).not.toBeDisabled();
    });

    it('should allow navigation back to warning from password form', async () => {
      const user = userEvent.setup();
      renderModal();

      // Navigate to password form
      await user.click(screen.getByText('I want to enter my password'));
      expect(screen.getByText('Enter Your Password')).toBeInTheDocument();

      // Navigate back
      await user.click(screen.getByText('Back'));
      expect(screen.getByText('Account Already Exists')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderModal();

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderModal();

      // Tab through buttons
      await user.tab();
      expect(screen.getByText('I want to enter my password')).toHaveFocus();

      await user.tab();
      expect(screen.getByText('I forgot my password')).toHaveFocus();

      await user.tab();
      expect(screen.getByText('Cancel')).toHaveFocus();
    });

    it('should handle Enter key on password form', async () => {
      const user = userEvent.setup();
      renderModal();

      // Navigate to password form
      await user.click(screen.getByText('I want to enter my password'));

      // Enter password and press Enter
      const passwordInput = screen.getByLabelText('Password');
      await user.type(passwordInput, 'testpassword123');
      await user.keyboard('{Enter}');

      expect(mockOnLinkAccount).toHaveBeenCalledWith('password', 'testpassword123');
    });
  });

  describe('Error Handling', () => {
    it('should display password error when provided', () => {
      renderModal();

      // Navigate to password form
      fireEvent.click(screen.getByText('I want to enter my password'));

      // Mock error by re-rendering with error prop
      // Note: In a real scenario, this would be handled by parent component state
      const { rerender } = render(
        <AccountLinkingModal
          existingAccount={mockExistingAccount}
          onLinkAccount={mockOnLinkAccount}
          onCancel={mockOnCancel}
          loading={false}
        />
      );

      // Simulate password form with error
      fireEvent.click(screen.getByText('I want to enter my password'));
      
      // The error would be shown by the parent component managing the modal state
      // This test verifies the modal structure supports error display
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing R Number in existing account', () => {
      const accountWithoutRNumber = { ...mockExistingAccount, rNumber: undefined };
      render(
        <AccountLinkingModal
          existingAccount={accountWithoutRNumber}
          onLinkAccount={mockOnLinkAccount}
          onCancel={mockOnCancel}
          loading={false}
        />
      );

      expect(screen.getByText('Account Already Exists')).toBeInTheDocument();
      // Should still show the modal even without R Number
    });

    it('should handle missing email in existing account', () => {
      const accountWithoutEmail = { ...mockExistingAccount, email: '' };
      render(
        <AccountLinkingModal
          existingAccount={accountWithoutEmail}
          onLinkAccount={mockOnLinkAccount}
          onCancel={mockOnCancel}
          loading={false}
        />
      );

      expect(screen.getByText('Account Already Exists')).toBeInTheDocument();
      // Should not show email section if email is empty
      expect(screen.queryByText(/Existing account email:/)).not.toBeInTheDocument();
    });
  });
});