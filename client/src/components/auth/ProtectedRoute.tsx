import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireOnboarding = false 
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute:', {
    path: location.pathname,
    user: user?.email,
    hasCompletedOnboarding: user?.hasCompletedOnboarding,
    loading,
    requireOnboarding
  });

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log('ProtectedRoute: Redirecting to login - no user');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Handle onboarding flow
  const currentPath = location.pathname;
  const hasCompletedOnboarding = user.hasCompletedOnboarding;

  // If user hasn't completed onboarding
  if (!hasCompletedOnboarding) {
    // Allow access to onboarding page
    if (currentPath === '/onboarding') {
      console.log('ProtectedRoute: Allowing access to onboarding page');
      return <>{children}</>;
    }
    // Redirect to onboarding for any other protected route
    console.log('ProtectedRoute: Redirecting to onboarding - user not onboarded');
    return <Navigate to="/onboarding" replace />;
  }

  // If user has completed onboarding
  if (hasCompletedOnboarding) {
    // Redirect away from onboarding page to profile
    if (currentPath === '/onboarding') {
      console.log('ProtectedRoute: Redirecting to profile - user already onboarded');
      return <Navigate to="/profile" replace />;
    }
    // Allow access to other protected routes
    console.log('ProtectedRoute: Allowing access to protected route');
    return <>{children}</>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;