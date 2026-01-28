'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { 
  createUserProfile, 
  getUserProfile, 
  UserProfile 
} from '@/lib/services/userProfile.client';

// User interface matching the design document
// Using UserProfile type from the service
type User = UserProfile;

// Auth context value interface
interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile from Firestore using the user profile service
  const fetchUserProfile = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    try {
      // Try to get existing user profile
      const existingProfile = await getUserProfile(firebaseUser.uid);

      if (existingProfile) {
        return existingProfile;
      } else {
        // Create initial user profile for new users
        await createUserProfile(firebaseUser.uid, {
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL,
          provider: 'google',
        });

        // Fetch the newly created profile
        const newProfile = await getUserProfile(firebaseUser.uid);
        return newProfile;
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      throw err;
    }
  };

  // Store Firebase ID token in cookie via API route
  const storeAuthToken = async (firebaseUser: FirebaseUser) => {
    try {
      const idToken = await firebaseUser.getIdToken();
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });
    } catch (err) {
      console.error('Error storing auth token:', err);
      // Non-critical error, continue with authentication
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Store token in cookie
      await storeAuthToken(result.user);

      // Fetch or create user profile
      const userProfile = await fetchUserProfile(result.user);
      setUser(userProfile);
    } catch (err: any) {
      console.error('Error signing in with Google:', err);
      setError(err.message || 'Unable to sign in with Google. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);

      await firebaseSignOut(auth);

      // Clear auth cookie
      await fetch('/api/auth/session', {
        method: 'DELETE',
      });

      setUser(null);
    } catch (err: any) {
      console.error('Error signing out:', err);
      setError(err.message || 'Error signing out. Please try again.');
      // Clear local state even if sign out fails
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Refresh user profile from Firestore
  const refreshUser = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const userProfile = await fetchUserProfile(currentUser);
        setUser(userProfile);
      } catch (err) {
        console.error('Error refreshing user:', err);
      }
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Store token in cookie
          await storeAuthToken(firebaseUser);

          // Fetch user profile
          const userProfile = await fetchUserProfile(firebaseUser);
          setUser(userProfile);
        } else {
          setUser(null);
        }
      } catch (err: any) {
        console.error('Error in auth state change:', err);
        setError(err.message || 'Authentication error occurred.');
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
