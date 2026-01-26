import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface NavigationProps {
  showAuthButtons?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ showAuthButtons = true }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
      // Force redirect even if logout fails
      window.location.href = '/';
    }
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center space-x-4">
            <img 
              src="https://static.mlh.io/brand-assets/logo/official/mlh-logo.png" 
              alt="MLH Logo" 
              className="h-8 w-auto"
            />
            <div className="h-8 w-px bg-gray-300"></div>
            <img 
              src="https://www.ttu.edu/traditions/images/DoubleT.gif" 
              alt="TTU Logo" 
              className="h-8 w-auto"
            />
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="/"
              className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
            >
              Home
            </a>
            <a
              href="/team"
              className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
            >
              Team
            </a>
            
            {showAuthButtons && (
              <>
                {user ? (
                  <>
                    <span className="text-sm text-gray-600">
                      Welcome, {user.firstName || user.email}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <a
                    href="/login"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Login
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;