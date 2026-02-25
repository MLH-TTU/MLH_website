import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createErrorResponse } from '@/lib/middleware/auth';
import { endEvent } from '@/lib/services/event.service';

/**
 * POST /api/admin/events/[id]/end
 * Manually end an event
 * 
 * Sets endTime to current time and marks event as completed
 * Requires admin authentication
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
    const { id: eventId } = await params;

    // End the event
    await endEvent(eventId);

    return NextResponse.json({
      success: true,
      message: 'Event ended successfully',
    });
  } catch (error: any) {
    console.error('Error ending event:', error);
    
    const statusCode = error.message === 'Event not found' ? 404 : 500;
    
    return NextResponse.json(
      { error: { message: error.message || 'Failed to end event' } },
      { status: statusCode }
    );
  }
}
