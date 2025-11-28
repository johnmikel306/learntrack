import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from '@/contexts/ToastContext'

interface WebSocketMessage {
  type: string
  data?: any
  timestamp?: string
  status?: string
  user_id?: string
  channels?: string[]
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
  autoReconnect?: boolean
  reconnectInterval?: number
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    autoReconnect = true,
    reconnectInterval = 5000,
  } = options

  const { getToken } = useAuth()
  const queryClient = useQueryClient()
  
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(async () => {
    try {
      // Get Clerk token
      const token = await getToken()
      if (!token) {
        console.error('No auth token available')
        return
      }

      // Determine WebSocket URL based on environment
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = import.meta.env.VITE_API_URL?.replace(/^https?:\/\//, '') || 'localhost:8000'
      const wsUrl = `${protocol}//${host}/api/v1/ws?token=${token}`

      console.log('Connecting to WebSocket:', wsUrl.replace(token, '***'))

      // Create WebSocket connection
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        reconnectAttemptsRef.current = 0
        onConnect?.()
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          console.log('WebSocket message received:', message)
          setLastMessage(message)

          // Handle different message types
          switch (message.type) {
            case 'connection':
              console.log('WebSocket connection established:', message)
              break

            case 'notification':
              // Invalidate notifications query to refetch
              queryClient.invalidateQueries({ queryKey: ['notifications'] })
              queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
              
              // Show toast notification
              if (message.data) {
                toast.info(message.data.title || 'New notification', {
                  description: message.data.message,
                })
              }
              break

            case 'pong':
              // Heartbeat response
              break

            default:
              console.log('Unknown message type:', message.type)
          }

          // Call custom message handler
          onMessage?.(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        onError?.(error)
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        wsRef.current = null
        onDisconnect?.()

        // Attempt to reconnect
        if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1
          console.log(`Reconnecting... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectInterval)
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.error('Max reconnection attempts reached')
          toast.error('Lost connection to server. Please refresh the page.')
        }
      }
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error)
    }
  }, [getToken, onConnect, onDisconnect, onError, onMessage, autoReconnect, reconnectInterval, queryClient])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setIsConnected(false)
  }, [])

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.error('WebSocket is not connected')
    }
  }, [])

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    isConnected,
    lastMessage,
    sendMessage,
    connect,
    disconnect,
  }
}

