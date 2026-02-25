import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/auth';
import { createErrorResponse } from '@/lib/middleware/auth';
import { createEvent } from '@/lib/services/event.service';
// import { sendCalendarInvitation } from '@/lib/services/calendar.service';
// import { getTTUVerifiedUsers } from '@/lib/services/user.service';
import type { CreateEventInput } from '@/lib/types';

/**
 * POST /api/admin/events
 * Create a new event (admin only)
 * 
 * Request body:
 * {
 *   name: string;
 *   description: string;
 *   startTime: string (ISO date);
 *   endTime: string (ISO date);
 *   location: string;
 *   pointsValue: number;
 * }
 * 
 * Response:
 * {
 *   success: true;
 *   data: Event;
 *   calendar?: CalendarResult;
 * }
 */
export async function POST(request: NextRequest) {
  // Verify admin authentication
  const authResult = await requireAdmin(request);
  
  if (!authResult.success) {
    return createErrorResponse(authResult);
  }
  
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.description || !body.location) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: name, description, location',
          },
        },
        { status: 400 }
      );
    }
    
    if (!body.startTime) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required field: startTime',
          },
        },
        { status: 400 }
      );
    }
    
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
    
    // Parse start date
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
    
    // Create event input
    const eventInput: CreateEventInput = {
      name: body.name,
      description: body.description,
      startTime,
      location: body.location,
      pointsValue: body.pointsValue,
    };
    
    // Create event
    const event = await createEvent(eventInput, authResult.userId!);
    
    // Send calendar invitations (non-blocking) - COMMENTED OUT FOR TESTING
    // let calendarResult;
    // try {
    //   const ttuUsers = await getTTUVerifiedUsers();
    //   const emails = ttuUsers.map(user => user.email);
    //   
    //   if (emails.length > 0) {
    //     calendarResult = await sendCalendarInvitation(event, emails);
    //   }
    // } catch (calendarError) {
    //   console.error('Error sending calendar invitations:', calendarError);
    //   // Don't fail the request if calendar sending fails
    // }
    
    return NextResponse.json({
      success: true,
      data: event,
      // calendar: calendarResult,
    });
  } catch (error: any) {
    console.error('Error creating event:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'CREATE_EVENT_ERROR',
          message: error.message || 'Failed to create event',
        },
      },
      { status: 500 }
    );
  }
}
