import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/auth';
import { createErrorResponse } from '@/lib/middleware/auth';
import { generateAttendanceCode } from '@/lib/services/event.service';

/**
 * POST /api/admin/events/[id]/generate-code
 * Generate attendance code for an event (admin only, after start time)
 * 
 * Response:
 * {
 *   success: true;
 *   data: {
 *     code: string;
 *   };
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
    
    // Generate attendance code (service will check if event has started)
    const code = await generateAttendanceCode(id);
    
    return NextResponse.json({
      success: true,
      data: {
        code,
      },
    });
  } catch (error: any) {
    console.error('Error generating attendance code:', error);
    
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
    
    if (error.message === 'Event not started') {
      return NextResponse.json(
        {
          error: {
            code: 'EVENT_NOT_STARTED',
            message: 'Cannot generate code before event start time',
          },
        },
        { status: 400 }
      );
    }
    
    if (error.message === 'Failed to generate unique code') {
      return NextResponse.json(
        {
          error: {
            code: 'CODE_GENERATION_FAILED',
            message: 'Failed to generate unique attendance code',
          },
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      {
        error: {
          code: 'GENERATE_CODE_ERROR',
          message: error.message || 'Failed to generate attendance code',
        },
      },
      { status: 500 }
    );
  }
}
