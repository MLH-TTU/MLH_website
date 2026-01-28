'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase/config';

export default function TestFirebasePage() {
  const [config, setConfig] = useState<any>(null);
  const [authInstance, setAuthInstance] = useState<any>(null);

  useEffect(() => {
    // Get Firebase config
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    setConfig(firebaseConfig);
    setAuthInstance({
      app: auth.app.name,
      currentUser: auth.currentUser,
      config: auth.config,
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Firebase Configuration Test</h1>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
          <div className="space-y-2 font-mono text-sm">
            {config && Object.entries(config).map(([key, value]) => (
              <div key={key} className="flex">
                <span className="font-bold w-48">{key}:</span>
                <span className={value ? 'text-green-600' : 'text-red-600'}>
                  {value ? '✓ Set' : '✗ Missing'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Firebase Auth Instance</h2>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex">
              <span className="font-bold w-48">App Name:</span>
              <span>{authInstance?.app || 'Not initialized'}</span>
            </div>
            <div className="flex">
              <span className="font-bold w-48">Current User:</span>
              <span>{authInstance?.currentUser ? 'Logged in' : 'Not logged in'}</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">Next Steps</h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Verify all environment variables show "✓ Set"</li>
            <li>Go to Firebase Console → Authentication → Sign-in method</li>
            <li>Enable Google provider and set support email</li>
            <li>Click Save and wait 1-2 minutes</li>
            <li>Return to <a href="/login" className="underline font-semibold">/login</a> and try again</li>
          </ol>
        </div>

        <div className="mt-6">
          <a
            href="/login"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login Page
          </a>
        </div>
      </div>
    </div>
  );
}
