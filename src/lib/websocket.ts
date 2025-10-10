/**
 * WebSocket service for real-time notifications
 */

interface WebSocketMessage {
  type: string
  event_type?: string
  notification_type?: string
  message?: string
  data?: any
  timestamp?: string
}

interface WebSocketCallbacks {
  onWorkflowUpdate?: (eventType: string, data: any) => void
  onNotification?: (notificationType: string, message: string, data: any) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
}

class WebSocketService {
  private workflowSocket: WebSocket | null = null
  private notificationSocket: WebSocket | null = null
  private callbacks: WebSocketCallbacks = {}
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 5000

  constructor() {
    this.connect()
  }

  private getWebSocketUrl(endpoint: string): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    return `${protocol}//${host}${endpoint}`
  }

  private connect(): void {
    this.connectWorkflowSocket()
    this.connectNotificationSocket()
  }

  private connectWorkflowSocket(): void {
    const bookId = this.getCurrentBookId()
    if (!bookId) return

    const url = this.getWebSocketUrl(`/ws/translation-workflow/${bookId}/`)
    
    try {
      this.workflowSocket = new WebSocket(url)
      
      this.workflowSocket.onopen = () => {
        console.log('Workflow WebSocket connected')
        this.reconnectAttempts = 0
        this.callbacks.onConnect?.()
      }

      this.workflowSocket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          this.handleWorkflowMessage(message)
        } catch (error) {
          console.error('Error parsing workflow message:', error)
        }
      }

      this.workflowSocket.onclose = () => {
        console.log('Workflow WebSocket disconnected')
        this.callbacks.onDisconnect?.()
        this.handleReconnect()
      }

      this.workflowSocket.onerror = (error) => {
        console.error('Workflow WebSocket error:', error)
        this.callbacks.onError?.(error)
      }
    } catch (error) {
      console.error('Failed to create workflow WebSocket:', error)
    }
  }

  private connectNotificationSocket(): void {
    const userId = this.getCurrentUserId()
    if (!userId) return

    const url = this.getWebSocketUrl(`/ws/notifications/${userId}/`)
    
    try {
      this.notificationSocket = new WebSocket(url)
      
      this.notificationSocket.onopen = () => {
        console.log('Notification WebSocket connected')
        this.reconnectAttempts = 0
      }

      this.notificationSocket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          this.handleNotificationMessage(message)
        } catch (error) {
          console.error('Error parsing notification message:', error)
        }
      }

      this.notificationSocket.onclose = () => {
        console.log('Notification WebSocket disconnected')
        this.handleReconnect()
      }

      this.notificationSocket.onerror = (error) => {
        console.error('Notification WebSocket error:', error)
        this.callbacks.onError?.(error)
      }
    } catch (error) {
      console.error('Failed to create notification WebSocket:', error)
    }
  }

  private handleWorkflowMessage(message: WebSocketMessage): void {
    if (message.type === 'workflow_update' && message.event_type && message.data) {
      this.callbacks.onWorkflowUpdate?.(message.event_type, message.data)
    }
  }

  private handleNotificationMessage(message: WebSocketMessage): void {
    if (message.type === 'notification' && message.notification_type && message.message) {
      this.callbacks.onNotification?.(message.notification_type, message.message, message.data || {})
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      
      setTimeout(() => {
        this.connect()
      }, this.reconnectInterval)
    } else {
      console.error('Max reconnection attempts reached')
    }
  }

  private getCurrentBookId(): string | null {
    // Extract book ID from current URL
    const path = window.location.pathname
    const bookMatch = path.match(/\/books\/(\d+)/)
    return bookMatch ? bookMatch[1] : null
  }

  private getCurrentUserId(): string | null {
    // Get user ID from localStorage or context
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        return user.id?.toString() || null
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
    return null
  }

  public setCallbacks(callbacks: WebSocketCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  public sendPing(): void {
    if (this.workflowSocket?.readyState === WebSocket.OPEN) {
      this.workflowSocket.send(JSON.stringify({ type: 'ping' }))
    }
    if (this.notificationSocket?.readyState === WebSocket.OPEN) {
      this.notificationSocket.send(JSON.stringify({ type: 'ping' }))
    }
  }

  public disconnect(): void {
    if (this.workflowSocket) {
      this.workflowSocket.close()
      this.workflowSocket = null
    }
    if (this.notificationSocket) {
      this.notificationSocket.close()
      this.notificationSocket = null
    }
  }

  public isConnected(): boolean {
    return (
      this.workflowSocket?.readyState === WebSocket.OPEN &&
      this.notificationSocket?.readyState === WebSocket.OPEN
    )
  }
}

// Global WebSocket service instance
export const websocketService = new WebSocketService()

// Export for use in components
export default websocketService
