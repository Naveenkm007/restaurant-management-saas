'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from './auth-context'
import { NotificationMessage } from '@/types'

interface NotificationContextType {
  notifications: NotificationMessage[]
  unreadCount: number
  isLoading: boolean
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  showBrowserNotification: (notification: NotificationMessage) => void
  requestNotificationPermission: () => Promise<boolean>
  hasNotificationPermission: boolean
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false)

  // Fetch notifications
  const { 
    data: notificationsData, 
    isLoading,
    refetch: refetchNotifications 
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications.getAll({ limit: 50 }),
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Fetch unread count
  const { data: unreadCountData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.notifications.getUnreadCount(),
    enabled: isAuthenticated,
    refetchInterval: 10000, // Refetch every 10 seconds
  })

  const notifications = notificationsData?.data || []
  const unreadCount = unreadCountData?.data?.count || 0

  // Check notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setHasNotificationPermission(Notification.permission === 'granted')
    }
  }, [])

  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      setHasNotificationPermission(true)
      return true
    }

    if (Notification.permission === 'denied') {
      return false
    }

    const permission = await Notification.requestPermission()
    const granted = permission === 'granted'
    setHasNotificationPermission(granted)
    return granted
  }, [])

  const showBrowserNotification = useCallback((notification: NotificationMessage) => {
    if (!hasNotificationPermission || !('Notification' in window)) {
      return
    }

    const browserNotification = new Notification(notification.title, {
      body: notification.message,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      tag: notification.id,
      renotify: true,
      requireInteraction: notification.type === 'error',
    })

    browserNotification.onclick = () => {
      window.focus()
      if (notification.actionUrl) {
        window.location.href = notification.actionUrl
      }
      browserNotification.close()
    }

    // Auto close after 5 seconds for non-error notifications
    if (notification.type !== 'error') {
      setTimeout(() => {
        browserNotification.close()
      }, 5000)
    }
  }, [hasNotificationPermission])

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.notifications.markAsRead(id)
      
      // Update the cache
      queryClient.setQueryData(['notifications'], (old: any) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map((notification: NotificationMessage) =>
            notification.id === id ? { ...notification, read: true } : notification
          )
        }
      })

      // Update unread count
      queryClient.setQueryData(['notifications', 'unread-count'], (old: any) => {
        if (!old) return old
        return {
          ...old,
          data: { count: Math.max(0, old.data.count - 1) }
        }
      })

      // Refetch to ensure consistency
      refetchNotifications()
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }, [queryClient, refetchNotifications])

  const markAllAsRead = useCallback(async () => {
    try {
      await api.notifications.markAllAsRead()
      
      // Update the cache
      queryClient.setQueryData(['notifications'], (old: any) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map((notification: NotificationMessage) => ({
            ...notification,
            read: true
          }))
        }
      })

      // Update unread count
      queryClient.setQueryData(['notifications', 'unread-count'], (old: any) => {
        if (!old) return old
        return {
          ...old,
          data: { count: 0 }
        }
      })

      refetchNotifications()
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }, [queryClient, refetchNotifications])

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await api.notifications.delete(id)
      
      // Update the cache
      queryClient.setQueryData(['notifications'], (old: any) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.filter((notification: NotificationMessage) => notification.id !== id)
        }
      })

      refetchNotifications()
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }, [queryClient, refetchNotifications])

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    showBrowserNotification,
    requestNotificationPermission,
    hasNotificationPermission,
  }

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
