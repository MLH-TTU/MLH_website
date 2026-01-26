import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50" role="alert" aria-live="assertive">
          <header className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div className="flex items-center space-x-4">
                  <img 
                    src="https://static.mlh.io/brand-assets/logo/official/mlh-logo.png" 
                    alt="MLH Logo" 
                    className="h-8 w-auto"
                  />
                  <div className="h-8 w-px bg-gray-300" aria-hidden="true"></div>
                  <img 
                    src="https://www.ttu.edu/traditions/images/DoubleT.gif" 
                    alt="TTU Logo" 
                    className="h-8 w-auto"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <a
                    href="/"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    aria-label="Return to home page"
                  >
                    Go to Home
                  </a>
                </div>
              </div>
            </div>
          </header>
          
          <div className="flex items-center justify-center pt-20">
            <div className="text-center max-w-md mx-auto px-4">
              <div className="mb-6">
                <svg 
                  className="mx-auto h-16 w-16 text-red-500" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" 
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
              <p className="text-gray-600 mb-6">
                There was an unexpected error loading the page. This might be due to a temporary issue or authentication problems.
              </p>
              {this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded">
                    Show technical details
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs text-gray-700 font-mono break-all">
                    {this.state.error.message}
                  </div>
                </details>
              )}
              <div className="space-y-3 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
                <a
                  href="/"
                  className="block w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Go to Home
                </a>
                <button
                  onClick={() => window.location.reload()}
                  className="block w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  aria-label="Reload the current page"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;