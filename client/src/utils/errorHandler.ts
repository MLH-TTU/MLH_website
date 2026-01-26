// Global error handling utilities

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, any>;
}

export class AppError extends Error {
  public readonly code?: string;
  public readonly status?: number;
  public readonly details?: Record<string, any>;

  constructor(message: string, code?: string, status?: number, details?: Record<string, any>) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const parseApiError = (error: any): ApiError => {
  // Handle different error formats
  if (error?.response?.data) {
    // Axios error format
    const { data, status } = error.response;
    return {
      message: data.message || data.error || 'An unexpected error occurred',
      code: data.code,
      status,
      details: data.details
    };
  }

  if (error?.message) {
    // Standard Error object
    return {
      message: error.message,
      code: error.code,
      status: error.status,
      details: error.details
    };
  }

  if (typeof error === 'string') {
    // String error
    return {
      message: error
    };
  }

  // Fallback for unknown error formats
  return {
    message: 'An unexpected error occurred',
    details: error
  };
};

export const getErrorMessage = (error: any): string => {
  const apiError = parseApiError(error);
  return apiError.message;
};

export const isNetworkError = (error: any): boolean => {
  return error?.code === 'NETWORK_ERROR' || 
         error?.message?.includes('Network Error') ||
         error?.message?.includes('fetch');
};

export const isAuthenticationError = (error: any): boolean => {
  const apiError = parseApiError(error);
  return apiError.status === 401 || 
         apiError.code === 'UNAUTHORIZED' ||
         apiError.message?.toLowerCase().includes('unauthorized');
};

export const isValidationError = (error: any): boolean => {
  const apiError = parseApiError(error);
  return apiError.status === 400 || 
         apiError.code === 'VALIDATION_ERROR' ||
         apiError.message?.toLowerCase().includes('validation');
};

export const getUserFriendlyErrorMessage = (error: any): string => {
  const apiError = parseApiError(error);

  if (isNetworkError(error)) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }

  if (isAuthenticationError(error)) {
    return 'Your session has expired. Please sign in again to continue.';
  }

  if (isValidationError(error)) {
    return apiError.message || 'Please check your input and try again.';
  }

  // Server errors (5xx)
  if (apiError.status && apiError.status >= 500) {
    return 'The server is experiencing issues. Please try again later.';
  }

  // Client errors (4xx)
  if (apiError.status && apiError.status >= 400 && apiError.status < 500) {
    return apiError.message || 'There was a problem with your request. Please try again.';
  }

  // Default fallback
  return apiError.message || 'An unexpected error occurred. Please try again.';
};

export const logError = (error: any, context?: string) => {
  const apiError = parseApiError(error);
  
  console.error('Application Error:', {
    context,
    message: apiError.message,
    code: apiError.code,
    status: apiError.status,
    details: apiError.details,
    timestamp: new Date().toISOString()
  });

  // In production, you might want to send this to an error tracking service
  // like Sentry, LogRocket, or Bugsnag
};