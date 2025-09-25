'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isServerDown: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isServerDown: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if it's a server connection error
    const isServerDown = error.message.includes('Failed to fetch') || 
                        error.message.includes('NetworkError') ||
                        error.message.includes('ERR_CONNECTION_REFUSED') ||
                        error.message.includes('ERR_NETWORK_CHANGED');
    
    return {
      hasError: true,
      error,
      isServerDown,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      isServerDown: false,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.state.isServerDown) {
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="max-w-md mx-auto text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Server Unavailable</h1>
                <p className="text-gray-600 mb-6">
                  We're having trouble connecting to our servers. This might be a temporary issue.
                </p>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
                
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Refresh Page
                </button>
              </div>
              
              <div className="mt-6 text-sm text-gray-500">
                <p>If the problem persists, please:</p>
                <ul className="mt-2 space-y-1">
                  <li>• Check your internet connection</li>
                  <li>• Try again in a few minutes</li>
                  <li>• Contact support if the issue continues</li>
                </ul>
              </div>
            </div>
          </div>
        );
      }

      // For other errors, show the fallback or default error
      return this.props.fallback || (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-6">An unexpected error occurred.</p>
            <button
              onClick={this.handleRetry}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
