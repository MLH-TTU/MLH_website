import React, { useState } from 'react';
import { MagicLinkFormProps } from '../../types';

const MagicLinkForm: React.FC<MagicLinkFormProps> = ({
  onSubmit,
  loading = false,
  error
}) => {
  const [email, setEmail] = useState('');
  const [isValidEmail, setIsValidEmail] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setIsValidEmail(validateEmail(newEmail));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidEmail && !loading) {
      onSubmit(email);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="Enter your email address"
          className={`
            w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
            transition-colors duration-200
            ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'}
          `}
          disabled={loading}
          required
          aria-describedby={error ? "email-error" : "email-help"}
          aria-invalid={!!error}
        />
        {error && (
          <p 
            id="email-error"
            className="mt-2 text-sm text-red-600 flex items-center gap-1"
            role="alert"
            aria-live="polite"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            {error}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={!isValidEmail || loading}
        className={`
          w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg
          font-medium transition-all duration-200
          ${isValidEmail && !loading
            ? 'bg-red-600 hover:bg-red-700 text-white hover:shadow-md'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
        `}
      >
        {loading ? (
          <>
            <svg 
              className="animate-spin w-4 h-4" 
              fill="none" 
              viewBox="0 0 24 24"
              aria-hidden="true"
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
            Sending Magic Link...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
            Send Magic Link
          </>
        )}
      </button>

      <p id="email-help" className="text-xs text-gray-500 text-center">
        We'll send you a secure link to sign in without a password
      </p>
    </form>
  );
};

export default MagicLinkForm;