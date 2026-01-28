'use client';

import { useState } from 'react';
import { z } from 'zod';
import { checkTTUEmailExists } from '@/lib/services/userProfile.client';

// Validation schema for TTU email
const ttuEmailSchema = z.object({
  ttuEmail: z
    .string()
    .email('Invalid email format')
    .regex(/@ttu\.edu$/, 'Must be a valid TTU email address (@ttu.edu)'),
});

export type TTUEmailData = z.infer<typeof ttuEmailSchema>;

interface TTUEmailStepProps {
  data: Partial<TTUEmailData>;
  onNext: (data: TTUEmailData) => void;
  onBack: () => void;
}

export default function TTUEmailStep({ data, onNext, onBack }: TTUEmailStepProps) {
  const [formData, setFormData] = useState<Partial<TTUEmailData>>(data);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isChecking, setIsChecking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate format
      const validated = ttuEmailSchema.parse(formData);
      setErrors({});
      
      // Check for duplicate
      setIsChecking(true);
      const exists = await checkTTUEmailExists(validated.ttuEmail);
      
      if (exists) {
        setErrors({
          ttuEmail: 'This TTU email is already registered to another account.',
        });
        setIsChecking(false);
        return;
      }
      
      setIsChecking(false);
      onNext(validated);
    } catch (error) {
      setIsChecking(false);
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      } else {
        setErrors({
          ttuEmail: 'Failed to verify email. Please try again.',
        });
      }
    }
  };

  const handleChange = (value: string) => {
    setFormData({ ttuEmail: value });
    // Clear error
    if (errors.ttuEmail) {
      setErrors({});
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">TTU Email Verification</h2>
        <p className="text-gray-600">
          Enter your Texas Tech University email address to verify your account
        </p>
      </div>

      <div>
        <label htmlFor="ttuEmail" className="block text-sm font-medium text-gray-700 mb-1">
          TTU Email Address *
        </label>
        <input
          type="email"
          id="ttuEmail"
          placeholder="username@ttu.edu"
          value={formData.ttuEmail || ''}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isChecking}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
            errors.ttuEmail ? 'border-red-500' : 'border-gray-300'
          } ${isChecking ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
        {errors.ttuEmail && (
          <p className="mt-1 text-sm text-red-600">{errors.ttuEmail}</p>
        )}
        <p className="mt-2 text-sm text-gray-500">
          A verification code will be sent to this email address
        </p>
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
            <h3 className="text-sm font-medium text-blue-800">Important</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Each TTU email can only be used for one account</li>
                <li>You will have 3 attempts to enter the correct verification code</li>
                <li>The verification code expires in 10 minutes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isChecking}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={isChecking}
          className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isChecking ? (
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
              Checking...
            </>
          ) : (
            'Send Verification Code'
          )}
        </button>
      </div>
    </form>
  );
}
