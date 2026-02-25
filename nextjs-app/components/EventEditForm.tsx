'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { useToast } from '@/hooks/useToastCompat';
import type { Event } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

interface EventEditFormProps {
  event: Event;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * EventEditForm Component
 * 
 * Form for editing existing events with:
 * - Pre-populated form with existing event data
 * - Disabled form if event has started
 * - Submit to update event API
 */
export function EventEditForm({ event, onClose, onSuccess }: EventEditFormProps) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    startTime: '',
    location: '',
    pointsValue: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasStarted, setHasStarted] = useState(false);

  // Initialize form data from event
  useEffect(() => {
    const startDate = event.startTime.toDate();

    // Check if event has started
    const now = new Date();
    setHasStarted(now >= startDate);

    // Format dates for input fields
    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };

    const formatTime = (date: Date) => {
      return date.toTimeString().slice(0, 5);
    };

    setFormData({
      name: event.name,
      description: event.description,
      startDate: formatDate(startDate),
      startTime: formatTime(startDate),
      location: event.location,
      pointsValue: event.pointsValue,
    });
  }, [event]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Event name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (formData.pointsValue < 0) {
      newErrors.pointsValue = 'Points must be non-negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (hasStarted) {
      toast.showError('Cannot edit an event that has already started');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // Combine date and time into ISO string
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);

      const updates = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        startTime: startDateTime.toISOString(),
        location: formData.location.trim(),
        pointsValue: Number(formData.pointsValue),
      };

      const { auth } = await import('@/lib/firebase/config');
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      const idToken = await currentUser.getIdToken();

      const response = await fetch(`/api/admin/events/${event.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to update event');
      }

      toast.showSuccess('Event updated successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating event:', error);
      toast.showError(error.message || 'Failed to update event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto my-auto custom-scrollbar">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Edit Event
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {hasStarted && (
            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ This event has already started and cannot be edited.
              </p>
            </div>
          )}

          {/* Event Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Event Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={hasStarted}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } ${hasStarted ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={hasStarted}
              rows={3}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none ${
                errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } ${hasStarted ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            {errors.description && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>}
          </div>

          {/* Start Date and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                disabled={hasStarted}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  errors.startDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } ${hasStarted ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {errors.startDate && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.startDate}</p>}
            </div>

            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Time *
              </label>
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                disabled={hasStarted}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  errors.startTime ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } ${hasStarted ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {errors.startTime && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.startTime}</p>}
            </div>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Location *
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              disabled={hasStarted}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                errors.location ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } ${hasStarted ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            {errors.location && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.location}</p>}
          </div>

          {/* Points Value */}
          <div>
            <label htmlFor="pointsValue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Points Value *
            </label>
            <input
              type="number"
              id="pointsValue"
              name="pointsValue"
              value={formData.pointsValue}
              onChange={handleChange}
              disabled={hasStarted}
              min="0"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                errors.pointsValue ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } ${hasStarted ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            {errors.pointsValue && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.pointsValue}</p>}
          </div>

          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-white dark:bg-gray-800 pt-4 pb-2 -mx-6 px-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                size="default"
                className="flex-1 order-2 sm:order-1"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                size="default"
                className="flex-1 order-1 sm:order-2"
                disabled={submitting || hasStarted}
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </span>
                ) : (
                  'Update Event'
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
