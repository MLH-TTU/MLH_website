import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { createErrorResponse } from '@/lib/middleware/auth';
import { getEvents } from '@/lib/services/event.service';
import type { EventFilter } from '@/lib/types';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * GET /api/events
 * Get events filtered by user role
 * 
 * Query parameters:
 * - status: EventStatus | EventStatus[] (optional)
 * - startAfter: ISO date string (optional)
 * - startBefore: ISO date string (optional)
 * - ongoing: boolean (optional) - filter for ongoing events only
 * 
 * Response:
 * {
 *   success: true;
 *   data: Event[];
 * }
 */
export async function GET(request: NextRequest) {
  // Verify authentication
  const authResult = await requireAuth(request);
  
  if (!authResult.success) {
    return createErrorResponse(authResult);
  }
  
  try {
    const { searchParams } = new URL(request.url);
    
    // Build filter
    const filter: EventFilter = {};
    
    // Status filter
    const statusParam = searchParams.get('status');
    if (statusParam) {
      // Support comma-separated statuses
      const statuses = statusParam.split(',');
      filter.status = statuses.length === 1 ? statuses[0] as any : statuses as any;
    }
    
    // Date filters
    const startAfter = searchParams.get('startAfter');
    if (startAfter) {
      const date = new Date(startAfter);
      if (!isNaN(date.getTime())) {
        filter.startAfter = date;
      }
    }
    
    const startBefore = searchParams.get('startBefore');
    if (startBefore) {
      const date = new Date(startBefore);
      if (!isNaN(date.getTime())) {
        filter.startBefore = date;
      }
    }
    
    // Get events
    let events = await getEvents(filter);
    
    // Filter for ongoing events if requested
    const ongoingParam = searchParams.get('ongoing');
    if (ongoingParam === 'true') {
      const now = Timestamp.now();
      events = events.filter(event => {
        const startTime = event.startTime as Timestamp;
        // Event is ongoing if it has started and status is 'active'
        return now.toMillis() >= startTime.toMillis() && event.status === 'active';
      });
    }
    
    // If user is not admin, filter to show only active events (status = 'active')
    if (!authResult.user?.isAdmin) {
      events = events.filter(event => event.status === 'active');
    }
    
    // Convert Timestamps to ISO strings for JSON serialization
    const serializedEvents = events.map(event => ({
      ...event,
      startTime: event.startTime.toDate().toISOString(),
      endTime: event.endTime ? event.endTime.toDate().toISOString() : null,
      createdAt: event.createdAt.toDate().toISOString(),
      updatedAt: event.updatedAt.toDate().toISOString(),
    }));
    
    return NextResponse.json({
      success: true,
      data: serializedEvents,
    });
  } catch (error: any) {
    console.error('Error getting events:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'GET_EVENTS_ERROR',
          message: error.message || 'Failed to get events',
        },
      },
      { status: 500 }
    );
  }
}
