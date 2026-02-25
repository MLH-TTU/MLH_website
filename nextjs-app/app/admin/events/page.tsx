'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/LoadingScreen';
import { EventCard } from '@/components/EventCard';
import { EventCreateForm } from '@/components/EventCreateForm';
import { EventEditForm } from '@/components/EventEditForm';
import { useToast } from '@/hooks/useToastCompat';
import type { Event, EventStatus } from '@/lib/types';

/**
 * Admin Events Page
 * 
 * Features:
 * - Displays all events using real-time listeners
 * - Filtering and sorting by status
 * - Admin controls for each event
 * - Redirects non-admin users to unauthorized page
 */
export default function AdminEventsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');

  // Redirect non-admin users
  useEffect(() => {
    if (authLoading) {
      return;
    }
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!user.isAdmin) {
      router.push('/');
      return;
    }
  }, [user, authLoading, router]);

  // Fetch events function (extracted so it can be called from handlers)
  const fetchEvents = async () => {
    try {
      const { auth } = await import('@/lib/firebase/config');
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      const idToken = await currentUser.getIdToken();
      
      const response = await fetch('/api/events', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });
      
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch events');
      }
      
      const data = await response.json();
      
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

  // Fetch all events using API route with polling
  useEffect(() => {
    if (!user || !user.isAdmin) {
      return;
    }

    setLoading(true);
    setError(null);

    // Initial fetch
    fetchEvents();
    
    // Poll for updates every 10 seconds
    const pollInterval = setInterval(fetchEvents, 10000);
    
    return () => clearInterval(pollInterval);
  }, [user]);

  // Apply status filter
  useEffect(() => {
    // Filter out cleaned up events (removed from admin page 24h after completion)
    const activeEvents = events.filter(event => !event.cleanedUp);
    
    if (statusFilter === 'all') {
      setFilteredEvents(activeEvents);
    } else {
      setFilteredEvents(activeEvents.filter(event => event.status === statusFilter));
    }
  }, [events, statusFilter]);

  // Handle generate attendance code
  const handleGenerateCode = async (eventId: string) => {
    try {
      const { auth } = await import('@/lib/firebase/config');
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      const idToken = await currentUser.getIdToken();
      
      const response = await fetch(`/api/admin/events/${eventId}/generate-code`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to generate attendance code');
      }

      setGeneratedCode(data.data.code);
      setShowCodeModal(true);
      toast.showSuccess('Attendance code generated successfully!');
    } catch (error: any) {
      console.error('Error generating attendance code:', error);
      toast.showError(error.message || 'Failed to generate attendance code');
    }
  };

  // Handle toggle attendance code
  const handleToggleCode = async (eventId: string, active: boolean) => {
    try {
      const { auth } = await import('@/lib/firebase/config');
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      const idToken = await currentUser.getIdToken();
      
      const response = await fetch(`/api/admin/events/${eventId}/toggle-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ active }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to toggle attendance code');
      }

      toast.showSuccess(`Attendance code ${active ? 'activated' : 'deactivated'} successfully!`);
    } catch (error: any) {
      console.error('Error toggling attendance code:', error);
      toast.showError(error.message || 'Failed to toggle attendance code');
    }
  };

  // Handle edit event
  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setShowEditModal(true);
  };

  // Handle delete event
  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    setLoading(true);
    try {
      const { auth } = await import('@/lib/firebase/config');
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      const idToken = await currentUser.getIdToken();
      
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to delete event');
      }

      toast.showSuccess('Event deleted successfully!');
      
      // Refetch events to update UI
      await fetchEvents();
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast.showError(error.message || 'Failed to delete event');
      setLoading(false);
    }
  };

  // Handle end event
  const handleEndEvent = async (eventId: string) => {
    setLoading(true);
    try {
      const { auth } = await import('@/lib/firebase/config');
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      const idToken = await currentUser.getIdToken();
      
      const response = await fetch(`/api/admin/events/${eventId}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to end event');
      }

      toast.showSuccess('Event ended successfully!');
      
      // Refetch events to update UI
      await fetchEvents();
    } catch (error: any) {
      console.error('Error ending event:', error);
      toast.showError(error.message || 'Failed to end event');
      setLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading || loading) {
    return <LoadingScreen message="Loading..." />;
  }

  // Don't render anything if user is not logged in or not admin (redirect will happen via useEffect)
  if (!user || !user.isAdmin) {
    return null;
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
                <Link href="/admin/users">
                  <Button variant="ghost" size="sm">
                    Users
                  </Button>
                </Link>
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
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Admin Events</h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage all events and attendance codes
              </p>
            </div>
            
            {/* Create Event Button */}
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="default"
              size="default"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Event
            </Button>
          </div>
        </div>

        {/* Filter Section */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filter by Status:
            </label>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'upcoming', 'active', 'completed', 'cancelled'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
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
        {filteredEvents.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto mb-8 w-24 h-24 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No Events Found
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {statusFilter === 'all' 
                ? 'Create your first event to get started!'
                : `No ${statusFilter} events found. Try a different filter.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isAdmin={true}
                userAttended={false}
                onGenerateCode={() => handleGenerateCode(event.id)}
                onToggleCode={(active) => handleToggleCode(event.id, active)}
                onEdit={() => handleEdit(event)}
                onDelete={() => handleDelete(event.id)}
                onEndEvent={() => handleEndEvent(event.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create Event Modal */}
      {showCreateModal && (
        <EventCreateForm
          onClose={() => setShowCreateModal(false)}
          onSuccess={async () => {
            setShowCreateModal(false);
            setLoading(true);
            await fetchEvents();
          }}
        />
      )}

      {/* Edit Event Modal */}
      {showEditModal && editingEvent && (
        <EventEditForm
          event={editingEvent}
          onClose={() => {
            setShowEditModal(false);
            setEditingEvent(null);
          }}
          onSuccess={async () => {
            setShowEditModal(false);
            setEditingEvent(null);
            setLoading(true);
            await fetchEvents();
          }}
        />
      )}

      {/* Code Display Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Attendance Code Generated
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Share this code with attendees:
              </p>
              <p className="text-5xl font-mono font-bold text-red-600 dark:text-red-400 tracking-wider">
                {generatedCode}
              </p>
            </div>
            <Button
              onClick={() => setShowCodeModal(false)}
              variant="default"
              size="default"
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
