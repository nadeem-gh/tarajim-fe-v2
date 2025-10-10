/**
 * React hook for WebSocket integration
 */

import { useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from 'react-query'
import { websocketService } from '@/lib/websocket'
import toast from 'react-hot-toast'

interface UseWebSocketOptions {
  bookId?: string
  userId?: string
  onWorkflowUpdate?: (eventType: string, data: any) => void
  onNotification?: (notificationType: string, message: string, data: any) => void
  enableNotifications?: boolean
  enableWorkflowUpdates?: boolean
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const queryClient = useQueryClient()
  const optionsRef = useRef(options)

  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options
  }, [options])

  const handleWorkflowUpdate = useCallback((eventType: string, data: any) => {
    console.log('Workflow update received:', eventType, data)
    
    // Invalidate relevant queries to trigger refetch
    if (optionsRef.current.bookId) {
      queryClient.invalidateQueries(['book-workflow', optionsRef.current.bookId])
    }
    
    // Call custom handler if provided
    optionsRef.current.onWorkflowUpdate?.(eventType, data)
    
    // Show toast notifications for important events
    switch (eventType) {
      case 'request_created':
        toast.success('New translation request created')
        break
      case 'application_submitted':
        toast.success('New application received')
        break
      case 'application_accepted':
        toast.success('Application accepted')
        break
      case 'application_rejected':
        toast.info('Application rejected')
        break
      case 'contract_created':
        toast.success('Contract created')
        break
      case 'contract_signed':
        toast.success('Contract signed')
        break
      case 'milestone_created':
        toast.success('New milestone created')
        break
      case 'milestone_assigned':
        toast.success('Milestone assigned')
        break
      case 'milestone_status_changed':
        toast.info(`Milestone status changed to ${data.new_status}`)
        break
    }
  }, [queryClient])

  const handleNotification = useCallback((notificationType: string, message: string, data: any) => {
    console.log('Notification received:', notificationType, message, data)
    
    // Call custom handler if provided
    optionsRef.current.onNotification?.(notificationType, message, data)
    
    // Show toast notification
    switch (notificationType) {
      case 'request_created':
        toast.success(message)
        break
      case 'application_received':
        toast.success(message)
        break
      case 'application_submitted':
        toast.success(message)
        break
      case 'application_accepted':
        toast.success(message)
        break
      case 'application_rejected':
        toast.error(message)
        break
      case 'contract_created':
        toast.success(message)
        break
      case 'contract_signed':
        toast.success(message)
        break
      case 'milestone_assigned':
        toast.success(message)
        break
      case 'milestone_completed':
        toast.success(message)
        break
      case 'milestone_approved':
        toast.success(message)
        break
      default:
        toast.info(message)
    }
  }, [])

  useEffect(() => {
    // Set up WebSocket callbacks
    websocketService.setCallbacks({
      onWorkflowUpdate: options.enableWorkflowUpdates !== false ? handleWorkflowUpdate : undefined,
      onNotification: options.enableNotifications !== false ? handleNotification : undefined,
      onConnect: () => {
        console.log('WebSocket connected')
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected')
      },
      onError: (error) => {
        console.error('WebSocket error:', error)
        toast.error('Connection error. Please refresh the page.')
      }
    })

    // Cleanup on unmount
    return () => {
      websocketService.setCallbacks({})
    }
  }, [handleWorkflowUpdate, handleNotification, options.enableWorkflowUpdates, options.enableNotifications])

  // Ping WebSocket to keep connection alive
  useEffect(() => {
    const interval = setInterval(() => {
      if (websocketService.isConnected()) {
        websocketService.sendPing()
      }
    }, 30000) // Ping every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return {
    isConnected: websocketService.isConnected(),
    sendPing: websocketService.sendPing,
    disconnect: websocketService.disconnect
  }
}
