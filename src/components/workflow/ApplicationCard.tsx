'use client'

import { useMutation, useQueryClient } from 'react-query'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { 
  UserIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  CurrencyDollarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { getApplicationWorkflowState } from '@/utils/workflowHelpers'

interface Application {
  id: number
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
  cover_letter: string
  proposed_rate: number
  estimated_completion_time: number
  relevant_experience?: string
  translator: {
    id: number
    first_name: string
    last_name: string
    email: string
    role: string
  }
  reviewed_by?: {
    id: number
    first_name: string
    last_name: string
    email: string
    role: string
  }
  created_at: string
  reviewed_at?: string
  review_notes?: string
  available_transitions: Array<{
    name: string
    target: string
    description: string
    permission: string
  }>
}

interface ApplicationCardProps {
  application: Application
  bookId: string
  userRole: 'requester' | 'translator'
  onRefresh: () => void
  onAccept?: (applicationId: number) => void
  onReject?: (applicationId: number) => void
}

export default function ApplicationCard({ 
  application, 
  bookId, 
  userRole, 
  onRefresh, 
  onAccept, 
  onReject 
}: ApplicationCardProps) {
  const queryClient = useQueryClient()
  
  // Get workflow state for this application
  const workflowState = getApplicationWorkflowState(application)

  // Accept application mutation
  const acceptApplicationMutation = useMutation(
    async (data: any) => {
      const response = await api.post(`/books/${bookId}/applications/${application.id}/accept/`, data)
      return response.data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['book-workflow', bookId])
        toast.success('Application accepted successfully')
        onRefresh()
        onAccept?.(application.id)
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.error?.message || 
                           error.response?.data?.message || 
                           'Failed to accept application'
        toast.error(errorMessage)
      }
    }
  )

  // Reject application mutation
  const rejectApplicationMutation = useMutation(
    async (data: any) => {
      const response = await api.post(`/books/${bookId}/applications/${application.id}/reject/`, data)
      return response.data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['book-workflow', bookId])
        toast.success('Application rejected')
        onRefresh()
        onReject?.(application.id)
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.error?.message || 
                           error.response?.data?.message || 
                           'Failed to reject application'
        toast.error(errorMessage)
      }
    }
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'accepted': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'withdrawn': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <ClockIcon className="h-4 w-4" />
      case 'accepted': return <CheckCircleIcon className="h-4 w-4" />
      case 'rejected': return <XCircleIcon className="h-4 w-4" />
      case 'withdrawn': return <XCircleIcon className="h-4 w-4" />
      default: return <ClockIcon className="h-4 w-4" />
    }
  }

  const handleAccept = () => {
    const defaultData = {
      review_notes: 'Application accepted',
      contract_terms: 'Standard translation contract terms',
      deliverables: 'Complete translation of the book',
      quality_requirements: 'High-quality translation meeting professional standards'
    }
    acceptApplicationMutation.mutate(defaultData)
  }

  const handleReject = () => {
    if (confirm('Are you sure you want to reject this application?')) {
      rejectApplicationMutation.mutate({
        review_notes: 'Application rejected'
      })
    }
  }

  const canAccept = workflowState.canAccept
  const canReject = workflowState.canReject
  const canView = userRole === 'requester' || (userRole === 'translator' && application.translator.id === application.translator.id)

  if (!canView) {
    return null
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <UserIcon className="h-5 w-5 text-gray-400" />
          <div>
            <h4 className="text-sm font-medium text-gray-900">
              {application.translator.first_name} {application.translator.last_name}
            </h4>
            <p className="text-xs text-gray-500">{application.translator.email}</p>
          </div>
        </div>
        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
          {getStatusIcon(application.status)}
          <span className="ml-1">{application.status}</span>
        </span>
      </div>

      {/* Application details */}
      <div className="space-y-3 mb-4">
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-1">Cover Letter</h5>
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            {application.cover_letter}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <CurrencyDollarIcon className="h-4 w-4" />
            <span>Rate: ${application.proposed_rate}/word</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <CalendarIcon className="h-4 w-4" />
            <span>Time: {application.estimated_completion_time} days</span>
          </div>
        </div>

        {application.relevant_experience && (
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-1">Relevant Experience</h5>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              {application.relevant_experience}
            </p>
          </div>
        )}

        {application.review_notes && (
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-1">Review Notes</h5>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              {application.review_notes}
            </p>
          </div>
        )}

        {application.reviewed_by && (
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-1">Reviewed By</h5>
            <p className="text-sm text-gray-600">
              {application.reviewed_by.first_name} {application.reviewed_by.last_name}
              {application.reviewed_at && (
                <span className="text-xs text-gray-500 ml-2">
                  on {new Date(application.reviewed_at).toLocaleDateString()}
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Application metadata */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
        <span>Applied: {new Date(application.created_at).toLocaleDateString()}</span>
        {application.reviewed_at && (
          <span>Reviewed: {new Date(application.reviewed_at).toLocaleDateString()}</span>
        )}
      </div>

      {/* Action buttons */}
      {(canAccept || canReject) && (
        <div className="flex space-x-2">
          {canAccept && (
            <button
              onClick={handleAccept}
              disabled={acceptApplicationMutation.isLoading}
              className="px-3 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded disabled:opacity-50"
            >
              {acceptApplicationMutation.isLoading ? 'Accepting...' : 'Accept'}
            </button>
          )}
          {canReject && (
            <button
              onClick={handleReject}
              disabled={rejectApplicationMutation.isLoading}
              className="px-3 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded disabled:opacity-50"
            >
              {rejectApplicationMutation.isLoading ? 'Rejecting...' : 'Reject'}
            </button>
          )}
        </div>
      )}

      {/* Status-specific messages */}
      {application.status === 'accepted' && (
        <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
          ✓ This application has been accepted and a contract has been created.
        </div>
      )}
      
      {application.status === 'rejected' && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          ✗ This application has been rejected.
        </div>
      )}
      
      {application.status === 'withdrawn' && (
        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
          ↶ This application has been withdrawn by the translator.
        </div>
      )}
    </div>
  )
}
