'use client'

import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Filter, MoreHorizontal, Clock, CheckCircle, XCircle, Truck, Eye, Phone, MapPin } from 'lucide-react'
import { api } from '@/lib/api'
import { Order, OrderStatus } from '@/types'
import { useAuth } from '@/contexts/auth-context'
import { useWebSocket, useOrderUpdates } from '@/contexts/websocket-context'
import { format } from 'date-fns'

const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  confirmed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  preparing: { color: 'bg-orange-100 text-orange-800', icon: Clock },
  ready: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  out_for_delivery: { color: 'bg-purple-100 text-purple-800', icon: Truck },
  delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle },
}

export default function OrdersPage() {
  const { user } = useAuth()
  const { isConnected } = useWebSocket()
  const [selectedRestaurant, setSelectedRestaurant] = useState(user?.restaurants[0]?.id || '')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // Set up real-time updates for the selected restaurant
  const { onOrderUpdate } = useOrderUpdates(selectedRestaurant)

  // Fetch orders
  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ['orders', selectedRestaurant, statusFilter, searchQuery],
    queryFn: () => api.orders.getAll({
      restaurantId: selectedRestaurant,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
    enabled: !!selectedRestaurant,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Listen for real-time order updates
  useEffect(() => {
    const unsubscribe = onOrderUpdate((updatedOrder) => {
      // Refresh orders when an update is received
      refetch()
    })
    return unsubscribe
  }, [onOrderUpdate, refetch])

  const orders = ordersData?.data || []

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await api.orders.updateStatus(orderId, newStatus)
      refetch()
    } catch (error) {
      console.error('Error updating order status:', error)
    }
  }

  const getStatusBadge = (status: OrderStatus) => {
    const config = statusConfig[status]
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon size={12} className="mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </span>
    )
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    return format(date, 'MMM dd, HH:mm')
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchQuery === '' || 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesSearch
  })

  if (!selectedRestaurant) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">Please select a restaurant to view orders</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <div className="flex items-center space-x-2 mt-1">
            <p className="text-gray-600">Manage your restaurant orders</p>
            {isConnected && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                Live
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Restaurant Selector */}
      {user?.restaurants && user.restaurants.length > 1 && (
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Restaurant:</label>
          <select
            value={selectedRestaurant}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
            className="input-field w-auto"
          >
            {user.restaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders by number or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 input-field"
            />
          </div>
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
          className="input-field w-auto"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        
        <button className="btn-secondary flex items-center">
          <Filter size={16} className="mr-2" />
          More Filters
        </button>
      </div>

      {/* Orders List */}
      <div className="bg-white shadow rounded-lg">
        {isLoading ? (
          <div className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center p-4 border border-gray-200 rounded-lg">
                  <div className="h-12 w-12 bg-gray-200 rounded-lg mr-4"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2 w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="h-8 w-20 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              {searchQuery || statusFilter !== 'all' ? 'No orders found matching your criteria' : 'No orders found'}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <OrderRow 
                key={order.id} 
                order={order} 
                onStatusUpdate={handleStatusUpdate}
                onViewDetails={() => setSelectedOrder(order)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  )
}

// Order Row Component
function OrderRow({ 
  order, 
  onStatusUpdate,
  onViewDetails 
}: { 
  order: Order;
  onStatusUpdate: (orderId: string, status: OrderStatus) => void;
  onViewDetails: () => void;
}) {
  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const statusFlow: Record<OrderStatus, OrderStatus | null> = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
      ready: order.type === 'delivery' ? 'out_for_delivery' : 'delivered',
      out_for_delivery: 'delivered',
      delivered: null,
      cancelled: null,
    }
    return statusFlow[currentStatus]
  }

  const nextStatus = getNextStatus(order.status)

  return (
    <div className="p-4 hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1 min-w-0">
          {/* Order Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-medium text-gray-900">{order.orderNumber}</h3>
              {getStatusBadge(order.status)}
              <span className="text-sm text-gray-500">{getTimeAgo(order.createdAt)}</span>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <span className="font-medium">{order.customer?.name || 'Guest'}</span>
              </span>
              
              {order.customer?.phone && (
                <span className="flex items-center">
                  <Phone size={14} className="mr-1" />
                  {order.customer.phone}
                </span>
              )}
              
              <span className="flex items-center">
                <span className="capitalize">{order.type.replace('_', ' ')}</span>
              </span>
              
              <span className="font-medium text-gray-900">
                ₹{order.total.toLocaleString()}
              </span>
              
              <span className="text-gray-500">
                {order.items.length} item{order.items.length !== 1 ? 's' : ''}
              </span>
            </div>

            {order.deliveryAddress && (
              <div className="mt-1 flex items-center text-sm text-gray-600">
                <MapPin size={14} className="mr-1" />
                <span className="truncate">
                  {order.deliveryAddress.street}, {order.deliveryAddress.city}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={onViewDetails}
            className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
          >
            <Eye size={16} className="mr-1" />
            Details
          </button>
          
          {nextStatus && (
            <button
              onClick={() => onStatusUpdate(order.id, nextStatus)}
              className="btn-primary text-sm py-1 px-3"
            >
              Mark as {nextStatus.replace('_', ' ')}
            </button>
          )}
          
          {order.status !== 'cancelled' && order.status !== 'delivered' && (
            <button
              onClick={() => onStatusUpdate(order.id, 'cancelled')}
              className="btn-danger text-sm py-1 px-3"
            >
              Cancel
            </button>
          )}
          
          <button className="p-1 text-gray-400 hover:text-gray-600">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

// Order Details Modal
function OrderDetailsModal({ 
  order, 
  isOpen, 
  onClose,
  onStatusUpdate 
}: { 
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (orderId: string, status: OrderStatus) => void;
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{order.orderNumber}</h2>
              <p className="text-gray-600">Order Details</p>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(order.status)}
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
          </div>

          {/* Customer Info */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Customer</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium">{order.customer?.name || 'Guest'}</p>
              {order.customer?.phone && <p className="text-gray-600">{order.customer.phone}</p>}
              {order.deliveryAddress && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Delivery Address:</p>
                  <p className="text-sm">
                    {order.deliveryAddress.street}, {order.deliveryAddress.city}, {order.deliveryAddress.zipCode}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Items</h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.menuItem.name}</h4>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    {item.specialInstructions && (
                      <p className="text-sm text-gray-600 mt-1">Note: {item.specialInstructions}</p>
                    )}
                    {item.selectedModifiers.length > 0 && (
                      <div className="mt-1">
                        {item.selectedModifiers.map((modifier) => (
                          <p key={modifier.modifierId} className="text-xs text-gray-500">
                            + {modifier.modifierName}: {modifier.selectedOptions.map(o => o.optionName).join(', ')}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">₹{item.totalPrice}</p>
                    <p className="text-sm text-gray-600">₹{item.unitPrice} each</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Summary</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>₹{order.tax}</span>
                </div>
                {order.serviceCharge > 0 && (
                  <div className="flex justify-between">
                    <span>Service Charge</span>
                    <span>₹{order.serviceCharge}</span>
                  </div>
                )}
                {order.deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>₹{order.deliveryFee}</span>
                  </div>
                )}
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{order.discount}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{order.total}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <button onClick={onClose} className="btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function getStatusBadge(status: OrderStatus) {
  const config = statusConfig[status]
  const Icon = config.icon
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      <Icon size={12} className="mr-1" />
      {status.replace('_', ' ').toUpperCase()}
    </span>
  )
}
