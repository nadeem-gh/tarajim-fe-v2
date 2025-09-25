# Server Error Handling System

This document explains how the application handles server errors and prevents rapid retries when the server is down.

## Overview

The application now includes a comprehensive error handling system that:
- Detects when the server is down
- Prevents rapid retry requests
- Shows user-friendly error messages
- Provides manual retry functionality

## Components

### 1. ErrorBoundary (`/src/components/ErrorBoundary.tsx`)
- Global error boundary that catches server connection errors
- Shows a dedicated server down page when connection fails
- Provides retry and refresh options

### 2. ServerStatusIndicator (`/src/components/ServerStatusIndicator.tsx`)
- Shows a small indicator in the top-right corner
- Displays server status (online/offline)
- Provides manual retry button when offline

### 3. ServerErrorPage (`/src/components/ServerErrorPage.tsx`)
- Dedicated page for server errors
- User-friendly error messages
- Manual retry functionality
- Helpful troubleshooting tips

### 4. useServerError Hook (`/src/hooks/useServerError.ts`)
- Hook for handling server errors in components
- Provides error state management
- Includes retry functionality

### 5. useServerStatus Hook (`/src/hooks/useServerStatus.ts`)
- Monitors server health
- Performs periodic health checks
- Updates server status automatically

## API Improvements

### Enhanced apiFetch Function
- Added 10-second timeout to prevent hanging requests
- Better error detection for server connection issues
- Improved error messages for different failure types

### Health Check Endpoint
- `/api/health` endpoint to check server status
- Returns server health information
- Used by the server status monitoring

## Usage in Components

### Basic Implementation
```tsx
import { useServerError } from '@/hooks/useServerError';
import ServerErrorPage from '@/components/ServerErrorPage';

export default function MyPage() {
  const { hasError, error: serverError, handleError, retry } = useServerError();

  const loadData = async () => {
    try {
      const data = await apiFetch('/some-endpoint');
      // Handle data
    } catch (error) {
      handleError(error); // This will trigger server error handling
    }
  };

  // Show server error page if server is down
  if (hasError) {
    return (
      <ServerErrorPage 
        error={serverError} 
        onRetry={() => retry(loadData)} 
      />
    );
  }

  return (
    // Your normal page content
  );
}
```

### Error Handling in useEffect
```tsx
useEffect(() => {
  const loadData = async () => {
    try {
      const data = await apiFetch('/endpoint');
      setData(data);
    } catch (error) {
      handleError(error);
    }
  };
  
  loadData();
}, [handleError]);
```

## Features

### 1. No Rapid Retries
- When server is down, the application stops making requests
- Users must manually retry using the provided buttons
- Prevents server overload from rapid retry attempts

### 2. User-Friendly Messages
- Clear error messages explaining what went wrong
- Helpful troubleshooting tips
- Professional error page design

### 3. Manual Retry Control
- Users can retry when they want to
- Retry button is clearly visible
- Option to refresh the entire page

### 4. Server Status Monitoring
- Real-time server status indicator
- Automatic health checks when offline
- Visual feedback for server status

## Error Types Handled

1. **Connection Refused**: Server is not running
2. **Network Errors**: Internet connectivity issues
3. **Timeout Errors**: Server not responding within 10 seconds
4. **Failed to Fetch**: General network failures

## Benefits

1. **Better User Experience**: Clear error messages instead of loading spinners
2. **Server Protection**: Prevents rapid retry requests that could overload the server
3. **Professional Appearance**: Dedicated error pages instead of broken UI
4. **Easy Recovery**: Simple retry mechanisms for users
5. **Monitoring**: Real-time server status awareness

## Implementation Notes

- The error boundary is applied globally in the root layout
- Server status indicator is always visible when there are issues
- Health checks are performed automatically every 30 seconds when offline
- All API calls now have a 10-second timeout
- Error handling is consistent across all pages

This system ensures that when the server is down, users get a clear message and can manually retry, rather than the application continuously attempting to connect and potentially causing issues.
