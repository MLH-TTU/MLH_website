/**
 * Integrated Flow Hook
 * 
 * Provides a unified interface for managing complete user flows
 * including authentication, onboarding, and profile management.
 */

import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';

export interface OnboardingData {
  firstName: string;
  lastName: string;
  major: string;
  rNumber: string;
  universityLevel: string;
  aspiredPosition: string;
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  technologySkills: string[];
  profilePicture?: File;
  resume?: File;
}

export interface DuplicateAccountData {
  existingUser: User;
  linkingToken: string;
  message: string;
}

export interface IntegratedFlowState {
  loading: boolean;
  error: string | null;
  success: boolean;
  duplicateAccount: DuplicateAccountData | null;
}

export interface IntegratedFlowActions {
  submitOnboarding: (data: OnboardingData) => Promise<void>;
  handleAccountLinking: (method: 'password' | 'reset', password?: string) => Promise<void>;
  updateProfile: (data: Partial<OnboardingData>) => Promise<void>;
  clearError: () => void;
  clearDuplicateAccount: () => void;
}

export const useIntegratedFlow = (): IntegratedFlowState & IntegratedFlowActions => {
  const { refreshUser } = useAuth();
  const [state, setState] = useState<IntegratedFlowState>({
    loading: false,
    error: null,
    success: false,
    duplicateAccount: null
  });

  const updateState = useCallback((updates: Partial<IntegratedFlowState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const clearDuplicateAccount = useCallback(() => {
    updateState({ duplicateAccount: null });
  }, [updateState]);

  const submitOnboarding = useCallback(async (data: OnboardingData) => {
    try {
      updateState({ loading: true, error: null, success: false });

      // Create FormData for file uploads
      const formData = new FormData();
      
      // Add text fields
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'profilePicture' || key === 'resume') {
          if (value instanceof File) {
            formData.append(key, value);
          }
        } else if (key === 'technologySkills') {
          formData.append(key, JSON.stringify(value));
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const response = await fetch(`${baseUrl}/api/user/onboard`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error === 'DUPLICATE_R_NUMBER') {
          updateState({
            loading: false,
            duplicateAccount: result.data,
            error: null
          });
          return;
        }
        throw new Error(result.error || 'Onboarding failed');
      }

      // Refresh user data and redirect
      await refreshUser();
      updateState({ loading: false, success: true });
      
      // Redirect to profile page
      window.location.href = '/profile';
      
    } catch (error) {
      console.error('Onboarding error:', error);
      updateState({
        loading: false,
        error: error instanceof Error ? error.message : 'Onboarding failed'
      });
    }
  }, [refreshUser, updateState]);

  const handleAccountLinking = useCallback(async (method: 'password' | 'reset', password?: string) => {
    if (!state.duplicateAccount) {
      updateState({ error: 'No duplicate account data available' });
      return;
    }

    try {
      updateState({ loading: true, error: null });

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const response = await fetch(`${baseUrl}/api/integration/link-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          linkingToken: state.duplicateAccount.linkingToken,
          method,
          password
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Account linking failed');
      }

      if (method === 'reset') {
        updateState({
          loading: false,
          success: true,
          error: null
        });
        // Show success message for password reset
        alert('Password reset email sent. Please check your email.');
      } else {
        // Password method - refresh user and redirect
        await refreshUser();
        updateState({
          loading: false,
          success: true,
          duplicateAccount: null
        });
        window.location.href = '/profile';
      }

    } catch (error) {
      console.error('Account linking error:', error);
      updateState({
        loading: false,
        error: error instanceof Error ? error.message : 'Account linking failed'
      });
    }
  }, [state.duplicateAccount, refreshUser, updateState]);

  const updateProfile = useCallback(async (data: Partial<OnboardingData>) => {
    try {
      updateState({ loading: true, error: null, success: false });

      // Create FormData for file uploads
      const formData = new FormData();
      
      // Add text fields
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'profilePicture' || key === 'resume') {
          if (value instanceof File) {
            formData.append(key, value);
          }
        } else if (key === 'technologySkills') {
          formData.append(key, JSON.stringify(value));
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const response = await fetch(`${baseUrl}/api/integration/profile`, {
        method: 'PUT',
        credentials: 'include',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Profile update failed');
      }

      // Refresh user data
      await refreshUser();
      updateState({ loading: false, success: true });

    } catch (error) {
      console.error('Profile update error:', error);
      updateState({
        loading: false,
        error: error instanceof Error ? error.message : 'Profile update failed'
      });
    }
  }, [refreshUser, updateState]);

  return {
    ...state,
    submitOnboarding,
    handleAccountLinking,
    updateProfile,
    clearError,
    clearDuplicateAccount
  };
};