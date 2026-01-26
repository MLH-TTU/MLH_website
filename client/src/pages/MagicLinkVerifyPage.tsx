import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const MagicLinkVerifyPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const verifyMagicLink = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setErrorMessage('Invalid or missing verification token');
        return;
      }

      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        const response = await fetch(`${baseUrl}/auth/magic-link/verify?token=${token}`, {
          method: 'GET',
          credentials: 'include',
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus('success');
          
          // Refresh user data
          await refreshUser();
          
          // Redirect after a short delay
          setTimeout(() => {
            if (data.data?.hasCompletedOnboarding) {
              navigate('/profile', { replace: true });
            } else {
              navigate('/onboarding', { replace: true });
            }
          }, 2000);
          
        } else {
          setStatus('error');
          setErrorMessage(data.error || 'Verification failed');
        }
      } catch (error) {
        setStatus('error');
        setErrorMessage('Network error occurred during verification');
      }
    };

    verifyMagicLink();
  }, [searchParams, navigate, refreshUser]);

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="animate-spin w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verifying Your Account
            </h2>
            
            <p className="text-gray-600">
              Please wait while we verify your magic link...
            </p>
          </>
        );

      case 'success':
        return (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to MLH TTU!
            </h2>
            
            <p className="text-gray-600 mb-4">
              Your account has been verified successfully. Redirecting you now...
            </p>
            
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Redirecting...
            </div>
          </>
        );

      case 'error':
        return (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verification Failed
            </h2>
            
            <p className="text-gray-600 mb-6">
              {errorMessage || 'The magic link is invalid or has expired.'}
            </p>
            
            <button
              onClick={() => navigate('/login')}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Back to Sign In
            </button>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* MLH Logo */}
        <div className="text-center mb-8">
          <img 
            src="https://static.mlh.io/brand-assets/logo/official/mlh-logo-color.png" 
            alt="MLH Logo" 
            className="h-12 w-auto mx-auto mb-4"
          />
          <div className="w-px h-8 bg-gray-400 mx-auto mb-4"></div>
          <img 
            src="https://www.ttu.edu/traditions/images/DoubleT.gif" 
            alt="TTU Logo" 
            className="h-10 w-auto mx-auto"
          />
        </div>

        {/* Verification Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default MagicLinkVerifyPage;