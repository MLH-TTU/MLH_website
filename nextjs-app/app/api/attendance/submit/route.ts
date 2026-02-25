import { NextRequest, NextResponse } from 'next/server';
import { requireOnboarded } from '@/lib/middleware/auth';
import { createErrorResponse } from '@/lib/middleware/auth';
import { submitAttendance } from '@/lib/services/attendance.service';

/**
 * POST /api/attendance/submit
 * Submit attendance code (onboarded users only)
 * 
 * Request body:
 * {
 *   code: string; // 6-digit attendance code
 * }
 * 
 * Response:
 * {
 *   success: true;
 *   message: string;
 *   pointsEarned?: number;
 *   eventName?: string;
 * }
 * 
 * Or error:
 * {
 *   error: {
 *     code: string;
 *     message: string;
 *   };
 * }
 */
export async function POST(request: NextRequest) {
  // Verify user is onboarded (TTU verified)
  const authResult = await requireOnboarded(request);
  
  if (!authResult.success) {
    return createErrorResponse(authResult);
  }
  
  try {
    const body = await request.json();
    
    // Validate code field
    if (!body.code) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required field: code',
          },
        },
        { status: 400 }
      );
    }
    
    // Validate code format (6-digit numeric)
    if (!/^\d{6}$/.test(body.code)) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid code format. Code must be 6 digits.',
          },
        },
        { status: 400 }
      );
    }
    
    // Submit attendance
    const result = await submitAttendance(authResult.userId!, body.code);
    
    if (!result.success) {
      // Return specific error from service
      return NextResponse.json(
        {
          error: {
            code: 'ATTENDANCE_ERROR',
            message: result.message,
          },
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: result.message,
      pointsEarned: result.pointsEarned,
      eventName: result.eventName,
    });
  } catch (error: any) {
    console.error('Error submitting attendance:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'SUBMIT_ATTENDANCE_ERROR',
          message: error.message || 'Failed to submit attendance',
        },
      },
      { status: 500 }
    );
  }
}
