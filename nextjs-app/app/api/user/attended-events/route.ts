import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createErrorResponse } from '@/lib/middleware/auth';
import { getAdminFirestore } from '@/lib/firebase/admin';

/**
 * GET /api/user/attended-events
 * Get events that the current user has attended
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
    const db = getAdminFirestore();
    
    // Get user's attended events
    const userDoc = await db.collection('users').doc(authResult.userId!).get();
    
    if (!userDoc.exists) {
      console.error('User document not found:', authResult.userId);
      return NextResponse.json({
        success: true,
        data: [],
      });
    }
    
    const userData = userDoc.data();
    
    if (!userData) {
      console.error('User data is undefined');
      return NextResponse.json({
        success: true,
        data: [],
      });
    }
    
    if (!userData.attendedEvents || userData.attendedEvents.length === 0) {
      console.log('No attended events for user');
      return NextResponse.json({
        success: true,
        data: [],
      });
    }
    
    // attendedEvents is an array of objects with metadata, not just IDs
    const attendedEventsData = userData.attendedEvents as Array<{
      eventId: string;
      eventName: string;
      eventDate: any;
      location: string;
      pointsEarned: number;
      attendedAt: any;
    }>;
    
    console.log('Processing attended events:', attendedEventsData.length);
    
    // Map the attended events data to the expected format
    const events = attendedEventsData.map(eventData => {
      try {
        // Convert Firestore Timestamp to ISO string
        const startTime = eventData.eventDate && typeof eventData.eventDate.toDate === 'function'
          ? eventData.eventDate.toDate().toISOString()
          : new Date().toISOString();
        
        return {
          id: eventData.eventId,
          name: eventData.eventName || 'Unnamed Event',
          description: '',
          startTime,
          endTime: null,
          location: eventData.location || '',
          pointsValue: eventData.pointsEarned || 0,
          status: 'completed',
          createdAt: startTime,
          updatedAt: startTime,
        };
      } catch (err) {
        console.error('Error processing attended event:', eventData.eventId, err);
        throw err;
      }
    });
    
    // Sort by start time (most recent first)
    events.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    
    console.log('Returning events:', events.length);
    
    return NextResponse.json({
      success: true,
      data: events,
    });
  } catch (error: any) {
    console.error('Error getting attended events:', error);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      {
        error: {
          code: 'GET_ATTENDED_EVENTS_ERROR',
          message: error.message || 'Failed to get attended events',
        },
      },
      { status: 500 }
    );
  }
}
