import 'server-only';
import type { CalendarResult, OutlookEvent } from '../types';
import type { Event } from './event.service';
import { getTTUVerifiedUsers } from './user.service';

/**
 * Calendar Service
 * 
 * Server-side service for Microsoft Graph API integration including:
 * - Access token management for Microsoft Graph API
 * - Outlook calendar event creation
 * - Calendar invitation distribution to TTU verified users
 * - Error handling for partial failures
 */

// ============================================================================
// Microsoft Graph API Configuration
// ============================================================================

const GRAPH_API_BASE_URL = 'https://graph.microsoft.com/v1.0';
const GRAPH_API_SCOPES = ['https://graph.microsoft.com/.default'];

/**
 * Get Microsoft Graph API access token
 * Uses client credentials flow with Azure AD app registration
 * 
 * @returns Access token for Microsoft Graph API
 * @throws Error if token acquisition fails
 */
export async function getAccessToken(): Promise<string> {
  try {
    // Get credentials from environment variables
    const tenantId = process.env.MICROSOFT_TENANT_ID;
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    
    if (!tenantId || !clientId || !clientSecret) {
      throw new Error('Microsoft Graph API credentials not configured');
    }
    
    // Token endpoint for client credentials flow
    const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    
    // Prepare request body
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: GRAPH_API_SCOPES.join(' '),
      grant_type: 'client_credentials',
    });
    
    // Request access token
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Token acquisition failed:', errorData);
      throw new Error(`Failed to acquire access token: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.access_token) {
      throw new Error('No access token in response');
    }
    
    return data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

/**
 * Create Outlook calendar event object from event data
 * Formats event data according to Microsoft Graph API schema
 * 
 * @param event - Event data to format
 * @returns Outlook event object ready for Graph API
 */
export function createOutlookEvent(event: Event): OutlookEvent {
  // Convert Firestore Timestamps to ISO strings
  const startDateTime = event.startTime.toDate().toISOString();
  const endDateTime = event.endTime.toDate().toISOString();
  
  // Format event description with points information
  const bodyContent = `${event.description}\n\nPoints: ${event.pointsValue} XP\nLocation: ${event.location}`;
  
  return {
    subject: event.name,
    body: {
      contentType: 'text',
      content: bodyContent,
    },
    start: {
      dateTime: startDateTime,
      timeZone: 'America/Chicago', // Central Time (TTU timezone)
    },
    end: {
      dateTime: endDateTime,
      timeZone: 'America/Chicago',
    },
    location: {
      displayName: event.location,
    },
    attendees: [], // Will be populated per recipient
  };
}

/**
 * Send calendar invitation to a single user
 * Helper function for individual invitation sending
 * 
 * @param accessToken - Microsoft Graph API access token
 * @param outlookEvent - Formatted Outlook event
 * @param recipientEmail - Email address of recipient
 * @returns Object with success status and optional error message
 */
async function sendSingleInvitation(
  accessToken: string,
  outlookEvent: OutlookEvent,
  recipientEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Create event with recipient as attendee
    const eventWithAttendee = {
      ...outlookEvent,
      attendees: [
        {
          emailAddress: {
            address: recipientEmail,
          },
          type: 'required',
        },
      ],
    };
    
    // Send calendar event via Microsoft Graph API
    // Using /me/events endpoint requires delegated permissions
    // For application permissions, we'd need to use /users/{userId}/events
    // For now, we'll use a service account approach
    const response = await fetch(`${GRAPH_API_BASE_URL}/me/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventWithAttendee),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Failed to send invitation to ${recipientEmail}:`, errorData);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorData.substring(0, 100)}`,
      };
    }
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error sending invitation to ${recipientEmail}:`, errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send calendar invitations to all TTU verified users
 * Handles partial failures by continuing to process all recipients
 * 
 * @param event - Event to send invitations for
 * @param recipients - Optional array of recipient emails (defaults to all TTU verified users)
 * @returns CalendarResult with success status and error details
 */
export async function sendCalendarInvitation(
  event: Event,
  recipients?: string[]
): Promise<CalendarResult> {
  const result: CalendarResult = {
    success: false,
    sentTo: [],
    failed: [],
    errors: [],
  };
  
  try {
    // Get access token
    let accessToken: string;
    try {
      accessToken = await getAccessToken();
    } catch (error) {
      // If we can't get an access token, fail immediately
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to get access token:', errorMessage);
      
      // Mark all recipients as failed
      const recipientList = recipients || [];
      result.failed = recipientList;
      result.errors = recipientList.map(email => ({
        email,
        error: `Access token acquisition failed: ${errorMessage}`,
      }));
      
      return result;
    }
    
    // Get recipient list
    let recipientEmails: string[];
    
    if (recipients && recipients.length > 0) {
      recipientEmails = recipients;
    } else {
      // Fetch all TTU verified users
      const users = await getTTUVerifiedUsers();
      recipientEmails = users.map(user => user.email);
    }
    
    if (recipientEmails.length === 0) {
      console.warn('No recipients found for calendar invitation');
      result.success = true; // Not an error, just no recipients
      return result;
    }
    
    // Create Outlook event object
    const outlookEvent = createOutlookEvent(event);
    
    // Send invitations to all recipients
    // Process sequentially to avoid rate limiting
    for (const email of recipientEmails) {
      const invitationResult = await sendSingleInvitation(accessToken, outlookEvent, email);
      
      if (invitationResult.success) {
        result.sentTo.push(email);
      } else {
        result.failed.push(email);
        result.errors.push({
          email,
          error: invitationResult.error || 'Failed to send invitation',
        });
      }
    }
    
    // Consider success if at least one invitation was sent
    result.success = result.sentTo.length > 0;
    
    // Log summary
    console.log(`Calendar invitations sent: ${result.sentTo.length} succeeded, ${result.failed.length} failed`);
    
    return result;
  } catch (error) {
    console.error('Error sending calendar invitations:', error);
    
    // Return error result
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push({
      email: 'system',
      error: errorMessage,
    });
    
    return result;
  }
}
