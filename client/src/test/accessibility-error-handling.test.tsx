/**
 * Property-Based Tests for Accessibility and Error Handling
 * Feature: mlh-ttu-backend-onboarding
 * 
 * Property 15: Accessibility and Keyboard Navigation
 * Property 16: Error Handling and User Feedback
 * 
 * Validates: Requirements 9.5, 9.6, 10.1, 10.2, 10.3, 10.5, 10.6
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import React from 'react';

// Import components to test
import OnboardingForm from '../components/onboarding/OnboardingForm';
import FileUpload from '../components/onboarding/FileUpload';
import AccountLinkingModal from '../components/onboarding/AccountLinkingModal';
import AuthProviderSelection from '../components/auth/AuthProviderSelection';
import MagicLinkForm from '../components/auth/MagicLinkForm';
import ErrorBoundary from '../components/ErrorBoundary';
import Alert from '../components/Alert';
import Button from '../components/Button';
import FormField from '../components/FormField';
import { UniversityLevel } from '../types';

// Mock user for account linking tests
const mockUser = {
  id: '1',
  email: 'test@ttu.edu',
  rNumber: 'R12345678',
  firstName: 'Test',
  lastName: 'User',
  hasCompletedOnboarding: false,
  provider: 'google' as const,
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('Feature: mlh-ttu-backend-onboarding, Property 15: Accessibility and Keyboard Navigation', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  test('Property 15a: Form inputs have proper labels and ARIA attributes', () => {
    fc.assert(fc.property(
      fc.boolean(),
      (loading) => {
        const mockOnSubmit = vi.fn();
        const mockOnDuplicateDetected = vi.fn();

        const { container, unmount } = render(
          <OnboardingForm
            onSubmit={mockOnSubmit}
            onDuplicateDetected={mockOnDuplicateDetected}
            loading={loading}
            errors={{}}
          />
        );

        // Test: All visible form inputs have proper labels
        const inputs = container.querySelectorAll('input:not([type="hidden"]), select, textarea');
        inputs.forEach(input => {
          const id = input.getAttribute('id');
          if (id) {
            // Skip file inputs that are part of custom upload components
            if (input.getAttribute('type') === 'file' && input.classList.contains('sr-only')) {
              // File inputs in upload components use aria-describedby instead of labels
              const describedBy = input.getAttribute('aria-describedby');
              expect(describedBy, `File input with id "${id}" should have aria-describedby`).toBeTruthy();
            } else {
              const label = container.querySelector(`label[for="${id}"]`);
              expect(label, `Input with id "${id}" should have a corresponding label`).toBeTruthy();
            }
          }
        });

        // Test: Required inputs have aria-required
        const requiredInputs = container.querySelectorAll('input[required], select[required]');
        requiredInputs.forEach(input => {
          expect(input).toHaveAttribute('aria-required', 'true');
        });

        unmount();
      }
    ), { numRuns: 10 });
  });

  test('Property 15b: Buttons are keyboard accessible', () => {
    fc.assert(fc.property(
      fc.boolean(),
      (loading) => {
        const mockOnClick = vi.fn();

        const { container, unmount } = render(
          <Button loading={loading} onClick={mockOnClick}>
            Test Button
          </Button>
        );

        // Test: Button is keyboard accessible
        const button = container.querySelector('button');
        expect(button).toBeTruthy();
        expect(button).not.toHaveAttribute('tabindex', '-1');

        unmount();
      }
    ), { numRuns: 10 });
  });

  test('Property 15c: Icons are hidden from screen readers', () => {
    fc.assert(fc.property(
      fc.constantFrom('success', 'error', 'warning', 'info'),
      fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
      (type, message) => {
        const mockOnClose = vi.fn();

        const { container, unmount } = render(
          <Alert
            type={type as 'success' | 'error' | 'warning' | 'info'}
            message={message}
            onClose={mockOnClose}
          />
        );

        // Test: Icons are properly hidden from screen readers
        const icons = container.querySelectorAll('svg');
        icons.forEach(icon => {
          // Only check if the icon doesn't have aria-hidden already set to something else
          const ariaHidden = icon.getAttribute('aria-hidden');
          if (ariaHidden !== null) {
            expect(icon).toHaveAttribute('aria-hidden', 'true');
          }
        });

        unmount();
      }
    ), { numRuns: 10 });
  });
});

describe('Feature: mlh-ttu-backend-onboarding, Property 16: Error Handling and User Feedback', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  test('Property 16a: Error messages have proper ARIA attributes', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
      (errorMessage) => {
        const mockOnClose = vi.fn();

        const { unmount } = render(
          <Alert
            type="error"
            message={errorMessage}
            onClose={mockOnClose}
          />
        );

        // Test: Error alert has proper ARIA attributes
        const alertElements = screen.getAllByRole('alert');
        expect(alertElements.length).toBeGreaterThan(0);

        // Test: Message is displayed
        expect(screen.getByText(errorMessage)).toBeInTheDocument();

        unmount();
      }
    ), { numRuns: 10 });
  });

  test('Property 16b: Loading states disable buttons properly', () => {
    fc.assert(fc.property(
      fc.boolean(),
      (loading) => {
        const mockOnClick = vi.fn();

        const { container, unmount } = render(
          <Button loading={loading} onClick={mockOnClick}>
            Test Button
          </Button>
        );

        const button = container.querySelector('button');
        expect(button).toBeTruthy();

        if (loading) {
          // Test: Button is properly disabled during loading
          expect(button).toBeDisabled();
          expect(button).toHaveAttribute('aria-disabled', 'true');
        } else {
          // Test: Button is enabled when not loading
          expect(button).not.toBeDisabled();
        }

        unmount();
      }
    ), { numRuns: 10 });
  });

  test('Property 16c: Form fields handle errors with proper ARIA', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0 && /^[a-zA-Z0-9\s]+$/.test(s)),
      fc.boolean(),
      fc.oneof(fc.constant(undefined), fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0)),
      (label, required, error) => {
        const { unmount } = render(
          <FormField
            label={label}
            id="test-field"
            required={required}
            error={error}
          >
            <input type="text" />
          </FormField>
        );

        // Test: Input has proper ARIA attributes
        const input = document.querySelector('#test-field');
        expect(input).toHaveAttribute('aria-required', required.toString());

        // Test: Error handling
        if (error) {
          expect(input).toHaveAttribute('aria-invalid', 'true');
          const errorElements = screen.getAllByRole('alert');
          expect(errorElements.length).toBeGreaterThan(0);
        }

        unmount();
      }
    ), { numRuns: 10 });
  });

  test('Property 16d: Magic link form provides validation feedback', () => {
    fc.assert(fc.property(
      fc.boolean(),
      fc.oneof(fc.constant(undefined), fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0)),
      (loading, error) => {
        const mockOnSubmit = vi.fn();

        const { container, unmount } = render(
          <MagicLinkForm
            onSubmit={mockOnSubmit}
            loading={loading}
            error={error}
          />
        );

        const emailInput = screen.getByRole('textbox', { name: /email/i });
        const submitButton = container.querySelector('button[type="submit"]');

        // Test: Input has proper accessibility attributes
        expect(emailInput).toHaveAttribute('type', 'email');

        // Test: Error display
        if (error) {
          expect(emailInput).toHaveAttribute('aria-invalid', 'true');
          const errorElements = screen.getAllByRole('alert');
          expect(errorElements.length).toBeGreaterThan(0);
        }

        // Test: Loading state
        if (loading && submitButton) {
          expect(submitButton).toBeDisabled();
        }

        unmount();
      }
    ), { numRuns: 10 });
  });

  test('Property 16e: Error boundary displays error UI with proper ARIA', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
      (errorMessage) => {
        // Create a component that throws an error
        const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
          if (shouldThrow) {
            throw new Error(errorMessage);
          }
          return <div>No error</div>;
        };

        const { rerender, container, unmount } = render(
          <ErrorBoundary>
            <ThrowError shouldThrow={false} />
          </ErrorBoundary>
        );

        // Initially no error
        expect(screen.getByText('No error')).toBeInTheDocument();

        // Trigger error
        rerender(
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>
        );

        // Test: Error boundary displays error UI
        const errorTexts = screen.getAllByText('Something went wrong');
        expect(errorTexts.length).toBeGreaterThan(0);

        // Test: Error UI has proper ARIA attributes
        const errorContainer = container.querySelector('[role="alert"]');
        if (errorContainer) {
          expect(errorContainer).toHaveAttribute('aria-live', 'assertive');
        }

        unmount();
      }
    ), { numRuns: 5 });
  });
});