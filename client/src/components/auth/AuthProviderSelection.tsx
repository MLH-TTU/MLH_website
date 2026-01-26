import React, { useState } from 'react';
import AuthProviderButton from './AuthProviderButton';
import MagicLinkForm from './MagicLinkForm';

interface AuthProviderSelectionProps {
  onAuth: (provider: string, email?: string) => void;
  loading?: boolean;
  error?: string;
}

const AuthProviderSelection: React.FC<AuthProviderSelectionProps> = ({
  onAuth,
  loading = false,
  error
}) => {
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [magicLinkError, setMagicLinkError] = useState<string | undefined>();

  const handleProviderAuth = (provider: string) => {
    if (provider === 'email') {
      setShowMagicLink(true);
      setMagicLinkError(undefined);
    } else {
      onAuth(provider);
    }
  };

  const handleMagicLinkSubmit = (email: string) => {
    setMagicLinkError(undefined);
    onAuth('email', email);
  };

  const handleBackToProviders = () => {
    setShowMagicLink(false);
    setMagicLinkError(undefined);
  };

  // Set magic link error when general error is provided and we're showing magic link form
  React.useEffect(() => {
    if (error && showMagicLink) {
      setMagicLinkError(error);
    }
  }, [error, showMagicLink]);

  return (
    <div className="w-full max-w-md mx-auto">
      {!showMagicLink ? (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to MLH TTU
            </h2>
            <p className="text-gray-600">
              Choose your preferred sign-in method
            </p>
          </div>

          {error && (
            <div 
              className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg"
              role="alert"
              aria-live="polite"
            >
              <p className="text-sm text-red-600 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                {error}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <AuthProviderButton
              provider="google"
              onAuth={handleProviderAuth}
              disabled={loading}
            />
            <AuthProviderButton
              provider="microsoft"
              onAuth={handleProviderAuth}
              disabled={loading}
            />
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <AuthProviderButton
              provider="email"
              onAuth={handleProviderAuth}
              disabled={loading}
            />
          </div>

          <p className="text-xs text-gray-500 text-center mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={handleBackToProviders}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              disabled={loading}
              aria-label="Go back to provider selection"
            >
              <svg 
                className="w-5 h-5 text-gray-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Sign in with Email
              </h2>
              <p className="text-sm text-gray-600">
                We'll send you a magic link
              </p>
            </div>
          </div>

          <MagicLinkForm
            onSubmit={handleMagicLinkSubmit}
            loading={loading}
            error={magicLinkError}
          />
        </div>
      )}
    </div>
  );
};

export default AuthProviderSelection;