import 'server-only';
import { getAdminFirestore } from '../firebase/admin';
import type { CreateEventInput, EventFilter, EventStatus } from '../types';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Server-side Event type using Firebase Admin SDK Timestamp
 */
export interface Event {
  id: string;
  name: string;
  description: string;
  startTime: Timestamp;
  endTime?: Timestamp;           // Optional - set when admin manually ends event
  location: string;
  pointsValue: number;
  createdBy: string;
  status: EventStatus;
  attendanceCode?: string;
  codeActive: boolean;
  attendees: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  cleanedUp?: boolean;
}

/**
 * Event Service
 * 
 * Server-side service for event management operations including:
 * - CRUD operations for events
 * - Attendance code generation and management
 * - Event status lifecycle management
 * - Time-based validation
 */

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Create a new event
 * Initializes event with status="upcoming", empty attendees array, and codeActive=false
 * 
 * @param eventInput - Event creation data
 * @param adminUid - UID of admin creating the event
 * @returns Created event with generated ID
 */
export async function createEvent(
  eventInput: CreateEventInput,
  adminUid: string
): Promise<Event> {
  try {
    const db = getAdminFirestore();
    const eventsRef = db.collection('events');
    
    // Validate required fields
    if (!eventInput.name || !eventInput.description || !eventInput.location) {
      throw new Error('Missing required fields');
    }
    
    if (!eventInput.startTime) {
      throw new Error('Missing required time field: startTime');
    }
    
    if (typeof eventInput.pointsValue !== 'number' || eventInput.pointsValue < 0) {
      throw new Error('Invalid points value');
    }
    
    const now = Timestamp.now();
    const startTime = Timestamp.fromDate(eventInput.startTime);
    
    // Create event document
    const eventData = {
      name: eventInput.name,
      description: eventInput.description,
      startTime,
      location: eventInput.location,
      pointsValue: eventInput.pointsValue,
      createdBy: adminUid,
      status: 'upcoming' as EventStatus,
      codeActive: false,
      attendees: [],
      createdAt: now,
      updatedAt: now,
    };
    
    const docRef = await eventsRef.add(eventData);
    
    return {
      id: docRef.id,
      ...eventData,
    };
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
}

/**
 * Update an existing event
 * Only allows updates before the event start time
 * 
 * @param eventId - ID of event to update
 * @param updates - Partial event data to update
 * @returns void
 * @throws Error if event has already started or doesn't exist
 */
export async function updateEvent(
  eventId: string,
  updates: Partial<Event>
): Promise<void> {
  try {
    const db = getAdminFirestore();
    const eventRef = db.collection('events').doc(eventId);
    
    // Get current event
    const eventDoc = await eventRef.get();
    
    if (!eventDoc.exists) {
      throw new Error('Event not found');
    }
    
    const eventData = eventDoc.data();
    if (!eventData) {
      throw new Error('Event data not found');
    }
    
    // Check if event has started
    const now = Timestamp.now();
    const startTime = eventData.startTime as Timestamp;
    
    if (now.toMillis() >= startTime.toMillis()) {
      throw new Error('Cannot edit started event');
    }
    
    // Prepare update data (exclude fields that shouldn't be updated)
    const allowedUpdates: any = {};
    
    if (updates.name !== undefined) allowedUpdates.name = updates.name;
    if (updates.description !== undefined) allowedUpdates.description = updates.description;
    if (updates.location !== undefined) allowedUpdates.location = updates.location;
    if (updates.pointsValue !== undefined) allowedUpdates.pointsValue = updates.pointsValue;
    
    // Handle time updates
    if (updates.startTime !== undefined) {
      allowedUpdates.startTime = updates.startTime;
    }
    if (updates.endTime !== undefined) {
      allowedUpdates.endTime = updates.endTime;
    }
    
    // Always update the updatedAt timestamp
    allowedUpdates.updatedAt = Timestamp.now();
    
    await eventRef.update(allowedUpdates);
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
}

/**
 * Delete an event
 * 
 * @param eventId - ID of event to delete
 * @returns void
 * @throws Error if event doesn't exist
 */
export async function deleteEvent(eventId: string): Promise<void> {
  try {
    const db = getAdminFirestore();
    const eventRef = db.collection('events').doc(eventId);
    
    // Check if event exists
    const eventDoc = await eventRef.get();
    
    if (!eventDoc.exists) {
      throw new Error('Event not found');
    }
    
    await eventRef.delete();
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}

/**
 * Get a single event by ID
 * 
 * @param eventId - ID of event to retrieve
 * @returns Event object or null if not found
 */
export async function getEvent(eventId: string): Promise<Event | null> {
  try {
    const db = getAdminFirestore();
    const eventDoc = await db.collection('events').doc(eventId).get();
    
    if (!eventDoc.exists) {
      return null;
    }
    
    const data = eventDoc.data();
    if (!data) {
      return null;
    }
    
    return {
      id: eventDoc.id,
      name: data.name,
      description: data.description,
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location,
      pointsValue: data.pointsValue,
      createdBy: data.createdBy,
      status: data.status,
      attendanceCode: data.attendanceCode,
      codeActive: data.codeActive ?? false,
      attendees: data.attendees ?? [],
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      cleanedUp: data.cleanedUp ?? false,
    };
  } catch (error) {
    console.error('Error getting event:', error);
    throw new Error('Failed to get event');
  }
}

/**
 * Get events with optional filtering
 * 
 * @param filter - Optional filter criteria
 * @returns Array of events matching the filter
 */
export async function getEvents(filter?: EventFilter): Promise<Event[]> {
  try {
    const db = getAdminFirestore();
    let query: FirebaseFirestore.Query = db.collection('events');
    
    // Apply status filter
    if (filter?.status) {
      if (Array.isArray(filter.status)) {
        query = query.where('status', 'in', filter.status);
      } else {
        query = query.where('status', '==', filter.status);
      }
    }
    
    // Apply time filters
    if (filter?.startAfter) {
      const timestamp = Timestamp.fromDate(filter.startAfter);
      query = query.where('startTime', '>', timestamp);
    }
    
    if (filter?.startBefore) {
      const timestamp = Timestamp.fromDate(filter.startBefore);
      query = query.where('startTime', '<', timestamp);
    }
    
    const snapshot = await query.get();
    
    const events: Event[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      events.push({
        id: doc.id,
        name: data.name,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        pointsValue: data.pointsValue,
        createdBy: data.createdBy,
        status: data.status,
        attendanceCode: data.attendanceCode,
        codeActive: data.codeActive ?? false,
        attendees: data.attendees ?? [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        cleanedUp: data.cleanedUp ?? false,
      });
    });
    
    return events;
  } catch (error) {
    console.error('Error getting events:', error);
    throw new Error('Failed to get events');
  }
}

// ============================================================================
// Attendance Code Management
// ============================================================================

/**
 * Generate a unique 6-digit attendance code for an event
 * Only allows generation after event start time
 * Ensures each event has at most one attendance code
 * 
 * @param eventId - ID of event to generate code for
 * @returns Generated 6-digit code
 * @throws Error if event hasn't started or doesn't exist
 */
export async function generateAttendanceCode(eventId: string): Promise<string> {
  try {
    const db = getAdminFirestore();
    const eventRef = db.collection('events').doc(eventId);
    
    // Get current event
    const eventDoc = await eventRef.get();
    
    if (!eventDoc.exists) {
      throw new Error('Event not found');
    }
    
    const eventData = eventDoc.data();
    if (!eventData) {
      throw new Error('Event data not found');
    }
    
    // Check if event has started
    const now = Timestamp.now();
    const startTime = eventData.startTime as Timestamp;
    
    if (now.toMillis() < startTime.toMillis()) {
      throw new Error('Event not started');
    }
    
    // Generate unique 6-digit code
    let code: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!isUnique && attempts < maxAttempts) {
      // Generate random 6-digit code
      code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Check if code is unique across all active events
      const existingEvents = await db.collection('events')
        .where('attendanceCode', '==', code)
        .where('codeActive', '==', true)
        .get();
      
      if (existingEvents.empty) {
        isUnique = true;
        
        // Update event with the code
        await eventRef.update({
          attendanceCode: code,
          codeActive: true,
          updatedAt: Timestamp.now(),
        });
        
        return code;
      }
      
      attempts++;
    }
    
    throw new Error('Failed to generate unique code');
  } catch (error) {
    console.error('Error generating attendance code:', error);
    throw error;
  }
}

/**
 * Toggle attendance code active status
 * Allows admins to activate or deactivate attendance codes
 * 
 * @param eventId - ID of event
 * @param active - Whether to activate (true) or deactivate (false) the code
 * @returns void
 * @throws Error if event doesn't exist or has no code
 */
export async function toggleAttendanceCode(
  eventId: string,
  active: boolean
): Promise<void> {
  try {
    const db = getAdminFirestore();
    const eventRef = db.collection('events').doc(eventId);
    
    // Get current event
    const eventDoc = await eventRef.get();
    
    if (!eventDoc.exists) {
      throw new Error('Event not found');
    }
    
    const eventData = eventDoc.data();
    if (!eventData) {
      throw new Error('Event data not found');
    }
    
    // Check if event has an attendance code
    if (!eventData.attendanceCode) {
      throw new Error('Event has no attendance code');
    }
    
    // Update code active status
    await eventRef.update({
      codeActive: active,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error toggling attendance code:', error);
    throw error;
  }
}

// ============================================================================
// Event Lifecycle Management
// ============================================================================

/**
 * Update event status based on current time
 * Transitions event to "completed" after end time
 * 
 * @param eventId - ID of event to update status
 * @returns void
 * @throws Error if event doesn't exist
 */
export async function updateEventStatus(eventId: string): Promise<void> {
  try {
    const db = getAdminFirestore();
    const eventRef = db.collection('events').doc(eventId);
    
    // Get current event
    const eventDoc = await eventRef.get();
    
    if (!eventDoc.exists) {
      throw new Error('Event not found');
    }
    
    const eventData = eventDoc.data();
    if (!eventData) {
      throw new Error('Event data not found');
    }
    
    const now = Timestamp.now();
    const endTime = eventData.endTime as Timestamp;
    
    // If event has ended and status is not already completed or cancelled
    if (
      now.toMillis() >= endTime.toMillis() &&
      eventData.status !== 'completed' &&
      eventData.status !== 'cancelled'
    ) {
      await eventRef.update({
        status: 'completed',
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error('Error updating event status:', error);
    throw error;
  }
}

/**
 * Manually end an event
 * Sets endTime to current time and updates status to "completed"
 * Deactivates attendance code if active
 * 
 * @param eventId - ID of event to end
 * @returns void
 * @throws Error if event doesn't exist or hasn't started
 */
export async function endEvent(eventId: string): Promise<void> {
  try {
    const db = getAdminFirestore();
    const eventRef = db.collection('events').doc(eventId);
    
    // Get current event
    const eventDoc = await eventRef.get();
    
    if (!eventDoc.exists) {
      throw new Error('Event not found');
    }
    
    const eventData = eventDoc.data();
    if (!eventData) {
      throw new Error('Event data not found');
    }
    
    // Check if event has started
    const now = Timestamp.now();
    const startTime = eventData.startTime as Timestamp;
    
    if (now.toMillis() < startTime.toMillis()) {
      throw new Error('Cannot end event that has not started');
    }
    
    // Check if event is already completed
    if (eventData.status === 'completed') {
      throw new Error('Event is already completed');
    }
    
    await eventRef.update({
      endTime: now,
      status: 'completed',
      codeActive: false,
      updatedAt: now,
    });
  } catch (error) {
    console.error('Error ending event:', error);
    throw error;
  }
}

/**
 * Cancel an event
 * Updates event status to "cancelled"
 * 
 * @param eventId - ID of event to cancel
 * @returns void
 * @throws Error if event doesn't exist
 */
export async function cancelEvent(eventId: string): Promise<void> {
  try {
    const db = getAdminFirestore();
    const eventRef = db.collection('events').doc(eventId);
    
    // Get current event
    const eventDoc = await eventRef.get();
    
    if (!eventDoc.exists) {
      throw new Error('Event not found');
    }
    
    await eventRef.update({
      status: 'cancelled',
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error cancelling event:', error);
    throw error;
  }
}

/**
 * Get events that should be cleaned up (24 hours after completion)
 * Returns events that are completed and past the cleanup period
 * 
 * @returns Array of event IDs to clean up
 */
export async function getEventsForCleanup(): Promise<string[]> {
  try {
    const db = getAdminFirestore();
    
    // Calculate cleanup threshold (24 hours ago)
    const now = Timestamp.now();
    const cleanupThreshold = Timestamp.fromMillis(now.toMillis() - 24 * 60 * 60 * 1000);
    
    // Query for completed events that ended more than 24 hours ago
    const snapshot = await db.collection('events')
      .where('status', '==', 'completed')
      .where('endTime', '<', cleanupThreshold)
      .get();
    
    const eventIds: string[] = [];
    
    snapshot.forEach((doc) => {
      eventIds.push(doc.id);
    });
    
    return eventIds;
  } catch (error) {
    console.error('Error getting events for cleanup:', error);
    throw new Error('Failed to get events for cleanup');
  }
}

/**
 * Mark events as cleaned up (for removal from admin page)
 * Note: This doesn't delete the event, just marks it for UI filtering
 * 
 * @param eventIds - Array of event IDs to mark as cleaned up
 * @returns void
 */
export async function markEventsAsCleanedUp(eventIds: string[]): Promise<void> {
  try {
    const db = getAdminFirestore();
    const batch = db.batch();
    
    for (const eventId of eventIds) {
      const eventRef = db.collection('events').doc(eventId);
      batch.update(eventRef, {
        cleanedUp: true,
        updatedAt: Timestamp.now(),
      });
    }
    
    await batch.commit();
  } catch (error) {
    console.error('Error marking events as cleaned up:', error);
    throw error;
  }
}

/**
 * Get events that need status updates (ended but not marked as completed)
 * Returns events where endTime has passed but status is still "upcoming" or "active"
 * 
 * @returns Array of event IDs that need status updates
 */
export async function getEventsNeedingStatusUpdate(): Promise<string[]> {
  try {
    const db = getAdminFirestore();
    const now = Timestamp.now();
    
    // Query for events that have ended but are not completed or cancelled
    const snapshot = await db.collection('events')
      .where('endTime', '<', now)
      .where('status', 'in', ['upcoming', 'active'])
      .get();
    
    const eventIds: string[] = [];
    
    snapshot.forEach((doc) => {
      eventIds.push(doc.id);
    });
    
    return eventIds;
  } catch (error) {
    console.error('Error getting events needing status update:', error);
    throw new Error('Failed to get events needing status update');
  }
}

/**
 * Update multiple events to completed status
 * Batch operation for efficiency
 * 
 * @param eventIds - Array of event IDs to update
 * @returns Number of events updated
 */
export async function batchUpdateEventsToCompleted(eventIds: string[]): Promise<number> {
  try {
    const db = getAdminFirestore();
    const batch = db.batch();
    const now = Timestamp.now();
    
    for (const eventId of eventIds) {
      const eventRef = db.collection('events').doc(eventId);
      batch.update(eventRef, {
        status: 'completed',
        updatedAt: now,
      });
    }
    
    await batch.commit();
    return eventIds.length;
  } catch (error) {
    console.error('Error batch updating events to completed:', error);
    throw error;
  }
}
