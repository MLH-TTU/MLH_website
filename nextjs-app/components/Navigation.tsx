'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { AttendanceCodeModal } from '@/components/AttendanceCodeModal';

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [hasActiveEvents, setHasActiveEvents] = useState(false);
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const adminDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close admin dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target as Node)) {
        setAdminDropdownOpen(false);
      }
    };

    if (adminDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [adminDropdownOpen]);

  // Check for active events (for non-admin users)
  useEffect(() => {
    const checkActiveEvents = async () => {
      if (!user || user.isAdmin || !user.hasCompletedOnboarding) {
        setHasActiveEvents(false);
        return;
      }

      try {
        const { auth } = await import('@/lib/firebase/config');
        const currentUser = auth.currentUser;
        
        if (!currentUser) return;
        
        const idToken = await currentUser.getIdToken();
        
        const response = await fetch('/api/events/active', {
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setHasActiveEvents(data.hasActiveEvents);
        }
      } catch (error) {
        console.error('Error checking active events:', error);
      }
    };

    checkActiveEvents();
    
    // Poll every 30 seconds
    const interval = setInterval(checkActiveEvents, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  return (
    <>
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'py-2' : 'py-3'
    } ${!prefersReducedMotion ? 'animate-on-load animate-fade-in' : ''}`}>
      <div className={`mx-auto transition-all duration-300 ${
        isScrolled 
          ? 'max-w-4xl' 
          : 'max-w-7xl'
      }`}>
        <div 
          className={`transition-all duration-300 ${
            isScrolled
              ? 'mx-auto w-fit rounded-full px-4 md:px-8 py-3 bg-white/10 dark:bg-gray-800/30 backdrop-blur-[20px] backdrop-saturate-[180%] border border-white/20 dark:border-gray-700/30 shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)]'
              : 'px-4 md:px-8 py-4 rounded-none'
          }`}
        >
          <div className={`flex items-center justify-between ${
            isScrolled ? 'md:min-w-[900px]' : ''
          }`}>
            {/* Left side - Logo/Brand */}
            <Link href="/" className="flex items-center space-x-4">
              <img 
                src="https://static.mlh.io/brand-assets/logo/official/mlh-logo-color.png?_gl=1*1c1b6mh*_ga*MTYxMTA5MjU0NC4xNzY4NjcxMDIw*_ga_E5KT6TC4TK*czE3NjkyODk3ODUkbzQkZzAkdDE3NjkyODk3ODgkajU3JGwwJGgw" 
                alt="MLH Logo" 
                className={`w-auto transition-all duration-300 ${
                  isScrolled ? 'h-6' : 'h-7'
                }`}
              />
              {/* Vertical separator line */}
              <div className={`w-px bg-gray-400 transition-all duration-300 ${
                isScrolled ? 'h-7' : 'h-8'
              }`}></div>
              {/* TTU Logo */}
              <img 
                src="https://www.ttu.edu/traditions/images/DoubleT.gif" 
                alt="TTU Logo" 
                className={`w-auto transition-all duration-300 ${
                  isScrolled ? 'h-6' : 'h-7'
                }`}
              />
            </Link>
            
            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/#about" className={`text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors ${
                isScrolled ? 'text-sm' : 'text-base'
              }`}>
                About
              </Link>
              <Link href="/#events" className={`text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors ${
                isScrolled ? 'text-sm' : 'text-base'
              }`}>
                Events
              </Link>
              <Link href="/team" className={`text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors ${
                isScrolled ? 'text-sm' : 'text-base'
              }`}>
                Team
              </Link>
              
              {/* Admin dropdown - Show only to admins */}
              {user && user.isAdmin && (
                <div className="relative" ref={adminDropdownRef}>
                  <button
                    onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                    className={`flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors ${
                      isScrolled ? 'text-sm' : 'text-base'
                    }`}
                  >
                    Admin
                    <svg 
                      className={`w-4 h-4 transition-transform ${adminDropdownOpen ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Dropdown menu */}
                  {adminDropdownOpen && (
                    <div className="absolute top-full mt-2 right-0 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                      <Link
                        href="/admin/events"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setAdminDropdownOpen(false)}
                      >
                        Events
                      </Link>
                      <Link
                        href="/admin/users"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setAdminDropdownOpen(false)}
                      >
                        Users
                      </Link>
                    </div>
                  )}
                </div>
              )}
              
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* Auth buttons */}
              <div className="flex items-center space-x-4">
                {loading ? (
                  <div className="w-20 h-9 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                ) : user ? (
                  user.hasCompletedOnboarding ? (
                    <>
                      {/* Show Enter Code button if there are active events (non-admin only) */}
                      {!user.isAdmin && hasActiveEvents && (
                        <Button 
                          onClick={() => setShowAttendanceModal(true)}
                          size={isScrolled ? 'sm' : 'default'}
                          variant="success"
                        >
                          Enter Code
                        </Button>
                      )}
                      
                      {/* Profile photo */}
                      <button
                        onClick={() => router.push('/profile')}
                        className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                      >
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.firstName || 'Profile'}
                            referrerPolicy="no-referrer"
                            className={`rounded-full border-2 border-gray-300 dark:border-gray-600 ${
                              isScrolled ? 'w-8 h-8' : 'w-10 h-10'
                            }`}
                          />
                        ) : (
                          <div className={`rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold ${
                            isScrolled ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base'
                          }`}>
                            {user.firstName?.[0] || user.email?.[0] || 'U'}
                          </div>
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      <Button 
                        onClick={() => router.push('/onboarding')}
                        size={isScrolled ? 'sm' : 'default'}
                        variant="default"
                      >
                        Complete Onboarding
                      </Button>
                      <Button 
                        onClick={async () => {
                          await signOut();
                          if (typeof window !== 'undefined') {
                            window.location.reload();
                          }
                        }}
                        size={isScrolled ? 'sm' : 'default'}
                        variant="outline"
                      >
                        Sign Out
                      </Button>
                    </>
                  )
                ) : (
                  <Button 
                    onClick={() => router.push('/login')}
                    size={isScrolled ? 'sm' : 'default'}
                  >
                    Sign In
                  </Button>
                )}
              </div>
              
              <Button 
                variant="secondary"
                size={isScrolled ? 'sm' : 'default'}
              >
                Join Discord
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle />
              <Button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                variant="ghost"
                size="icon"
                className="min-w-[44px] min-h-[44px]"
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
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 pt-2 pb-3 space-y-3">
              <Link 
                href="/#about" 
                className="block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-3 rounded-md text-base font-medium transition-colors duration-100 min-h-[44px]"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                href="/#events" 
                className="block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-3 rounded-md text-base font-medium transition-colors duration-100 min-h-[44px]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Events
              </Link>
              <Link 
                href="/team" 
                className="block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-3 rounded-md text-base font-medium transition-colors duration-100 min-h-[44px]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Team
              </Link>
              
              {/* Admin section - Show only to admins */}
              {user && user.isAdmin && (
                <>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Admin
                  </div>
                  <Link 
                    href="/admin/events" 
                    className="block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-3 rounded-md text-base font-medium transition-colors duration-100 min-h-[44px]"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Events
                  </Link>
                  <Link 
                    href="/admin/users" 
                    className="block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-3 rounded-md text-base font-medium transition-colors duration-100 min-h-[44px]"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Users
                  </Link>
                </>
              )}
              
              {/* Auth buttons for mobile */}
              {loading ? (
                <div className="px-3 py-2">
                  <div className="w-full h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
                </div>
              ) : user ? (
                user.hasCompletedOnboarding ? (
                  <>
                    {/* Show Enter Code button if there are active events (non-admin only) */}
                    {!user.isAdmin && hasActiveEvents && (
                      <Button 
                        onClick={() => {
                          setShowAttendanceModal(true);
                          setMobileMenuOpen(false);
                        }}
                        variant="success"
                        className="w-full"
                      >
                        Enter Code
                      </Button>
                    )}
                    
                    <div className="flex items-center gap-3 px-3 py-2">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.firstName || 'Profile'}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full border-2 border-gray-300 dark:border-gray-600"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold">
                          {user.firstName?.[0] || user.email?.[0] || 'U'}
                        </div>
                      )}
                      <span className="text-gray-600 dark:text-gray-300 text-base">
                        {user.firstName || user.email}
                      </span>
                    </div>
                    
                    <Button 
                      onClick={() => {
                        router.push('/profile');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full"
                    >
                      Profile
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      onClick={() => {
                        router.push('/onboarding');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full"
                    >
                      Complete Onboarding
                    </Button>
                    <Button 
                      onClick={async () => {
                        await signOut();
                        setMobileMenuOpen(false);
                        if (typeof window !== 'undefined') {
                          window.location.reload();
                        }
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Sign Out
                    </Button>
                  </>
                )
              ) : (
                <Button 
                  onClick={() => {
                    router.push('/login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full"
                >
                  Sign In
                </Button>
              )}
              
              <Button 
                onClick={() => setMobileMenuOpen(false)}
                variant="secondary"
                className="w-full"
              >
                Join Discord
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
    
    {/* Attendance Code Modal */}
    {showAttendanceModal && (
      <AttendanceCodeModal
        onClose={() => setShowAttendanceModal(false)}
        onSuccess={() => {
          // Refresh to update user points
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }}
      />
    )}
  </>
  );
}
