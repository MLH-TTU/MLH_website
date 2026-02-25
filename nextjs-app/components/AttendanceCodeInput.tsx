'use client';

import { useState, useRef, KeyboardEvent, ClipboardEvent } from 'react';
import { Button } from './ui/Button';

interface AttendanceCodeInputProps {
  eventId: string;
  onSubmit: (code: string) => Promise<void>;
  disabled: boolean;
}

/**
 * AttendanceCodeInput Component
 * 
 * Six-digit numeric input with validation for attendance code submission.
 * Features:
 * - Six individual input boxes for each digit
 * - Auto-focus on next input after entering a digit
 * - Paste support for full 6-digit codes
 * - Submit button with loading state
 * - Error message display
 */
export function AttendanceCodeInput({
  eventId,
  onSubmit,
  disabled,
}: AttendanceCodeInputProps) {
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Handle input change for a specific digit
  const handleChange = (index: number, value: string) => {
    // Only allow numeric input
    if (value && !/^\d$/.test(value)) {
      return;
    }
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError(null);
    
    // Auto-focus next input if value entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  
  // Handle backspace key
  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Move to previous input if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter') {
      // Submit on Enter key
      handleSubmit();
    }
  };
  
  // Handle paste event
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Check if pasted data is 6 digits
    if (/^\d{6}$/.test(pastedData)) {
      const newCode = pastedData.split('');
      setCode(newCode);
      setError(null);
      
      // Focus the last input
      inputRefs.current[5]?.focus();
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    const fullCode = code.join('');
    
    // Validate code is 6 digits
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }
    
    if (!/^\d{6}$/.test(fullCode)) {
      setError('Code must be 6 digits');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      await onSubmit(fullCode);
      setSuccess(true);
      setCode(['', '', '', '', '', '']);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit attendance code');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Enter Attendance Code
        </label>
        
        {/* Six-digit input boxes */}
        <div className="flex gap-2 mb-3">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              disabled={disabled || loading || success}
              className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label={`Digit ${index + 1}`}
            />
          ))}
        </div>
        
        {/* Submit button */}
        <Button
          onClick={handleSubmit}
          disabled={disabled || loading || success || code.join('').length !== 6}
          variant="default"
          className="w-full"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </span>
          ) : success ? (
            <span className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Submitted!
            </span>
          ) : (
            'Submit Code'
          )}
        </Button>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-800 dark:text-red-200">
            {error}
          </p>
        </div>
      )}
      
      {/* Success message */}
      {success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <p className="text-sm text-green-800 dark:text-green-200">
            Attendance recorded successfully!
          </p>
        </div>
      )}
    </div>
  );
}
