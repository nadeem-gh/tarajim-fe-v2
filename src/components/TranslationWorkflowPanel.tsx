'use client'

import { useQuery, useMutation, useQueryClient } from 'react-query'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { 
  DocumentTextIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import TranslationRequestCard from './workflow/TranslationRequestCard'
import WorkflowProgress from './workflow/WorkflowProgress'
import { useWebSocket } from '@/hooks/useWebSocket'
import { getRequestWorkflowState } from '@/utils/workflowHelpers'

interface TranslationRequest {
  id: number
  title: string
  description: string
  status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled'
  budget: number
  currency: string
  deadline: string
  source_language: string
  target_language: string
  word_count: number
  applications: Application[]
  contracts: Contract[]
  requester: {
    id: number
    first_name: string
    last_name: string
    email: string
    role: string
  }
  created_at: string
  updated_at: string
}

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
}

interface Contract {
  id: number
  status: 'draft' | 'pending_requester' | 'pending_translator' | 'signed' | 'completed' | 'terminated'
  requester_signed: boolean
  translator_signed: boolean
  requester_signature_date?: string
  translator_signature_date?: string
  contract_terms: string
  deliverables: string
  quality_requirements: string
  translator: {
    id: number
    first_name: string
    last_name: string
    email: string
    role: string
  }
  requester: {
    id: number
    first_name: string
    last_name: string
    email: string
    role: string
  }
  created_at: string
  updated_at: string
}

interface Milestone {
  id: number
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'approved' | 'paid'
  completion_percentage: number
  amount: number
  currency: string
  contract: number
  translator?: {
    id: number
    first_name: string
    last_name: string
    email: string
    role: string
  }
  approved_by?: {
    id: number
    first_name: string
    last_name: string
    email: string
    role: string
  }
  created_at: string
  updated_at: string
}

interface WorkflowData {
  book_id: number
  book_title: string
  has_requests: boolean
  can_create_request: boolean
  requests: TranslationRequest[]
  applications: Application[]
  contracts: Contract[]
  milestones: Milestone[]
}

interface TranslationWorkflowPanelProps {
  bookId: string
  userRole: 'requester' | 'translator'
  onRefresh: () => void
}

export default function TranslationWorkflowPanel({ 
  bookId, 
  userRole, 
  onRefresh 
}: TranslationWorkflowPanelProps) {
  const queryClient = useQueryClient()

  // Set up WebSocket for real-time updates
  const { isConnected } = useWebSocket({
    bookId,
    enableWorkflowUpdates: true,
    enableNotifications: true,
    onWorkflowUpdate: (eventType, data) => {
      console.log('Workflow update received:', eventType, data)
      // The useWebSocket hook already handles query invalidation
    },
    onNotification: (notificationType, message, data) => {
      console.log('Notification received:', notificationType, message, data)
      // The useWebSocket hook already handles toast notifications
    }
  })

  // Fetch workflow data
  const { data: workflowData, isLoading, error } = useQuery(
    ['book-workflow', bookId],
    async () => {
      const response = await api.get(`/books/${bookId}/translation-workflow/`)
      return response.data as WorkflowData
    },
    {
      enabled: !!bookId && userRole !== 'reader',
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to load workflow data')
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
        queryClient.invalidateQueries(['book-workflow', bookId])
        toast.success(`${data.applications.length} applications accepted successfully!`)
        onRefresh()
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to accept applications')
      }
    }
  )

  const handleRefresh = () => {
    queryClient.invalidateQueries(['book-workflow', bookId])
    onRefresh()
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading workflow data</h3>
          <p className="mt-1 text-sm text-gray-500">
            There was a problem loading the translation workflow data.
          </p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!workflowData) {
    return null
  }

  const { requests, applications, contracts, milestones, can_create_request } = workflowData

  // Calculate summary statistics
  const totalApplications = applications.length
  const pendingApplications = applications.filter(app => app.status === 'pending').length
  const acceptedApplications = applications.filter(app => app.status === 'accepted').length
  const totalContracts = contracts.length
  const signedContracts = contracts.filter(contract => contract.status === 'signed').length
  const totalMilestones = milestones.length
  const completedMilestones = milestones.filter(m => 
    m.status === 'completed' || m.status === 'approved' || m.status === 'paid'
  ).length

  return (
    <div className="space-y-6">
      {/* Connection status indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {isConnected ? 'Real-time updates connected' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Workflow Progress */}
      <WorkflowProgress 
        request={workflowData?.requests?.[0] || {}}
        applications={workflowData?.applications || []}
        contracts={workflowData?.contracts || []}
        milestones={workflowData?.milestones || []}
        showMilestoneProgress={true}
      />

      {/* Workflow summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Translation Workflow Summary</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-lg mb-2">
              <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{requests.length}</div>
            <div className="text-sm text-gray-500">Requests</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-lg mb-2">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{pendingApplications}</div>
            <div className="text-sm text-gray-500">Pending Applications</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-lg mb-2">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{signedContracts}</div>
            <div className="text-sm text-gray-500">Signed Contracts</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-purple-100 rounded-lg mb-2">
              <DocumentTextIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{completedMilestones}</div>
            <div className="text-sm text-gray-500">Completed Milestones</div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Total Applications:</span>
            <span className="ml-2 font-medium">{totalApplications}</span>
          </div>
          <div>
            <span className="text-gray-500">Active Contracts:</span>
            <span className="ml-2 font-medium">{totalContracts}</span>
          </div>
          <div>
            <span className="text-gray-500">Total Milestones:</span>
            <span className="ml-2 font-medium">{totalMilestones}</span>
          </div>
        </div>
      </div>

      {/* Translation requests */}
      {requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((request) => (
            <TranslationRequestCard
              key={request.id}
              request={request}
              milestones={milestones}
              bookId={bookId}
              userRole={userRole}
              onRefresh={handleRefresh}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No translation requests</h3>
            <p className="mt-1 text-sm text-gray-500">
              {userRole === 'requester' 
                ? 'Create a translation request to get started'
                : 'No translation requests are available for this book'
              }
            </p>
            {can_create_request && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    // Navigate to create request page or open modal
                    window.location.href = `/books/${bookId}?action=create-request`
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  Create Translation Request
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
