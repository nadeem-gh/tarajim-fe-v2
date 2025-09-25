'use client';

import { useState, useEffect, useCallback } from 'react';

interface ServerStatus {
  isOnline: boolean;
  isChecking: boolean;
  lastChecked: Date | null;
  error: string | null;
}

export function useServerStatus() {
  const [status, setStatus] = useState<ServerStatus>({
    isOnline: true,
    isChecking: false,
    lastChecked: null,
    error: null,
  });

  const checkServerStatus = useCallback(async () => {
    setStatus(prev => ({ ...prev, isChecking: true, error: null }));
    
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add a timeout to prevent hanging requests
        signal: AbortSignal.timeout(5000),
      });
      
      if (response.ok) {
        setStatus({
          isOnline: true,
          isChecking: false,
          lastChecked: new Date(),
          error: null,
        });
      } else {
        throw new Error(`Server responded with status ${response.status}`);
      }
    } catch (error: any) {
      console.error('Server status check failed:', error);
      setStatus({
        isOnline: false,
        isChecking: false,
        lastChecked: new Date(),
        error: error.message || 'Server is not responding',
      });
    }
  }, []);

  // Check server status on mount
  useEffect(() => {
    checkServerStatus();
  }, [checkServerStatus]);

  // Set up periodic health checks (every 30 seconds when offline)
  useEffect(() => {
    if (!status.isOnline && !status.isChecking) {
      const interval = setInterval(() => {
        checkServerStatus();
      }, 30000); // Check every 30 seconds when offline

      return () => clearInterval(interval);
    }
  }, [status.isOnline, status.isChecking, checkServerStatus]);

  return {
    ...status,
    checkServerStatus,
  };
}
