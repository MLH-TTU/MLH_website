import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '../types';
import { apiClient } from '../utils/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (provider: string, email?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated on app load
  useEffect(() => {
    console.log('AuthProvider: Checking auth status on mount');
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('AuthProvider: Checking auth status...');
      setLoading(true);
      const response = await apiClient.auth.me();
      
      if (response.data.success && response.data.data) {
        console.log('AuthProvider: User authenticated:', response.data.data.email);
        setUser(response.data.data);
      } else {
        console.log('AuthProvider: No authenticated user - response:', response.data);
        setUser(null);
      }
    } catch (error: any) {
      console.log('AuthProvider: Auth check failed:', error.message, error.response?.status);
      setUser(null);
      
      // If we get a 401, clear any stale session data
      if (error.response?.status === 401) {
        console.log('AuthProvider: Clearing stale session data');
        // Clear any stored session data
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      }
    } finally {
      console.log('AuthProvider: Auth check complete, loading set to false');
      setLoading(false);
    }
  };

  const login = async (provider: string, email?: string) => {
    try {
      setLoading(true);
      setError(null);

      if (provider === 'email' && email) {
        // Handle magic link authentication
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        const response = await fetch(`${baseUrl}/auth/magic-link`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ email }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to send magic link');
        }

        // For magic link, we don't immediately set user - they need to click the link
        setError(null);
        
        // Show success message or redirect to check email page
        // This could be handled by the calling component
        
      } else {
        // Handle OAuth providers (Google, Microsoft)
        // Redirect to OAuth provider
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        const authUrl = `${baseUrl}/auth/${provider}`;
        window.location.href = authUrl;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await apiClient.auth.logout();
      setUser(null);
      setError(null);
      
      // Redirect to home page after successful logout
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails on server, clear local state and redirect
      setUser(null);
      setError(null);
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    await checkAuthStatus();
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    refreshUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};