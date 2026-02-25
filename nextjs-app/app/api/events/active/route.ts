import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createErrorResponse } from '@/lib/middleware/auth';
import { getEvents } from '@/lib/services/event.service';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * GET /api/events/active
 * Check if there are any active events (events that have started but not ended)
 * 
 * Response:
 * {
 *   success: true;
 *   hasActiveEvents: boolean;
 * }
 */
export async function GET(request: NextRequest) {
  // Verify authentication
  const authResult = await requireAuth(request);
  
  if (!authResult.success) {
    return createErrorResponse(authResult);
  }

  try {
    // Get all events that are not completed or cancelled
    const events = await getEvents({ 
      status: ['upcoming', 'active'] as any 
    });
    
    // Filter for events that have started but not ended
    const now = Timestamp.now();
    const activeEvents = events.filter(event => {
      const startTime = event.startTime as Timestamp;
      const hasStarted = now.toMillis() >= startTime.toMillis();
      const isNotCompleted = event.status !== 'completed' && event.status !== 'cancelled';
      
      return hasStarted && isNotCompleted;
    });
    
    return NextResponse.json({
      success: true,
      hasActiveEvents: activeEvents.length > 0,
    });
  } catch (error: any) {
    console.error('Error checking active events:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'CHECK_ACTIVE_EVENTS_ERROR',
          message: error.message || 'Failed to check active events',
        },
      },
      { status: 500 }
    );
  }
}
