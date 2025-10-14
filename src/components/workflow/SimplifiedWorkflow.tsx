'use client'

import { useQuery, useMutation, useQueryClient } from 'react-query'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { 
  DocumentTextIcon, 
  UserGroupIcon,
  DocumentCheckIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useRouter } from 'next/navigation'
import ApplicationCard from './ApplicationCard'
import ContractCard from './ContractCard'

interface SimplifiedWorkflowProps {
  bookId: string
  userRole: 'requester' | 'translator' | 'reader'
  onRefresh: () => void
}

interface TranslationRequest {
  id: number
  title: string
  status: 'draft' | 'open' | 'reviewing' | 'contracted' | 'in_progress' | 'completed' | 'cancelled'
  requester: {
    id: number
    first_name: string
    last_name: string
  }
  applications: Application[]
  contracts: Contract[]
  created_at: string
}

interface Application {
  id: number
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
  translator: {
    id: number
    first_name: string
    last_name: string
  }
  created_at: string
}

interface Contract {
  id: number
  status: 'draft' | 'pending_requester' | 'pending_translator' | 'signed' | 'in_progress' | 'completed'
  translator: {
    id: number
    first_name: string
    last_name: string
  }
  created_at: string
}

interface Milestone {
  id: number
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'approved' | 'paid'
  milestone_number: number
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
  available_transitions: Array<{
    name: string
    target: string
    description: string
    permission: string
  }>
}

interface WorkflowData {
  book_id: string
  book_title: string
  has_requests: boolean
  can_create_request: boolean
  requests: TranslationRequest[]
  applications: Application[]
  contracts: Contract[]
  milestones: Milestone[]
}

export default function SimplifiedWorkflow({
  bookId,
  userRole,
  onRefresh
}: SimplifiedWorkflowProps) {
  const queryClient = useQueryClient()
  const router = useRouter()

  // Set up WebSocket for real-time updates
  const { isConnected } = useWebSocket({
    bookId,
    enableWorkflowUpdates: true,
    enableNotifications: true
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
        const errorMessage = error.response?.data?.error?.message ||
                           error.response?.data?.message ||
                           'Failed to load workflow data'
        toast.error(errorMessage)
      }
    }
  )

  // Extract data from workflowData
  const requests = workflowData?.requests || []
  const applications = workflowData?.applications || []
  const contracts = workflowData?.contracts || []
  const milestones = workflowData?.milestones || []

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
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading workflow</h3>
          <p className="mt-1 text-sm text-gray-500">
            There was a problem loading the translation workflow.
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

  const { 
    can_create_request = false 
  } = workflowData

  // Get the primary request (first one)
  const primaryRequest = requests[0]

  // Calculate workflow status
  const getWorkflowStatus = () => {
    if (!primaryRequest) {
      return {
        stage: 'No Request',
        status: 'empty',
        description: 'No translation request has been created yet',
        action: userRole === 'requester' ? 'Create Request' : 'Wait for Request'
      }
    }

    switch (primaryRequest.status) {
      case 'draft':
        return {
          stage: 'Draft',
          status: 'draft',
          description: 'Request is being prepared',
          action: 'Publish Request'
        }
      case 'open':
        return {
          stage: 'Open for Applications',
          status: 'open',
          description: 'Translators can apply to this request',
          action: userRole === 'translator' ? 'Apply Now' : 'Review Applications'
        }
      case 'reviewing':
        return {
          stage: 'Reviewing Applications',
          status: 'reviewing',
          description: 'Applications are being reviewed',
          action: userRole === 'requester' ? 'Accept Applications' : 'Wait for Review'
        }
      case 'contracted':
        return {
          stage: 'Contract Created',
          status: 'contracted',
          description: 'Contract is ready for signatures',
          action: 'Sign Contract'
        }
      case 'in_progress':
        return {
          stage: 'Work in Progress',
          status: 'in_progress',
          description: 'Translation work has started',
          action: 'View Progress'
        }
      case 'completed':
        return {
          stage: 'Completed',
          status: 'completed',
          description: 'Translation project is finished',
          action: 'View Results'
        }
      default:
        return {
          stage: 'Unknown',
          status: 'unknown',
          description: 'Unknown status',
          action: 'Contact Support'
        }
    }
  }

  const workflowStatus = getWorkflowStatus()

  // Get statistics
  const totalApplications = applications.length
  const pendingApplications = applications.filter(app => app.status === 'pending').length
  const acceptedApplications = applications.filter(app => app.status === 'accepted').length
  const signedContracts = contracts.filter(contract => contract.status === 'signed').length

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {isConnected ? 'Real-time updates connected' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Main Workflow Card */}
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Translation Workflow</h3>
              <p className="text-sm text-gray-600">Manage your translation project</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                workflowStatus.status === 'completed' ? 'bg-green-100 text-green-800' :
                workflowStatus.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                workflowStatus.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {workflowStatus.stage}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!primaryRequest ? (
            /* Empty State */
            <div className="text-center py-8">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No Translation Request</h3>
              <p className="mt-1 text-sm text-gray-500">
                {userRole === 'requester' 
                  ? 'Create a translation request to get started'
                  : 'No translation request is available for this book'
                }
              </p>
              {can_create_request && (
                <button
                  onClick={() => router.push(`/books/${bookId}?action=create-request`)}
                  className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create Translation Request
                </button>
              )}
            </div>
          ) : (
            /* Workflow Content */
            <div className="space-y-6">
              {/* Current Status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{workflowStatus.stage}</h4>
                    <p className="text-sm text-gray-600">{workflowStatus.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Created by</p>
                    <p className="text-sm font-medium text-gray-900">
                      {primaryRequest.requester.first_name} {primaryRequest.requester.last_name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-lg mb-2">
                    <UserGroupIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{totalApplications}</div>
                  <div className="text-sm text-gray-500">Applications</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-lg mb-2">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{acceptedApplications}</div>
                  <div className="text-sm text-gray-500">Accepted</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto bg-purple-100 rounded-lg mb-2">
                    <DocumentCheckIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{signedContracts}</div>
                  <div className="text-sm text-gray-500">Signed Contracts</div>
                </div>
              </div>

              {/* Applications List */}
              {applications.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Applications</h4>
                  <div className="space-y-4">
                    {applications.map((application) => (
                      <ApplicationCard
                        key={application.id}
                        application={application}
                        bookId={bookId}
                        userRole={userRole}
                        onRefresh={onRefresh}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Contracts List */}
              {contracts.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Contracts</h4>
                  <div className="space-y-4">
                    {contracts.map((contract) => (
                      <ContractCard
                        key={contract.id}
                        contract={contract}
                        milestones={milestones.filter(m => m.contract === contract.id)}
                        bookId={bookId}
                        userRole={userRole}
                        onRefresh={onRefresh}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
