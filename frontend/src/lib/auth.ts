import Cookies from 'js-cookie'
import { User, AuthState } from '@/types'
import { api } from './api'

class AuthService {
  private static instance: AuthService
  private tokenKey = 'auth_token'
  private refreshTokenKey = 'refresh_token'
  private userKey = 'auth_user'

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  // Token management
  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.tokenKey, token)
      Cookies.set(this.tokenKey, token, { expires: 7, secure: true, sameSite: 'strict' })
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.tokenKey) || Cookies.get(this.tokenKey) || null
    }
    return null
  }

  removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.tokenKey)
      Cookies.remove(this.tokenKey)
    }
  }

  // Refresh token management
  setRefreshToken(refreshToken: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.refreshTokenKey, refreshToken)
      Cookies.set(this.refreshTokenKey, refreshToken, { expires: 30, secure: true, sameSite: 'strict' })
    }
  }

  getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.refreshTokenKey) || Cookies.get(this.refreshTokenKey) || null
    }
    return null
  }

  removeRefreshToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.refreshTokenKey)
      Cookies.remove(this.refreshTokenKey)
    }
  }

  // User management
  setUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.userKey, JSON.stringify(user))
    }
  }

  getUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem(this.userKey)
      return userStr ? JSON.parse(userStr) : null
    }
    return null
  }

  removeUser(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.userKey)
    }
  }

  // Authentication methods
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    // DEMO MODE - Remove this when backend is ready
    const demoCredentials = {
      'admin@restaurant.com': 'admin123',
      'manager@restaurant.com': 'manager123',
      'staff@restaurant.com': 'staff123'
    }

    if (demoCredentials[email as keyof typeof demoCredentials] === password) {
      const mockUser: User = {
        id: '1',
        email: email,
        name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
        role: email.includes('admin') ? 'admin' : email.includes('manager') ? 'manager' : 'staff',
        tenant: {
          id: 'demo-tenant',
          name: 'Demo Restaurant Group',
          subdomain: 'demo',
          plan: 'premium'
        },
        restaurants: [{
          id: 'demo-restaurant',
          name: 'Demo Restaurant',
          description: 'A beautiful demo restaurant',
          address: {
            street: '123 Demo Street',
            city: 'Demo City',
            state: 'Demo State',
            zipCode: '12345',
            country: 'India'
          },
          phone: '+91 9876543210',
          email: 'demo@restaurant.com',
          cuisine: ['Indian', 'Continental'],
          priceRange: '$$',
          rating: 4.5,
          reviewCount: 150,
          isActive: true,
          openingHours: {},
          settings: {
            allowOnlineOrders: true,
            allowReservations: true,
            deliveryRadius: 5,
            minimumOrder: 200,
            deliveryFee: 50,
            taxRate: 18,
            serviceCharge: 10
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }],
        isActive: true,
        createdAt: new Date().toISOString()
      }

      const mockToken = 'demo-jwt-token'
      this.setToken(mockToken)
      this.setRefreshToken('demo-refresh-token')
      this.setUser(mockUser)
      return { user: mockUser, token: mockToken }
    }

    // Fallback to API call for production
    try {
      const response = await api.auth.login({ email, password })
      
      if (response.success && response.data) {
        const { user, token, refreshToken } = response.data
        this.setToken(token)
        this.setRefreshToken(refreshToken)
        this.setUser(user)
        return { user, token }
      }
      
      throw new Error(response.message || 'Login failed')
    } catch (error: any) {
      throw new Error('Invalid credentials. Use demo credentials: admin@restaurant.com / admin123')
    }
  }

  async register(userData: {
    name: string
    email: string
    password: string
    phone: string
    restaurantName: string
  }): Promise<{ user: User; token: string }> {
    try {
      const response = await api.auth.register(userData)
      
      if (response.success && response.data) {
        const { user, token, refreshToken } = response.data
        this.setToken(token)
        this.setRefreshToken(refreshToken)
        this.setUser(user)
        return { user, token }
      }
      
      throw new Error(response.message || 'Registration failed')
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed')
    }
  }

  async logout(): Promise<void> {
    try {
      await api.auth.logout()
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error)
    } finally {
      this.clearAuthData()
    }
  }

  async refreshToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      return null
    }

    try {
      const response = await api.auth.refreshToken(refreshToken)
      
      if (response.success && response.data) {
        const { token, refreshToken: newRefreshToken } = response.data
        this.setToken(token)
        this.setRefreshToken(newRefreshToken)
        return token
      }
      
      return null
    } catch (error) {
      console.error('Token refresh failed:', error)
      this.clearAuthData()
      return null
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const token = this.getToken()
    if (!token) {
      return null
    }

    try {
      const response = await api.auth.me()
      
      if (response.success && response.data) {
        this.setUser(response.data)
        return response.data
      }
      
      return null
    } catch (error) {
      console.error('Get current user failed:', error)
      return null
    }
  }

  // Token validation
  isTokenExpired(token?: string): boolean {
    const authToken = token || this.getToken()
    if (!authToken) return true

    try {
      const payload = JSON.parse(atob(authToken.split('.')[1]))
      const currentTime = Date.now() / 1000
      return payload.exp < currentTime
    } catch (error) {
      return true
    }
  }

  shouldRefreshToken(): boolean {
    const token = this.getToken()
    if (!token) return false

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const timeUntilExpiry = payload.exp * 1000 - Date.now()
      // Refresh if token expires within 5 minutes
      return timeUntilExpiry < 5 * 60 * 1000
    } catch {
      return true
    }
  }

  clearAuthData(): void {
    this.removeToken()
    this.removeRefreshToken()
    this.removeUser()
  }

  // Role and permission checks
  hasRole(role: string): boolean {
    const user = this.getUser()
    return user?.role === role
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getUser()
    return user ? roles.includes(user.role) : false
  }

  canAccessRestaurant(restaurantId: string): boolean {
    const user = this.getUser()
    if (!user) return false

    // Admin can access all restaurants
    if (user.role === 'admin') return true

    // Check if user has access to specific restaurant
    return user.restaurants?.some(r => r.id === restaurantId) || false
  }

  getCurrentTenant(): { id: string; name: string; subdomain: string; plan: string } | null {
    const user = this.getUser()
    return user?.tenant || null
  }

  // Session management
  startTokenRefreshTimer(): void {
    // Check token every 5 minutes
    setInterval(() => {
      if (this.shouldRefreshToken()) {
        this.refreshToken()
      }
    }, 5 * 60 * 1000)
  }

  startSessionMonitor(): void {
    // Monitor for multiple tabs/windows
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === this.tokenKey && !e.newValue) {
          // Token was removed in another tab, logout here too
          this.clearAuthData()
          window.location.reload()
        }
      })
    }

    // Check for inactivity
    const checkSession = () => {
      const user = this.getUser()
      const token = this.getToken()
      
      if (user && token && this.isTokenExpired(token)) {
        this.clearAuthData()
        window.location.href = '/auth/login'
      }
    }

    // Check every 30 seconds
    setInterval(checkSession, 30000)
  }
}

// Export singleton instance
export const authService = AuthService.getInstance()
