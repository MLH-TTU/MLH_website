'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClearSessionPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Clearing session...');

  useEffect(() => {
    const clearSession = async () => {
      try {
        // Clear the auth cookie via API
        await fetch('/api/auth/session', {
          method: 'DELETE',
        });

        // Clear all cookies manually as well
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        setStatus('Session cleared! Redirecting to login...');
        
        // Wait a moment then redirect
        setTimeout(() => {
          router.push('/login');
        }, 1000);
      } catch (error) {
        console.error('Error clearing session:', error);
        setStatus('Error clearing session. Redirecting anyway...');
        setTimeout(() => {
          router.push('/login');
        }, 1000);
      }
    };

    clearSession();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
}
