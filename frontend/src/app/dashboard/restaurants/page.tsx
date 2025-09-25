'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, Filter, MoreVertical, Edit, Trash2, Eye, MapPin, Phone, Globe } from 'lucide-react'
import { api } from '@/lib/api'
import { Restaurant } from '@/types'
import { useAuth } from '@/contexts/auth-context'

export default function RestaurantsPage() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Fetch restaurants
  const { data: restaurantsData, isLoading, error } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => api.restaurants.getAll({ search: searchQuery }),
  })

  const restaurants = restaurantsData?.data || []

  const handleCreateRestaurant = () => {
    setShowCreateModal(true)
  }

  const handleEditRestaurant = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant)
  }

  const handleDeleteRestaurant = async (id: string) => {
    if (confirm('Are you sure you want to delete this restaurant?')) {
      try {
        await api.restaurants.delete(id)
        // Refresh the list
        // queryClient.invalidateQueries(['restaurants'])
      } catch (error) {
        console.error('Error deleting restaurant:', error)
      }
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    )
  }

  const getCuisineTypes = (cuisine: string[]) => {
    return cuisine.slice(0, 2).join(', ') + (cuisine.length > 2 ? ` +${cuisine.length - 2}` : '')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error loading restaurants</div>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Restaurants</h1>
          <p className="text-gray-600">Manage your restaurant locations</p>
        </div>
        <button
          onClick={handleCreateRestaurant}
          className="btn-primary flex items-center"
        >
          <Plus size={16} className="mr-2" />
          Add Restaurant
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search restaurants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 input-field"
            />
          </div>
        </div>
        <button className="btn-secondary flex items-center">
          <Filter size={16} className="mr-2" />
          Filter
        </button>
      </div>

      {/* Restaurants Grid */}
      {restaurants.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No restaurants found</div>
          <button
            onClick={handleCreateRestaurant}
            className="btn-primary"
          >
            Create your first restaurant
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => (
            <div key={restaurant.id} className="card overflow-hidden">
              {/* Restaurant Image */}
              <div className="h-48 bg-gray-200 relative">
                {restaurant.coverImage ? (
                  <img
                    src={restaurant.coverImage}
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <MapPin size={32} className="mx-auto mb-2" />
                      <p className="text-sm">No image</p>
                    </div>
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  {getStatusBadge(restaurant.isActive)}
                </div>

                {/* Actions Menu */}
                <div className="absolute top-3 right-3">
                  <div className="relative">
                    <button className="p-1 bg-white rounded-full shadow-sm hover:shadow-md">
                      <MoreVertical size={16} className="text-gray-600" />
                    </button>
                    {/* Dropdown menu would go here */}
                  </div>
                </div>
              </div>

              {/* Restaurant Info */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {restaurant.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {getCuisineTypes(restaurant.cuisine)}
                    </p>
                  </div>
                  <div className="flex items-center ml-2">
                    <div className="flex text-yellow-400">
                      {'★'.repeat(Math.floor(restaurant.rating))}
                    </div>
                    <span className="text-sm text-gray-600 ml-1">
                      ({restaurant.reviewCount})
                    </span>
                  </div>
                </div>

                {restaurant.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {restaurant.description}
                  </p>
                )}

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin size={14} className="mr-2 flex-shrink-0" />
                    <span className="truncate">
                      {restaurant.address.street}, {restaurant.address.city}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone size={14} className="mr-2 flex-shrink-0" />
                    <span>{restaurant.phone}</span>
                  </div>
                  {restaurant.website && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Globe size={14} className="mr-2 flex-shrink-0" />
                      <span className="truncate">{restaurant.website}</span>
                    </div>
                  )}
                </div>

                {/* Price Range */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-900">
                    Price Range: {restaurant.priceRange}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleEditRestaurant(restaurant)}
                    className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    <Edit size={14} className="mr-1" />
                    Edit
                  </button>
                  
                  <button className="flex items-center text-sm text-gray-600 hover:text-gray-800">
                    <Eye size={14} className="mr-1" />
                    View Details
                  </button>
                  
                  <button
                    onClick={() => handleDeleteRestaurant(restaurant.id)}
                    className="flex items-center text-sm text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={14} className="mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Restaurant Modal */}
      {showCreateModal && (
        <CreateRestaurantModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {selectedRestaurant && (
        <EditRestaurantModal
          restaurant={selectedRestaurant}
          isOpen={!!selectedRestaurant}
          onClose={() => setSelectedRestaurant(null)}
        />
      )}
    </div>
  )
}

// Placeholder Modal Components
function CreateRestaurantModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Create New Restaurant</h2>
        <p className="text-gray-600 mb-4">Restaurant creation form will be implemented here.</p>
        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button className="btn-primary">
            Create Restaurant
          </button>
        </div>
      </div>
    </div>
  )
}

function EditRestaurantModal({ 
  restaurant, 
  isOpen, 
  onClose 
}: { 
  restaurant: Restaurant; 
  isOpen: boolean; 
  onClose: () => void 
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Edit Restaurant</h2>
        <p className="text-gray-600 mb-4">Editing: {restaurant.name}</p>
        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button className="btn-primary">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
