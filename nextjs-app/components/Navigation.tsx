'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToastCompat';
import { SUCCESS_MESSAGES } from '@/lib/constants/errorMessages';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Navigation() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.showSuccess(SUCCESS_MESSAGES.SIGN_OUT_SUCCESS);
      router.push('/');
    } catch (error) {
      console.error('Sign out failed:', error);
      toast.showError('Error signing out. Redirecting to home page.');
      // Force redirect even if sign out fails
      router.push('/');
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3">
              <img 
                src="https://static.mlh.io/brand-assets/logo/official/mlh-logo-color.png?_gl=1*1c1b6mh*_ga*MTYxMTA5MjU0NC4xNzY4NjcxMDIw*_ga_E5KT6TC4TK*czE3NjkyODk3ODUkbzQkZzAkdDE3NjkyODk3ODgkajU3JGwwJGgw" 
                alt="MLH Logo" 
                className="h-8 w-auto object-contain"
              />
              <div className="h-8 w-px bg-gray-300 dark:bg-gray-600 transition-colors duration-200"></div>
              <img 
                src="https://www.ttu.edu/traditions/images/DoubleT.gif" 
                alt="TTU Logo" 
                className="h-8 w-auto object-contain"
              />
            </Link>
          </div>

          {/* Desktop Navigation - 1.5rem spacing (space-x-6 = 1.5rem) */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors duration-100"
            >
              Home
            </Link>
            <Link
              href="/team"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors duration-100"
            >
              Team
            </Link>
            
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {user ? (
              <>
                {/* User Avatar and Name */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                        <svg className="h-5 w-5 text-gray-400 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      </div>
                    )}
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {user.firstName || user.displayName || user.email}
                    </span>
                  </div>
                  
                  <Link
                    href="/profile"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-md text-sm font-medium transition-colors duration-100 min-h-[44px] flex items-center justify-center"
                  >
                    Profile
                  </Link>
                  
                  <button
                    onClick={handleSignOut}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-md text-sm font-medium transition-colors duration-100 min-h-[44px]"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-md text-sm font-medium transition-colors duration-100 min-h-[44px] flex items-center justify-center"
              >
                Login
              </Link>
            )}
          </nav>

          {/* Mobile menu button - Visible only on mobile */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors duration-100 min-w-[44px] min-h-[44px]"
              aria-controls="mobile-menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">{mobileMenuOpen ? 'Close main menu' : 'Open main menu'}</span>
              {mobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu - 1rem spacing (space-y-4 = 1rem) */}
      <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`} id="mobile-menu">
        <div className="px-2 pt-2 pb-3 space-y-4 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/"
            className="block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 text-base font-medium transition-colors duration-100 px-3 py-3 rounded-md min-h-[44px]"
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            href="/team"
            className="block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 text-base font-medium transition-colors duration-100 px-3 py-3 rounded-md min-h-[44px]"
            onClick={() => setMobileMenuOpen(false)}
          >
            Team
          </Link>
          
          {/* Theme Toggle for Mobile */}
          <div className="px-3 py-2">
            <ThemeToggle />
          </div>
          
          {user ? (
            <>
              <div className="flex items-center space-x-3 px-3 py-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                    <svg className="h-6 w-6 text-gray-400 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                )}
                <span className="text-base font-medium text-gray-700 dark:text-gray-200">
                  {user.firstName || user.displayName || user.email}
                </span>
              </div>
              
              <Link
                href="/profile"
                className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-md text-base font-medium transition-colors duration-100 text-center min-h-[44px]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Profile
              </Link>
              
              <button
                onClick={() => {
                  handleSignOut();
                  setMobileMenuOpen(false);
                }}
                className="block w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-md text-base font-medium transition-colors duration-100 text-center min-h-[44px]"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="block w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-md text-base font-medium transition-colors duration-100 text-center min-h-[44px]"
              onClick={() => setMobileMenuOpen(false)}
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
