'use client';

import { useState } from 'react';

export interface VerificationCodeData {
  code: string;
}

interface VerificationCodeStepProps {
  ttuEmail: string;
  onNext: (data: VerificationCodeData) => Promise<void>;
  onBack: () => void;
  remainingAttempts: number;
}

export default function VerificationCodeStep({
  ttuEmail,
  onNext,
  onBack,
  remainingAttempts,
}: VerificationCodeStepProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      setError('Code must contain only numbers');
      return;
    }

    try {
      setIsVerifying(true);
      setError(null);
      await onNext({ code });
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCodeChange = (value: string) => {
    // Only allow numbers and limit to 6 digits
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setCode(numericValue);
    if (error) {
      setError(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Enter Verification Code</h2>
        <p className="text-gray-600 dark:text-gray-300">
          We've sent a 6-digit code to <span className="font-medium">{ttuEmail}</span>
        </p>
      </div>

      <div>
        <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          Verification Code *
        </label>
        <input
          type="text"
          id="code"
          inputMode="numeric"
          placeholder="000000"
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          disabled={isVerifying}
          className={`w-full px-3 py-2 border rounded-md text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-red-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${isVerifying ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          maxLength={6}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>

      {/* Remaining Attempts Warning */}
      <div className={`rounded-md p-4 ${
        remainingAttempts === 1 ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
      }`}>
        <div className="flex">
          <svg
            className={`h-5 w-5 mt-0.5 ${
              remainingAttempts === 1 ? 'text-red-400' : 'text-yellow-400'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div className="ml-3">
            <h3 className={`text-sm font-medium ${
              remainingAttempts === 1 ? 'text-red-800' : 'text-yellow-800'
            }`}>
              {remainingAttempts === 1 ? 'Last Attempt!' : 'Attempts Remaining'}
            </h3>
            <div className={`mt-2 text-sm ${
              remainingAttempts === 1 ? 'text-red-700' : 'text-yellow-700'
            }`}>
              <p>
                You have <span className="font-bold">{remainingAttempts}</span> attempt
                {remainingAttempts !== 1 ? 's' : ''} remaining.
                {remainingAttempts === 1 && (
                  <span className="block mt-1 font-medium">
                    If this attempt fails, your account will be deleted and you'll need to sign up again.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <svg
            className="h-5 w-5 text-blue-400 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Didn't receive the code?</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Check your spam/junk folder</li>
                <li>Make sure you entered the correct email address</li>
                <li>The code expires in 10 minutes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isVerifying}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={isVerifying || code.length !== 6}
          className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isVerifying ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
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
              Verifying...
            </>
          ) : (
            'Verify Code'
          )}
        </button>
      </div>
    </form>
  );
}
