'use client'

import { useState } from 'react'
import { useQuery } from 'react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { 
  MicrophoneIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  PlusIcon,
  ClockIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'

export default function Translations() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    source_language: '',
    target_language: '',
  })

  const { data: requests, isLoading } = useQuery(
    ['translation-requests', search, filters],
    async () => {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (filters.status) params.append('status', filters.status)
      if (filters.source_language) params.append('source_language', filters.source_language)
      if (filters.target_language) params.append('target_language', filters.target_language)
      
      const response = await api.get(`/translations/requests/?${params.toString()}`)
      return response.data
    }
  )

  const { data: languages } = useQuery('languages', async () => {
    const response = await api.get('/translations/languages/')
    return response.data
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Translation Requests</h1>
          <p className="mt-2 text-gray-600">
            Browse and manage translation projects.
          </p>
        </div>
        {user?.role === 'requester' && (
          <Link
            href="/translations/requests/new"
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Request
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search requests..."
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={filters.source_language}
            onChange={(e) => setFilters({ ...filters, source_language: e.target.value })}
          >
            <option value="">All Source Languages</option>
            {languages?.map((language: string) => (
              <option key={language} value={language}>{language}</option>
            ))}
          </select>
          
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={filters.target_language}
            onChange={(e) => setFilters({ ...filters, target_language: e.target.value })}
          >
            <option value="">All Target Languages</option>
            {languages?.map((language: string) => (
              <option key={language} value={language}>{language}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="flex space-x-4">
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {requests?.results?.map((request: any) => (
            <div key={request.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{request.title}</h3>
                    <p className="text-gray-600 mb-4">{request.description}</p>
                    
                    <div className="flex items-center space-x-4 mb-4">
                      <span className="text-sm text-gray-500">
                        <strong>Book:</strong> {request.book_title}
                      </span>
                      <span className="text-sm text-gray-500">
                        <strong>Language:</strong> {request.language_pair}
                      </span>
                      <span className="text-sm text-gray-500">
                        <strong>Budget:</strong> ${request.budget}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(request.priority)}`}>
                        {request.priority} priority
                      </span>
                      <span className="text-sm text-gray-500">
                        {request.applications_count} applications
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Deadline</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(request.deadline).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Link
                        href={`/translations/requests/${request.id}`}
                        className="text-primary-600 hover:text-primary-500 text-sm font-medium"
                      >
                        View Details →
                      </Link>
                      {user?.role === 'translator' && request.status === 'open' && (
                        <Link
                          href={`/translations/requests/${request.id}/apply`}
                          className="text-green-600 hover:text-green-500 text-sm font-medium"
                        >
                          Apply →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {requests?.results?.length === 0 && (
        <div className="text-center py-12">
          <MicrophoneIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No translation requests found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}
    </div>
  )
}
