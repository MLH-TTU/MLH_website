/**
 * Calendar Service Integration Example
 * 
 * This file demonstrates how to integrate the calendar service with event creation.
 * This is an example file and should not be imported in production code.
 */

import { createEvent } from './event.service';
import { sendCalendarInvitation } from './calendar.service';
import type { CreateEventInput } from '../types';

/**
 * Example: Create event and send calendar invitations
 * 
 * This function demonstrates the recommended pattern for creating events
 * and sending calendar invitations in API routes.
 */
export async function createEventWithInvitations(
  eventData: CreateEventInput,
  adminUid: string
): Promise<{ eventId: string; invitationsSent: number; invitationsFailed: number }> {
  try {
    // Step 1: Create the event
    const event = await createEvent(eventData, adminUid);
    
    console.log(`Event created: ${event.id}`);
    
    // Step 2: Send calendar invitations (non-blocking)
    // We don't await this to avoid blocking the API response
    // The invitations will be sent in the background
    sendCalendarInvitation(event)
      .then(result => {
        if (result.success) {
          console.log(`Calendar invitations sent successfully:`);
          console.log(`  - Sent to: ${result.sentTo.length} users`);
          console.log(`  - Failed: ${result.failed.length} users`);
          
          if (result.failed.length > 0) {
            console.log('Failed recipients:');
            result.errors.forEach(error => {
              console.log(`  - ${error.email}: ${error.error}`);
            });
          }
        } else {
          console.error('Failed to send calendar invitations');
          console.error('Errors:', result.errors);
        }
      })
      .catch(error => {
        console.error('Error sending calendar invitations:', error);
      });
    
    return {
      eventId: event.id,
      invitationsSent: 0, // Will be updated asynchronously
      invitationsFailed: 0,
    };
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
}

/**
 * Example: Create event and wait for calendar invitations
 * 
 * This function demonstrates how to wait for calendar invitations to complete
 * before returning. Use this pattern when you need to know the invitation results
 * immediately (e.g., for testing or admin dashboards).
 */
export async function createEventWithInvitationsSync(
  eventData: CreateEventInput,
  adminUid: string
): Promise<{
  eventId: string;
  invitationsSent: number;
  invitationsFailed: number;
  failedEmails: string[];
}> {
  try {
    // Step 1: Create the event
    const event = await createEvent(eventData, adminUid);
    
    console.log(`Event created: ${event.id}`);
    
    // Step 2: Send calendar invitations (blocking)
    const result = await sendCalendarInvitation(event);
    
    if (result.success) {
      console.log(`Calendar invitations sent successfully:`);
      console.log(`  - Sent to: ${result.sentTo.length} users`);
      console.log(`  - Failed: ${result.failed.length} users`);
    } else {
      console.error('Failed to send calendar invitations');
    }
    
    return {
      eventId: event.id,
      invitationsSent: result.sentTo.length,
      invitationsFailed: result.failed.length,
      failedEmails: result.failed,
    };
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
}

/**
 * Example: Send calendar invitations to specific users
 * 
 * This function demonstrates how to send calendar invitations to a specific
 * subset of users rather than all TTU verified users.
 */
export async function sendInvitationsToSpecificUsers(
  eventData: CreateEventInput,
  adminUid: string,
  recipientEmails: string[]
): Promise<void> {
  try {
    // Create the event
    const event = await createEvent(eventData, adminUid);
    
    console.log(`Event created: ${event.id}`);
    
    // Send invitations to specific users
    const result = await sendCalendarInvitation(event, recipientEmails);
    
    console.log(`Invitations sent to ${result.sentTo.length} of ${recipientEmails.length} users`);
    
    if (result.failed.length > 0) {
      console.log('Failed to send to:');
      result.errors.forEach(error => {
        console.log(`  - ${error.email}: ${error.error}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

/**
 * Example API Route Implementation
 * 
 * This demonstrates how to use the calendar service in a Next.js API route.
 * 
 * File: app/api/admin/events/route.ts
 */
export const exampleAPIRoute = `
import { NextRequest, NextResponse } from 'next/server';
import { createEvent } from '@/lib/services/event.service';
import { sendCalendarInvitation } from '@/lib/services/calendar.service';
import type { CreateEventInput } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // TODO: Verify admin authentication
    // const adminUid = await verifyAdminAuth(request);
    const adminUid = 'admin-uid-placeholder';
    
    // Parse request body
    const body = await request.json();
    
    // Validate event data
    const eventData: CreateEventInput = {
      name: body.name,
      description: body.description,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      location: body.location,
      pointsValue: body.pointsValue,
    };
    
    // Create event
    const event = await createEvent(eventData, adminUid);
    
    // Send calendar invitations (non-blocking)
    sendCalendarInvitation(event).then(result => {
      console.log(\`Calendar invitations: \${result.sentTo.length} sent, \${result.failed.length} failed\`);
    }).catch(error => {
      console.error('Failed to send calendar invitations:', error);
    });
    
    return NextResponse.json({
      success: true,
      data: {
        id: event.id,
        name: event.name,
        description: event.description,
        startTime: event.startTime.toDate().toISOString(),
        endTime: event.endTime ? event.endTime.toDate().toISOString() : null,
        location: event.location,
        pointsValue: event.pointsValue,
        status: event.status,
      },
    });
  } catch (error) {
    console.error('Error creating event:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'CREATE_EVENT_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
`;
