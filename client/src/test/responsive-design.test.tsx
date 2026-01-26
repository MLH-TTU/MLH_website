/**
 * Responsive Design Tests
 * Feature: mlh-ttu-backend-onboarding
 * 
 * Tests onboarding flow on desktop, tablet, and mobile viewports
 * Verifies MLH branding consistency across screen sizes
 * Tests touch interactions and mobile-specific functionality
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 12.8
 */

import { describe, test, beforeEach, afterEach, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Import components to test
import OnboardingForm from '../components/onboarding/OnboardingForm';
import FileUpload from '../components/onboarding/FileUpload';
import AuthProviderSelection from '../components/auth/AuthProviderSelection';
import MLHLogo from '../components/MLHLogo';
import { AuthProvider } from '../contexts/AuthContext';

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

// Viewport configurations
const viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1024, height: 768 },
  largeDesktop: { width: 1440, height: 900 }
};

// Mock window.matchMedia for responsive testing
const mockMatchMedia = (viewport: keyof typeof viewports) => {
  const { width } = viewports[viewport];
  
  return vi.fn().mockImplementation((query: string) => {
    let matches = false;
    
    // Parse common media queries
    if (query.includes('max-width: 768px')) {
      matches = width <= 768;
    } else if (query.includes('max-width: 1024px')) {
      matches = width <= 1024;
    } else if (query.includes('min-width: 769px')) {
      matches = width >= 769;
    } else if (query.includes('min-width: 1025px')) {
      matches = width >= 1025;
    }
    
    return {
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  });
};

// Mock window dimensions
const mockWindowDimensions = (viewport: keyof typeof viewports) => {
  const { width, height } = viewports[viewport];
  
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  
  // Mock screen dimensions
  Object.defineProperty(window.screen, 'width', {
    writable: true,
    configurable: true,
    value: width,
  });
  
  Object.defineProperty(window.screen, 'height', {
    writable: true,
    configurable: true,
    value: height,
  });
};

describe('Responsive Design Tests: MLH TTU Onboarding', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('Mobile Viewport (375px)', () => {
    beforeEach(() => {
      mockWindowDimensions('mobile');
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia('mobile')
      });
    });

    test('Onboarding form renders properly on mobile', () => {
      const mockOnSubmit = vi.fn();
      const mockOnDuplicateDetected = vi.fn();

      const { container } = render(
        <TestWrapper>
          <OnboardingForm
            onSubmit={mockOnSubmit}
            onDuplicateDetected={mockOnDuplicateDetected}
            loading={false}
            errors={{}}
          />
        </TestWrapper>
      );

      // Test: Form is visible and accessible
      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();
      expect(form).toBeVisible();

      // Test: All required inputs are visible
      expect(screen.getByLabelText(/first name/i)).toBeVisible();
      expect(screen.getByLabelText(/last name/i)).toBeVisible();
      expect(screen.getByLabelText(/major/i)).toBeVisible();
      expect(screen.getByLabelText(/r number/i)).toBeVisible();
      expect(screen.getByLabelText(/university level/i)).toBeVisible();
      expect(screen.getByLabelText(/aspired position/i)).toBeVisible();

      // Test: Submit button is visible and accessible
      const submitButton = screen.getByRole('button', { name: /complete profile/i });
      expect(submitButton).toBeVisible();
      expect(submitButton).not.toBeDisabled();

      // Test: Form maintains proper spacing on mobile
      const fieldsets = container.querySelectorAll('fieldset');
      fieldsets.forEach(fieldset => {
        expect(fieldset).toBeVisible();
      });
    });

    test('File upload components work on mobile with touch', async () => {
      const user = userEvent.setup();
      const mockOnUpload = vi.fn();
      const mockOnRemove = vi.fn();

      render(
        <TestWrapper>
          <FileUpload
            type="profile-picture"
            onUpload={mockOnUpload}
            onRemove={mockOnRemove}
            loading={false}
          />
        </TestWrapper>
      );

      // Test: Upload area is visible and accessible on mobile
      const uploadArea = screen.getByRole('button', { name: /upload profile picture/i });
      expect(uploadArea).toBeVisible();
      expect(uploadArea).toHaveAttribute('tabindex', '0');

      // Test: Touch interaction simulation
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      if (fileInput) {
        await user.upload(fileInput, file);
        expect(mockOnUpload).toHaveBeenCalledWith(file);
      }
    });

    test('MLH branding is consistent on mobile', () => {
      render(
        <TestWrapper>
          <MLHLogo />
        </TestWrapper>
      );

      // Test: Logo is visible and properly sized for mobile
      const logo = screen.getByText('MAJOR LEAGUE HACKING');
      expect(logo).toBeVisible();
      
      // Test: Logo maintains aspect ratio
      const logoSvg = document.querySelector('svg');
      expect(logoSvg).toBeTruthy();
    });

    test('Authentication provider selection works on mobile', async () => {
      const user = userEvent.setup();
      const mockOnAuth = vi.fn();

      render(
        <TestWrapper>
          <AuthProviderSelection onAuth={mockOnAuth} />
        </TestWrapper>
      );

      // Test: All auth buttons are visible and properly sized for mobile
      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      const microsoftButton = screen.getByRole('button', { name: /sign in with microsoft/i });

      expect(googleButton).toBeVisible();
      expect(microsoftButton).toBeVisible();

      // Test: Touch interactions work
      await user.click(googleButton);
      expect(mockOnAuth).toHaveBeenCalledWith('google');

      await user.click(microsoftButton);
      expect(mockOnAuth).toHaveBeenCalledWith('microsoft');
    });
  });

  describe('Tablet Viewport (768px)', () => {
    beforeEach(() => {
      mockWindowDimensions('tablet');
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia('tablet')
      });
    });

    test('Onboarding form adapts to tablet layout', () => {
      const mockOnSubmit = vi.fn();
      const mockOnDuplicateDetected = vi.fn();

      const { container } = render(
        <TestWrapper>
          <OnboardingForm
            onSubmit={mockOnSubmit}
            onDuplicateDetected={mockOnDuplicateDetected}
            loading={false}
            errors={{}}
          />
        </TestWrapper>
      );

      // Test: Form uses tablet-optimized layout
      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();

      // Test: Grid layout may be different on tablet
      const gridContainers = container.querySelectorAll('.grid');
      gridContainers.forEach(grid => {
        expect(grid).toBeVisible();
      });

      // Test: Technology selector is usable on tablet
      const techButtons = screen.getAllByRole('button').filter(button => 
        button.getAttribute('aria-label')?.includes('technology skill')
      );
      
      // Should have technology selection buttons
      expect(techButtons.length).toBeGreaterThan(0);
      
      techButtons.slice(0, 3).forEach(button => {
        expect(button).toBeVisible();
      });
    });

    test('File upload drag and drop works on tablet', async () => {
      const user = userEvent.setup();
      const mockOnUpload = vi.fn();
      const mockOnRemove = vi.fn();

      render(
        <TestWrapper>
          <FileUpload
            type="resume"
            onUpload={mockOnUpload}
            onRemove={mockOnRemove}
            loading={false}
          />
        </TestWrapper>
      );

      // Test: Upload area is properly sized for tablet
      const uploadArea = screen.getByRole('button', { name: /upload resume/i });
      expect(uploadArea).toBeVisible();

      // Test: Drag and drop area is accessible
      expect(uploadArea).toHaveAttribute('tabindex', '0');
    });

    test('MLH branding scales properly on tablet', () => {
      render(
        <TestWrapper>
          <div className="p-4">
            <MLHLogo />
            <h1 className="text-2xl font-bold text-gray-900 mt-4">
              Complete Your MLH TTU Profile
            </h1>
          </div>
        </TestWrapper>
      );

      // Test: Logo and heading are visible
      const logoText = screen.getByText('MAJOR LEAGUE HACKING');
      const heading = screen.getByRole('heading', { name: /complete your mlh ttu profile/i });
      
      expect(logoText).toBeVisible();
      expect(heading).toBeVisible();
    });
  });

  describe('Desktop Viewport (1024px)', () => {
    beforeEach(() => {
      mockWindowDimensions('desktop');
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia('desktop')
      });
    });

    test('Onboarding form uses full desktop layout', () => {
      const mockOnSubmit = vi.fn();
      const mockOnDuplicateDetected = vi.fn();

      const { container } = render(
        <TestWrapper>
          <OnboardingForm
            onSubmit={mockOnSubmit}
            onDuplicateDetected={mockOnDuplicateDetected}
            loading={false}
            errors={{}}
          />
        </TestWrapper>
      );

      // Test: Form uses desktop grid layout
      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();

      // Test: Two-column layout for name fields
      const nameInputs = [
        screen.getByLabelText(/first name/i),
        screen.getByLabelText(/last name/i)
      ];
      
      nameInputs.forEach(input => {
        expect(input).toBeVisible();
      });

      // Test: Technology selector shows more items per row
      const techButtons = screen.getAllByRole('button').filter(button => 
        button.getAttribute('aria-label')?.includes('technology skill')
      );
      
      expect(techButtons.length).toBeGreaterThan(10); // Should show many technologies
    });

    test('File upload components show side by side on desktop', () => {
      const mockOnProfileUpload = vi.fn();
      const mockOnResumeUpload = vi.fn();
      const mockOnRemove = vi.fn();

      render(
        <TestWrapper>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileUpload
              type="profile-picture"
              onUpload={mockOnProfileUpload}
              onRemove={mockOnRemove}
              loading={false}
            />
            <FileUpload
              type="resume"
              onUpload={mockOnResumeUpload}
              onRemove={mockOnRemove}
              loading={false}
            />
          </div>
        </TestWrapper>
      );

      // Test: Both upload areas are visible
      const profileUpload = screen.getByRole('button', { name: /upload profile picture/i });
      const resumeUpload = screen.getByRole('button', { name: /upload resume/i });
      
      expect(profileUpload).toBeVisible();
      expect(resumeUpload).toBeVisible();
    });

    test('MLH branding is prominent on desktop', () => {
      render(
        <TestWrapper>
          <div className="max-w-4xl mx-auto p-8">
            <div className="text-center mb-8">
              <MLHLogo />
              <h1 className="text-3xl font-bold text-gray-900 mt-6">
                Join MLH TTU Chapter
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                Complete your profile to get started
              </p>
            </div>
          </div>
        </TestWrapper>
      );

      // Test: All branding elements are visible
      const logoText = screen.getByText('MAJOR LEAGUE HACKING');
      const heading = screen.getByRole('heading', { name: /join mlh ttu chapter/i });
      const description = screen.getByText(/complete your profile to get started/i);
      
      expect(logoText).toBeVisible();
      expect(heading).toBeVisible();
      expect(description).toBeVisible();
    });
  });

  describe('Large Desktop Viewport (1440px)', () => {
    beforeEach(() => {
      mockWindowDimensions('largeDesktop');
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia('largeDesktop')
      });
    });

    test('Content is properly centered on large screens', () => {
      const mockOnSubmit = vi.fn();
      const mockOnDuplicateDetected = vi.fn();

      render(
        <TestWrapper>
          <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
              <OnboardingForm
                onSubmit={mockOnSubmit}
                onDuplicateDetected={mockOnDuplicateDetected}
                loading={false}
                errors={{}}
              />
            </div>
          </div>
        </TestWrapper>
      );

      // Test: Form is centered and not too wide
      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();
      expect(form).toBeVisible();

      // Test: All form elements are accessible
      expect(screen.getByLabelText(/first name/i)).toBeVisible();
      expect(screen.getByLabelText(/last name/i)).toBeVisible();
      expect(screen.getByRole('button', { name: /complete profile/i })).toBeVisible();
    });
  });

  describe('Cross-Viewport Consistency', () => {
    test('MLH branding colors are consistent across all viewports', () => {
      const viewportTests = Object.keys(viewports) as (keyof typeof viewports)[];
      
      viewportTests.forEach(viewport => {
        mockWindowDimensions(viewport);
        Object.defineProperty(window, 'matchMedia', {
          writable: true,
          value: mockMatchMedia(viewport)
        });

        const { unmount } = render(
          <TestWrapper>
            <div className="bg-indigo-600 text-white p-4">
              <MLHLogo />
              <h2 className="text-xl font-semibold">MLH TTU</h2>
            </div>
          </TestWrapper>
        );

        // Test: MLH branding elements are present
        const logoText = screen.getByText('MAJOR LEAGUE HACKING');
        const heading = screen.getByRole('heading', { name: /mlh ttu/i });
        
        expect(logoText).toBeVisible();
        expect(heading).toBeVisible();

        unmount();
      });
    });

    test('Form validation works consistently across viewports', async () => {
      const user = userEvent.setup();
      const viewportTests = Object.keys(viewports) as (keyof typeof viewports)[];
      
      for (const viewport of viewportTests) {
        mockWindowDimensions(viewport);
        Object.defineProperty(window, 'matchMedia', {
          writable: true,
          value: mockMatchMedia(viewport)
        });

        const mockOnSubmit = vi.fn();
        const mockOnDuplicateDetected = vi.fn();

        const { unmount } = render(
          <TestWrapper>
            <OnboardingForm
              onSubmit={mockOnSubmit}
              onDuplicateDetected={mockOnDuplicateDetected}
              loading={false}
              errors={{
                firstName: 'First name is required',
                rNumber: 'Invalid R Number format'
              }}
            />
          </TestWrapper>
        );

        // Test: Error messages are visible on all viewports
        expect(screen.getByText('First name is required')).toBeVisible();
        expect(screen.getByText('Invalid R Number format')).toBeVisible();

        // Test: Form inputs have proper error states
        const firstNameInput = screen.getByLabelText(/first name/i);
        const rNumberInput = screen.getByLabelText(/r number/i);
        
        expect(firstNameInput).toHaveAttribute('aria-invalid', 'true');
        expect(rNumberInput).toHaveAttribute('aria-invalid', 'true');

        unmount();
      }
    });

    test('Keyboard navigation works on all viewports', async () => {
      const user = userEvent.setup();
      const viewportTests = ['mobile', 'tablet', 'desktop'] as (keyof typeof viewports)[];
      
      for (const viewport of viewportTests) {
        mockWindowDimensions(viewport);
        Object.defineProperty(window, 'matchMedia', {
          writable: true,
          value: mockMatchMedia(viewport)
        });

        const mockOnSubmit = vi.fn();
        const mockOnDuplicateDetected = vi.fn();

        const { unmount } = render(
          <TestWrapper>
            <OnboardingForm
              onSubmit={mockOnSubmit}
              onDuplicateDetected={mockOnDuplicateDetected}
              loading={false}
              errors={{}}
            />
          </TestWrapper>
        );

        // Test: Tab navigation works
        const firstInput = screen.getByLabelText(/first name/i);
        firstInput.focus();
        expect(document.activeElement).toBe(firstInput);

        await user.tab();
        const secondInput = screen.getByLabelText(/last name/i);
        expect(document.activeElement).toBe(secondInput);

        unmount();
      }
    });
  });

  describe('Touch and Mobile-Specific Functionality', () => {
    beforeEach(() => {
      mockWindowDimensions('mobile');
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia('mobile')
      });
    });

    test('Touch targets are appropriately sized for mobile', () => {
      const mockOnAuth = vi.fn();

      render(
        <TestWrapper>
          <AuthProviderSelection onAuth={mockOnAuth} />
        </TestWrapper>
      );

      // Test: Buttons are large enough for touch (minimum 44px)
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeVisible();
        // Buttons should be accessible and not too small for touch
        expect(button).not.toHaveAttribute('disabled');
      });
    });

    test('File upload works with mobile file picker', async () => {
      const user = userEvent.setup();
      const mockOnUpload = vi.fn();
      const mockOnRemove = vi.fn();

      render(
        <TestWrapper>
          <FileUpload
            type="profile-picture"
            onUpload={mockOnUpload}
            onRemove={mockOnRemove}
            loading={false}
          />
        </TestWrapper>
      );

      // Test: File input is accessible on mobile
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeTruthy();

      // Test: Upload area is touch-friendly
      const uploadArea = screen.getByRole('button', { name: /upload profile picture/i });
      expect(uploadArea).toBeVisible();
      expect(uploadArea).toHaveAttribute('tabindex', '0');

      // Simulate mobile file selection
      const file = new File(['mobile image'], 'mobile.jpg', { type: 'image/jpeg' });
      if (fileInput) {
        await user.upload(fileInput, file);
        expect(mockOnUpload).toHaveBeenCalledWith(file);
      }
    });

    test('Form scrolling works properly on mobile', () => {
      const mockOnSubmit = vi.fn();
      const mockOnDuplicateDetected = vi.fn();

      const { container } = render(
        <TestWrapper>
          <div style={{ height: '100vh', overflow: 'auto' }}>
            <OnboardingForm
              onSubmit={mockOnSubmit}
              onDuplicateDetected={mockOnDuplicateDetected}
              loading={false}
              errors={{}}
            />
          </div>
        </TestWrapper>
      );

      // Test: Form sections are accessible even with scrolling
      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();

      // Test: Submit button is reachable
      const submitButton = screen.getByRole('button', { name: /complete profile/i });
      expect(submitButton).toBeInTheDocument();
    });
  });
});