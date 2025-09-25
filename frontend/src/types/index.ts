import React from 'react'

// Authentication Types
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'manager' | 'staff' | 'kitchen'
  tenant: {
    id: string
    name: string
    subdomain: string
    plan: string
  }
  restaurants: Restaurant[]
  avatar?: string
  phone?: string
  isActive: boolean
  lastLogin?: string
  createdAt: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

// Restaurant Types
export interface Restaurant {
  id: string
  name: string
  description?: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  phone: string
  email: string
  website?: string
  logo?: string
  coverImage?: string
  cuisine: string[]
  priceRange: '$' | '$$' | '$$$' | '$$$$'
  rating: number
  reviewCount: number
  isActive: boolean
  openingHours: {
    [key: string]: {
      open: string
      close: string
      isClosed: boolean
    }
  }
  settings: {
    allowOnlineOrders: boolean
    allowReservations: boolean
    deliveryRadius: number
    minimumOrder: number
    deliveryFee: number
    taxRate: number
    serviceCharge: number
  }
  createdAt: string
  updatedAt: string
}

// Menu Types
export interface MenuCategory {
  id: string
  restaurantId: string
  name: string
  description?: string
  image?: string
  sortOrder: number
  isActive: boolean
  itemCount: number
  createdAt: string
}

export interface MenuItem {
  id: string
  categoryId: string
  restaurantId: string
  name: string
  description?: string
  price: number
  originalPrice?: number
  imageUrl?: string
  preparationTime: number
  calories?: number
  isVegetarian: boolean
  isVegan: boolean
  isGlutenFree: boolean
  spiceLevel: 0 | 1 | 2 | 3 | 4 | 5
  allergens: string[]
  tags: string[]
  modifiers: MenuModifier[]
  isAvailable: boolean
  sortOrder: number
  nutritionInfo?: {
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
  createdAt: string
  updatedAt: string
}

export interface MenuModifier {
  id: string
  name: string
  description?: string
  type: 'single' | 'multiple'
  required: boolean
  maxSelections?: number
  options: ModifierOption[]
}

export interface ModifierOption {
  id: string
  name: string
  price: number
  isDefault: boolean
  isAvailable: boolean
}

// Order Types
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'
export type OrderType = 'dine_in' | 'takeaway' | 'delivery'

export interface Order {
  id: string
  orderNumber: string
  restaurantId: string
  customerId?: string
  customer?: Customer
  type: OrderType
  status: OrderStatus
  items: OrderItem[]
  subtotal: number
  tax: number
  serviceCharge: number
  deliveryFee: number
  discount: number
  total: number
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentMethod?: string
  notes?: string
  estimatedDeliveryTime?: string
  actualDeliveryTime?: string
  tableNumber?: number
  deliveryAddress?: {
    street: string
    city: string
    zipCode: string
    instructions?: string
  }
  assignedStaff?: User
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  menuItemId: string
  menuItem: MenuItem
  quantity: number
  unitPrice: number
  totalPrice: number
  selectedModifiers: SelectedModifier[]
  specialInstructions?: string
}

export interface SelectedModifier {
  modifierId: string
  modifierName: string
  selectedOptions: {
    optionId: string
    optionName: string
    price: number
  }[]
}

// Customer Types
export interface Customer {
  id: string
  name: string
  email?: string
  phone: string
  addresses: CustomerAddress[]
  orderHistory: Order[]
  totalOrders: number
  totalSpent: number
  averageOrderValue: number
  lastOrderDate?: string
  preferences: {
    favoriteItems: string[]
    dietaryRestrictions: string[]
    spicePreference: number
  }
  loyaltyPoints: number
  createdAt: string
}

export interface CustomerAddress {
  id: string
  label: string
  street: string
  city: string
  zipCode: string
  isDefault: boolean
}

// Payment Types
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'wallet' | 'bank_transfer'
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded'

export interface Payment {
  id: string
  orderId: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  transactionId?: string
  gatewayResponse?: any
  refundAmount?: number
  refundReason?: string
  processedAt?: string
  createdAt: string
}

// Inventory Types
export interface InventoryItem {
  id: string
  restaurantId: string
  name: string
  description?: string
  category: string
  unit: string
  currentStock: number
  minimumStock: number
  maximumStock: number
  costPerUnit: number
  supplierId?: string
  supplier?: Supplier
  expiryDate?: string
  isPerishable: boolean
  stockAlerts: boolean
  lastRestocked?: string
  createdAt: string
}

export interface Supplier {
  id: string
  name: string
  contactPerson: string
  email: string
  phone: string
  address: string
  items: InventoryItem[]
  isActive: boolean
  createdAt: string
}

// Analytics Types
export interface AnalyticsData {
  period: 'today' | 'week' | 'month' | 'year'
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  topSellingItems: {
    item: MenuItem
    quantity: number
    revenue: number
  }[]
  revenueByDay: {
    date: string
    revenue: number
    orders: number
  }[]
  ordersByStatus: {
    status: OrderStatus
    count: number
    percentage: number
  }[]
  paymentMethods: {
    method: PaymentMethod
    count: number
    amount: number
    percentage: number
  }[]
  customerInsights: {
    newCustomers: number
    returningCustomers: number
    customerRetentionRate: number
  }
  peakHours: {
    hour: number
    orderCount: number
  }[]
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// WebSocket Types
export interface WebSocketMessage {
  type: 'order_update' | 'kitchen_update' | 'notification' | 'user_joined' | 'user_left'
  data: any
  timestamp: string
  userId?: string
  restaurantId?: string
}

// Form Types
export interface LoginForm {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterForm {
  name: string
  email: string
  password: string
  confirmPassword: string
  phone: string
  restaurantName: string
  acceptTerms: boolean
}

// UI Types
export interface NotificationMessage {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: string
  actionUrl?: string
}

export interface TableData {
  id: string
  [key: string]: any
}

export interface Column {
  key: string
  label: string
  sortable?: boolean
  render?: (value: any, row: TableData) => React.ReactNode
}

export interface FilterOption {
  label: string
  value: string | number
  count?: number
}

export interface SearchFilters {
  query?: string
  status?: string
  category?: string
  dateRange?: {
    start: string
    end: string
  }
  priceRange?: {
    min: number
    max: number
  }
}

// Kitchen Display Types
export interface KitchenOrder extends Order {
  preparationTime: number
  estimatedReadyTime: string
  timeElapsed: number
  isOverdue: boolean
  priority: 'low' | 'medium' | 'high'
}

// Notification Types
export interface PushNotification {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  actions?: NotificationAction[]
}

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

// PWA Types
export interface PWAConfig {
  name: string
  shortName: string
  description: string
  themeColor: string
  backgroundColor: string
  display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser'
  orientation: 'portrait' | 'landscape' | 'any'
  startUrl: string
  scope: string
  icons: PWAIcon[]
}

export interface PWAIcon {
  src: string
  sizes: string
  type: string
  purpose?: string
}

// Export all types for easy importing
export type {
  // Re-export common types that might be used frequently
  User as AuthUser,
  Restaurant as RestaurantType,
  Order as OrderType,
  MenuItem as MenuItemType,
  Customer as CustomerType,
}
