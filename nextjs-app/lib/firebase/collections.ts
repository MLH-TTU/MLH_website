/**
 * Firestore Collection References and Type Helpers
 * 
 * This file provides typed collection references and helper functions
 * for interacting with Firestore collections.
 */

import {
  collection,
  CollectionReference,
  DocumentReference,
  doc,
  Firestore,
} from 'firebase/firestore';
import { getFirebaseFirestore } from './config';
import type {
  Event,
  User,
  PointAdjustment,
} from '../types';

// ============================================================================
// Collection Names
// ============================================================================

export const COLLECTION_NAMES = {
  EVENTS: 'events',
  USERS: 'users',
  POINT_ADJUSTMENTS: 'pointAdjustments',
} as const;

// ============================================================================
// Collection Reference Helpers
// ============================================================================

/**
 * Get a typed collection reference for events
 */
export function getEventsCollection(
  db?: Firestore
): CollectionReference<Event> {
  const firestore = db || getFirebaseFirestore();
  return collection(firestore, COLLECTION_NAMES.EVENTS) as CollectionReference<Event>;
}

/**
 * Get a typed collection reference for users
 */
export function getUsersCollection(
  db?: Firestore
): CollectionReference<User> {
  const firestore = db || getFirebaseFirestore();
  return collection(firestore, COLLECTION_NAMES.USERS) as CollectionReference<User>;
}

/**
 * Get a typed collection reference for point adjustments
 */
export function getPointAdjustmentsCollection(
  db?: Firestore
): CollectionReference<PointAdjustment> {
  const firestore = db || getFirebaseFirestore();
  return collection(firestore, COLLECTION_NAMES.POINT_ADJUSTMENTS) as CollectionReference<PointAdjustment>;
}

// ============================================================================
// Document Reference Helpers
// ============================================================================

/**
 * Get a typed document reference for a specific event
 */
export function getEventDoc(
  eventId: string,
  db?: Firestore
): DocumentReference<Event> {
  const firestore = db || getFirebaseFirestore();
  return doc(firestore, COLLECTION_NAMES.EVENTS, eventId) as DocumentReference<Event>;
}

/**
 * Get a typed document reference for a specific user
 */
export function getUserDoc(
  userId: string,
  db?: Firestore
): DocumentReference<User> {
  const firestore = db || getFirebaseFirestore();
  return doc(firestore, COLLECTION_NAMES.USERS, userId) as DocumentReference<User>;
}

/**
 * Get a typed document reference for a specific point adjustment
 */
export function getPointAdjustmentDoc(
  adjustmentId: string,
  db?: Firestore
): DocumentReference<PointAdjustment> {
  const firestore = db || getFirebaseFirestore();
  return doc(firestore, COLLECTION_NAMES.POINT_ADJUSTMENTS, adjustmentId) as DocumentReference<PointAdjustment>;
}

// ============================================================================
// Type Conversion Helpers
// ============================================================================

/**
 * Convert Firestore document data to Event type
 * Handles Timestamp conversion and ensures all required fields are present
 */
export function toEvent(id: string, data: any): Event {
  return {
    id,
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
  };
}

/**
 * Convert Firestore document data to User type
 * Handles Timestamp conversion and ensures all required fields are present
 */
export function toUser(uid: string, data: any): User {
  return {
    uid,
    email: data.email,
    displayName: data.displayName,
    ttuVerified: data.ttuVerified ?? false,
    isAdmin: data.isAdmin ?? false,
    points: data.points ?? 0,
    attendedEvents: data.attendedEvents ?? [],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/**
 * Convert Firestore document data to PointAdjustment type
 */
export function toPointAdjustment(id: string, data: any): PointAdjustment {
  return {
    id,
    userId: data.userId,
    points: data.points,
    reason: data.reason,
    adjustedBy: data.adjustedBy,
    createdAt: data.createdAt,
  };
}

// ============================================================================
// Data Validation Helpers
// ============================================================================

/**
 * Validate event data has all required fields
 */
export function isValidEventData(data: any): boolean {
  return (
    typeof data.name === 'string' &&
    typeof data.description === 'string' &&
    data.startTime !== undefined &&
    data.endTime !== undefined &&
    typeof data.location === 'string' &&
    typeof data.pointsValue === 'number' &&
    typeof data.createdBy === 'string' &&
    typeof data.status === 'string'
  );
}

/**
 * Validate user data has all required fields
 */
export function isValidUserData(data: any): boolean {
  return (
    typeof data.email === 'string' &&
    typeof data.displayName === 'string' &&
    data.createdAt !== undefined
  );
}

/**
 * Validate point adjustment data has all required fields
 */
export function isValidPointAdjustmentData(data: any): boolean {
  return (
    typeof data.userId === 'string' &&
    typeof data.points === 'number' &&
    typeof data.reason === 'string' &&
    typeof data.adjustedBy === 'string' &&
    data.createdAt !== undefined
  );
}
