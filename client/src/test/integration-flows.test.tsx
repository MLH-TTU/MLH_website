/**
 * Frontend Integration Tests for Complete User Flows
 * Feature: mlh-ttu-backend-onboarding
 * 
 * Tests complete frontend user journeys and component interactions
 */

import { describe, test, beforeEach, afterEach, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Import components
import OnboardingForm from '../components/onboarding/OnboardingForm';
import AccountLinkingModal from '../components/onboarding/AccountLinkingModal';
import FileUpload from '../components/onboarding/FileUpload';
import AuthProviderSelection from '../components/auth/AuthProviderSelection';
import MagicLinkForm from '../components/auth/MagicLinkForm';
import { AuthProvider } from '../contexts/AuthContext';
import { UniversityLevel } from '../types';

// Mock user data
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

const mockExistingUser = {
  id: '2',
  email: 'existing@ttu.edu',
  rNumber: 'R87654321',
  firstName: 'Existing',
  lastName: 'User',
  hasCompletedOnboarding: true,
  provider: 'microsoft' as const,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock API responses
const mockApiResponses = {
  login: vi.fn(),
  logout: vi.fn(),
  onboard: vi.fn(),
  checkDuplicate: vi.fn(),
  linkAccount: vi.fn(),
  uploadFile: vi.fn()
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('Frontend Integration Tests: Complete User Flows', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    
    // Mock fetch for API calls
    global.fetch = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  test('Complete Authentication and Onboarding Flow', async () => {
    const user = userEvent.setup();
    
    // Step 1: Test authentication provider selection
    const mockOnAuth = vi.fn();
    
    const { rerender } = render(
      <TestWrapper>
        <AuthProviderSelection onAuth={mockOnAuth} />
      </TestWrapper>
    );

    // Test Google OAuth button
    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    expect(googleButton).toBeInTheDocument();
    
    await user.click(googleButton);
    expect(mockOnAuth).toHaveBeenCalledWith('google');

    // Test Microsoft OAuth button
    const microsoftButton = screen.getByRole('button', { name: /continue with microsoft/i });
    await user.click(microsoftButton);
    expect(mockOnAuth).toHaveBeenCalledWith('microsoft');

    // Step 2: Test magic link form
    const mockOnMagicLink = vi.fn();
    
    rerender(
      <TestWrapper>
        <MagicLinkForm onSubmit={mockOnMagicLink} />
      </TestWrapper>
    );

    const emailInput = screen.getByRole('textbox', { name: /email/i });
    const submitButton = screen.getByRole('button', { name: /send magic link/i });

    await user.type(emailInput, 'test@ttu.edu');
    await user.click(submitButton);

    expect(mockOnMagicLink).toHaveBeenCalledWith('test@ttu.edu');

    // Step 3: Test onboarding form completion
    const mockOnSubmit = vi.fn();
    const mockOnDuplicateDetected = vi.fn();

    rerender(
      <TestWrapper>
        <OnboardingForm
          onSubmit={mockOnSubmit}
          onDuplicateDetected={mockOnDuplicateDetected}
          loading={false}
          errors={{}}
        />
      </TestWrapper>
    );

    // Fill out required fields
    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);
    const majorInput = screen.getByLabelText(/major/i);
    const rNumberInput = screen.getByLabelText(/r number/i);
    const universityLevelSelect = screen.getByLabelText(/university level/i);
    const aspiredPositionInput = screen.getByLabelText(/aspired position/i);

    await user.type(firstNameInput, 'John');
    await user.type(lastNameInput, 'Doe');
    await user.type(majorInput, 'Computer Science');
    await user.type(rNumberInput, 'R12345678');
    await user.selectOptions(universityLevelSelect, UniversityLevel.JUNIOR);
    await user.type(aspiredPositionInput, 'Software Engineer');

    // Fill optional social media fields
    const githubInput = screen.getByLabelText(/github url/i);
    const linkedinInput = screen.getByLabelText(/linkedin url/i);
    
    await user.type(githubInput, 'https://github.com/johndoe');
    await user.type(linkedinInput, 'https://linkedin.com/in/johndoe');

    // Select technology skills
    const jsCheckbox = screen.getByRole('checkbox', { name: /javascript/i });
    const reactCheckbox = screen.getByRole('checkbox', { name: /react/i });
    
    await user.click(jsCheckbox);
    await user.click(reactCheckbox);

    // Submit form
    const onboardingSubmitButton = screen.getByRole('button', { name: /complete onboarding/i });
    await user.click(onboardingSubmitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'John',
        lastName: 'Doe',
        major: 'Computer Science',
        rNumber: 'R12345678',
        universityLevel: UniversityLevel.JUNIOR,
        aspiredPosition: 'Software Engineer',
        githubUrl: 'https://github.com/johndoe',
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        technologySkills: expect.arrayContaining(['javascript', 'react'])
      })
    );
  });

  test('Duplicate Account Detection and Linking Flow', async () => {
    const user = userEvent.setup();
    
    // Step 1: Simulate onboarding form submission that triggers duplicate detection
    const mockOnSubmit = vi.fn();
    const mockOnDuplicateDetected = vi.fn();

    const { rerender } = render(
      <TestWrapper>
        <OnboardingForm
          onSubmit={mockOnSubmit}
          onDuplicateDetected={mockOnDuplicateDetected}
          loading={false}
          errors={{}}
        />
      </TestWrapper>
    );

    // Fill form with existing R Number
    const rNumberInput = screen.getByLabelText(/r number/i);
    await user.type(rNumberInput, mockExistingUser.rNumber);

    // Fill other required fields
    const firstNameInput = screen.getByLabelText(/first name/i);
    await user.type(firstNameInput, 'New');
    
    const lastNameInput = screen.getByLabelText(/last name/i);
    await user.type(lastNameInput, 'User');
    
    const majorInput = screen.getByLabelText(/major/i);
    await user.type(majorInput, 'Engineering');
    
    const universityLevelSelect = screen.getByLabelText(/university level/i);
    await user.selectOptions(universityLevelSelect, UniversityLevel.SENIOR);
    
    const aspiredPositionInput = screen.getByLabelText(/aspired position/i);
    await user.type(aspiredPositionInput, 'Engineer');

    // Mock API response for duplicate detection
    mockOnSubmit.mockImplementation((data) => {
      if (data.rNumber === mockExistingUser.rNumber) {
        mockOnDuplicateDetected(mockExistingUser);
      }
    });

    const submitButton = screen.getByRole('button', { name: /complete onboarding/i });
    await user.click(submitButton);

    expect(mockOnDuplicateDetected).toHaveBeenCalledWith(mockExistingUser);

    // Step 2: Test account linking modal
    const mockOnLinkAccount = vi.fn();
    const mockOnCancel = vi.fn();

    rerender(
      <TestWrapper>
        <AccountLinkingModal
          existingAccount={mockExistingUser}
          onLinkAccount={mockOnLinkAccount}
          onCancel={mockOnCancel}
          loading={false}
        />
      </TestWrapper>
    );

    // Verify modal displays existing account info
    expect(screen.getByText(mockExistingUser.email)).toBeInTheDocument();
    expect(screen.getByText(mockExistingUser.rNumber)).toBeInTheDocument();

    // Test password linking option
    const passwordButton = screen.getByRole('button', { name: /enter password/i });
    await user.click(passwordButton);
    expect(mockOnLinkAccount).toHaveBeenCalledWith('password');

    // Test forgot password option
    const forgotPasswordButton = screen.getByRole('button', { name: /forgot password/i });
    await user.click(forgotPasswordButton);
    expect(mockOnLinkAccount).toHaveBeenCalledWith('reset');

    // Test cancel option
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    expect(mockOnCancel).toHaveBeenCalled();
  });

  test('File Upload Integration Flow', async () => {
    const user = userEvent.setup();
    
    // Step 1: Test profile picture upload
    const mockOnProfileUpload = vi.fn();
    const mockOnProfileRemove = vi.fn();

    const { rerender } = render(
      <TestWrapper>
        <FileUpload
          type="profile-picture"
          onUpload={mockOnProfileUpload}
          onRemove={mockOnProfileRemove}
          loading={false}
        />
      </TestWrapper>
    );

    // Create mock file
    const profilePictureFile = new File(['profile picture content'], 'profile.jpg', {
      type: 'image/jpeg'
    });

    // Test file input
    const fileInput = screen.getByLabelText(/upload profile picture/i);
    await user.upload(fileInput, profilePictureFile);

    expect(mockOnProfileUpload).toHaveBeenCalledWith(profilePictureFile);

    // Step 2: Test resume upload
    const mockOnResumeUpload = vi.fn();
    const mockOnResumeRemove = vi.fn();

    rerender(
      <TestWrapper>
        <FileUpload
          type="resume"
          onUpload={mockOnResumeUpload}
          onRemove={mockOnResumeRemove}
          loading={false}
        />
      </TestWrapper>
    );

    const resumeFile = new File(['resume content'], 'resume.pdf', {
      type: 'application/pdf'
    });

    const resumeInput = screen.getByLabelText(/upload resume/i);
    await user.upload(resumeInput, resumeFile);

    expect(mockOnResumeUpload).toHaveBeenCalledWith(resumeFile);

    // Step 3: Test file validation errors
    rerender(
      <TestWrapper>
        <FileUpload
          type="profile-picture"
          onUpload={mockOnProfileUpload}
          onRemove={mockOnProfileRemove}
          loading={false}
          error="File size too large. Please select a file smaller than 5MB."
        />
      </TestWrapper>
    );

    expect(screen.getByText(/file size too large/i)).toBeInTheDocument();

    // Step 4: Test file removal
    rerender(
      <TestWrapper>
        <FileUpload
          type="profile-picture"
          onUpload={mockOnProfileUpload}
          onRemove={mockOnProfileRemove}
          currentFile="profile.jpg"
          loading={false}
        />
      </TestWrapper>
    );

    const removeButton = screen.getByRole('button', { name: /remove/i });
    await user.click(removeButton);

    expect(mockOnProfileRemove).toHaveBeenCalled();
  });

  test('Form Validation and Error Handling Flow', async () => {
    const user = userEvent.setup();
    
    const mockOnSubmit = vi.fn();
    const mockOnDuplicateDetected = vi.fn();

    // Test with validation errors
    const validationErrors = {
      firstName: 'First name is required',
      rNumber: 'Invalid R Number format',
      githubUrl: 'Invalid GitHub URL format'
    };

    render(
      <TestWrapper>
        <OnboardingForm
          onSubmit={mockOnSubmit}
          onDuplicateDetected={mockOnDuplicateDetected}
          loading={false}
          errors={validationErrors}
        />
      </TestWrapper>
    );

    // Verify error messages are displayed
    expect(screen.getByText('First name is required')).toBeInTheDocument();
    expect(screen.getByText('Invalid R Number format')).toBeInTheDocument();
    expect(screen.getByText('Invalid GitHub URL format')).toBeInTheDocument();

    // Test that form fields have proper ARIA attributes for errors
    const firstNameInput = screen.getByLabelText(/first name/i);
    expect(firstNameInput).toHaveAttribute('aria-invalid', 'true');

    const rNumberInput = screen.getByLabelText(/r number/i);
    expect(rNumberInput).toHaveAttribute('aria-invalid', 'true');

    const githubInput = screen.getByLabelText(/github url/i);
    expect(githubInput).toHaveAttribute('aria-invalid', 'true');

    // Test form submission with errors
    const submitButton = screen.getByRole('button', { name: /complete onboarding/i });
    await user.click(submitButton);

    // Form should not submit with validation errors
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('Loading States and User Feedback Flow', async () => {
    const user = userEvent.setup();
    
    // Step 1: Test loading state during form submission
    const mockOnSubmit = vi.fn();
    const mockOnDuplicateDetected = vi.fn();

    const { rerender } = render(
      <TestWrapper>
        <OnboardingForm
          onSubmit={mockOnSubmit}
          onDuplicateDetected={mockOnDuplicateDetected}
          loading={true}
          errors={{}}
        />
      </TestWrapper>
    );

    // Verify submit button is disabled during loading
    const submitButton = screen.getByRole('button', { name: /completing/i });
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveAttribute('aria-disabled', 'true');

    // Step 2: Test loading state in file upload
    rerender(
      <TestWrapper>
        <FileUpload
          type="profile-picture"
          onUpload={vi.fn()}
          onRemove={vi.fn()}
          loading={true}
        />
      </TestWrapper>
    );

    // Verify loading indicator is shown
    expect(screen.getByText(/uploading/i)).toBeInTheDocument();

    // Step 3: Test loading state in account linking modal
    rerender(
      <TestWrapper>
        <AccountLinkingModal
          existingAccount={mockExistingUser}
          onLinkAccount={vi.fn()}
          onCancel={vi.fn()}
          loading={true}
        />
      </TestWrapper>
    );

    // Verify buttons are disabled during loading
    const linkButtons = screen.getAllByRole('button');
    linkButtons.forEach(button => {
      if (!button.textContent?.includes('Cancel')) {
        expect(button).toBeDisabled();
      }
    });
  });

  test('Accessibility Features Integration', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <OnboardingForm
          onSubmit={vi.fn()}
          onDuplicateDetected={vi.fn()}
          loading={false}
          errors={{}}
        />
      </TestWrapper>
    );

    // Test keyboard navigation
    const firstInput = screen.getByLabelText(/first name/i);
    firstInput.focus();
    expect(document.activeElement).toBe(firstInput);

    // Test tab navigation through form fields
    await user.tab();
    const lastNameInput = screen.getByLabelText(/last name/i);
    expect(document.activeElement).toBe(lastNameInput);

    // Test that all form controls have proper labels
    const formControls = screen.getAllByRole('textbox');
    formControls.forEach(control => {
      const id = control.getAttribute('id');
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        expect(label).toBeTruthy();
      }
    });

    // Test that required fields have aria-required
    const requiredFields = screen.getAllByRole('textbox', { required: true });
    requiredFields.forEach(field => {
      expect(field).toHaveAttribute('aria-required', 'true');
    });

    // Test select elements
    const selectElements = screen.getAllByRole('combobox');
    selectElements.forEach(select => {
      expect(select).toHaveAttribute('aria-required', 'true');
    });
  });

  test('Responsive Design Integration', async () => {
    // Mock window.matchMedia for responsive testing
    const mockMatchMedia = vi.fn();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia
    });

    // Test mobile viewport
    mockMatchMedia.mockImplementation((query: string) => ({
      matches: query.includes('max-width: 768px'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <TestWrapper>
        <OnboardingForm
          onSubmit={vi.fn()}
          onDuplicateDetected={vi.fn()}
          loading={false}
          errors={{}}
        />
      </TestWrapper>
    );

    // Verify form renders properly on mobile
    const form = screen.getByRole('form');
    expect(form).toBeInTheDocument();

    // Test that form maintains usability on mobile
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach(input => {
      expect(input).toBeVisible();
    });

    // Test tablet viewport
    mockMatchMedia.mockImplementation((query: string) => ({
      matches: query.includes('max-width: 1024px') && !query.includes('max-width: 768px'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    // Form should still be functional on tablet
    const submitButton = screen.getByRole('button', { name: /complete onboarding/i });
    expect(submitButton).toBeVisible();
    expect(submitButton).not.toBeDisabled();
  });
});