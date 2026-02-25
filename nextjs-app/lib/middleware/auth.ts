import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '../firebase/admin';
import { getUser } from '../services/user.service';

/**
 * Authentication and Authorization Middleware
 * 
 * Provides middleware functions for:
 * - Verifying Firebase Auth tokens
 * - Checking admin role
 * - Checking onboarding status
 */

// ============================================================================
// Types
// ============================================================================

export interface AuthenticatedRequest extends NextRequest {
  userId?: string;
  user?: {
    uid: string;
    email: string;
    isAdmin: boolean;
    ttuVerified: boolean;
  };
}

export interface AuthMiddlewareResult {
  success: boolean;
  userId?: string;
  user?: {
    uid: string;
    email: string;
    isAdmin: boolean;
    ttuVerified: boolean;
  };
  error?: {
    code: string;
    message: string;
    status: number;
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract Firebase ID token from request headers
 * Supports both Authorization header and custom X-Firebase-Token header
 */
function extractToken(request: NextRequest): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check custom X-Firebase-Token header
  const customHeader = request.headers.get('x-firebase-token');
  if (customHeader) {
    return customHeader;
  }
  
  return null;
}

// ============================================================================
// Middleware Functions
// ============================================================================

/**
 * Verify Firebase Auth token and extract user ID
 * 
 * @param request - Next.js request object
 * @returns AuthMiddlewareResult with userId or error
 */
export async function verifyAuth(
  request: NextRequest
): Promise<AuthMiddlewareResult> {
  try {
    const token = extractToken(request);
    
    if (!token) {
      return {
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Missing authentication token',
          status: 401,
        },
      };
    }
    
    // Verify token with Firebase Admin SDK
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(token);
    
    if (!decodedToken.uid) {
      return {
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token',
          status: 401,
        },
      };
    }
    
    return {
      success: true,
      userId: decodedToken.uid,
    };
  } catch (error: any) {
    console.error('Error verifying auth token:', error);
    
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/id-token-expired') {
      return {
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Authentication token has expired',
          status: 401,
        },
      };
    }
    
    if (error.code === 'auth/argument-error') {
      return {
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token format',
          status: 401,
        },
      };
    }
    
    return {
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
        status: 401,
      },
    };
  }
}

/**
 * Verify user is authenticated and load user data
 * 
 * @param request - Next.js request object
 * @returns AuthMiddlewareResult with user data or error
 */
export async function requireAuth(
  request: NextRequest
): Promise<AuthMiddlewareResult> {
  const authResult = await verifyAuth(request);
  
  if (!authResult.success || !authResult.userId) {
    return authResult;
  }
  
  try {
    // Load user data from Firestore
    const user = await getUser(authResult.userId);
    
    if (!user) {
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          status: 404,
        },
      };
    }
    
    return {
      success: true,
      userId: user.uid,
      user: {
        uid: user.uid,
        email: user.email,
        isAdmin: user.isAdmin,
        ttuVerified: user.ttuVerified,
      },
    };
  } catch (error) {
    console.error('Error loading user data:', error);
    return {
      success: false,
      error: {
        code: 'USER_LOAD_ERROR',
        message: 'Failed to load user data',
        status: 500,
      },
    };
  }
}

/**
 * Verify user is authenticated and has admin role
 * 
 * @param request - Next.js request object
 * @returns AuthMiddlewareResult with user data or error
 */
export async function requireAdmin(
  request: NextRequest
): Promise<AuthMiddlewareResult> {
  const authResult = await requireAuth(request);
  
  if (!authResult.success) {
    return authResult;
  }
  
  if (!authResult.user?.isAdmin) {
    return {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required',
        status: 403,
      },
    };
  }
  
  return authResult;
}

/**
 * Verify user is authenticated and has completed onboarding (TTU verified)
 * 
 * @param request - Next.js request object
 * @returns AuthMiddlewareResult with user data or error
 */
export async function requireOnboarded(
  request: NextRequest
): Promise<AuthMiddlewareResult> {
  const authResult = await requireAuth(request);
  
  if (!authResult.success) {
    return authResult;
  }
  
  if (!authResult.user?.ttuVerified) {
    return {
      success: false,
      error: {
        code: 'ONBOARDING_REQUIRED',
        message: 'TTU email verification required',
        status: 403,
      },
    };
  }
  
  return authResult;
}

// ============================================================================
// Response Helpers
// ============================================================================

/**
 * Create error response from AuthMiddlewareResult
 * 
 * @param result - AuthMiddlewareResult with error
 * @returns NextResponse with error details
 */
export function createErrorResponse(result: AuthMiddlewareResult): NextResponse {
  if (!result.error) {
    return NextResponse.json(
      {
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unknown error occurred',
        },
      },
      { status: 500 }
    );
  }
  
  return NextResponse.json(
    {
      error: {
        code: result.error.code,
        message: result.error.message,
      },
    },
    { status: result.error.status }
  );
}

/**
 * Wrapper function to apply authentication middleware to a route handler
 * 
 * @param handler - Route handler function
 * @param authCheck - Authentication check function (requireAuth, requireAdmin, requireOnboarded)
 * @returns Wrapped route handler with authentication
 */
export function withAuth(
  handler: (request: NextRequest, context: { userId: string; user: any }) => Promise<NextResponse>,
  authCheck: (request: NextRequest) => Promise<AuthMiddlewareResult> = requireAuth
) {
  return async (request: NextRequest, routeContext?: any) => {
    const authResult = await authCheck(request);
    
    if (!authResult.success) {
      return createErrorResponse(authResult);
    }
    
    // Call the handler with authenticated context
    return handler(request, {
      userId: authResult.userId!,
      user: authResult.user!,
    });
  };
}
