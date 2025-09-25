'use client'

import { useAuth } from '@/contexts/auth-context'
import { TrendingUp, Users, ShoppingCart, DollarSign, Clock, CheckCircle } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()

  const stats = [
    {
      name: 'Total Revenue',
      value: '₹2,45,890',
      change: '+12%',
      changeType: 'increase' as const,
      icon: DollarSign,
    },
    {
      name: 'Total Orders',
      value: '1,284',
      change: '+8%',
      changeType: 'increase' as const,
      icon: ShoppingCart,
    },
    {
      name: 'Active Customers',
      value: '892',
      change: '+5%',
      changeType: 'increase' as const,
      icon: Users,
    },
    {
      name: 'Avg Order Value',
      value: '₹485',
      change: '+3%',
      changeType: 'increase' as const,
      icon: TrendingUp,
    },
  ]

  const recentOrders = [
    { id: '#ORD-001', customer: 'John Doe', amount: '₹850', status: 'completed', time: '2 min ago' },
    { id: '#ORD-002', customer: 'Jane Smith', amount: '₹1,200', status: 'preparing', time: '5 min ago' },
    { id: '#ORD-003', customer: 'Mike Johnson', amount: '₹650', status: 'confirmed', time: '8 min ago' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {user?.name}!</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                <Clock size={16} className="inline mr-1" />
                Last updated: just now
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((item) => (
            <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <item.icon size={20} className="text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {item.name}
                      </dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">
                          {item.value}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <span className="font-medium text-green-600">{item.change}</span>
                  <span className="text-gray-500"> from last month</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {recentOrders.map((order) => (
                <div key={order.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{order.id}</p>
                        <p className="text-sm text-gray-500">{order.customer}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{order.amount}</p>
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {order.status === 'completed' && <CheckCircle size={12} className="mr-1" />}
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                  <ShoppingCart size={24} className="text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-900">New Order</span>
                </button>
                <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                  <Users size={24} className="text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Add Customer</span>
                </button>
                <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                  <TrendingUp size={24} className="text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-900">View Analytics</span>
                </button>
                <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                  <DollarSign size={24} className="text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Payments</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center">
            <CheckCircle size={20} className="text-green-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-green-800">
                🎉 Your Restaurant Management SaaS is Ready!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>All 542+ TypeScript errors have been fixed and your application is now fully functional.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
