import 'server-only';
import { getAdminFirestore, getAdminAuth } from '../firebase/admin';
import type { Timestamp } from 'firebase-admin/firestore';

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

/**
 * User Profile interface matching Firestore schema
 */
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  provider?: string;
  hasCompletedOnboarding: boolean;
  
  // TTU Verification
  ttuEmail?: string;
  ttuEmailVerified?: boolean;
  
  // Profile Information
  firstName?: string;
  lastName?: string;
  major?: string;
  rNumber?: string;
  universityLevel?: 'freshman' | 'sophomore' | 'junior' | 'senior' | 'graduate' | 'other';
  aspiredPosition?: string;
  
  // Social Links
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  
  // Files
  profilePictureId?: string;
  resumeId?: string;
  
  // Admin and Event Management
  isAdmin: boolean;              // Admin role flag (default: false)
  points: number;                // Total accumulated points (default: 0)
  attendedEvents: AttendedEvent[]; // Array of attended event details
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Verification tracking
  verificationAttempts?: number;
  verificationExpiresAt?: Timestamp;
}

/**
 * Server-side function to get user profile using Admin SDK
 * @param uid - Firebase user ID
 * @returns User profile or null if not found
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const db = getAdminFirestore();
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
      return null;
    }
    
    return userSnap.data() as UserProfile;
  } catch (error) {
    console.error('Error getting user profile (server):', error);
    throw new Error('Failed to get user profile');
  }
}

/**
 * Server-side function to create user profile using Admin SDK
 * @param uid - Firebase user ID
 * @param data - Partial user profile data
 */
export async function createUserProfile(
  uid: string, 
  data: Partial<UserProfile>
): Promise<void> {
  try {
    const db = getAdminFirestore();
    const userRef = db.collection('users').doc(uid);
    
    const now = new Date();
    const profileData: Partial<UserProfile> = {
      uid,
      hasCompletedOnboarding: false,
      isAdmin: false,              // Default to non-admin
      points: 0,                   // Default to 0 points
      attendedEvents: [],          // Default to empty array
      ...data,
      createdAt: now as any,
      updatedAt: now as any,
    };
    
    await userRef.set(profileData);
  } catch (error) {
    console.error('Error creating user profile (server):', error);
    throw new Error('Failed to create user profile');
  }
}

/**
 * Server-side function to update user profile using Admin SDK
 * @param uid - Firebase user ID
 * @param data - Partial user profile data to update
 */
export async function updateUserProfile(
  uid: string, 
  data: Partial<UserProfile>
): Promise<void> {
  try {
    const db = getAdminFirestore();
    const userRef = db.collection('users').doc(uid);
    
    const now = new Date();
    const updateData = {
      ...data,
      updatedAt: now,
    };
    
    // Remove uid, email, and isAdmin from update data to prevent modification
    delete (updateData as any).uid;
    delete (updateData as any).email;
    delete (updateData as any).isAdmin;  // Prevent role modification through app interface
    
    await userRef.update(updateData);
  } catch (error) {
    console.error('Error updating user profile (server):', error);
    throw new Error('Failed to update user profile');
  }
}

/**
 * Server-side function to check if TTU email exists using Admin SDK
 * @param ttuEmail - TTU email to check
 * @returns True if email exists, false otherwise
 */
export async function checkTTUEmailExists(ttuEmail: string): Promise<boolean> {
  try {
    const db = getAdminFirestore();
    const usersRef = db.collection('users');
    const querySnapshot = await usersRef.where('ttuEmail', '==', ttuEmail).get();
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking TTU email (server):', error);
    throw new Error('Failed to check TTU email');
  }
}

/**
 * Server-side function to delete user profile and Firebase Auth user
 * @param uid - Firebase user ID
 */
export async function deleteUserProfile(uid: string): Promise<void> {
  try {
    const db = getAdminFirestore();
    const auth = getAdminAuth();
    
    // Delete Firestore document
    await db.collection('users').doc(uid).delete();
    
    // Delete Firebase Auth user
    try {
      await auth.deleteUser(uid);
    } catch (authError) {
      console.error('Error deleting Firebase Auth user:', authError);
      // Continue even if auth deletion fails
    }
  } catch (error) {
    console.error('Error deleting user profile (server):', error);
    throw new Error('Failed to delete user profile');
  }
}
