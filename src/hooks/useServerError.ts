'use client';

import { useState, useCallback } from 'react';

interface ServerErrorState {
  hasError: boolean;
  error: string | null;
  isRetrying: boolean;
}

export function useServerError() {
  const [state, setState] = useState<ServerErrorState>({
    hasError: false,
    error: null,
    isRetrying: false,
  });

  const handleError = useCallback((error: Error) => {
    console.error('Server error detected:', error);
    
    // Check if it's a server connection error
    const isServerError = error.message.includes('Server is not available') ||
                         error.message.includes('Request timeout') ||
                         error.message.includes('Failed to fetch') ||
                         error.message.includes('NetworkError') ||
                         error.message.includes('ERR_CONNECTION_REFUSED');
    
    if (isServerError) {
      setState({
        hasError: true,
        error: error.message,
        isRetrying: false,
      });
    }
  }, []);

  const retry = useCallback(async (retryFunction?: () => Promise<any>) => {
    console.log('useServerError: Retry initiated');
    setState(prev => ({ ...prev, isRetrying: true }));
    
    try {
      if (retryFunction) {
        console.log('useServerError: Executing retry function');
        await retryFunction();
      }
      
      console.log('useServerError: Retry successful, clearing error state');
      setState({
        hasError: false,
        error: null,
        isRetrying: false,
      });
    } catch (error: any) {
      console.error('useServerError: Retry failed', error);
      setState(prev => ({ ...prev, isRetrying: false }));
      handleError(error);
    }
  }, [handleError]);

  const clearError = useCallback(() => {
    setState({
      hasError: false,
      error: null,
      isRetrying: false,
    });
  }, []);

  return {
    ...state,
    handleError,
    retry,
    clearError,
  };
}
