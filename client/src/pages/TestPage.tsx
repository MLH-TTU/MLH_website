import React from 'react';
import Navigation from '../components/Navigation';

const TestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation showAuthButtons={true} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Test Page</h1>
          <p className="text-gray-600 mb-6">
            This page demonstrates the navigation component working without authentication.
          </p>
          
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-2">Navigation Test</h2>
              <p className="text-gray-600">
                You can use the navigation buttons above to go to:
              </p>
              <ul className="mt-2 text-left">
                <li>• Home - Goes to the landing page</li>
                <li>• Team - Goes to the team page</li>
                <li>• Login - Goes to the login page</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-2 text-blue-900">Profile Access</h2>
              <p className="text-blue-700 mb-4">
                To test the ProfilePage without authentication issues:
              </p>
              <a
                href="/profile-debug"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md text-sm font-medium transition-colors"
              >
                Go to Profile (Debug Mode)
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TestPage;