import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/auth';
import { createErrorResponse } from '@/lib/middleware/auth';
import { toggleAttendanceCode } from '@/lib/services/event.service';

/**
 * POST /api/admin/events/[id]/toggle-code
 * Toggle attendance code active status (admin only)
 * 
 * Request body:
 * {
 *   active: boolean;
 * }
 * 
 * Response:
 * {
 *   success: true;
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication
  const authResult = await requireAdmin(request);
  
  if (!authResult.success) {
    return createErrorResponse(authResult);
  }
  
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Validate active field
    if (typeof body.active !== 'boolean') {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing or invalid field: active (must be boolean)',
          },
        },
        { status: 400 }
      );
    }
    
    // Toggle attendance code
    await toggleAttendanceCode(id, body.active);
    
    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Error toggling attendance code:', error);
    
    // Handle specific errors
    if (error.message === 'Event not found') {
      return NextResponse.json(
        {
          error: {
            code: 'EVENT_NOT_FOUND',
            message: 'Event not found',
          },
        },
        { status: 404 }
      );
    }
    
    if (error.message === 'Event has no attendance code') {
      return NextResponse.json(
        {
          error: {
            code: 'NO_ATTENDANCE_CODE',
            message: 'Event has no attendance code to toggle',
          },
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        error: {
          code: 'TOGGLE_CODE_ERROR',
          message: error.message || 'Failed to toggle attendance code',
        },
      },
      { status: 500 }
    );
  }
}
