import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthProviderSelection from '../AuthProviderSelection';

describe('AuthProviderSelection', () => {
  const mockOnAuth = vi.fn();

  beforeEach(() => {
    mockOnAuth.mockClear();
  });

  it('renders provider selection view by default', () => {
    render(<AuthProviderSelection onAuth={mockOnAuth} />);

    expect(screen.getByText(/welcome to mlh ttu/i)).toBeInTheDocument();
    expect(screen.getByText(/choose your preferred sign-in method/i)).toBeInTheDocument();
    
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with microsoft/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with email/i })).toBeInTheDocument();
  });

  it('calls onAuth for OAuth providers', async () => {
    const user = userEvent.setup();
    render(<AuthProviderSelection onAuth={mockOnAuth} />);

    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    await user.click(googleButton);

    expect(mockOnAuth).toHaveBeenCalledWith('google');

    const microsoftButton = screen.getByRole('button', { name: /continue with microsoft/i });
    await user.click(microsoftButton);

    expect(mockOnAuth).toHaveBeenCalledWith('microsoft');
    expect(mockOnAuth).toHaveBeenCalledTimes(2);
  });

  it('shows magic link form when email provider is selected', async () => {
    const user = userEvent.setup();
    render(<AuthProviderSelection onAuth={mockOnAuth} />);

    const emailButton = screen.getByRole('button', { name: /continue with email/i });
    await user.click(emailButton);

    await waitFor(() => {
      expect(screen.getByText(/sign in with email/i)).toBeInTheDocument();
      expect(screen.getByText(/we'll send you a magic link/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });
  });

  it('allows navigation back from magic link form', async () => {
    const user = userEvent.setup();
    render(<AuthProviderSelection onAuth={mockOnAuth} />);

    // Go to magic link form
    const emailButton = screen.getByRole('button', { name: /continue with email/i });
    await user.click(emailButton);

    await waitFor(() => {
      expect(screen.getByText(/sign in with email/i)).toBeInTheDocument();
    });

    // Go back to provider selection
    const backButton = screen.getByRole('button', { name: '' }); // Back arrow button
    await user.click(backButton);

    await waitFor(() => {
      expect(screen.getByText(/welcome to mlh ttu/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    });
  });

  it('submits magic link form correctly', async () => {
    const user = userEvent.setup();
    render(<AuthProviderSelection onAuth={mockOnAuth} />);

    // Navigate to magic link form
    const emailButton = screen.getByRole('button', { name: /continue with email/i });
    await user.click(emailButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    // Fill and submit email
    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /send magic link/i });
    await user.click(submitButton);

    expect(mockOnAuth).toHaveBeenCalledWith('email', 'test@example.com');
  });

  it('displays general error message', () => {
    const errorMessage = 'Authentication failed';
    render(<AuthProviderSelection onAuth={mockOnAuth} error={errorMessage} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('passes error to magic link form when in email mode', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Email sending failed';
    
    render(<AuthProviderSelection onAuth={mockOnAuth} />);

    // Navigate to magic link form
    const emailButton = screen.getByRole('button', { name: /continue with email/i });
    await user.click(emailButton);

    // Re-render with error
    render(<AuthProviderSelection onAuth={mockOnAuth} error={errorMessage} />);

    // Navigate to magic link form again to see error
    const emailButton2 = screen.getByRole('button', { name: /continue with email/i });
    await user.click(emailButton2);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('disables all buttons when loading', () => {
    render(<AuthProviderSelection onAuth={mockOnAuth} loading={true} />);

    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    const microsoftButton = screen.getByRole('button', { name: /continue with microsoft/i });
    const emailButton = screen.getByRole('button', { name: /continue with email/i });

    expect(googleButton).toBeDisabled();
    expect(microsoftButton).toBeDisabled();
    expect(emailButton).toBeDisabled();
  });

  it('shows terms and privacy policy text', () => {
    render(<AuthProviderSelection onAuth={mockOnAuth} />);

    expect(screen.getByText(/by continuing, you agree to our terms of service and privacy policy/i)).toBeInTheDocument();
  });

  it('clears magic link error when navigating back', async () => {
    const user = userEvent.setup();
    render(<AuthProviderSelection onAuth={mockOnAuth} />);

    // Navigate to magic link form
    const emailButton = screen.getByRole('button', { name: /continue with email/i });
    await user.click(emailButton);

    // Go back - this should clear any magic link errors
    const backButton = screen.getByRole('button', { name: '' });
    await user.click(backButton);

    // Navigate to magic link form again
    await user.click(screen.getByRole('button', { name: /continue with email/i }));

    // Should not show any previous errors
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
  });

  it('handles loading state in magic link form', async () => {
    const user = userEvent.setup();
    render(<AuthProviderSelection onAuth={mockOnAuth} />);

    // Navigate to magic link form first
    const emailButton = screen.getByRole('button', { name: /continue with email/i });
    await user.click(emailButton);

    // Re-render with loading state
    render(<AuthProviderSelection onAuth={mockOnAuth} loading={true} />);

    // Navigate to magic link form again to see loading state
    const emailButton2 = screen.getByRole('button', { name: /continue with email/i });
    await user.click(emailButton2);

    await waitFor(() => {
      // Check that the magic link form shows loading state
      expect(screen.getByText(/sending magic link/i)).toBeInTheDocument();
    });
  });
});