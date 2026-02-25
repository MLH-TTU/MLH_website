import 'server-only';
import { getAdminFirestore } from '../firebase/admin';
import type { AttendanceResult, User } from '../types';
import { Timestamp } from 'firebase-admin/firestore';
import { getEvent } from './event.service';

/**
 * Attendance Service
 * 
 * Server-side service for attendance management operations including:
 * - Atomic attendance code submission with transaction support
 * - Attendance validation and verification
 * - Manual attendance addition by admins
 * - Attendee list retrieval
 */

// ============================================================================
// Attendance Submission
// ============================================================================

/**
 * Submit attendance code for an event
 * Uses Firestore transaction to atomically:
 * - Validate code matches active event code
 * - Check user hasn't already attended
 * - Add user to event attendees
 * - Update user's attendedEvents array
 * - Increment user's points
 * 
 * @param userId - User submitting attendance
 * @param code - 6-digit attendance code
 * @returns AttendanceResult with success status and details
 */
export async function submitAttendance(
  userId: string,
  code: string
): Promise<AttendanceResult> {
  try {
    const db = getAdminFirestore();
    
    // Validate code format (6-digit numeric)
    if (!/^\d{6}$/.test(code)) {
      return {
        success: false,
        message: 'Invalid code format. Code must be 6 digits.',
      };
    }
    
    // Find event with matching attendance code
    const eventsSnapshot = await db.collection('events')
      .where('attendanceCode', '==', code)
      .limit(1)
      .get();
    
    if (eventsSnapshot.empty) {
      return {
        success: false,
        message: 'Invalid code',
      };
    }
    
    const eventDoc = eventsSnapshot.docs[0];
    const eventData = eventDoc.data();
    
    // Check if code is active
    if (!eventData.codeActive) {
      return {
        success: false,
        message: 'Code not active',
      };
    }
    
    // Check if event is ongoing
    const now = Timestamp.now();
    const startTime = eventData.startTime as Timestamp;
    const endTime = eventData.endTime as Timestamp | undefined;
    
    if (now.toMillis() < startTime.toMillis()) {
      return {
        success: false,
        message: 'Event has not started yet',
      };
    }
    
    // Only check endTime if it exists (event has been manually ended)
    if (endTime && now.toMillis() >= endTime.toMillis()) {
      return {
        success: false,
        message: 'Event has ended',
      };
    }
    
    // Also check event status
    if (eventData.status === 'completed' || eventData.status === 'cancelled') {
      return {
        success: false,
        message: 'Event has ended',
      };
    }
    
    // Use transaction to ensure atomicity
    const result = await db.runTransaction(async (transaction) => {
      const eventRef = db.collection('events').doc(eventDoc.id);
      const userRef = db.collection('users').doc(userId);
      
      // Re-fetch event and user within transaction
      const eventSnapshot = await transaction.get(eventRef);
      const userSnapshot = await transaction.get(userRef);
      
      if (!eventSnapshot.exists) {
        throw new Error('Event not found');
      }
      
      if (!userSnapshot.exists) {
        throw new Error('User not found');
      }
      
      const currentEventData = eventSnapshot.data();
      const currentUserData = userSnapshot.data();
      
      if (!currentEventData || !currentUserData) {
        throw new Error('Data not found');
      }
      
      // Check if user has already attended
      const attendees = currentEventData.attendees || [];
      if (attendees.includes(userId)) {
        throw new Error('Already attended');
      }
      
      // Prepare attended event metadata
      const attendedEvent = {
        eventId: eventDoc.id,
        eventName: currentEventData.name,
        eventDate: currentEventData.startTime,
        location: currentEventData.location,
        pointsEarned: currentEventData.pointsValue,
        attendedAt: Timestamp.now(),
      };
      
      // Update event attendees
      transaction.update(eventRef, {
        attendees: [...attendees, userId],
        updatedAt: Timestamp.now(),
      });
      
      // Update user's attended events and points
      const currentAttendedEvents = currentUserData.attendedEvents || [];
      const currentPoints = currentUserData.points || 0;
      
      transaction.update(userRef, {
        attendedEvents: [...currentAttendedEvents, attendedEvent],
        points: currentPoints + currentEventData.pointsValue,
        updatedAt: Timestamp.now(),
      });
      
      return {
        success: true,
        message: 'Attendance recorded successfully',
        pointsEarned: currentEventData.pointsValue,
        eventName: currentEventData.name,
      };
    });
    
    return result;
  } catch (error: any) {
    console.error('Error submitting attendance:', error);
    
    // Handle specific transaction errors
    if (error.message === 'Already attended') {
      return {
        success: false,
        message: 'You have already attended this event',
      };
    }
    
    if (error.message === 'User not found') {
      return {
        success: false,
        message: 'User not found',
      };
    }
    
    if (error.message === 'Event not found') {
      return {
        success: false,
        message: 'Event not found',
      };
    }
    
    return {
      success: false,
      message: 'Failed to record attendance. Please try again.',
    };
  }
}

// ============================================================================
// Attendance Helper Functions
// ============================================================================

/**
 * Check if a user has attended a specific event
 * 
 * @param userId - User UID to check
 * @param eventId - Event ID to check
 * @returns True if user attended the event, false otherwise
 */
export async function hasAttended(
  userId: string,
  eventId: string
): Promise<boolean> {
  try {
    const db = getAdminFirestore();
    
    // Get event document
    const eventDoc = await db.collection('events').doc(eventId).get();
    
    if (!eventDoc.exists) {
      return false;
    }
    
    const eventData = eventDoc.data();
    const attendees = eventData?.attendees || [];
    
    return attendees.includes(userId);
  } catch (error) {
    console.error('Error checking attendance:', error);
    return false;
  }
}

/**
 * Get list of attendees for an event
 * Fetches full user objects for all attendees
 * 
 * @param eventId - Event ID
 * @returns Array of User objects who attended the event
 */
export async function getAttendees(eventId: string): Promise<User[]> {
  try {
    const db = getAdminFirestore();
    
    // Get event document
    const eventDoc = await db.collection('events').doc(eventId).get();
    
    if (!eventDoc.exists) {
      return [];
    }
    
    const eventData = eventDoc.data();
    const attendeeIds = eventData?.attendees || [];
    
    if (attendeeIds.length === 0) {
      return [];
    }
    
    // Fetch all attendee user documents
    // Firestore 'in' query supports up to 10 items, so batch if needed
    const users: User[] = [];
    
    for (let i = 0; i < attendeeIds.length; i += 10) {
      const batch = attendeeIds.slice(i, i + 10);
      const usersSnapshot = await db.collection('users')
        .where('__name__', 'in', batch)
        .get();
      
      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          uid: doc.id,
          email: data.email || '',
          displayName: data.displayName || '',
          ttuVerified: data.ttuVerified ?? data.ttuEmailVerified ?? false,
          isAdmin: data.isAdmin ?? false,
          points: data.points ?? 0,
          attendedEvents: data.attendedEvents ?? [],
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
    }
    
    return users;
  } catch (error) {
    console.error('Error getting attendees:', error);
    throw new Error('Failed to get attendees');
  }
}

/**
 * Manually add an attendee to an event (admin only)
 * Atomically updates both event attendees and user attendedEvents
 * 
 * @param eventId - Event ID
 * @param userId - User ID to add as attendee
 * @param adminUid - Admin UID performing the action
 * @returns void
 * @throws Error if event or user not found, or if user already attended
 */
export async function addAttendee(
  eventId: string,
  userId: string,
  adminUid: string
): Promise<void> {
  try {
    const db = getAdminFirestore();
    
    // Use transaction to ensure atomicity
    await db.runTransaction(async (transaction) => {
      const eventRef = db.collection('events').doc(eventId);
      const userRef = db.collection('users').doc(userId);
      
      // Fetch event and user within transaction
      const eventSnapshot = await transaction.get(eventRef);
      const userSnapshot = await transaction.get(userRef);
      
      if (!eventSnapshot.exists) {
        throw new Error('Event not found');
      }
      
      if (!userSnapshot.exists) {
        throw new Error('User not found');
      }
      
      const eventData = eventSnapshot.data();
      const userData = userSnapshot.data();
      
      if (!eventData || !userData) {
        throw new Error('Data not found');
      }
      
      // Check if user has already attended
      const attendees = eventData.attendees || [];
      if (attendees.includes(userId)) {
        throw new Error('User has already attended this event');
      }
      
      // Prepare attended event metadata
      const attendedEvent = {
        eventId: eventId,
        eventName: eventData.name,
        eventDate: eventData.startTime,
        location: eventData.location,
        pointsEarned: eventData.pointsValue,
        attendedAt: Timestamp.now(),
      };
      
      // Update event attendees
      transaction.update(eventRef, {
        attendees: [...attendees, userId],
        updatedAt: Timestamp.now(),
      });
      
      // Update user's attended events and points
      const currentAttendedEvents = userData.attendedEvents || [];
      const currentPoints = userData.points || 0;
      
      transaction.update(userRef, {
        attendedEvents: [...currentAttendedEvents, attendedEvent],
        points: currentPoints + eventData.pointsValue,
        updatedAt: Timestamp.now(),
      });
    });
  } catch (error) {
    console.error('Error adding attendee:', error);
    throw error;
  }
}
