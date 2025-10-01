'use client'

import { useState } from 'react'
import { useQuery } from 'react-query'
import { api } from '@/lib/api'
import Link from 'next/link'
import { BookOpenIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline'

export default function Books() {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    genre: '',
    language: '',
    status: '',
  })

  const { data: books, isLoading } = useQuery(
    ['books', search, filters],
    async () => {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (filters.genre) params.append('genre', filters.genre)
      if (filters.language) params.append('language', filters.language)
      if (filters.status) params.append('status', filters.status)
      
      const response = await api.get(`/books/?${params.toString()}`)
      return response.data
    }
  )

  const { data: genres } = useQuery('genres', async () => {
    const response = await api.get('/books/genres/')
    return response.data
  })

  const { data: languages } = useQuery('languages', async () => {
    const response = await api.get('/books/languages/')
    return response.data
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Book Catalog</h1>
        <p className="mt-2 text-gray-600">
          Discover books available for translation and reading.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search books..."
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={filters.genre}
            onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
          >
            <option value="">All Genres</option>
            {genres?.map((genre: string) => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
          
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={filters.language}
            onChange={(e) => setFilters({ ...filters, language: e.target.value })}
          >
            <option value="">All Languages</option>
            {languages?.map((language: string) => (
              <option key={language} value={language}>{language}</option>
            ))}
          </select>
          
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="in_translation">In Translation</option>
            <option value="completed">Completed</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      {/* Books Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
              <div className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {books?.results?.map((book: any) => (
            <div key={book.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="aspect-w-16 aspect-h-9">
                <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                  <BookOpenIcon className="h-12 w-12 text-gray-400" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{book.title}</h3>
                <p className="text-gray-600 mb-2">by {book.author}</p>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{book.description}</p>
                
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800">
                    {book.language_pair}
                  </span>
                  <span className="text-sm text-gray-500">{book.word_count} words</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    book.status === 'available' ? 'bg-green-100 text-green-800' :
                    book.status === 'in_translation' ? 'bg-yellow-100 text-yellow-800' :
                    book.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {book.status}
                  </span>
                  <Link
                    href={`/books/${book.id}`}
                    className="text-primary-600 hover:text-primary-500 text-sm font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {books?.results?.length === 0 && (
        <div className="text-center py-12">
          <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No books found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}
    </div>
  )
}
