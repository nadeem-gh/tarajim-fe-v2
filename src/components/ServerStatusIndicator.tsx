'use client';

import { useServerStatus } from '@/hooks/useServerStatus';

export default function ServerStatusIndicator() {
  const { isOnline, isChecking, error, checkServerStatus } = useServerStatus();

  if (isOnline && !isChecking) {
    return null; // Don't show anything when server is online
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${
        isOnline 
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : 'bg-red-100 text-red-800 border border-red-200'
      }`}>
        {isChecking ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            <span className="text-sm font-medium">Checking server...</span>
          </>
        ) : (
          <>
            <div className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm font-medium">
              {isOnline ? 'Server online' : 'Server offline'}
            </span>
            {!isOnline && (
              <button
                onClick={checkServerStatus}
                className="ml-2 text-xs bg-white px-2 py-1 rounded hover:bg-gray-50 transition-colors"
              >
                Retry
              </button>
            )}
          </>
        )}
      </div>
      
      {!isOnline && error && (
        <div className="mt-2 text-xs text-red-600 max-w-xs">
          {error}
        </div>
      )}
    </div>
  );
}
