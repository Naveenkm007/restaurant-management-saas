'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Filter, Download, CreditCard, Smartphone, Wallet, DollarSign, TrendingUp, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'
import { Payment, PaymentMethod, PaymentStatus } from '@/types'
import { useAuth } from '@/contexts/auth-context'
import { format } from 'date-fns'

const paymentMethodIcons = {
  cash: DollarSign,
  card: CreditCard,
  upi: Smartphone,
  wallet: Wallet,
  bank_transfer: CreditCard,
}

const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
  processing: { color: 'bg-blue-100 text-blue-800', text: 'Processing' },
  completed: { color: 'bg-green-100 text-green-800', text: 'Completed' },
  failed: { color: 'bg-red-100 text-red-800', text: 'Failed' },
  cancelled: { color: 'bg-gray-100 text-gray-800', text: 'Cancelled' },
  refunded: { color: 'bg-purple-100 text-purple-800', text: 'Refunded' },
}

export default function PaymentsPage() {
  const { user } = useAuth()
  const [selectedRestaurant, setSelectedRestaurant] = useState(user?.restaurants[0]?.id || '')
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all')
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState('week')

  // Fetch payments
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['payments', selectedRestaurant, statusFilter, methodFilter],
    queryFn: () => api.payments.getAll({
      restaurantId: selectedRestaurant,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      method: methodFilter !== 'all' ? methodFilter : undefined,
    }),
    enabled: !!selectedRestaurant,
  })

  // Fetch payment summary
  const { data: summaryData } = useQuery({
    queryKey: ['payments', 'summary', selectedRestaurant, dateRange],
    queryFn: () => api.payments.getSummary(selectedRestaurant),
    enabled: !!selectedRestaurant,
  })

  const payments = paymentsData?.data || []
  const summary = summaryData?.data

  const filteredPayments = payments.filter(payment => {
    return searchQuery === '' || 
      payment.transactionId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.orderId.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const handleRefund = async (paymentId: string, amount: number) => {
    const reason = prompt('Enter refund reason:')
    if (reason) {
      try {
        await api.payments.refund(paymentId, amount, reason)
        // Refresh payments
      } catch (error) {
        console.error('Error processing refund:', error)
      }
    }
  }

  const getStatusBadge = (status: PaymentStatus) => {
    const config = statusConfig[status]
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    )
  }

  const getMethodIcon = (method: PaymentMethod) => {
    const Icon = paymentMethodIcons[method]
    return <Icon size={16} />
  }

  if (!selectedRestaurant) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">Please select a restaurant to view payments</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">Track and manage payment transactions</p>
        </div>
        <button className="btn-primary flex items-center">
          <Download size={16} className="mr-2" />
          Export Report
        </button>
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

      {/* Payment Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign size={24} className="text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{summary.totalRevenue?.toLocaleString() || '0'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CreditCard size={24} className="text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalTransactions || '0'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp size={24} className="text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{summary.successRate || '0'}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <RefreshCw size={24} className="text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Refunds</p>
                <p className="text-2xl font-bold text-gray-900">₹{summary.totalRefunds?.toLocaleString() || '0'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by transaction ID or order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 input-field"
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'all')}
            className="input-field w-auto"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
          
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value as PaymentMethod | 'all')}
            className="input-field w-auto"
          >
            <option value="all">All Methods</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
            <option value="wallet">Wallet</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
          
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input-field w-auto"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
        </div>
        
        {isLoading ? (
          <div className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center p-4">
                  <div className="h-4 bg-gray-200 rounded w-1/6 mr-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4 mr-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6 mr-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No payments found</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {payment.transactionId || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">ID: {payment.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{payment.orderId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getMethodIcon(payment.method)}
                        <span className="ml-2 text-sm text-gray-900 capitalize">
                          {payment.method.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{payment.amount.toLocaleString()}
                      </div>
                      {payment.refundAmount && payment.refundAmount > 0 && (
                        <div className="text-sm text-red-600">
                          Refunded: ₹{payment.refundAmount.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(payment.createdAt), 'MMM dd, HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {payment.status === 'completed' && !payment.refundAmount && (
                        <button
                          onClick={() => handleRefund(payment.id, payment.amount)}
                          className="text-red-600 hover:text-red-900 mr-3"
                        >
                          Refund
                        </button>
                      )}
                      <button className="text-indigo-600 hover:text-indigo-900">
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
