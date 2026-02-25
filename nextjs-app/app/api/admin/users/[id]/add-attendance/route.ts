import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/auth';
import { createErrorResponse } from '@/lib/middleware/auth';
import { addAttendee } from '@/lib/services/attendance.service';

/**
 * POST /api/admin/users/[id]/add-attendance
 * Manually add attendance to event (admin only)
 * 
 * Request body:
 * {
 *   eventId: string; // Event ID to add attendance for
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
    
    // Validate required fields
    if (!body.eventId || typeof body.eventId !== 'string') {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing or invalid field: eventId (must be a string)',
          },
        },
        { status: 400 }
      );
    }
    
    // Add attendee
    await addAttendee(body.eventId, id, authResult.userId!);
    
    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Error adding attendance:', error);
    
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
    
    if (error.message === 'User not found') {
      return NextResponse.json(
        {
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        },
        { status: 404 }
      );
    }
    
    if (error.message === 'User has already attended this event') {
      return NextResponse.json(
        {
          error: {
            code: 'ALREADY_ATTENDED',
            message: 'User has already attended this event',
          },
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        error: {
          code: 'ADD_ATTENDANCE_ERROR',
          message: error.message || 'Failed to add attendance',
        },
      },
      { status: 500 }
    );
  }
}
