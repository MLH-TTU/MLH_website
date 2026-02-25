'use client';

import { Event } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';
import { AttendanceCodeInput } from './AttendanceCodeInput';
import { AdminEventControls } from './AdminEventControls';

interface EventCardProps {
  event: Event;
  isAdmin: boolean;
  userAttended: boolean;
  onSubmitCode?: (code: string) => Promise<void>;
  onGenerateCode?: () => Promise<void>;
  onToggleCode?: (active: boolean) => Promise<void>;
  onEdit?: () => void;
  onDelete?: () => void;
  onEndEvent?: () => Promise<void>;
}

/**
 * EventCard Component
 * 
 * Displays event information with conditional rendering based on user role and event state.
 * - Shows event details (name, description, date, time, location, points)
 * - Conditionally renders attendance input for onboarded users during ongoing events
 * - Conditionally renders admin controls for admin users
 */
export function EventCard({
  event,
  isAdmin,
  userAttended,
  onSubmitCode,
  onGenerateCode,
  onToggleCode,
  onEdit,
  onDelete,
  onEndEvent,
}: EventCardProps) {
  // Convert Firestore Timestamp to Date for display
  const startDate = event.startTime.toDate();
  
  const endDate = event.endTime ? event.endTime.toDate() : null;
  
  const now = new Date();
  const isOngoing = endDate ? (now >= startDate && now < endDate) : (event.status === 'active');
  const hasStarted = now >= startDate;
  
  // Determine if attendance input should be shown
  // Show if: user is onboarded (has onSubmitCode), event is ongoing, and user hasn't attended
  const showAttendanceInput = !isAdmin && isOngoing && !userAttended && onSubmitCode;
  
  // Format date and time
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      {/* Header with name and status */}
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          {event.name}
        </h3>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(event.status)}`}>
          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
        </span>
      </div>
      
      {/* Description */}
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        {event.description}
      </p>
      
      {/* Event details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{formatDate(startDate)}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            {formatTime(startDate)}
            {endDate && ` - ${formatTime(endDate)}`}
            {!endDate && event.status !== 'completed' && ' (Ongoing)'}
          </span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{event.location}</span>
        </div>
        
        <div className="flex items-center text-sm font-semibold text-red-600 dark:text-red-400">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <span>{event.pointsValue} Points</span>
        </div>
      </div>
      
      {/* Attendance status for regular users */}
      {!isAdmin && userAttended && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <p className="text-sm text-green-800 dark:text-green-200 font-medium">
            ✓ You attended this event
          </p>
        </div>
      )}
      
      {/* Attendance code input for regular users */}
      {showAttendanceInput && (
        <div className="mb-4">
          <AttendanceCodeInput
            eventId={event.id}
            onSubmit={onSubmitCode}
            disabled={false}
          />
        </div>
      )}
      
      {/* Admin controls */}
      {isAdmin && onGenerateCode && onToggleCode && onEdit && onDelete && (
        <AdminEventControls
          event={event}
          onGenerateCode={onGenerateCode}
          onToggleCode={onToggleCode}
          onEdit={onEdit}
          onDelete={onDelete}
          onEndEvent={onEndEvent}
        />
      )}
      
      {/* Attendee count */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {event.attendees.length} {event.attendees.length === 1 ? 'attendee' : 'attendees'}
        </p>
      </div>
    </div>
  );
}
