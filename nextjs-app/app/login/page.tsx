'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ToastContainer';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants/errorMessages';

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Redirect authenticated users
  useEffect(() => {
    if (user && !loading) {
      // Temporarily disabled onboarding redirect for testing SSO
      // if (!user.hasCompletedOnboarding) {
      //   router.push('/onboarding');
      // } else {
      //   router.push('/profile');
      // }
      
      // For now, just redirect to profile page
      router.push('/profile');
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
      toast.showSuccess(SUCCESS_MESSAGES.SIGN_IN_SUCCESS);
    } catch (err: any) {
      const errorMessage = err.message || ERROR_MESSAGES.AUTH_FAILED;
      toast.showError(errorMessage, {
        onRetry: handleGoogleSignIn,
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't show login page if already authenticated
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 font-sans transition-colors duration-200 mt-5">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 py-4">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-center justify-between">
            {/* Left side - Logo/Brand */}
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <img 
                src="https://static.mlh.io/brand-assets/logo/official/mlh-logo-color.png?_gl=1*1c1b6mh*_ga*MTYxMTA5MjU0NC4xNzY4NjcxMDIw*_ga_E5KT6TC4TK*czE3NjkyODk3ODUkbzQkZzAkdDE3NjkyODk3ODgkajU3JGwwJGgw" 
                alt="MLH Logo" 
                className="h-7 w-auto"
              />
              <div className="h-8 w-px bg-gray-400"></div>
              <img 
                src="https://www.ttu.edu/traditions/images/DoubleT.gif" 
                alt="TTU Logo" 
                className="h-7 w-auto"
              />
            </Link>
            
            {/* Right side - Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full">
          {/* Card Container */}
          <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 md:p-12 transition-colors duration-200 ${
            !prefersReducedMotion ? 'animate-on-load animate-scale-in' : ''
          }`}>
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className={!prefersReducedMotion ? 'animate-on-load animate-logo animation-delay-200' : ''}>
                <img 
                  src="https://static.mlh.io/brand-assets/logo/official/mlh-logo-color.png?_gl=1*1c1b6mh*_ga*MTYxMTA5MjU0NC4xNzY4NjcxMDIw*_ga_E5KT6TC4TK*czE3NjkyODk3ODUkbzQkZzAkdDE3NjkyODk3ODgkajU3JGwwJGgw" 
                  alt="MLH Logo" 
                  className="h-12 w-auto"
                />
              </div>
            </div>

            {/* Header */}
            <div className={`text-center mb-8 ${
              !prefersReducedMotion ? 'animate-on-load animate-hero animation-delay-300' : ''
            }`}>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                Welcome Back
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-base">
                Sign in to access your MLH TTU account
              </p>
            </div>

            {/* Sign In Button */}
            <div className={`space-y-6 ${
              !prefersReducedMotion ? 'animate-on-load animate-fade-in animation-delay-400' : ''
            }`}>
              <button
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                className="group relative w-full flex justify-center items-center py-4 px-6 border-2 border-gray-300 dark:border-gray-600 text-base font-medium rounded-full text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg min-h-[56px]"
              >
                {isSigningIn ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700 dark:border-gray-200 mr-3"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 mr-3"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    New to MLH TTU?
                  </span>
                </div>
              </div>

              {/* Create Account Link */}
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  Don&apos;t have an account yet? Sign in with Google to get started!
                </p>
                <Link 
                  href="/"
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium text-sm transition-colors"
                >
                  ← Back to Home
                </Link>
              </div>

              {/* Terms */}
              <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
                By signing in, you agree to our{' '}
                <a href="#" className="text-red-600 dark:text-red-400 hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-red-600 dark:text-red-400 hover:underline">
                  Privacy Policy
                </a>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className={`mt-8 text-center ${
            !prefersReducedMotion ? 'animate-on-load animate-fade-in animation-delay-500' : ''
          }`}>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Need help? Contact us at{' '}
              <a 
                href="mailto:mlh@ttu.edu" 
                className="text-red-600 dark:text-red-400 hover:underline font-medium"
              >
                mlh@ttu.edu
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
