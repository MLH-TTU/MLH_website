import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  collection,
  where,
  getDocs,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { firestore } from '../firebase/config';

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
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Verification tracking
  verificationAttempts?: number;
  verificationExpiresAt?: Timestamp;
}

/**
 * Create a new user profile in Firestore (Client-side)
 * @param uid - Firebase user ID
 * @param data - Partial user profile data
 */
export async function createUserProfile(
  uid: string, 
  data: Partial<UserProfile>
): Promise<void> {
  try {
    const userRef = doc(firestore, 'users', uid);
    
    const profileData: Partial<UserProfile> = {
      uid,
      hasCompletedOnboarding: false,
      ...data,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };
    
    await setDoc(userRef, profileData);
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw new Error('Failed to create user profile');
  }
}

/**
 * Get user profile from Firestore (Client-side)
 * @param uid - Firebase user ID
 * @returns User profile or null if not found
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(firestore, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return null;
    }
    
    return userSnap.data() as UserProfile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw new Error('Failed to get user profile');
  }
}

/**
 * Update user profile in Firestore (Client-side)
 * @param uid - Firebase user ID
 * @param data - Partial user profile data to update
 */
export async function updateUserProfile(
  uid: string, 
  data: Partial<UserProfile>
): Promise<void> {
  try {
    const userRef = doc(firestore, 'users', uid);
    
    const updateData = {
      ...data,
      updatedAt: serverTimestamp() as Timestamp,
    };
    
    // Remove uid and email from update data to prevent modification
    delete (updateData as any).uid;
    delete (updateData as any).email;
    
    await updateDoc(userRef, updateData);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update user profile');
  }
}

/**
 * Check if a TTU email already exists in Firestore (Client-side)
 * @param ttuEmail - TTU email to check
 * @returns True if email exists, false otherwise
 */
export async function checkTTUEmailExists(ttuEmail: string): Promise<boolean> {
  try {
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('ttuEmail', '==', ttuEmail));
    const querySnapshot = await getDocs(q);
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking TTU email:', error);
    throw new Error('Failed to check TTU email');
  }
}

/**
 * Delete user profile from Firestore (Client-side)
 * Note: This only deletes the Firestore document, not the Firebase Auth user
 * @param uid - Firebase user ID
 */
export async function deleteUserProfile(uid: string): Promise<void> {
  try {
    const userRef = doc(firestore, 'users', uid);
    await deleteDoc(userRef);
  } catch (error) {
    console.error('Error deleting user profile:', error);
    throw new Error('Failed to delete user profile');
  }
}
