/**
 * Enhanced Error Handling Middleware
 * 
 * Provides comprehensive error handling with user-friendly messages,
 * proper HTTP status codes, and detailed logging for debugging.
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export class AppError extends Error implements ApiError {
  public statusCode: number;
  public code?: string;
  public details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'AppError';
  }
}

/**
 * Create standardized error responses
 */
export const createErrorResponse = (
  error: string | Error | ApiError,
  statusCode: number = 500,
  details?: any
) => {
  const message = typeof error === 'string' ? error : error.message;
  
  return {
    success: false,
    error: message,
    code: (error as ApiError)?.code,
    details: details || (error as ApiError)?.details,
    timestamp: new Date().toISOString()
  };
};

/**
 * Handle Prisma database errors
 */
const handlePrismaError = (error: PrismaClientKnownRequestError): ApiError => {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const target = error.meta?.target as string[];
      const field = target?.[0] || 'field';
      return new AppError(
        `A record with this ${field} already exists`,
        409,
        'DUPLICATE_ENTRY',
        { field, constraint: target }
      );
    
    case 'P2025':
      // Record not found
      return new AppError(
        'The requested record was not found',
        404,
        'NOT_FOUND'
      );
    
    case 'P2003':
      // Foreign key constraint violation
      return new AppError(
        'Invalid reference to related record',
        400,
        'INVALID_REFERENCE',
        { field: error.meta?.field_name }
      );
    
    case 'P2014':
      // Required relation violation
      return new AppError(
        'Missing required relationship',
        400,
        'MISSING_RELATION'
      );
    
    default:
      return new AppError(
        'Database operation failed',
        500,
        'DATABASE_ERROR',
        { code: error.code }
      );
  }
};

/**
 * Handle validation errors
 */
const handleValidationError = (error: PrismaClientValidationError): ApiError => {
  return new AppError(
    'Invalid data provided',
    400,
    'VALIDATION_ERROR',
    { message: error.message }
  );
};

/**
 * Handle authentication errors
 */
export const handleAuthError = (message: string = 'Authentication required'): ApiError => {
  return new AppError(message, 401, 'AUTH_ERROR');
};

/**
 * Handle authorization errors
 */
export const handleAuthorizationError = (message: string = 'Insufficient permissions'): ApiError => {
  return new AppError(message, 403, 'AUTHORIZATION_ERROR');
};

/**
 * Handle file upload errors
 */
export const handleFileUploadError = (message: string, details?: any): ApiError => {
  return new AppError(message, 400, 'FILE_UPLOAD_ERROR', details);
};

/**
 * Handle rate limiting errors
 */
export const handleRateLimitError = (): ApiError => {
  return new AppError(
    'Too many requests. Please try again later.',
    429,
    'RATE_LIMIT_EXCEEDED'
  );
};

/**
 * Main error handling middleware
 */
export const errorHandler = (
  error: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let apiError: ApiError;

  // Handle different types of errors
  if (error instanceof PrismaClientKnownRequestError) {
    apiError = handlePrismaError(error);
  } else if (error instanceof PrismaClientValidationError) {
    apiError = handleValidationError(error);
  } else if (error instanceof AppError) {
    apiError = error;
  } else {
    // Generic error
    apiError = new AppError(
      process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message,
      500,
      'INTERNAL_ERROR'
    );
  }

  // Log error for debugging
  console.error('Error occurred:', {
    message: apiError.message,
    statusCode: apiError.statusCode,
    code: apiError.code,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Send error response
  res.status(apiError.statusCode || 500).json(
    createErrorResponse(apiError, apiError.statusCode)
  );
};

/**
 * Handle 404 errors
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json(
    createErrorResponse(
      `Route ${req.method} ${req.path} not found`,
      404,
      'NOT_FOUND'
    )
  );
};

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation error formatter
 */
export const formatValidationErrors = (errors: any[]): string => {
  return errors.map(error => error.message).join(', ');
};

/**
 * Success response helper
 */
export const createSuccessResponse = (data: any, message?: string) => {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
};