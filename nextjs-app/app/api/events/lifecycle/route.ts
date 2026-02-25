import { NextRequest, NextResponse } from 'next/server';
import {
  getEventsNeedingStatusUpdate,
  batchUpdateEventsToCompleted,
  getEventsForCleanup,
  markEventsAsCleanedUp,
} from '@/lib/services/event.service';

/**
 * API route for event lifecycle management
 * This endpoint should be called periodically (e.g., every 5 minutes via a cron job)
 * 
 * Performs two operations:
 * 1. Updates events to "completed" status after their end time
 * 2. Marks events as cleaned up 24 hours after completion (removes from admin page)
 * 
 * For security, you should add authentication to this endpoint in production
 * (e.g., check for a secret token in the Authorization header)
 * 
 * Example cron setup (Vercel):
 * - Add to vercel.json with crons array containing path and schedule (every 5 minutes)
 * 
 * Example manual trigger:
 * - POST /api/events/lifecycle with Authorization header
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication check for production
    // Uncomment and set LIFECYCLE_JOB_SECRET in environment variables
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.LIFECYCLE_JOB_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    let completedCount = 0;
    let cleanedUpCount = 0;

    // Step 1: Update events to "completed" status
    const eventsNeedingUpdate = await getEventsNeedingStatusUpdate();
    if (eventsNeedingUpdate.length > 0) {
      completedCount = await batchUpdateEventsToCompleted(eventsNeedingUpdate);
    }

    // Step 2: Mark events as cleaned up (24 hours after completion)
    const eventsForCleanup = await getEventsForCleanup();
    if (eventsForCleanup.length > 0) {
      await markEventsAsCleanedUp(eventsForCleanup);
      cleanedUpCount = eventsForCleanup.length;
    }

    return NextResponse.json({
      success: true,
      message: 'Event lifecycle job completed successfully',
      completedCount,
      cleanedUpCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in event lifecycle job:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to run event lifecycle job',
      },
      { status: 500 }
    );
  }
}

// Allow GET requests for testing purposes
export async function GET(request: NextRequest) {
  return POST(request);
}
