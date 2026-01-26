import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AuthProviderButton from '../AuthProviderButton';

describe('AuthProviderButton', () => {
  const mockOnAuth = vi.fn();

  beforeEach(() => {
    mockOnAuth.mockClear();
  });

  it('renders Google provider button correctly', () => {
    render(
      <AuthProviderButton 
        provider="google" 
        onAuth={mockOnAuth} 
      />
    );

    const button = screen.getByRole('button', { name: /continue with google/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-white', 'hover:bg-gray-50', 'text-gray-900');
  });

  it('renders Microsoft provider button correctly', () => {
    render(
      <AuthProviderButton 
        provider="microsoft" 
        onAuth={mockOnAuth} 
      />
    );

    const button = screen.getByRole('button', { name: /continue with microsoft/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-white', 'hover:bg-gray-50', 'text-gray-900');
  });

  it('renders Email provider button correctly', () => {
    render(
      <AuthProviderButton 
        provider="email" 
        onAuth={mockOnAuth} 
      />
    );

    const button = screen.getByRole('button', { name: /continue with email/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-red-600', 'hover:bg-red-700', 'text-white');
  });

  it('calls onAuth with correct provider when clicked', () => {
    render(
      <AuthProviderButton 
        provider="google" 
        onAuth={mockOnAuth} 
      />
    );

    const button = screen.getByRole('button', { name: /continue with google/i });
    fireEvent.click(button);

    expect(mockOnAuth).toHaveBeenCalledWith('google');
    expect(mockOnAuth).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <AuthProviderButton 
        provider="google" 
        onAuth={mockOnAuth} 
        disabled={true}
      />
    );

    const button = screen.getByRole('button', { name: /continue with google/i });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('does not call onAuth when disabled and clicked', () => {
    render(
      <AuthProviderButton 
        provider="google" 
        onAuth={mockOnAuth} 
        disabled={true}
      />
    );

    const button = screen.getByRole('button', { name: /continue with google/i });
    fireEvent.click(button);

    expect(mockOnAuth).not.toHaveBeenCalled();
  });

  it('has proper accessibility attributes', () => {
    render(
      <AuthProviderButton 
        provider="google" 
        onAuth={mockOnAuth} 
      />
    );

    const button = screen.getByRole('button', { name: /continue with google/i });
    // Button elements don't need explicit type="button" attribute - it's the default
    expect(button.tagName).toBe('BUTTON');
  });

  it('throws error for unknown provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(
        <AuthProviderButton 
          provider={'unknown' as any} 
          onAuth={mockOnAuth} 
        />
      );
    }).toThrow('Unknown provider: unknown');

    consoleSpy.mockRestore();
  });
});