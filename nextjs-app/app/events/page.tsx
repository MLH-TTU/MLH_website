'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/LoadingScreen';
import { EventCard } from '@/components/EventCard';
import { useToast } from '@/hooks/useToastCompat';
import type { Event } from '@/lib/types';

/**
 * Events Page for Regular Users
 * 
 * Features:
 * - Displays ongoing events (between start and end time)
 * - Real-time updates using Firestore listeners
 * - Attendance code submission
 * - User points and attendance history display
 * - Redirects non-onboarded users to onboarding
 */
export default function EventsPage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const toast = useToast();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect non-onboarded users to onboarding
  useEffect(() => {
    if (authLoading) {
      return; // Still loading, don't redirect yet
    }
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!user.ttuEmailVerified) {
      router.push('/onboarding');
      return;
    }
  }, [user, authLoading, router]);

  // Fetch ongoing events using API route with polling
  useEffect(() => {
    if (!user || !user.ttuEmailVerified) {
      return;
    }

    setLoading(true);
    setError(null);

    const fetchEvents = async () => {
      try {
        console.log('Fetching events for user:', user.uid);
        
        // Get the current user's ID token
        const { auth } = await import('@/lib/firebase/config');
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          throw new Error('User not authenticated');
        }
        
        const idToken = await currentUser.getIdToken();
        
        const response = await fetch('/api/events?ongoing=true', {
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to fetch events');
        }
        
        const data = await response.json();
        console.log('Events fetched:', data.data.length);
        
        // Convert ISO strings back to Firestore Timestamps
        const fetchedEvents: Event[] = data.data.map((event: any) => ({
          ...event,
          startTime: {
            toDate: () => new Date(event.startTime),
            toMillis: () => new Date(event.startTime).getTime(),
          } as any,
          endTime: event.endTime ? {
            toDate: () => new Date(event.endTime),
            toMillis: () => new Date(event.endTime).getTime(),
          } as any : null,
          createdAt: {
            toDate: () => new Date(event.createdAt),
            toMillis: () => new Date(event.createdAt).getTime(),
          } as any,
          updatedAt: {
            toDate: () => new Date(event.updatedAt),
            toMillis: () => new Date(event.updatedAt).getTime(),
          } as any,
        }));
        
        setEvents(fetchedEvents);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching events:', err);
        setError(err.message || 'Failed to load events. Please try again.');
        setLoading(false);
      }
    };

    // Initial fetch
    fetchEvents();
    
    // Poll for updates every 10 seconds (simulates real-time updates)
    const pollInterval = setInterval(fetchEvents, 10000);
    
    return () => clearInterval(pollInterval);
  }, [user]);

  // Handle attendance code submission
  const handleSubmitCode = async (code: string) => {
    try {
      const response = await fetch('/api/attendance/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to submit attendance code');
      }

      toast.showSuccess(data.message || 'Attendance recorded successfully!');
      
      // Refresh user data to update points and attendance history
      await refreshUser();
      
      // The real-time listener will automatically update the events
    } catch (error: any) {
      console.error('Error submitting attendance code:', error);
      throw error;
    }
  };

  // Check if user has attended an event
  const hasUserAttended = (event: Event): boolean => {
    return event.attendees.includes(user?.uid || '');
  };

  if (authLoading || loading) {
    return <LoadingScreen message="Loading..." />;
  }

  if (!user || !user.ttuEmailVerified) {
    return <LoadingScreen message="Loading..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 font-sans transition-colors duration-200">
      {/* Floating Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 py-3">
        <div className="mx-auto max-w-4xl">
          <div className="mx-auto w-fit rounded-full px-8 py-3 bg-white/10 dark:bg-gray-800/30 backdrop-blur-[20px] backdrop-saturate-[180%] border border-white/20 dark:border-gray-700/30 shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)]">
            <div className="flex items-center justify-between min-w-[300px] gap-6">
              <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                <img src="https://static.mlh.io/brand-assets/logo/official/mlh-logo-color.png" alt="MLH Logo" className="h-6 w-auto" />
                <div className="h-7 w-px bg-gray-400"></div>
                <img src="https://www.ttu.edu/traditions/images/DoubleT.gif" alt="TTU Logo" className="h-6 w-auto" />
              </Link>
              <div className="flex items-center gap-4">
                <Link href="/profile">
                  <Button variant="ghost" size="sm">
                    Profile
                  </Button>
                </Link>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Ongoing Events</h1>
              <p className="text-gray-600 dark:text-gray-300">
                Submit attendance codes to earn points
              </p>
            </div>
            
            {/* User Points Display */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Your Points</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {user.points || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto mb-8 w-24 h-24 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No Ongoing Events
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              There are no events happening right now. Check back later!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isAdmin={false}
                userAttended={hasUserAttended(event)}
                onSubmitCode={handleSubmitCode}
              />
            ))}
          </div>
        )}

        {/* Attendance History Section */}
        {user.attendedEvents && user.attendedEvents.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Your Attendance History
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Points
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {user.attendedEvents.map((attendedEvent, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {attendedEvent.eventName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {attendedEvent.eventDate.toDate().toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {attendedEvent.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600 dark:text-red-400">
                          +{attendedEvent.pointsEarned}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
