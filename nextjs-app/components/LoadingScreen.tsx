'use client';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-200">
      <div className="text-center">
        {/* MLH Logo */}
        <div className="mb-8 flex justify-center">
          <img 
            src="https://static.mlh.io/brand-assets/logo/official/mlh-logo-color.png?_gl=1*1c1b6mh*_ga*MTYxMTA5MjU0NC4xNzY4NjcxMDIw*_ga_E5KT6TC4TK*czE3NjkyODk3ODUkbzQkZzAkdDE3NjkyODk3ODgkajU3JGwwJGgw" 
            alt="MLH Logo" 
            className="h-12 w-auto animate-pulse"
          />
        </div>
        
        {/* Spinner */}
        <div className="mb-4 flex justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-red-600 dark:border-t-red-500"></div>
        </div>
        
        {/* Message */}
        <p className="text-lg text-gray-600 dark:text-gray-300 transition-colors duration-200">
          {message}
        </p>
      </div>
    </div>
  );
}
