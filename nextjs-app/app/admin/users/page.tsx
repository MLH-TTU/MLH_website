'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useToast } from '@/hooks/useToastCompat';
import type { User } from '@/lib/types';

/**
 * Admin Users Page
 * 
 * Features:
 * - Displays all TTU verified users
 * - Search functionality
 * - User details view with attendance history
 * - Manual point adjustment
 * - Manual attendance addition
 * - Redirects non-admin users to unauthorized page
 */
export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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

  // Fetch all TTU verified users
  useEffect(() => {
    if (!user || !user.isAdmin) {
      return;
    }

    const fetchUsers = async () => {
      setLoading(true);
      setError(null);

      try {
        const { auth } = await import('@/lib/firebase/config');
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          throw new Error('User not authenticated');
        }
        
        const idToken = await currentUser.getIdToken();
        
        const response = await fetch('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to fetch users');
        }
        
        const data = await response.json();
        
        // Convert ISO strings back to Firestore Timestamps
        const fetchedUsers: User[] = data.data.map((user: any) => ({
          ...user,
          createdAt: {
            toDate: () => new Date(user.createdAt),
            toMillis: () => new Date(user.createdAt).getTime(),
          } as any,
          updatedAt: {
            toDate: () => new Date(user.updatedAt),
            toMillis: () => new Date(user.updatedAt).getTime(),
          } as any,
          attendedEvents: user.attendedEvents.map((event: any) => ({
            ...event,
            eventDate: {
              toDate: () => new Date(event.eventDate),
              toMillis: () => new Date(event.eventDate).getTime(),
            } as any,
            attendedAt: {
              toDate: () => new Date(event.attendedAt),
              toMillis: () => new Date(event.attendedAt).getTime(),
            } as any,
          })),
        }));
        
        setUsers(fetchedUsers);
        setFilteredUsers(fetchedUsers);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching users:', err);
        setError(err.message || 'Failed to load users. Please try again.');
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(u => 
      u.displayName.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  // Handle view user details
  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
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
                <Link href="/admin/events">
                  <Button variant="ghost" size="sm">
                    Events
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
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">User Management</h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage TTU verified users and their attendance
              </p>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-4">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Users Count */}
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredUsers.length} of {users.length} users
        </div>

        {/* Users Table */}
        {filteredUsers.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto mb-8 w-24 h-24 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No Users Found
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {searchQuery 
                ? 'No users match your search criteria. Try a different search term.'
                : 'No TTU verified users found.'}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Points
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Events Attended
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((u) => (
                    <tr key={u.uid} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {u.displayName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {u.displayName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{u.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-red-600 dark:text-red-400">{u.points}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{u.attendedEvents.length}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button
                          onClick={() => handleViewDetails(u)}
                          variant="default"
                          size="sm"
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedUser(null);
          }}
          onUpdate={() => {
            // Refresh users list
            setShowDetailsModal(false);
            setSelectedUser(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

// User Details Modal Component
interface UserDetailsModalProps {
  user: User;
  onClose: () => void;
  onUpdate: () => void;
}

function UserDetailsModal({ user, onClose, onUpdate }: UserDetailsModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [eventId, setEventId] = useState('');
  const [events, setEvents] = useState<any[]>([]);

  // Fetch events for manual attendance
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { auth } = await import('@/lib/firebase/config');
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          return;
        }
        
        const idToken = await currentUser.getIdToken();
        
        const response = await fetch('/api/events', {
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setEvents(data.data);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchEvents();
  }, []);

  // Handle add points
  const handleAddPoints = async () => {
    if (!points || !reason) {
      toast.showError('Please enter points and reason');
      return;
    }

    const pointsNum = parseInt(points);
    if (isNaN(pointsNum)) {
      toast.showError('Points must be a valid number');
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
      
      const response = await fetch(`/api/admin/users/${user.uid}/add-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          points: pointsNum,
          reason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to add points');
      }

      toast.showSuccess('Points added successfully!');
      setPoints('');
      setReason('');
      onUpdate();
    } catch (error: any) {
      console.error('Error adding points:', error);
      toast.showError(error.message || 'Failed to add points');
    } finally {
      setLoading(false);
    }
  };

  // Handle add attendance
  const handleAddAttendance = async () => {
    if (!eventId) {
      toast.showError('Please select an event');
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
      
      const response = await fetch(`/api/admin/users/${user.uid}/add-attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          eventId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to add attendance');
      }

      toast.showSuccess('Attendance added successfully!');
      setEventId('');
      onUpdate();
    } catch (error: any) {
      console.error('Error adding attendance:', error);
      toast.showError(error.message || 'Failed to add attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-auto custom-scrollbar">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              User Details
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Info */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 h-16 w-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {user.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {user.displayName}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Points</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{user.points}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Events Attended</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{user.attendedEvents.length}</p>
              </div>
            </div>
          </div>

          {/* Attendance History */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Attendance History
            </h3>
            {user.attendedEvents.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">No events attended yet.</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                {user.attendedEvents.map((event, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {event.eventName}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {event.location}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {event.eventDate?.toDate?.()?.toLocaleDateString() || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                          +{event.pointsEarned} pts
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Points Form */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Add Points
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Points (can be negative)
                </label>
                <input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  placeholder="Enter points"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for adjustment"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <Button
                onClick={handleAddPoints}
                disabled={loading || !points || !reason}
                variant="default"
                size="default"
                className="w-full"
              >
                {loading ? 'Adding...' : 'Add Points'}
              </Button>
            </div>
          </div>

          {/* Add Attendance Form */}
          <div className="pb-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Manually Add Attendance
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Event
                </label>
                <select
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Select an event...</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                onClick={handleAddAttendance}
                disabled={loading || !eventId}
                variant="default"
                size="default"
                className="w-full"
              >
                {loading ? 'Adding...' : 'Add Attendance'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
