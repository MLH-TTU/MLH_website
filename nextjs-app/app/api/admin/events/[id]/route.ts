import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/auth';
import { createErrorResponse } from '@/lib/middleware/auth';
import { updateEvent, deleteEvent, getEvent } from '@/lib/services/event.service';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * PUT /api/admin/events/[id]
 * Update an event (admin only, before start time)
 * 
 * Request body:
 * {
 *   name?: string;
 *   description?: string;
 *   startTime?: string (ISO date);
 *   endTime?: string (ISO date);
 *   location?: string;
 *   pointsValue?: number;
 * }
 * 
 * Response:
 * {
 *   success: true;
 * }
 */
export async function PUT(
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
    
    // Prepare updates
    const updates: any = {};
    
    if (body.name !== undefined) {
      updates.name = body.name;
    }
    
    if (body.description !== undefined) {
      updates.description = body.description;
    }
    
    if (body.location !== undefined) {
      updates.location = body.location;
    }
    
    if (body.pointsValue !== undefined) {
      if (typeof body.pointsValue !== 'number' || body.pointsValue < 0) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid pointsValue: must be a non-negative number',
            },
          },
          { status: 400 }
        );
      }
      updates.pointsValue = body.pointsValue;
    }
    
    if (body.startTime !== undefined) {
      const startTime = new Date(body.startTime);
      if (isNaN(startTime.getTime())) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid date format for startTime',
            },
          },
          { status: 400 }
        );
      }
      updates.startTime = Timestamp.fromDate(startTime);
    }
    
    if (body.endTime !== undefined) {
      const endTime = new Date(body.endTime);
      if (isNaN(endTime.getTime())) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid date format for endTime',
            },
          },
          { status: 400 }
        );
      }
      updates.endTime = Timestamp.fromDate(endTime);
    }
    
    // Update event (service will check if event has started)
    await updateEvent(id, updates);
    
    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Error updating event:', error);
    
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
    
    if (error.message === 'Cannot edit started event') {
      return NextResponse.json(
        {
          error: {
            code: 'EVENT_STARTED',
            message: 'Cannot edit event after start time',
          },
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        error: {
          code: 'UPDATE_EVENT_ERROR',
          message: error.message || 'Failed to update event',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/events/[id]
 * Delete an event (admin only)
 * 
 * Response:
 * {
 *   success: true;
 * }
 */
export async function DELETE(
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
    
    // Delete event
    await deleteEvent(id);
    
    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Error deleting event:', error);
    
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
    
    return NextResponse.json(
      {
        error: {
          code: 'DELETE_EVENT_ERROR',
          message: error.message || 'Failed to delete event',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/events/[id]
 * Get a single event (admin only)
 * 
 * Response:
 * {
 *   success: true;
 *   data: Event;
 * }
 */
export async function GET(
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
    
    // Get event
    const event = await getEvent(id);
    
    if (!event) {
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
    
    return NextResponse.json({
      success: true,
      data: event,
    });
  } catch (error: any) {
    console.error('Error getting event:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'GET_EVENT_ERROR',
          message: error.message || 'Failed to get event',
        },
      },
      { status: 500 }
    );
  }
}
