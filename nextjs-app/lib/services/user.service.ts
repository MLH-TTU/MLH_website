import 'server-only';
import { getAdminFirestore } from '../firebase/admin';
import type { User, AttendedEvent } from '../types';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * User Service
 * 
 * Server-side service for user management operations including:
 * - Fetching user data
 * - Searching and filtering users
 * - Role and onboarding checks
 * - Attendance history retrieval
 * - Manual point adjustments with audit logging
 */

// ============================================================================
// Core User Operations
// ============================================================================

/**
 * Get a user by their UID
 * @param userId - Firebase user UID
 * @returns User object or null if not found
 */
export async function getUser(userId: string): Promise<User | null> {
  try {
    const db = getAdminFirestore();
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return null;
    }
    
    const data = userDoc.data();
    if (!data) {
      return null;
    }
    
    return {
      uid: userDoc.id,
      email: data.email || '',
      displayName: data.displayName || '',
      ttuVerified: data.ttuVerified ?? data.ttuEmailVerified ?? false,
      isAdmin: data.isAdmin ?? false,
      points: data.points ?? 0,
      attendedEvents: data.attendedEvents ?? [],
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    console.error('Error getting user:', error);
    throw new Error('Failed to get user');
  }
}

/**
 * Get all TTU verified users
 * @returns Array of TTU verified users
 */
export async function getTTUVerifiedUsers(): Promise<User[]> {
  try {
    const db = getAdminFirestore();
    const usersRef = db.collection('users');
    
    // Query for users where ttuVerified is true OR ttuEmailVerified is true
    const snapshot = await usersRef.where('ttuEmailVerified', '==', true).get();
    
    const users: User[] = [];
    
    snapshot.forEach((doc) => {
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
    
    return users;
  } catch (error) {
    console.error('Error getting TTU verified users:', error);
    throw new Error('Failed to get TTU verified users');
  }
}

/**
 * Search users by name or email
 * @param query - Search query string
 * @returns Array of users matching the search criteria
 */
export async function searchUsers(query: string): Promise<User[]> {
  try {
    const db = getAdminFirestore();
    const usersRef = db.collection('users');
    
    // Get all users (Firestore doesn't support full-text search natively)
    const snapshot = await usersRef.get();
    
    const queryLower = query.toLowerCase();
    const users: User[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const email = (data.email || '').toLowerCase();
      const displayName = (data.displayName || '').toLowerCase();
      
      // Check if query matches email or display name
      if (email.includes(queryLower) || displayName.includes(queryLower)) {
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
      }
    });
    
    return users;
  } catch (error) {
    console.error('Error searching users:', error);
    throw new Error('Failed to search users');
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a user is an admin
 * @param userId - Firebase user UID
 * @returns True if user is admin, false otherwise
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const user = await getUser(userId);
    return user?.isAdmin ?? false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Check if a user has completed onboarding (TTU verified)
 * @param userId - Firebase user UID
 * @returns True if user is onboarded, false otherwise
 */
export async function isOnboarded(userId: string): Promise<boolean> {
  try {
    const user = await getUser(userId);
    return user?.ttuVerified ?? false;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
}

/**
 * Get a user's attendance history
 * @param userId - Firebase user UID
 * @returns Array of attended events
 */
export async function getAttendanceHistory(userId: string): Promise<AttendedEvent[]> {
  try {
    const user = await getUser(userId);
    return user?.attendedEvents ?? [];
  } catch (error) {
    console.error('Error getting attendance history:', error);
    throw new Error('Failed to get attendance history');
  }
}

// ============================================================================
// Point Management
// ============================================================================

/**
 * Add points to a user with audit logging
 * Creates a PointAdjustment document and updates user's points atomically
 * 
 * @param userId - User receiving points
 * @param points - Points to add (can be negative)
 * @param reason - Reason for adjustment
 * @param adminUid - Admin UID making the adjustment
 * @returns The new total points for the user
 */
export async function addPoints(
  userId: string,
  points: number,
  reason: string,
  adminUid: string
): Promise<number> {
  try {
    const db = getAdminFirestore();
    
    // Use a transaction to ensure atomicity
    const newPoints = await db.runTransaction(async (transaction) => {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      const currentPoints = userData?.points ?? 0;
      const updatedPoints = currentPoints + points;
      
      // Update user's points
      transaction.update(userRef, {
        points: updatedPoints,
        updatedAt: Timestamp.now(),
      });
      
      // Create point adjustment record
      const adjustmentRef = db.collection('pointAdjustments').doc();
      transaction.set(adjustmentRef, {
        userId,
        points,
        reason,
        adjustedBy: adminUid,
        createdAt: Timestamp.now(),
      });
      
      return updatedPoints;
    });
    
    return newPoints;
  } catch (error) {
    console.error('Error adding points:', error);
    throw new Error('Failed to add points');
  }
}
