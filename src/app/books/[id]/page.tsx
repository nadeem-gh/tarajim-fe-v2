'use client'

import { useQuery, useMutation, useQueryClient } from 'react-query'
import { api } from '@/lib/api'
import { useParams } from 'next/navigation'
import { BookOpenIcon, MicrophoneIcon, SpeakerWaveIcon, ClockIcon, DocumentTextIcon, UserPlusIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useState } from 'react'

export default function BookDetail() {
  const params = useParams()
  const bookId = params.id
  const queryClient = useQueryClient()
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showApplicationModal, setShowApplicationModal] = useState(false)

  const { data: book, isLoading } = useQuery(
    ['book-detail', bookId],
    async () => {
      const response = await api.get(`/books/${bookId}/detail/`)
      return response.data
    }
  )

  const { data: stats } = useQuery(
    ['book-stats', bookId],
    async () => {
      const response = await api.get(`/books/${bookId}/stats/`)
      return response.data
    }
  )

  // Create translation request mutation
  const createRequestMutation = useMutation(
    async (requestData: any) => {
      const response = await api.post(`/books/${bookId}/create-request/`, requestData)
      return response.data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['book-detail', bookId])
        setShowRequestModal(false)
      }
    }
  )

  // Submit application mutation
  const submitApplicationMutation = useMutation(
    async (applicationData: any) => {
      const response = await api.post(`/books/${bookId}/submit-application/`, applicationData)
      return response.data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['book-detail', bookId])
        setShowApplicationModal(false)
      }
    }
  )

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="h-64 bg-gray-200 rounded mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Book not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The book you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{book.title}</h1>
        <p className="mt-2 text-xl text-gray-600">by {book.author}</p>
        <div className="mt-4 flex items-center space-x-4">
          <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-primary-100 text-primary-800">
            {book.language_pair}
          </span>
          <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 text-gray-800">
            {book.genre}
          </span>
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
            book.status === 'available' ? 'bg-green-100 text-green-800' :
            book.status === 'in_translation' ? 'bg-yellow-100 text-yellow-800' :
            book.status === 'completed' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {book.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-600 leading-relaxed">{book.description}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Chapters</h2>
            <div className="space-y-3">
              {book.chapters?.map((chapter: any) => (
                <div key={chapter.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{chapter.title}</h3>
                    <p className="text-sm text-gray-500">{chapter.word_count} words</p>
                  </div>
                  <Link
                    href={`/books/${book.id}/chapters/${chapter.id}`}
                    className="text-primary-600 hover:text-primary-500 text-sm font-medium"
                  >
                    View →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Book Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Book Statistics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Word Count</span>
                <span className="font-medium">{book.word_count.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pages</span>
                <span className="font-medium">{book.page_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Estimated Translation Time</span>
                <span className="font-medium">{book.estimated_translation_time} hours</span>
              </div>
              {stats && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Chapters</span>
                    <span className="font-medium">{stats.chapters_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Translation Progress</span>
                    <span className="font-medium">{stats.translation_progress?.toFixed(1)}%</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              {/* Read Book Button - Available for all users */}
              {book.can_read_book && (
                <a
                  href={book.epub_download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <BookOpenIcon className="h-5 w-5 mr-2" />
                  Read Book
                </a>
              )}
              
              {/* Send Request Button - Only for requesters */}
              {book.can_send_request && (
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="w-full flex items-center justify-center px-4 py-2 border border-primary-600 text-sm font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50"
                >
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Send Request
                </button>
              )}
              
              {/* Submit Application Button - Only for translators */}
              {book.can_start_translation && (
                <button
                  onClick={() => setShowApplicationModal(true)}
                  className="w-full flex items-center justify-center px-4 py-2 border border-green-600 text-sm font-medium rounded-md text-green-600 bg-white hover:bg-green-50"
                >
                  <UserPlusIcon className="h-5 w-5 mr-2" />
                  Submit Application
                </button>
              )}
              
              {/* Generate Audio Button - Available for all users */}
              <Link
                href={`/books/${book.id}/audio`}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <SpeakerWaveIcon className="h-5 w-5 mr-2" />
                Generate Audio
              </Link>
            </div>
          </div>

          {/* Sample Translations */}
          {book.sample_translations_count > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sample Translations</h3>
              <p className="text-sm text-gray-600 mb-4">
                {book.sample_translations_count} sample translations available
              </p>
              <Link
                href={`/books/${book.id}/samples`}
                className="text-primary-600 hover:text-primary-500 text-sm font-medium"
              >
                View Samples →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Translation Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Translation Request</h3>
              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.target as HTMLFormElement)
                createRequestMutation.mutate({
                  title: formData.get('title'),
                  description: formData.get('description'),
                  target_language: formData.get('target_language'),
                  budget: parseFloat(formData.get('budget') as string),
                  deadline: formData.get('deadline')
                })
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                      type="text"
                      name="title"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Translation request title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      name="description"
                      required
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Describe your translation needs"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Target Language</label>
                    <select
                      name="target_language"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="ar">Arabic</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="it">Italian</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Budget ($)</label>
                    <input
                      type="number"
                      name="budget"
                      required
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Deadline</label>
                    <input
                      type="datetime-local"
                      name="deadline"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createRequestMutation.isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md disabled:opacity-50"
                  >
                    {createRequestMutation.isLoading ? 'Creating...' : 'Create Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Translation Application Modal */}
      {showApplicationModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Submit Translation Application</h3>
              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.target as HTMLFormElement)
                submitApplicationMutation.mutate({
                  message: formData.get('message'),
                  proposed_rate: parseFloat(formData.get('proposed_rate') as string),
                  estimated_completion_time: formData.get('estimated_completion_time')
                })
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Message</label>
                    <textarea
                      name="message"
                      required
                      rows={4}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Tell us why you're interested in translating this book..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Proposed Rate ($/word)</label>
                    <input
                      type="number"
                      name="proposed_rate"
                      required
                      min="0"
                      step="0.001"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="0.05"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estimated Completion Time</label>
                    <input
                      type="text"
                      name="estimated_completion_time"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="e.g., 30 days, 2 months"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowApplicationModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitApplicationMutation.isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50"
                  >
                    {submitApplicationMutation.isLoading ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
