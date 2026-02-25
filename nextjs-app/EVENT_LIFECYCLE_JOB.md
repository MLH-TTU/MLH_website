# Event Lifecycle Background Job

## Overview

The event lifecycle background job automatically manages event status transitions and cleanup operations. This ensures that events are properly marked as completed after they end and removed from the admin interface 24 hours after completion.

## What It Does

The job performs two main operations:

### 1. Status Updates (Requirement 6.1)
- Finds all events where `endTime` has passed but status is still "upcoming" or "active"
- Updates these events to status "completed"
- Runs every 5 minutes to ensure timely status transitions

### 2. Event Cleanup (Requirement 6.2)
- Finds all events that have been completed for more than 24 hours
- Marks these events with `cleanedUp: true` flag
- Events remain in the database for historical records but are filtered from the admin events page
- Preserves all event data including attendees and timestamps

## Implementation

### API Endpoint
- **Path**: `/api/events/lifecycle`
- **Methods**: POST, GET (GET for testing only)
- **Schedule**: Every 5 minutes (configured in `vercel.json`)

### Service Functions

The job uses the following functions from `event.service.ts`:

1. **`getEventsNeedingStatusUpdate()`**
   - Queries events where `endTime < now` and status is "upcoming" or "active"
   - Returns array of event IDs

2. **`batchUpdateEventsToCompleted(eventIds)`**
   - Updates multiple events to "completed" status in a single batch operation
   - Returns count of updated events

3. **`getEventsForCleanup()`**
   - Queries events where status is "completed" and `endTime < (now - 24 hours)`
   - Returns array of event IDs

4. **`markEventsAsCleanedUp(eventIds)`**
   - Adds `cleanedUp: true` flag to events in a batch operation
   - Events remain in database but are filtered from admin UI

## Deployment

### Vercel (Recommended)

The job is configured to run automatically on Vercel using Vercel Cron Jobs:

```json
{
  "crons": [
    {
      "path": "/api/events/lifecycle",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Schedule**: `*/5 * * * *` (every 5 minutes)

Vercel will automatically call the endpoint on this schedule. No additional configuration needed.

### Other Platforms

If deploying to a platform other than Vercel, you'll need to set up an external cron service:

#### Option 1: External Cron Service (e.g., cron-job.org, EasyCron)
1. Create a cron job that makes a POST request to your deployed URL
2. URL: `https://your-domain.com/api/events/lifecycle`
3. Schedule: Every 5 minutes (`*/5 * * * *`)
4. Add authentication header (see Security section)

#### Option 2: Server-Side Cron (if self-hosting)
```bash
# Add to crontab
*/5 * * * * curl -X POST https://your-domain.com/api/events/lifecycle -H "Authorization: Bearer YOUR_SECRET"
```

## Security

### Production Authentication

For production deployments, it's recommended to add authentication to prevent unauthorized access:

1. Set environment variable `LIFECYCLE_JOB_SECRET` with a secure random string
2. Uncomment the authentication check in `/api/events/lifecycle/route.ts`:

```typescript
const authHeader = request.headers.get('authorization');
if (authHeader !== `Bearer ${process.env.LIFECYCLE_JOB_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

3. Configure your cron service to include the Authorization header:
```
Authorization: Bearer YOUR_SECRET_HERE
```

**Note**: Vercel Cron Jobs run in a trusted environment and don't require authentication headers, but you may still want to add this for defense in depth.

## Testing

### Manual Testing

You can manually trigger the job for testing:

```bash
# Without authentication
curl -X POST http://localhost:3000/api/events/lifecycle

# With authentication (if enabled)
curl -X POST http://localhost:3000/api/events/lifecycle \
  -H "Authorization: Bearer YOUR_SECRET"
```

Or simply visit in browser (GET request):
```
http://localhost:3000/api/events/lifecycle
```

### Expected Response

```json
{
  "success": true,
  "message": "Event lifecycle job completed successfully",
  "completedCount": 2,
  "cleanedUpCount": 1,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

- `completedCount`: Number of events updated to "completed" status
- `cleanedUpCount`: Number of events marked as cleaned up
- `timestamp`: When the job ran

## Monitoring

### Logs

The job logs all operations to the console:
- Successful operations: Info level
- Errors: Error level with full stack traces

Check your deployment platform's logs:
- **Vercel**: View logs in Vercel Dashboard → Functions → Logs
- **Other platforms**: Check your platform's logging service

### Metrics to Monitor

1. **Execution frequency**: Should run every 5 minutes
2. **Success rate**: Should be close to 100%
3. **Processing counts**: Track `completedCount` and `cleanedUpCount` over time
4. **Execution time**: Should complete in < 5 seconds for typical workloads

### Alerts

Consider setting up alerts for:
- Job failures (status 500 responses)
- Job not running (no executions in 10+ minutes)
- Unusually high processing counts (may indicate a bug)

## Troubleshooting

### Job Not Running

1. **Vercel**: Check that `vercel.json` is in the project root and properly formatted
2. **Other platforms**: Verify your external cron service is configured and active
3. Check deployment logs for any startup errors

### Events Not Updating

1. Manually trigger the job and check the response
2. Verify Firestore indexes are created (may be needed for queries)
3. Check that events have proper `endTime` and `status` fields
4. Review application logs for error messages

### Performance Issues

If the job times out or runs slowly:
1. Check the number of events being processed
2. Consider adding pagination for large batches (> 500 events)
3. Monitor Firestore read/write quotas
4. Optimize queries with composite indexes if needed

## Future Enhancements

Potential improvements for the lifecycle job:

1. **Configurable schedule**: Allow admins to configure the job frequency
2. **Notification system**: Send notifications when events are completed
3. **Archival system**: Move old events to a separate collection or cold storage
4. **Analytics**: Track event completion rates and attendance patterns
5. **Retry logic**: Add exponential backoff for transient failures
6. **Batch size limits**: Process events in smaller batches for very large datasets

## Related Requirements

- **Requirement 6.1**: Event status transitions to "completed" after end time
- **Requirement 6.2**: Events removed from admin page 24 hours after completion
- **Requirement 6.3**: Event data preserved for historical records
- **Requirement 6.5**: All event data maintained including attendees and timestamps
