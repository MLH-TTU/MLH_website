import React, { useState } from 'react';
import { User } from '../../types';

interface AccountLinkingModalProps {
  existingAccount: User;
  onLinkAccount: (method: 'password' | 'reset', password?: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

interface PasswordLinkingFormProps {
  onSubmit: (password: string) => void;
  error?: string;
  loading?: boolean;
}

const PasswordLinkingForm: React.FC<PasswordLinkingFormProps> = ({
  onSubmit,
  error,
  loading = false,
}) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      onSubmit(password);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Enter your password"
          required
          disabled={loading}
          aria-describedby={error ? "password-error" : undefined}
          aria-invalid={!!error}
        />
        {error && (
          <p 
            id="password-error"
            className="mt-1 text-sm text-red-600"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
      
      <button
        type="submit"
        disabled={loading || !password.trim()}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Linking Account...
          </>
        ) : (
          'Link Account'
        )}
      </button>
    </form>
  );
};

const AccountLinkingModal: React.FC<AccountLinkingModalProps> = ({
  existingAccount,
  onLinkAccount,
  onCancel,
  loading = false,
}) => {
  const [step, setStep] = useState<'warning' | 'password' | 'reset'>('warning');
  const [passwordError, setPasswordError] = useState<string>('');

  const handlePasswordSubmit = (password: string) => {
    setPasswordError('');
    onLinkAccount('password', password);
  };

  const handleForgotPassword = () => {
    setStep('reset');
    onLinkAccount('reset');
  };

  const handleBackToWarning = () => {
    setStep('warning');
    setPasswordError('');
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto" 
      aria-labelledby="modal-title" 
      role="dialog" 
      aria-modal="true"
    >
      {/* Background overlay */}
      <div 
        className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
      >
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          aria-hidden="true"
          onClick={onCancel}
        ></div>

        {/* Center modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          {/* Warning icon */}
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
              <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>

            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              {step === 'warning' && (
                <>
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Account Already Exists
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      You already have an account with this R Number ({existingAccount.rNumber}). 
                      Do you want to use your existing account?
                    </p>
                    {existingAccount.email && (
                      <p className="text-sm text-gray-600 mt-2">
                        <strong>Existing account email:</strong> {existingAccount.email}
                      </p>
                    )}
                  </div>
                </>
              )}

              {step === 'password' && (
                <>
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Enter Your Password
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-4">
                      Please enter the password for your existing account ({existingAccount.email}) to link it with your current login method.
                    </p>
                    <PasswordLinkingForm
                      onSubmit={handlePasswordSubmit}
                      error={passwordError}
                      loading={loading}
                    />
                  </div>
                </>
              )}

              {step === 'reset' && (
                <>
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Password Reset Sent
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      A password reset link has been sent to {existingAccount.email}. 
                      Please check your email and follow the instructions to reset your password.
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      After resetting your password, you can try linking your accounts again.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            {step === 'warning' && (
              <>
                <button
                  type="button"
                  onClick={() => setStep('password')}
                  disabled={loading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  I want to enter my password
                </button>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  I forgot my password
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={loading}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </>
            )}

            {step === 'password' && (
              <>
                <button
                  type="button"
                  onClick={handleBackToWarning}
                  disabled={loading}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={loading}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </>
            )}

            {step === 'reset' && (
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountLinkingModal;