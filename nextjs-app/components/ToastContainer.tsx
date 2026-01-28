'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Toast, ToastType } from './Toast';

interface ToastData {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onRetry?: () => void;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string, options?: { duration?: number; onRetry?: () => void }) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, options?: { duration?: number; onRetry?: () => void }) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/**
 * Toast Container component that manages toast notifications.
 * Provides context for showing toasts throughout the application.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.5, 9.6
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, options?: { duration?: number; onRetry?: () => void }) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const newToast: ToastData = {
        id,
        type,
        message,
        duration: options?.duration,
        onRetry: options?.onRetry,
      };

      setToasts((prev) => [...prev, newToast]);
    },
    []
  );

  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      showToast('success', message, { duration });
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string, options?: { duration?: number; onRetry?: () => void }) => {
      showToast('error', message, options);
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, duration?: number) => {
      showToast('info', message, { duration });
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message: string, duration?: number) => {
      showToast('warning', message, { duration });
    },
    [showToast]
  );

  const value: ToastContextValue = {
    showToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container - fixed position at top center */}
      <div
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 space-y-4 pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex flex-col items-center space-y-4 pointer-events-auto">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              id={toast.id}
              type={toast.type}
              message={toast.message}
              duration={toast.duration}
              onClose={removeToast}
              onRetry={toast.onRetry}
            />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Hook to use toast notifications
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
