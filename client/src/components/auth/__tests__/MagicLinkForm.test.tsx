import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MagicLinkForm from '../MagicLinkForm';

describe('MagicLinkForm', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders form elements correctly', () => {
    render(<MagicLinkForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send magic link/i })).toBeInTheDocument();
  });

  it('validates email format correctly', async () => {
    const user = userEvent.setup();
    render(<MagicLinkForm onSubmit={mockOnSubmit} />);

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send magic link/i });

    // Initially button should be disabled
    expect(submitButton).toBeDisabled();

    // Invalid email should keep button disabled
    await user.type(emailInput, 'invalid-email');
    expect(submitButton).toBeDisabled();

    // Valid email should enable button
    await user.clear(emailInput);
    await user.type(emailInput, 'test@example.com');
    
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('calls onSubmit with valid email', async () => {
    const user = userEvent.setup();
    render(<MagicLinkForm onSubmit={mockOnSubmit} />);

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send magic link/i });

    await user.type(emailInput, 'test@example.com');
    
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    await user.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith('test@example.com');
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
  });

  it('prevents submission with invalid email', async () => {
    const user = userEvent.setup();
    render(<MagicLinkForm onSubmit={mockOnSubmit} />);

    const emailInput = screen.getByLabelText(/email address/i);
    const form = emailInput.closest('form')!;

    await user.type(emailInput, 'invalid-email');
    fireEvent.submit(form);

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows loading state correctly', () => {
    render(<MagicLinkForm onSubmit={mockOnSubmit} loading={true} />);

    const submitButton = screen.getByRole('button');
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/sending magic link/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveClass('bg-gray-300');
  });

  it('displays error message when provided', () => {
    const errorMessage = 'Email sending failed';
    render(<MagicLinkForm onSubmit={mockOnSubmit} error={errorMessage} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    
    const emailInput = screen.getByLabelText(/email address/i);
    expect(emailInput).toHaveClass('border-red-300', 'bg-red-50');
  });

  it('disables input when loading', () => {
    render(<MagicLinkForm onSubmit={mockOnSubmit} loading={true} />);

    const emailInput = screen.getByLabelText(/email address/i);
    expect(emailInput).toBeDisabled();
  });

  it('shows helpful text about magic links', () => {
    render(<MagicLinkForm onSubmit={mockOnSubmit} />);

    expect(screen.getByText(/we'll send you a secure link to sign in without a password/i)).toBeInTheDocument();
  });

  it('handles form submission via Enter key', async () => {
    const user = userEvent.setup();
    render(<MagicLinkForm onSubmit={mockOnSubmit} />);

    const emailInput = screen.getByLabelText(/email address/i);
    
    await user.type(emailInput, 'test@example.com');
    await user.keyboard('{Enter}');

    expect(mockOnSubmit).toHaveBeenCalledWith('test@example.com');
  });

  it('validates multiple email formats correctly', async () => {
    const user = userEvent.setup();
    render(<MagicLinkForm onSubmit={mockOnSubmit} />);

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send magic link/i });

    const validEmails = [
      'test@example.com',
      'user.name@domain.co.uk',
      'test+tag@example.org'
    ];

    const invalidEmails = [
      'invalid',
      '@example.com',
      'test@',
      'test.example.com'
    ];

    // Test valid emails
    for (const email of validEmails) {
      await user.clear(emailInput);
      await user.type(emailInput, email);
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    }

    // Test invalid emails
    for (const email of invalidEmails) {
      await user.clear(emailInput);
      await user.type(emailInput, email);
      
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    }
  });
});