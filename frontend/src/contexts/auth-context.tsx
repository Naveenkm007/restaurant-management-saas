'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { User, AuthState } from '@/types'
import { authService } from '@/lib/auth'
import toast from 'react-hot-toast'

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (userData: {
    name: string
    email: string
    password: string
    phone: string
    restaurantName: string
  }) => Promise<void>
  logout: () => Promise<void>
  updateUser: (userData: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const publicRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  })

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getToken()
      const user = authService.getUser()

      if (token && user && !authService.isTokenExpired(token)) {
        setAuthState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        })
      } else if (token && authService.shouldRefreshToken()) {
        // Try to refresh token
        const newToken = await authService.refreshToken()
        if (newToken) {
          const currentUser = authService.getUser()
          setAuthState({
            user: currentUser,
            token: newToken,
            isAuthenticated: true,
            isLoading: false,
          })
        } else {
          setAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      } else {
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        })
      }
    }

    initAuth()
    
    // Start token refresh timer and session monitor
    authService.startTokenRefreshTimer()
    authService.startSessionMonitor()
  }, [])

  // Redirect based on auth state
  useEffect(() => {
    if (!authState.isLoading) {
      const isPublicRoute = publicRoutes.includes(pathname)
      
      if (!authState.isAuthenticated && !isPublicRoute) {
        router.push('/auth/login')
      } else if (authState.isAuthenticated && isPublicRoute) {
        router.push('/dashboard')
      }
    }
  }, [authState.isAuthenticated, authState.isLoading, pathname, router])

  const login = useCallback(async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }))
      
      const { user, token } = await authService.login(email, password)
      
      setAuthState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      })

      toast.success(`Welcome back, ${user.name}!`)
      router.push('/dashboard')
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }))
      toast.error(error.message || 'Login failed')
      throw error
    }
  }, [router])

  const register = useCallback(async (userData: {
    name: string
    email: string
    password: string
    phone: string
    restaurantName: string
  }) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }))
      
      const { user, token } = await authService.register(userData)
      
      setAuthState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      })

      toast.success(`Welcome to Restaurant SaaS, ${user.name}!`)
      router.push('/dashboard')
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }))
      toast.error(error.message || 'Registration failed')
      throw error
    }
  }, [router])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
      
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      })

      toast.success('Logged out successfully')
      router.push('/auth/login')
    } catch (error: any) {
      toast.error('Logout failed')
      console.error('Logout error:', error)
    }
  }, [router])

  const updateUser = useCallback((userData: Partial<User>) => {
    setAuthState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...userData } : null,
    }))
    
    if (authState.user) {
      authService.setUser({ ...authState.user, ...userData })
    }
  }, [authState.user])

  const contextValue: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    updateUser,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function useRequireAuth() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, isLoading, router])

  return { isAuthenticated, isLoading, user }
}

export function useRequireRole(allowedRoles: string[]) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (!allowedRoles.includes(user.role)) {
        router.push('/dashboard')
        toast.error('You do not have permission to access this page')
      }
    }
  }, [user, isAuthenticated, isLoading, allowedRoles, router])

  return { 
    hasPermission: user ? allowedRoles.includes(user.role) : false,
    user,
    isLoading 
  }
}
