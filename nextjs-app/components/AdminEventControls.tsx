'use client';

import { useState } from 'react';
import { Event } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';
import { Button } from './ui/Button';

interface AdminEventControlsProps {
  event: Event;
  onGenerateCode: () => Promise<void>;
  onToggleCode: (active: boolean) => Promise<void>;
  onEdit: () => void;
  onDelete: () => void;
  onEndEvent?: () => Promise<void>;
}

/**
 * AdminEventControls Component
 * 
 * Admin-only controls for event management.
 * Features:
 * - Generate attendance code button (disabled before start time)
 * - Toggle code active/inactive button
 * - End event button (visible after event starts, before it ends)
 * - Edit button (disabled after start time)
 * - Delete button with confirmation
 * - Display current code and status
 */
export function AdminEventControls({
  event,
  onGenerateCode,
  onToggleCode,
  onEdit,
  onDelete,
  onEndEvent,
}: AdminEventControlsProps) {
  const [generatingCode, setGeneratingCode] = useState(false);
  const [togglingCode, setTogglingCode] = useState(false);
  const [endingEvent, setEndingEvent] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [codeVisible, setCodeVisible] = useState(false);
  
  // Convert Firestore Timestamp to Date
  const startDate = event.startTime.toDate();
  
  const now = new Date();
  const hasStarted = now >= startDate;
  const hasEnded = event.status === 'completed' || event.status === 'cancelled';
  const hasCode = !!event.attendanceCode;
  const canEndEvent = hasStarted && !hasEnded;
  
  // Handle code generation
  const handleGenerateCode = async () => {
    setGeneratingCode(true);
    try {
      await onGenerateCode();
    } catch (error) {
      console.error('Error generating code:', error);
    } finally {
      setGeneratingCode(false);
    }
  };
  
  // Handle code toggle
  const handleToggleCode = async () => {
    setTogglingCode(true);
    try {
      await onToggleCode(!event.codeActive);
    } catch (error) {
      console.error('Error toggling code:', error);
    } finally {
      setTogglingCode(false);
    }
  };
  
  // Handle end event
  const handleEndEvent = async () => {
    if (!onEndEvent) return;
    
    if (!confirm('Are you sure you want to end this event? This action cannot be undone.')) {
      return;
    }
    
    setEndingEvent(true);
    try {
      await onEndEvent();
    } catch (error) {
      console.error('Error ending event:', error);
    } finally {
      setEndingEvent(false);
    }
  };
  
  // Handle delete with confirmation
  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete();
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      // Auto-hide confirmation after 5 seconds
      setTimeout(() => {
        setShowDeleteConfirm(false);
      }, 5000);
    }
  };

  return (
    <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
      {/* Attendance Code Section */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Attendance Code
        </h4>
        
        {hasCode ? (
          <div className="space-y-3">
            {/* Code display */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
                  {codeVisible ? event.attendanceCode : '••••••'}
                </span>
                <button
                  onClick={() => setCodeVisible(!codeVisible)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label={codeVisible ? 'Hide code' : 'Show code'}
                >
                  {codeVisible ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              
              {/* Status badge */}
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                event.codeActive 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
              }`}>
                {event.codeActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            {/* Toggle button */}
            <Button
              onClick={handleToggleCode}
              disabled={togglingCode}
              variant={event.codeActive ? 'outline' : 'success'}
              size="sm"
              className="w-full"
            >
              {togglingCode ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {event.codeActive ? 'Deactivating...' : 'Activating...'}
                </span>
              ) : (
                event.codeActive ? 'Deactivate Code' : 'Activate Code'
              )}
            </Button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              No attendance code generated yet.
              {!hasStarted && ' Code can be generated after event starts.'}
            </p>
            <Button
              onClick={handleGenerateCode}
              disabled={!hasStarted || generatingCode}
              variant="success"
              size="sm"
              className="w-full"
            >
              {generatingCode ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </span>
              ) : (
                'Generate Code'
              )}
            </Button>
            {!hasStarted && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Available after event starts
              </p>
            )}
          </div>
        )}
      </div>
      
      {/* End Event Button (only show if event has started and not ended) */}
      {canEndEvent && onEndEvent && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
          <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            End Event
          </h4>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
            Manually end this event and mark it as completed. This will deactivate the attendance code.
          </p>
          <Button
            onClick={handleEndEvent}
            disabled={endingEvent}
            variant="warning"
            size="sm"
            className="w-full"
          >
            {endingEvent ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Ending Event...
              </span>
            ) : (
              'End Event Now'
            )}
          </Button>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {/* Edit button */}
        <Button
          onClick={onEdit}
          disabled={hasStarted}
          variant="outline"
          size="sm"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
          {hasStarted && (
            <span className="ml-1 text-xs">(Started)</span>
          )}
        </Button>
        
        {/* Delete button */}
        <Button
          onClick={handleDelete}
          variant={showDeleteConfirm ? 'destructive' : 'outline'}
          size="sm"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          {showDeleteConfirm ? 'Confirm Delete?' : 'Delete'}
        </Button>
      </div>
      
      {showDeleteConfirm && (
        <p className="text-xs text-red-600 dark:text-red-400 text-center">
          Click delete again to confirm
        </p>
      )}
    </div>
  );
}
