'use client'

import { useQuery, useMutation, useQueryClient } from 'react-query'
import { api } from '@/lib/api'
import { useParams, useSearchParams } from 'next/navigation'
import { BookOpenIcon, MicrophoneIcon, SpeakerWaveIcon, ClockIcon, DocumentTextIcon, UserPlusIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import React, { useState } from 'react'
import toast from 'react-hot-toast'
import TranslationWorkflowPanel from '@/components/TranslationWorkflowPanel'
import ErrorBoundary from '@/components/ErrorBoundary'
import { useAuth } from '@/contexts/AuthContext'

export default function BookDetail() {
  const params = useParams()
  const searchParams = useSearchParams()
  const bookId = Array.isArray(params.id) ? params.id[0] : params.id
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showApplicationModal, setShowApplicationModal] = useState(false)

  // Check for URL parameters to open modals
  React.useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'create-request') {
      setShowRequestModal(true)
    } else if (action === 'apply') {
      setShowApplicationModal(true)
    }
  }, [searchParams])

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

  const { data: applicationStatus } = useQuery(
    ['book-application-status', bookId],
    async () => {
      const response = await api.get(`/books/${bookId}/application-status/`)
      return response.data
    }
  )

  const { data: translationRequests } = useQuery(
    ['book-translation-requests', bookId],
    async () => {
      const response = await api.get(`/books/${bookId}/translation-requests/`)
      return response.data
    },
    {
      enabled: book?.can_send_request // Only fetch for requesters
    }
  )

  // Fetch workflow data to check translation status
  const { data: workflowData } = useQuery(
    ['book-workflow', bookId],
    async () => {
      const response = await api.get(`/books/${bookId}/translation-workflow/`)
      return response.data
    },
    {
      enabled: !!bookId && user?.role !== 'reader'
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
        // Clear URL parameter
        const url = new URL(window.location.href)
        url.searchParams.delete('action')
        window.history.replaceState({}, '', url.toString())
        toast.success('Translation request created successfully')
      },
      onError: (error: any) => {
        console.error('Create request error:', error)
        const errorMessage = error.response?.data?.error?.message || 
                           error.response?.data?.message || 
                           'Failed to create translation request'
        toast.error(errorMessage)
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
        queryClient.invalidateQueries(['book-application-status', bookId])
        setShowApplicationModal(false)
        toast.success('Application submitted successfully')
      },
      onError: (error: any) => {
        console.error('Submit application error:', error)
        const errorMessage = error.response?.data?.error?.message || 
                           error.response?.data?.message || 
                           'Failed to submit application'
        toast.error(errorMessage)
      }
    }
  )

  // Accept application mutation
  const acceptApplicationMutation = useMutation(
    async ({ applicationId, data }: { applicationId: number, data: any }) => {
      const response = await api.post(`/books/${bookId}/applications/${applicationId}/accept/`, data)
      return response.data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['book-translation-requests', bookId])
        queryClient.invalidateQueries(['book-detail', bookId])
      }
    }
  )

  // Reject application mutation
  const rejectApplicationMutation = useMutation(
    async ({ applicationId, data }: { applicationId: number, data: any }) => {
      const response = await api.post(`/books/${bookId}/applications/${applicationId}/reject/`, data)
      return response.data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['book-translation-requests', bookId])
        queryClient.invalidateQueries(['book-detail', bookId])
      }
    }
  )

  // Accept multiple applications mutation
  const acceptMultipleApplicationsMutation = useMutation(
    async ({ applicationIds, data }: { applicationIds: number[], data: any }) => {
      const response = await api.post(`/books/${bookId}/applications/accept-multiple/`, {
        application_ids: applicationIds,
        ...data
      })
      return response.data
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['book-translation-requests', bookId])
        queryClient.invalidateQueries(['book-detail', bookId])
        toast.success(`${data.applications.length} applications accepted successfully!`)
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.error?.message || 
                           error.response?.data?.message || 
                           'Failed to accept applications'
        toast.error(errorMessage)
      }
    }
  )

  // Helper function to check if translation is completed
  const isTranslationCompleted = () => {
    if (!workflowData?.requests || workflowData.requests.length === 0) {
      return false
    }
    
    // Check if any request has status 'completed'
    const hasCompletedRequest = workflowData.requests.some((request: any) => 
      request.status === 'completed'
    )
    
    // Also check if all milestones are completed
    const allMilestonesCompleted = workflowData.milestones?.every((milestone: any) => 
      milestone.status === 'completed' || milestone.status === 'approved' || milestone.status === 'paid'
    ) || false
    
    return hasCompletedRequest && allMilestonesCompleted
  }

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

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Chapters</h2>
            <div className="space-y-3">
              {book.chapters?.map((chapter: any) => (
                <div key={chapter.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{chapter.title}</h3>
                    <p className="text-sm text-gray-500">{chapter.word_count} words</p>
                  </div>
                  <Link
                    href={`/workspace/${chapter.milestone_id}?book=${book.id}`}
                    className="text-primary-600 hover:text-primary-500 text-sm font-medium"
                  >
                    Start Translation →
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Translation Workflow Panel */}
          {user && user.role !== 'reader' && (
            <ErrorBoundary>
              <TranslationWorkflowPanel
                bookId={bookId}
                userRole={user.role}
                onRefresh={() => queryClient.invalidateQueries(['book-workflow', bookId])}
              />
            </ErrorBoundary>
          )}
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
              {/* Read Book Button - Only available when translation is completed */}
              {book.can_read_book && isTranslationCompleted() && (
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
              
              {/* Submit Application Button - Only for translators */}
              {book.can_start_translation && !applicationStatus?.has_applied && (
                <button
                  onClick={() => setShowApplicationModal(true)}
                  className="w-full flex items-center justify-center px-4 py-2 border border-green-600 text-sm font-medium rounded-md text-green-600 bg-white hover:bg-green-50"
                >
                  <UserPlusIcon className="h-5 w-5 mr-2" />
                  Submit Application
                </button>
              )}
              
              {/* Generate Audio Button - Only available when translation is completed */}
              {isTranslationCompleted() && (
                <Link
                  href={`/books/${book.id}/audio`}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <SpeakerWaveIcon className="h-5 w-5 mr-2" />
                  Generate Audio
                </Link>
              )}

              {/* Translation Status Message */}
              {!isTranslationCompleted() && (workflowData?.requests?.length > 0) && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <ClockIcon className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Translation in Progress
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>Read Book and Generate Audio features will be available once the translation is completed.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Application Status */}
          {applicationStatus?.has_applied && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Application History</h3>
              
              {/* Current Application Status */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-md font-medium text-gray-900 mb-3">Latest Application</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      applicationStatus.application_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      applicationStatus.application_status === 'accepted' ? 'bg-green-100 text-green-800' :
                      applicationStatus.application_status === 'rejected' ? 'bg-red-100 text-red-800' :
                      applicationStatus.application_status === 'withdrawn' ? 'bg-gray-100 text-gray-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {applicationStatus.application_status?.charAt(0).toUpperCase() + applicationStatus.application_status?.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Applied At</span>
                    <span className="text-sm font-medium">
                      {new Date(applicationStatus.applied_at).toLocaleDateString()}
                    </span>
                  </div>
                  {applicationStatus.reviewed_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Reviewed At</span>
                      <span className="text-sm font-medium">
                        {new Date(applicationStatus.reviewed_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {applicationStatus.review_notes && (
                    <div className="mt-3">
                      <span className="text-sm text-gray-600">Review Notes</span>
                      <p className="text-sm text-gray-800 mt-1">{applicationStatus.review_notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* All Applications History */}
              {applicationStatus.all_applications && applicationStatus.all_applications.length > 1 && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Application History</h4>
                  <div className="space-y-3">
                    {applicationStatus.all_applications.map((application: any, index: number) => (
                      <div key={application.id} className={`p-3 rounded-lg border ${
                        application.status === 'rejected' ? 'border-red-200 bg-red-50' :
                        application.status === 'accepted' ? 'border-green-200 bg-green-50' :
                        application.status === 'pending' ? 'border-yellow-200 bg-yellow-50' :
                        'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            Application #{applicationStatus.all_applications.length - index}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            application.status === 'withdrawn' ? 'bg-gray-100 text-gray-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {application.status?.charAt(0).toUpperCase() + application.status?.slice(1)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          Applied: {new Date(application.created_at).toLocaleDateString()}
                          {application.reviewed_at && (
                            <span> • Reviewed: {new Date(application.reviewed_at).toLocaleDateString()}</span>
                          )}
                        </div>
                        {application.review_notes && (
                          <div className="text-xs text-gray-600">
                            <strong>Notes:</strong> {application.review_notes}
                          </div>
                        )}
                        {application.status === 'rejected' && (
                          <div className="mt-2 text-xs text-red-600">
                            💡 <strong>Tip:</strong> Consider improving your cover letter or proposed rate for future applications.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

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
                    onClick={() => {
                      setShowRequestModal(false)
                      // Clear URL parameter
                      const url = new URL(window.location.href)
                      url.searchParams.delete('action')
                      window.history.replaceState({}, '', url.toString())
                    }}
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
                  cover_letter: formData.get('cover_letter'),
                  proposed_rate: parseFloat(formData.get('proposed_rate') as string),
                  estimated_completion_time: parseInt(formData.get('estimated_completion_time') as string),
                  translator_id: user?.id
                })
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cover Letter</label>
                    <textarea
                      name="cover_letter"
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
                    <label className="block text-sm font-medium text-gray-700">Estimated Completion Time (days)</label>
                    <input
                      type="number"
                      name="estimated_completion_time"
                      required
                      min="1"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="30"
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
