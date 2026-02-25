# Calendar Service Documentation

## Overview

The Calendar Service provides Microsoft Graph API integration for sending Outlook calendar invitations to TTU verified users when events are created.

## Features

- **Access Token Management**: Handles OAuth2 client credentials flow for Microsoft Graph API
- **Outlook Event Formatting**: Converts event data to Microsoft Graph API schema
- **Batch Invitation Sending**: Sends calendar invitations to all TTU verified users
- **Partial Failure Handling**: Continues processing even if individual invitations fail
- **Error Tracking**: Provides detailed error information for failed invitations

## Setup

### 1. Azure AD App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to Azure Active Directory > App registrations
3. Click "New registration"
4. Configure:
   - Name: "MLH TTU Calendar Service"
   - Supported account types: "Accounts in this organizational directory only"
   - Redirect URI: Not needed for client credentials flow
5. Click "Register"

### 2. Configure API Permissions

1. In your app registration, go to "API permissions"
2. Click "Add a permission"
3. Select "Microsoft Graph"
4. Select "Application permissions"
5. Add the following permissions:
   - `Calendars.ReadWrite` - Required to create calendar events
6. Click "Grant admin consent" (requires admin privileges)

### 3. Create Client Secret

1. In your app registration, go to "Certificates & secrets"
2. Click "New client secret"
3. Add a description and set expiration
4. Copy the secret value immediately (it won't be shown again)

### 4. Configure Environment Variables

Add the following to your `.env.local` file:

```env
# Microsoft Graph API Configuration
MICROSOFT_TENANT_ID=your_tenant_id_here
MICROSOFT_CLIENT_ID=your_client_id_here
MICROSOFT_CLIENT_SECRET=your_client_secret_here
```

You can find these values in your Azure AD app registration:
- **Tenant ID**: Overview > Directory (tenant) ID
- **Client ID**: Overview > Application (client) ID
- **Client Secret**: The value you copied when creating the secret

## Usage

### Basic Usage

```typescript
import { createEvent } from '@/lib/services/event.service';
import { sendCalendarInvitation } from '@/lib/services/calendar.service';

// Create an event
const event = await createEvent({
  name: 'MLH Workshop',
  description: 'Learn about web development',
  startTime: new Date('2024-03-20T18:00:00'),
  endTime: new Date('2024-03-20T20:00:00'),
  location: 'Engineering Building Room 101',
  pointsValue: 10,
}, adminUid);

// Send calendar invitations to all TTU verified users
const result = await sendCalendarInvitation(event);

if (result.success) {
  console.log(`Sent to ${result.sentTo.length} users`);
  if (result.failed.length > 0) {
    console.log(`Failed for ${result.failed.length} users`);
  }
} else {
  console.error('Failed to send calendar invitations');
}
```

### Send to Specific Recipients

```typescript
// Send to specific email addresses
const result = await sendCalendarInvitation(event, [
  'student1@ttu.edu',
  'student2@ttu.edu',
]);
```

### Handle Errors

```typescript
const result = await sendCalendarInvitation(event);

// Check for failures
if (result.failed.length > 0) {
  console.log('Failed recipients:');
  result.errors.forEach(error => {
    console.log(`- ${error.email}: ${error.error}`);
  });
}

// Log success
console.log(`Successfully sent to: ${result.sentTo.join(', ')}`);
```

## API Reference

### `getAccessToken()`

Acquires an access token for Microsoft Graph API using client credentials flow.

**Returns:** `Promise<string>` - Access token

**Throws:** Error if credentials are not configured or token acquisition fails

### `createOutlookEvent(event: Event)`

Formats an event object for Microsoft Graph API.

**Parameters:**
- `event`: Event object from event service

**Returns:** `OutlookEvent` - Formatted event object

### `sendCalendarInvitation(event: Event, recipients?: string[])`

Sends calendar invitations to TTU verified users.

**Parameters:**
- `event`: Event to send invitations for
- `recipients` (optional): Array of email addresses. If not provided, sends to all TTU verified users

**Returns:** `Promise<CalendarResult>`

```typescript
interface CalendarResult {
  success: boolean;        // True if at least one invitation was sent
  sentTo: string[];        // Array of successful recipient emails
  failed: string[];        // Array of failed recipient emails
  errors: CalendarError[]; // Detailed error information
}

interface CalendarError {
  email: string;  // Email address that failed
  error: string;  // Error message
}
```

## Integration with Event Creation

When creating events via API routes, integrate calendar invitations:

```typescript
// app/api/admin/events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createEvent } from '@/lib/services/event.service';
import { sendCalendarInvitation } from '@/lib/services/calendar.service';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication (implementation depends on your auth setup)
    const adminUid = await verifyAdminAuth(request);
    
    // Parse request body
    const eventData = await request.json();
    
    // Create event
    const event = await createEvent(eventData, adminUid);
    
    // Send calendar invitations (don't block on this)
    sendCalendarInvitation(event).then(result => {
      console.log(`Calendar invitations: ${result.sentTo.length} sent, ${result.failed.length} failed`);
    }).catch(error => {
      console.error('Failed to send calendar invitations:', error);
    });
    
    return NextResponse.json({ success: true, data: event });
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'CREATE_EVENT_FAILED', message: error.message } },
      { status: 500 }
    );
  }
}
```

## Error Handling

The service handles errors gracefully:

1. **Token Acquisition Failure**: If access token cannot be obtained, all recipients are marked as failed
2. **Individual Send Failures**: If sending to one recipient fails, processing continues for remaining recipients
3. **Partial Success**: The service returns success if at least one invitation was sent successfully

## Timezone Configuration

The service uses `America/Chicago` (Central Time) as the default timezone for TTU. This is configured in the `createOutlookEvent` function.

To change the timezone, modify the `timeZone` field in `calendar.service.ts`:

```typescript
start: {
  dateTime: startDateTime,
  timeZone: 'America/Chicago', // Change this if needed
},
```

## Rate Limiting

The service processes invitations sequentially to avoid Microsoft Graph API rate limits. For large numbers of recipients, consider:

1. Implementing batch processing with delays
2. Using Microsoft Graph batch requests
3. Monitoring API usage in Azure Portal

## Troubleshooting

### "Microsoft Graph API credentials not configured"

Ensure all three environment variables are set:
- `MICROSOFT_TENANT_ID`
- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`

### "Failed to acquire access token: 401"

- Verify your client secret is correct and hasn't expired
- Check that the app registration is in the correct tenant
- Ensure the client ID matches your app registration

### "Failed to send invitation"

- Verify API permissions are granted (Calendars.ReadWrite)
- Check that admin consent has been granted
- Ensure the service account has necessary permissions

### No invitations sent

- Verify there are TTU verified users in the database
- Check that users have valid email addresses
- Review application logs for detailed error messages

## Security Considerations

1. **Client Secret Protection**: Never commit client secrets to version control
2. **Environment Variables**: Use secure environment variable management in production
3. **Access Token Caching**: Consider implementing token caching to reduce API calls
4. **Audit Logging**: Log all calendar invitation attempts for security auditing

## Testing

To test the calendar service:

1. **Manual Testing**: Create a test event and verify invitations are received
2. **Unit Testing**: Mock Microsoft Graph API responses
3. **Integration Testing**: Use a test Azure AD tenant

Example test setup:

```typescript
// Mock the fetch function for testing
global.fetch = jest.fn();

// Test access token acquisition
test('getAccessToken returns valid token', async () => {
  (fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ access_token: 'test_token' }),
  });
  
  const token = await getAccessToken();
  expect(token).toBe('test_token');
});
```

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 3.1**: Generates Outlook calendar events with event details
- **Requirement 3.2**: Sends calendar invitations to all TTU verified users
- **Requirement 3.3**: Includes event name, description, date, time, and location
- **Requirement 3.4**: Handles partial failures by continuing to process remaining users

## Future Enhancements

1. **Token Caching**: Implement in-memory or Redis caching for access tokens
2. **Batch Requests**: Use Microsoft Graph batch API for better performance
3. **Retry Logic**: Add exponential backoff for failed requests
4. **Calendar Updates**: Support updating/canceling calendar events
5. **User Preferences**: Allow users to opt-out of calendar invitations
