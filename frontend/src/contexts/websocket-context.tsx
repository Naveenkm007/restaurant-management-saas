'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './auth-context'
import { useNotifications } from './notification-context'
import { WebSocketMessage, Order, NotificationMessage } from '@/types'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

interface WebSocketContextType {
  socket: Socket | null
  isConnected: boolean
  joinRoom: (room: string) => void
  leaveRoom: (room: string) => void
  sendMessage: (event: string, data: any) => void
  onOrderUpdate: (callback: (order: Order) => void) => () => void
  onKitchenUpdate: (callback: (data: any) => void) => () => void
  onNotification: (callback: (notification: NotificationMessage) => void) => () => void
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { user, token, isAuthenticated } = useAuth()
  const { showBrowserNotification } = useNotifications()
  const queryClient = useQueryClient()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  useEffect(() => {
    if (!isAuthenticated || !token || !user) {
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setIsConnected(false)
      }
      return
    }

    // Initialize socket connection
    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001', {
      auth: {
        token,
        userId: user.id,
        tenantId: user.tenant.id,
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
    })

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('WebSocket connected')
      setIsConnected(true)
      reconnectAttempts.current = 0
      
      // Join user-specific room
      newSocket.emit('join', { userId: user.id, tenantId: user.tenant.id })
      
      // Join restaurant rooms for user's restaurants
      user.restaurants?.forEach(restaurant => {
        newSocket.emit('join', { room: `restaurant:${restaurant.id}` })
      })
    })

    newSocket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason)
      setIsConnected(false)
      
      // Auto-reconnect with exponential backoff
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect
        return
      }
      
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.pow(2, reconnectAttempts.current) * 1000
        setTimeout(() => {
          reconnectAttempts.current++
          newSocket.connect()
        }, delay)
      }
    })

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      setIsConnected(false)
    })

    // Message handlers
    newSocket.on('order:update', (data: { order: Order; message?: string }) => {
      console.log('Order update received:', data)
      
      // Update orders cache
      queryClient.setQueryData(['orders'], (old: any) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map((order: Order) => 
            order.id === data.order.id ? data.order : order
          )
        }
      })

      // Update kitchen orders cache
      queryClient.setQueryData(['kitchen', 'orders'], (old: any) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map((order: Order) => 
            order.id === data.order.id ? data.order : order
          )
        }
      })

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['kitchen'] })

      // Show toast notification
      if (data.message) {
        toast.success(data.message)
      }
    })

    newSocket.on('kitchen:update', (data: any) => {
      console.log('Kitchen update received:', data)
      
      // Invalidate kitchen-related queries
      queryClient.invalidateQueries({ queryKey: ['kitchen'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    })

    newSocket.on('notification', (notification: NotificationMessage) => {
      console.log('Notification received:', notification)
      
      // Update notifications cache
      queryClient.setQueryData(['notifications'], (old: any) => {
        if (!old) return old
        return {
          ...old,
          data: [notification, ...old.data]
        }
      })

      // Update unread count
      queryClient.setQueryData(['notifications', 'unread-count'], (old: any) => {
        if (!old) return old
        return {
          ...old,
          data: { count: old.data.count + 1 }
        }
      })

      // Show browser notification
      showBrowserNotification(notification)
      
      // Show toast for important notifications
      if (notification.type === 'error') {
        toast.error(notification.message)
      } else if (notification.type === 'success') {
        toast.success(notification.message)
      } else {
        toast(notification.message)
      }
    })

    newSocket.on('inventory:alert', (data: { item: any; type: 'low_stock' | 'expired' }) => {
      console.log('Inventory alert received:', data)
      
      // Invalidate inventory queries
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      
      // Show alert
      if (data.type === 'low_stock') {
        toast.error(`Low stock alert: ${data.item.name}`)
      } else if (data.type === 'expired') {
        toast.error(`Item expired: ${data.item.name}`)
      }
    })

    newSocket.on('payment:update', (data: any) => {
      console.log('Payment update received:', data)
      
      // Invalidate payment queries
      queryClient.invalidateQueries({ queryKey: ['payments'] })
    })

    setSocket(newSocket)

    // Cleanup on unmount
    return () => {
      newSocket.disconnect()
      setSocket(null)
      setIsConnected(false)
    }
  }, [isAuthenticated, token, user, queryClient, showBrowserNotification])

  const joinRoom = useCallback((room: string) => {
    if (socket && isConnected) {
      socket.emit('join', { room })
    }
  }, [socket, isConnected])

  const leaveRoom = useCallback((room: string) => {
    if (socket && isConnected) {
      socket.emit('leave', { room })
    }
  }, [socket, isConnected])

  const sendMessage = useCallback((event: string, data: any) => {
    if (socket && isConnected) {
      socket.emit(event, data)
    }
  }, [socket, isConnected])

  const onOrderUpdate = useCallback((callback: (order: Order) => void) => {
    if (!socket) return () => {}
    
    const handler = (data: { order: Order }) => {
      callback(data.order)
    }
    
    socket.on('order:update', handler)
    return () => socket.off('order:update', handler)
  }, [socket])

  const onKitchenUpdate = useCallback((callback: (data: any) => void) => {
    if (!socket) return () => {}
    
    socket.on('kitchen:update', callback)
    return () => socket.off('kitchen:update', callback)
  }, [socket])

  const onNotification = useCallback((callback: (notification: NotificationMessage) => void) => {
    if (!socket) return () => {}
    
    socket.on('notification', callback)
    return () => socket.off('notification', callback)
  }, [socket])

  const contextValue: WebSocketContextType = {
    socket,
    isConnected,
    joinRoom,
    leaveRoom,
    sendMessage,
    onOrderUpdate,
    onKitchenUpdate,
    onNotification,
  }

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}

// Specialized hooks for specific use cases
export function useOrderUpdates(restaurantId?: string) {
  const { onOrderUpdate, joinRoom, leaveRoom } = useWebSocket()
  
  useEffect(() => {
    if (restaurantId) {
      joinRoom(`restaurant:${restaurantId}`)
      return () => leaveRoom(`restaurant:${restaurantId}`)
    }
  }, [restaurantId, joinRoom, leaveRoom])
  
  return { onOrderUpdate }
}

export function useKitchenUpdates(restaurantId?: string) {
  const { onKitchenUpdate, joinRoom, leaveRoom } = useWebSocket()
  
  useEffect(() => {
    if (restaurantId) {
      joinRoom(`kitchen:${restaurantId}`)
      return () => leaveRoom(`kitchen:${restaurantId}`)
    }
  }, [restaurantId, joinRoom, leaveRoom])
  
  return { onKitchenUpdate }
}
