'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ToastContainer';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants/errorMessages';
import { updateUserProfile } from '@/lib/services/userProfile.client';
import { uploadProfilePicture, uploadResume } from '@/lib/services/fileUpload';
import ProfileInfoStep, { ProfileInfoData } from '@/components/onboarding/ProfileInfoStep';
import SocialLinksStep, { SocialLinksData } from '@/components/onboarding/SocialLinksStep';
import FileUploadsStep, { FileUploadsData } from '@/components/onboarding/FileUploadsStep';
import TTUEmailStep, { TTUEmailData } from '@/components/onboarding/TTUEmailStep';
import VerificationCodeStep, { VerificationCodeData } from '@/components/onboarding/VerificationCodeStep';

type OnboardingData = ProfileInfoData & SocialLinksData & FileUploadsData & TTUEmailData;

const STEPS = [
  'Profile Info',
  'Social Links',
  'File Uploads',
  'TTU Email',
  'Verification',
] as const;

export default function OnboardingPage() {
  const { user, refreshUser, signOut } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<OnboardingData>>({});
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  // Redirect if onboarding is already complete
  useEffect(() => {
    if (user && user.hasCompletedOnboarding) {
      router.push('/profile');
    }
  }, [user, router]);

  // Cleanup incomplete account when user leaves the page
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (!onboardingComplete && user && !user.hasCompletedOnboarding) {
        // Warn user they'll lose their account
        e.preventDefault();
        e.returnValue = 'If you leave now, your account will be deleted and you\'ll need to start over.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Cleanup on unmount only if navigating away from onboarding
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, onboardingComplete]);

  const cleanupIncompleteAccount = async () => {
    if (!user) return;

    try {
      await fetch('/api/cleanup-incomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid }),
        keepalive: true, // Ensure request completes even if page is closing
      });
      
      // Sign out the user
      await signOut();
    } catch (error) {
      console.error('Error cleaning up incomplete account:', error);
    }
  };

  const handleNext = (data: Partial<OnboardingData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setError(null);

    // If we're on the TTU Email step, send verification code
    if (currentStep === 3 && data.ttuEmail && user) {
      sendVerificationCode(data.ttuEmail);
    }

    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
    setError(null);
  };

  const sendVerificationCode = async (ttuEmail: string) => {
    try {
      const response = await fetch('/api/verification/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ttuEmail, uid: user?.uid }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send verification code');
      }

      toast.showSuccess(SUCCESS_MESSAGES.VERIFICATION_CODE_SENT);
    } catch (err: any) {
      setError(err.message);
      toast.showError(err.message || ERROR_MESSAGES.NETWORK_ERROR);
    }
  };

  const handleVerificationSubmit = async (data: VerificationCodeData) => {
    if (!user) return;

    try {
      const response = await fetch('/api/verification/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, code: data.code }),
      });

      const result = await response.json();

      if (response.ok && result.verified) {
        // Verification successful, proceed to final submission
        toast.showSuccess(SUCCESS_MESSAGES.EMAIL_VERIFIED);
        await handleFinalSubmit();
      } else {
        // Update remaining attempts
        if (result.remainingAttempts !== undefined) {
          setRemainingAttempts(result.remainingAttempts);
        }

        // If account was deleted, redirect to login
        if (result.accountDeleted) {
          if (user) {
            await refreshUser();
          }
          toast.showError(ERROR_MESSAGES.MAX_ATTEMPTS_EXCEEDED);
          router.push('/login?error=verification_failed');
          return;
        }

        throw new Error(result.error || ERROR_MESSAGES.VERIFICATION_CODE_INVALID);
      }
    } catch (err: any) {
      toast.showError(err.message || ERROR_MESSAGES.VERIFICATION_CODE_INVALID);
      throw err;
    }
  };

  const handleFinalSubmit = async () => {
    if (!user) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Upload files if provided
      let profilePictureId: string | undefined;
      let resumeId: string | undefined;

      if (formData.profilePicture) {
        try {
          const result = await uploadProfilePicture(formData.profilePicture, user.uid);
          profilePictureId = result.fileId;
          toast.showSuccess(SUCCESS_MESSAGES.FILE_UPLOADED);
        } catch (err: any) {
          toast.showError(ERROR_MESSAGES.FILE_UPLOAD_FAILED, {
            onRetry: handleFinalSubmit,
          });
          throw err;
        }
      }

      if (formData.resume) {
        try {
          const result = await uploadResume(formData.resume, user.uid);
          resumeId = result.fileId;
          toast.showSuccess(SUCCESS_MESSAGES.FILE_UPLOADED);
        } catch (err: any) {
          toast.showError(ERROR_MESSAGES.FILE_UPLOAD_FAILED, {
            onRetry: handleFinalSubmit,
          });
          throw err;
        }
      }

      // Update user profile with all collected data
      try {
        await updateUserProfile(user.uid, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          major: formData.major,
          universityLevel: formData.universityLevel,
          aspiredPosition: formData.aspiredPosition,
          githubUrl: formData.githubUrl || undefined,
          linkedinUrl: formData.linkedinUrl || undefined,
          twitterUrl: formData.twitterUrl || undefined,
          ttuEmail: formData.ttuEmail,
          profilePictureId,
          resumeId,
          hasCompletedOnboarding: true,
        });

        // Mark onboarding as complete to prevent cleanup
        setOnboardingComplete(true);

        // Refresh user data
        await refreshUser();

        toast.showSuccess(SUCCESS_MESSAGES.ONBOARDING_COMPLETE);

        // Redirect to profile page
        router.push('/profile');
      } catch (err: any) {
        toast.showError(ERROR_MESSAGES.PROFILE_UPDATE_FAILED, {
          onRetry: handleFinalSubmit,
        });
        throw err;
      }
    } catch (err: any) {
      console.error('Error submitting onboarding:', err);
      setError(err.message || 'Failed to complete onboarding. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (!user) {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 font-sans transition-colors duration-200">
      {/* Floating Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 py-3">
        <div className="mx-auto max-w-4xl">
          <div className="mx-auto w-fit rounded-full px-8 py-3 bg-white/10 dark:bg-gray-800/30 backdrop-blur-[20px] backdrop-saturate-[180%] border border-white/20 dark:border-gray-700/30 shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)]">
            <div className="flex items-center justify-between min-w-[300px] gap-6">
              <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                <img src="https://static.mlh.io/brand-assets/logo/official/mlh-logo-color.png" alt="MLH Logo" className="h-6 w-auto" />
                <div className="h-7 w-px bg-gray-400"></div>
                <img src="https://www.ttu.edu/traditions/images/DoubleT.gif" alt="TTU Logo" className="h-6 w-auto" />
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-32 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Welcome Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3 transition-colors duration-200">
            Welcome! Let's Get Started
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 transition-colors duration-200">
            Complete your profile to join the MLH TTU community
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    index <= currentStep
                      ? 'border-red-600 bg-red-600 text-white'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {index < currentStep ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-12 sm:w-20 h-1 mx-2 transition-colors ${
                      index < currentStep ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {STEPS.map((step, index) => (
              <div
                key={step}
                className={`text-xs sm:text-sm transition-colors ${
                  index === currentStep ? 'font-medium text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                }`}
                style={{ width: '80px', textAlign: 'center' }}
              >
                {step}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 sm:p-8 transition-colors duration-200">
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <div className="flex">
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="ml-3 text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {isSubmitting ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">Completing your profile...</p>
            </div>
          ) : (
            <>
              {currentStep === 0 && (
                <ProfileInfoStep
                  data={formData}
                  onNext={handleNext}
                />
              )}
              {currentStep === 1 && (
                <SocialLinksStep
                  data={formData}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}
              {currentStep === 2 && (
                <FileUploadsStep
                  data={formData}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}
              {currentStep === 3 && (
                <TTUEmailStep
                  data={formData}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}
              {currentStep === 4 && formData.ttuEmail && (
                <VerificationCodeStep
                  ttuEmail={formData.ttuEmail}
                  onNext={handleVerificationSubmit}
                  onBack={handleBack}
                  remainingAttempts={remainingAttempts}
                />
              )}
            </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

