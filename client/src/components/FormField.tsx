import React, { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  id: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  id,
  error,
  helpText,
  required = false,
  children,
  className = ''
}) => {
  const hasError = !!error;
  const helpId = helpText ? `${id}-help` : undefined;
  const errorId = hasError ? `${id}-error` : undefined;

  return (
    <div className={`space-y-1 ${className}`}>
      <label 
        htmlFor={id} 
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      
      <div className="relative">
        {React.cloneElement(children as React.ReactElement, {
          id,
          'aria-describedby': [helpId, errorId].filter(Boolean).join(' ') || undefined,
          'aria-invalid': hasError,
          'aria-required': required,
          className: `${(children as React.ReactElement).props.className || ''} ${
            hasError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
          }`.trim()
        })}
        
        {hasError && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg 
              className="h-5 w-5 text-red-500" 
              fill="currentColor" 
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path 
                fillRule="evenodd" 
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
        )}
      </div>

      {hasError && (
        <p 
          id={errorId}
          className="text-sm text-red-600"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}

      {helpText && !hasError && (
        <p 
          id={helpId}
          className="text-sm text-gray-500"
        >
          {helpText}
        </p>
      )}
    </div>
  );
};

export default FormField;