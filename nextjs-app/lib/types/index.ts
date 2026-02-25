/**
 * Type definitions for Admin and Event Management System
 * 
 * This file contains all TypeScript interfaces, type aliases, and type helpers
 * for the event management system.
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// Event Types
// ============================================================================

/**
 * Event status representing the lifecycle stage of an event
 */
export type EventStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';

/**
 * Complete event document structure stored in Firestore
 */
export interface Event {
  id: string;                    // Firestore document ID
  name: string;                  // Event name
  description: string;           // Event description
  startTime: Timestamp;          // Event start time
  endTime?: Timestamp;           // Event end time (set when admin manually ends event)
  location: string;              // Event location
  pointsValue: number;           // XP awarded for attendance
  createdBy: string;             // Admin UID who created event
  status: EventStatus;           // Current event status
  attendanceCode?: string;       // 6-digit code (optional, generated on demand)
  codeActive: boolean;           // Whether code is currently active
  attendees: string[];           // Array of user UIDs who attended
  createdAt: Timestamp;          // Creation timestamp
  updatedAt: Timestamp;          // Last update timestamp
  cleanedUp?: boolean;           // Whether event has been cleaned up (24h after completion)
}

/**
 * Input data for creating a new event
 */
export interface CreateEventInput {
  name: string;
  description: string;
  startTime: Date;
  location: string;
  pointsValue: number;
}

/**
 * Filter options for querying events
 */
export interface EventFilter {
  status?: EventStatus | EventStatus[];
  startAfter?: Date;
  startBefore?: Date;
}

// ============================================================================
// User Types
// ============================================================================

/**
 * Extended user document structure stored in Firestore
 */
export interface User {
  uid: string;                   // Firebase Auth UID
  email: string;                 // User email
  displayName: string;           // User display name
  ttuVerified: boolean;          // TTU email verification status
  isAdmin: boolean;              // Admin role flag (default: false)
  points: number;                // Total accumulated points (default: 0)
  attendedEvents: AttendedEvent[]; // Array of attended event details
  createdAt: Timestamp;          // Account creation timestamp
  updatedAt: Timestamp;          // Last update timestamp
}

/**
 * Attended event metadata stored in user's attendedEvents array
 */
export interface AttendedEvent {
  eventId: string;               // Reference to event document
  eventName: string;             // Event name (denormalized)
  eventDate: Timestamp;          // Event date (denormalized)
  location: string;              // Event location (denormalized)
  pointsEarned: number;          // Points earned from this event
  attendedAt: Timestamp;         // When attendance was recorded
}

// ============================================================================
// Point Adjustment Types
// ============================================================================

/**
 * Point adjustment record for manual admin point additions
 */
export interface PointAdjustment {
  id: string;                    // Firestore document ID
  userId: string;                // User receiving points
  points: number;                // Points added (can be negative)
  reason: string;                // Reason for adjustment
  adjustedBy: string;            // Admin UID who made adjustment
  createdAt: Timestamp;          // Adjustment timestamp
}

// ============================================================================
// Service Response Types
// ============================================================================

/**
 * Result of attendance code submission
 */
export interface AttendanceResult {
  success: boolean;
  message: string;
  pointsEarned?: number;
  eventName?: string;
}

/**
 * Result of calendar invitation sending
 */
export interface CalendarResult {
  success: boolean;
  sentTo: string[];              // Successfully sent emails
  failed: string[];              // Failed emails
  errors: CalendarError[];       // Error details
}

/**
 * Calendar invitation error details
 */
export interface CalendarError {
  email: string;
  error: string;
}

/**
 * Microsoft Outlook calendar event structure
 */
export interface OutlookEvent {
  subject: string;
  body: {
    contentType: string;
    content: string;
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location: {
    displayName: string;
  };
  attendees: Array<{
    emailAddress: {
      address: string;
      name?: string;
    };
    type: string;
  }>;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable error message
    details?: any;          // Optional additional context
  };
}

/**
 * Success response with data
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
}

/**
 * Generic API response type
 */
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a response is an error
 */
export function isErrorResponse(response: ApiResponse): response is ErrorResponse {
  return 'error' in response;
}

/**
 * Type guard to check if a response is successful
 */
export function isSuccessResponse<T>(response: ApiResponse<T>): response is SuccessResponse<T> {
  return 'success' in response && response.success === true;
}

/**
 * Type guard to check if a user is an admin
 */
export function isAdmin(user: User | null | undefined): boolean {
  return user?.isAdmin === true;
}

/**
 * Type guard to check if a user is onboarded (TTU verified)
 */
export function isOnboarded(user: User | null | undefined): boolean {
  return user?.ttuVerified === true;
}
