import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthProviderSelection } from '../components/auth';

const LoginPage: React.FC = () => {
  const { user, login, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authLoading, setAuthLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Get the intended destination from location state
  const from = location.state?.from?.pathname || '/';

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      if (!user.hasCompletedOnboarding) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [user, navigate, from]);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
    setMagicLinkSent(false);
  }, [clearError]);

  const handleAuth = async (provider: string, email?: string) => {
    try {
      setAuthLoading(true);
      clearError();
      
      await login(provider, email);
      
      // For magic link, show success message
      if (provider === 'email') {
        setMagicLinkSent(true);
      }
      
    } catch (error) {
      console.error('Authentication failed:', error);
      // Error is handled by AuthContext
    } finally {
      setAuthLoading(false);
    }
  };

  // Show magic link sent confirmation
  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Check Your Email
            </h2>
            
            <p className="text-gray-600 mb-6">
              We've sent you a magic link to sign in. Click the link in your email to continue.
            </p>
            
            <button
              onClick={() => {
                setMagicLinkSent(false);
                clearError();
              }}
              className="text-red-600 hover:text-red-700 font-medium transition-colors"
            >
              ← Back to sign in options
            </button>
          </div>
        </div>
      </div>
    );
  }

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

        {/* Authentication Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <AuthProviderSelection
            onAuth={handleAuth}
            loading={authLoading || loading}
            error={error || undefined}
          />
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          New to MLH TTU?{' '}
          <a href="/" className="text-red-600 hover:text-red-700 font-medium">
            Learn more about our chapter
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;