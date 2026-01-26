import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';

// Simple test that focuses on component structure rather than complex mocking
describe('ProtectedRoute', () => {
  const TestComponent = () => <div>Protected Content</div>;

  it('renders children when provided', () => {
    // Mock useAuth to return a valid user
    vi.doMock('../../../contexts/AuthContext', () => ({
      useAuth: () => ({
        user: { id: '1', hasCompletedOnboarding: true },
        loading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
        clearError: vi.fn(),
      }),
    }));

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    );

    // This test verifies the component can render without crashing
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    // Mock useAuth to return loading state
    vi.doMock('../../../contexts/AuthContext', () => ({
      useAuth: () => ({
        user: null,
        loading: true,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
        clearError: vi.fn(),
      }),
    }));

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    );

    // Look for loading spinner
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});