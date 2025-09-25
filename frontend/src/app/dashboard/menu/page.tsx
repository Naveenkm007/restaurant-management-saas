'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, Grid, List, Filter, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { api } from '@/lib/api'
import { MenuCategory, MenuItem } from '@/types'
import { useAuth } from '@/contexts/auth-context'

export default function MenuPage() {
  const { user } = useAuth()
  const [selectedRestaurant, setSelectedRestaurant] = useState(user?.restaurants[0]?.id || '')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [showCreateItem, setShowCreateItem] = useState(false)

  // Fetch menu categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['menu-categories', selectedRestaurant],
    queryFn: () => api.menu.categories.getAll(selectedRestaurant),
    enabled: !!selectedRestaurant,
  })

  // Fetch menu items
  const { data: itemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ['menu-items', selectedRestaurant, selectedCategory, searchQuery],
    queryFn: () => api.menu.items.getAll(selectedRestaurant, {
      categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
      search: searchQuery,
    }),
    enabled: !!selectedRestaurant,
  })

  const categories = categoriesData?.data || []
  const items = itemsData?.data || []

  const handleToggleItemAvailability = async (itemId: string, isAvailable: boolean) => {
    try {
      await api.menu.items.updateAvailability(selectedRestaurant, itemId, !isAvailable)
      // Refresh items
    } catch (error) {
      console.error('Error updating item availability:', error)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (confirm('Are you sure you want to delete this menu item?')) {
      try {
        await api.menu.items.delete(selectedRestaurant, itemId)
        // Refresh items
      } catch (error) {
        console.error('Error deleting item:', error)
      }
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (confirm('Are you sure you want to delete this category? All items in this category will also be deleted.')) {
      try {
        await api.menu.categories.delete(selectedRestaurant, categoryId)
        // Refresh categories and items
      } catch (error) {
        console.error('Error deleting category:', error)
      }
    }
  }

  if (!selectedRestaurant) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">Please select a restaurant to manage menu</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-600">Manage your restaurant menu items and categories</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowCreateCategory(true)}
            className="btn-secondary flex items-center"
          >
            <Plus size={16} className="mr-2" />
            Add Category
          </button>
          <button
            onClick={() => setShowCreateItem(true)}
            className="btn-primary flex items-center"
          >
            <Plus size={16} className="mr-2" />
            Add Item
          </button>
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

      {/* Categories */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Categories</h2>
        </div>
        
        {categoriesLoading ? (
          <div className="animate-pulse flex space-x-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg flex-1"></div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No categories found. Create your first category to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                selectedCategory === 'all' 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-gray-900">All Items</div>
              <div className="text-sm text-gray-500">{items.length} items</div>
            </button>
            
            {categories.map((category) => (
              <div key={category.id} className="relative group">
                <button
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                    selectedCategory === category.id 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{category.name}</div>
                  <div className="text-sm text-gray-500">{category.itemCount} items</div>
                </button>
                
                {/* Category Actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex space-x-1">
                    <button className="p-1 text-gray-400 hover:text-indigo-600">
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Menu Items */}
      <div className="bg-white shadow rounded-lg">
        {/* Items Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg font-medium text-gray-900">
              Menu Items {selectedCategory !== 'all' && categories.find(c => c.id === selectedCategory) && 
                `- ${categories.find(c => c.id === selectedCategory)?.name}`}
            </h2>
            
            <div className="flex items-center space-x-2">
              {/* Search */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-64"
                />
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600'}`}
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600'}`}
                >
                  <List size={16} />
                </button>
              </div>
              
              <button className="btn-secondary flex items-center">
                <Filter size={16} className="mr-2" />
                Filter
              </button>
            </div>
          </div>
        </div>

        {/* Items Content */}
        <div className="p-6">
          {itemsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">No menu items found</div>
              <button
                onClick={() => setShowCreateItem(true)}
                className="btn-primary"
              >
                Create your first menu item
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <MenuItemCard 
                  key={item.id} 
                  item={item} 
                  onToggleAvailability={handleToggleItemAvailability}
                  onDelete={handleDeleteItem}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <MenuItemRow 
                  key={item.id} 
                  item={item} 
                  onToggleAvailability={handleToggleItemAvailability}
                  onDelete={handleDeleteItem}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Menu Item Card Component
function MenuItemCard({ 
  item, 
  onToggleAvailability, 
  onDelete 
}: { 
  item: MenuItem; 
  onToggleAvailability: (id: string, isAvailable: boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="h-48 bg-gray-200 relative">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No image
          </div>
        )}
        
        {/* Availability Toggle */}
        <button
          onClick={() => onToggleAvailability(item.id, item.isAvailable)}
          className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm"
        >
          {item.isAvailable ? (
            <ToggleRight size={20} className="text-green-600" />
          ) : (
            <ToggleLeft size={20} className="text-gray-400" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
          <span className="font-bold text-gray-900">₹{item.price}</span>
        </div>
        
        {item.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>{item.preparationTime} min</span>
          {item.modifiers.length > 0 && (
            <span>{item.modifiers.length} modifier{item.modifiers.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
          <span className={`text-xs font-medium ${item.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
            {item.isAvailable ? 'Available' : 'Unavailable'}
          </span>
          
          <div className="flex space-x-2">
            <button className="p-1 text-gray-400 hover:text-indigo-600">
              <Edit size={16} />
            </button>
            <button 
              onClick={() => onDelete(item.id)}
              className="p-1 text-gray-400 hover:text-red-600"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Menu Item Row Component
function MenuItemRow({ 
  item, 
  onToggleAvailability, 
  onDelete 
}: { 
  item: MenuItem; 
  onToggleAvailability: (id: string, isAvailable: boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
      <div className="w-16 h-16 bg-gray-200 rounded-lg mr-4 flex-shrink-0">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-lg" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            No image
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-gray-900">{item.name}</h3>
            <p className="text-sm text-gray-600 truncate">{item.description}</p>
          </div>
          <div className="text-right ml-4">
            <div className="font-bold text-gray-900">₹{item.price}</div>
            <div className="text-xs text-gray-500">{item.preparationTime} min</div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 ml-4">
        <button
          onClick={() => onToggleAvailability(item.id, item.isAvailable)}
          className={`p-1 rounded ${item.isAvailable ? 'text-green-600' : 'text-gray-400'}`}
        >
          {item.isAvailable ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
        </button>
        <button className="p-1 text-gray-400 hover:text-indigo-600">
          <Edit size={16} />
        </button>
        <button 
          onClick={() => onDelete(item.id)}
          className="p-1 text-gray-400 hover:text-red-600"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}
