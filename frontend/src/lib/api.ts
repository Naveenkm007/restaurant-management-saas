import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ApiResponse, User, Restaurant, MenuItem, MenuCategory, Order, Customer, Payment, InventoryItem, AnalyticsData } from '@/types'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response.data
      },
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login
          this.clearAuth()
          window.location.href = '/auth/login'
        }
        return Promise.reject(error.response?.data || error.message)
      }
    )
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token')
    }
    return null
  }

  private clearAuth(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }
  }

  // Generic HTTP methods
  private async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.client.get(url, config)
  }

  private async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.client.post(url, data, config)
  }

  private async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.client.put(url, data, config)
  }

  private async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.client.patch(url, data, config)
  }

  private async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.client.delete(url, config)
  }

  // Authentication API
  auth = {
    login: (credentials: { email: string; password: string }) => 
      this.post<{ user: User; token: string; refreshToken: string }>('/auth/login', credentials),
    
    register: (userData: { name: string; email: string; password: string; phone: string; restaurantName: string }) =>
      this.post<{ user: User; token: string; refreshToken: string }>('/auth/register', userData),
    
    logout: () => this.post('/auth/logout'),
    
    refreshToken: (refreshToken: string) =>
      this.post<{ token: string; refreshToken: string }>('/auth/refresh', { refreshToken }),
    
    forgotPassword: (email: string) =>
      this.post('/auth/forgot-password', { email }),
    
    resetPassword: (token: string, password: string) =>
      this.post('/auth/reset-password', { token, password }),
    
    verifyEmail: (token: string) =>
      this.post('/auth/verify-email', { token }),
    
    me: () => this.get<User>('/auth/me'),
  }

  // Users API
  users = {
    getAll: (params?: { page?: number; limit?: number; search?: string; role?: string }) =>
      this.get<User[]>('/users', { params }),
    
    getById: (id: string) => this.get<User>(`/users/${id}`),
    
    create: (userData: Partial<User>) => this.post<User>('/users', userData),
    
    update: (id: string, userData: Partial<User>) => this.put<User>(`/users/${id}`, userData),
    
    delete: (id: string) => this.delete(`/users/${id}`),
    
    updateProfile: (userData: Partial<User>) => this.put<User>('/users/profile', userData),
    
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      this.put('/users/change-password', data),
  }

  // Restaurants API
  restaurants = {
    getAll: (params?: { page?: number; limit?: number; search?: string }) =>
      this.get<Restaurant[]>('/restaurants', { params }),
    
    getById: (id: string) => this.get<Restaurant>(`/restaurants/${id}`),
    
    create: (restaurantData: Partial<Restaurant>) =>
      this.post<Restaurant>('/restaurants', restaurantData),
    
    update: (id: string, restaurantData: Partial<Restaurant>) =>
      this.put<Restaurant>(`/restaurants/${id}`, restaurantData),
    
    delete: (id: string) => this.delete(`/restaurants/${id}`),
    
    updateStatus: (id: string, isActive: boolean) =>
      this.patch(`/restaurants/${id}/status`, { isActive }),
    
    getSettings: (id: string) => this.get(`/restaurants/${id}/settings`),
    
    updateSettings: (id: string, settings: any) =>
      this.put(`/restaurants/${id}/settings`, settings),
  }

  // Menu API
  menu = {
    categories: {
      getAll: (restaurantId: string) =>
        this.get<MenuCategory[]>(`/restaurants/${restaurantId}/menu/categories`),
      
      getById: (restaurantId: string, categoryId: string) =>
        this.get<MenuCategory>(`/restaurants/${restaurantId}/menu/categories/${categoryId}`),
      
      create: (restaurantId: string, categoryData: Partial<MenuCategory>) =>
        this.post<MenuCategory>(`/restaurants/${restaurantId}/menu/categories`, categoryData),
      
      update: (restaurantId: string, categoryId: string, categoryData: Partial<MenuCategory>) =>
        this.put<MenuCategory>(`/restaurants/${restaurantId}/menu/categories/${categoryId}`, categoryData),
      
      delete: (restaurantId: string, categoryId: string) =>
        this.delete(`/restaurants/${restaurantId}/menu/categories/${categoryId}`),
    },

    items: {
      getAll: (restaurantId: string, params?: { categoryId?: string; search?: string; isAvailable?: boolean }) =>
        this.get<MenuItem[]>(`/restaurants/${restaurantId}/menu/items`, { params }),
      
      getById: (restaurantId: string, itemId: string) =>
        this.get<MenuItem>(`/restaurants/${restaurantId}/menu/items/${itemId}`),
      
      create: (restaurantId: string, itemData: Partial<MenuItem>) =>
        this.post<MenuItem>(`/restaurants/${restaurantId}/menu/items`, itemData),
      
      update: (restaurantId: string, itemId: string, itemData: Partial<MenuItem>) =>
        this.put<MenuItem>(`/restaurants/${restaurantId}/menu/items/${itemId}`, itemData),
      
      delete: (restaurantId: string, itemId: string) =>
        this.delete(`/restaurants/${restaurantId}/menu/items/${itemId}`),
      
      updateAvailability: (restaurantId: string, itemId: string, isAvailable: boolean) =>
        this.patch(`/restaurants/${restaurantId}/menu/items/${itemId}/availability`, { isAvailable }),
    },
  }

  // Orders API
  orders = {
    getAll: (params?: { 
      page?: number; 
      limit?: number; 
      restaurantId?: string; 
      status?: string; 
      type?: string; 
      dateRange?: { start: string; end: string }
    }) => this.get<Order[]>('/orders', { params }),
    
    getById: (id: string) => this.get<Order>(`/orders/${id}`),
    
    create: (orderData: Partial<Order>) => this.post<Order>('/orders', orderData),
    
    update: (id: string, orderData: Partial<Order>) => this.put<Order>(`/orders/${id}`, orderData),
    
    updateStatus: (id: string, status: string, estimatedTime?: number) =>
      this.patch(`/orders/${id}/status`, { status, estimatedTime }),
    
    cancel: (id: string, reason: string) =>
      this.patch(`/orders/${id}/cancel`, { reason }),
    
    getRecent: (restaurantId: string, limit = 10) =>
      this.get<Order[]>(`/orders/recent?restaurantId=${restaurantId}&limit=${limit}`),
    
    getKitchenOrders: (restaurantId: string) =>
      this.get<Order[]>(`/orders/kitchen?restaurantId=${restaurantId}`),
  }

  // Customers API
  customers = {
    getAll: (params?: { page?: number; limit?: number; search?: string; restaurantId?: string }) =>
      this.get<Customer[]>('/customers', { params }),
    
    getById: (id: string) => this.get<Customer>(`/customers/${id}`),
    
    create: (customerData: Partial<Customer>) => this.post<Customer>('/customers', customerData),
    
    update: (id: string, customerData: Partial<Customer>) =>
      this.put<Customer>(`/customers/${id}`, customerData),
    
    delete: (id: string) => this.delete(`/customers/${id}`),
    
    getOrderHistory: (id: string, params?: { page?: number; limit?: number }) =>
      this.get<Order[]>(`/customers/${id}/orders`, { params }),
  }

  // Tables API  
  tables = {
    getAll: (restaurantId: string) => this.get(`/restaurants/${restaurantId}/tables`),
    
    getById: (restaurantId: string, tableId: string) =>
      this.get(`/restaurants/${restaurantId}/tables/${tableId}`),
    
    create: (restaurantId: string, tableData: any) =>
      this.post(`/restaurants/${restaurantId}/tables`, tableData),
    
    update: (restaurantId: string, tableId: string, tableData: any) =>
      this.put(`/restaurants/${restaurantId}/tables/${tableId}`, tableData),
    
    delete: (restaurantId: string, tableId: string) =>
      this.delete(`/restaurants/${restaurantId}/tables/${tableId}`),
  }

  // Payments API
  payments = {
    getAll: (params?: { 
      page?: number; 
      limit?: number; 
      restaurantId?: string; 
      status?: string; 
      method?: string;
      dateRange?: { start: string; end: string }
    }) => this.get<Payment[]>('/payments', { params }),
    
    getById: (id: string) => this.get<Payment>(`/payments/${id}`),
    
    process: (paymentData: { orderId: string; method: string; amount: number }) =>
      this.post<Payment>('/payments/process', paymentData),
    
    refund: (id: string, amount: number, reason: string) =>
      this.post(`/payments/${id}/refund`, { amount, reason }),
    
    getSummary: (restaurantId: string, dateRange?: { start: string; end: string }) =>
      this.get(`/payments/summary?restaurantId=${restaurantId}`, { params: dateRange }),
  }

  // Inventory API
  inventory = {
    getAll: (restaurantId: string, params?: { category?: string; lowStock?: boolean; search?: string }) =>
      this.get<InventoryItem[]>(`/restaurants/${restaurantId}/inventory`, { params }),
    
    getById: (restaurantId: string, itemId: string) =>
      this.get<InventoryItem>(`/restaurants/${restaurantId}/inventory/${itemId}`),
    
    create: (restaurantId: string, itemData: Partial<InventoryItem>) =>
      this.post<InventoryItem>(`/restaurants/${restaurantId}/inventory`, itemData),
    
    update: (restaurantId: string, itemId: string, itemData: Partial<InventoryItem>) =>
      this.put<InventoryItem>(`/restaurants/${restaurantId}/inventory/${itemId}`, itemData),
    
    delete: (restaurantId: string, itemId: string) =>
      this.delete(`/restaurants/${restaurantId}/inventory/${itemId}`),
    
    updateStock: (restaurantId: string, itemId: string, quantity: number, type: 'add' | 'subtract' | 'set') =>
      this.patch(`/restaurants/${restaurantId}/inventory/${itemId}/stock`, { quantity, type }),
    
    getLowStockItems: (restaurantId: string) =>
      this.get<InventoryItem[]>(`/restaurants/${restaurantId}/inventory/low-stock`),
  }

  // Analytics API
  analytics = {
    getDashboard: (restaurantId: string, period: string = 'week') =>
      this.get<AnalyticsData>(`/analytics/dashboard?restaurantId=${restaurantId}&period=${period}`),
    
    getRevenue: (restaurantId: string, dateRange: { start: string; end: string }) =>
      this.get(`/analytics/revenue?restaurantId=${restaurantId}`, { params: dateRange }),
    
    getTopItems: (restaurantId: string, period: string = 'week', limit = 10) =>
      this.get(`/analytics/top-items?restaurantId=${restaurantId}&period=${period}&limit=${limit}`),
    
    getCustomerInsights: (restaurantId: string, period: string = 'month') =>
      this.get(`/analytics/customers?restaurantId=${restaurantId}&period=${period}`),
    
    exportReport: (type: string, format: string, params: any) =>
      this.get(`/analytics/export?type=${type}&format=${format}`, { 
        params,
        responseType: 'blob'
      }),
  }

  // Kitchen API
  kitchen = {
    getOrders: (restaurantId: string) =>
      this.get<Order[]>(`/kitchen/orders?restaurantId=${restaurantId}`),
    
    updateOrderStatus: (orderId: string, status: string, estimatedTime?: number) =>
      this.patch(`/kitchen/orders/${orderId}/status`, { status, estimatedTime }),
    
    getMetrics: (restaurantId: string) =>
      this.get(`/kitchen/metrics?restaurantId=${restaurantId}`),
  }

  // Notifications API
  notifications = {
    getAll: (params?: { page?: number; limit?: number; read?: boolean }) =>
      this.get('/notifications', { params }),
    
    markAsRead: (id: string) =>
      this.patch(`/notifications/${id}/read`),
    
    markAllAsRead: () =>
      this.patch('/notifications/mark-all-read'),
    
    delete: (id: string) =>
      this.delete(`/notifications/${id}`),
    
    getUnreadCount: () =>
      this.get<{ count: number }>('/notifications/unread-count'),
  }
}

// Create and export a singleton instance
export const api = new ApiClient()
