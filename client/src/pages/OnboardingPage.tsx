import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import OnboardingForm from '../components/onboarding/OnboardingForm';
import AccountLinkingModal from '../components/onboarding/AccountLinkingModal';
import { OnboardingFormData, User, DuplicateDetectionResponse } from '../types';
import { apiClient } from '../utils/api';

const OnboardingPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showLinkingModal, setShowLinkingModal] = useState(false);
  const [existingAccount, setExistingAccount] = useState<User | null>(null);
  const [linkingToken, setLinkingToken] = useState<string>('');
  const [linkingLoading, setLinkingLoading] = useState(false);
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (data: OnboardingFormData) => {
    try {
      setLoading(true);
      setErrors({});

      const response = await apiClient.user.onboard(data);
      
      if (response.data.success) {
        // Refresh user data to update onboarding status
        await refreshUser();
        // Redirect to profile page
        navigate('/profile');
      } else {
        // Check if this is a duplicate account error
        if (response.data.error?.includes('duplicate') || response.data.error?.includes('R Number')) {
          const duplicateData = response.data.data as DuplicateDetectionResponse;
          if (duplicateData?.isDuplicate && duplicateData.existingAccount) {
            handleDuplicateDetected(duplicateData.existingAccount, duplicateData.linkingToken);
            return;
          }
        }
        setErrors({ general: response.data.error || 'Onboarding failed' });
      }
    } catch (error: any) {
      if (error.response?.status === 409) {
        // Duplicate account detected
        const duplicateData = error.response.data.data as DuplicateDetectionResponse;
        if (duplicateData?.isDuplicate && duplicateData.existingAccount) {
          handleDuplicateDetected(duplicateData.existingAccount, duplicateData.linkingToken);
          return;
        }
      }
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: 'An unexpected error occurred' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateDetected = (account: User, token?: string) => {
    setExistingAccount(account);
    setLinkingToken(token || '');
    setShowLinkingModal(true);
  };

  const handleLinkAccount = async (method: 'password' | 'reset', password?: string) => {
    if (!existingAccount) return;

    try {
      setLinkingLoading(true);
      
      if (method === 'reset') {
        // Send password reset email
        await apiClient.user.resetForLinking(existingAccount.email);
        // Modal will show confirmation message
      } else if (method === 'password' && password) {
        // Link account with password
        const response = await apiClient.user.linkAccount(linkingToken, password);
        
        if (response.data.success) {
          // Account linked successfully
          await refreshUser();
          navigate('/profile');
        } else {
          setErrors({ general: response.data.error || 'Failed to link account' });
          setShowLinkingModal(false);
        }
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        setErrors({ general: 'Invalid password. Please try again or use the password reset option.' });
      } else {
        setErrors({ general: error.response?.data?.error || 'Failed to process account linking' });
      }
      setShowLinkingModal(false);
    } finally {
      setLinkingLoading(false);
    }
  };

  const handleCancelLinking = () => {
    setShowLinkingModal(false);
    setExistingAccount(null);
    setLinkingToken('');
    setErrors({ general: 'Account creation cancelled. Please contact support if you need help accessing your existing account.' });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img
            className="h-12 w-auto"
            src="/mlh-logo.png"
            alt="MLH Logo"
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Complete Your Profile
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Tell us about yourself to join the MLH TTU community
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <OnboardingForm
            onSubmit={handleSubmit}
            onDuplicateDetected={handleDuplicateDetected}
            loading={loading}
            errors={errors}
          />
        </div>
      </div>

      {/* Account Linking Modal */}
      {showLinkingModal && existingAccount && (
        <AccountLinkingModal
          existingAccount={existingAccount}
          onLinkAccount={handleLinkAccount}
          onCancel={handleCancelLinking}
          loading={linkingLoading}
        />
      )}
    </div>
  );
};

export default OnboardingPage;