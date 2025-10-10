'use client'

import { useState } from 'react'
import { 
  DocumentTextIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import ApplicationCard from './ApplicationCard'
import ContractCard from './ContractCard'
import { useWebSocket } from '@/hooks/useWebSocket'

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

interface TranslationRequestCardProps {
  request: TranslationRequest
  milestones: Milestone[]
  bookId: string
  userRole: 'requester' | 'translator'
  onRefresh: () => void
}

export default function TranslationRequestCard({ 
  request, 
  milestones, 
  bookId, 
  userRole, 
  onRefresh 
}: TranslationRequestCardProps) {
  const [activeTab, setActiveTab] = useState<'applications' | 'contracts'>('applications')

  // Set up WebSocket for real-time updates
  useWebSocket({
    bookId,
    enableWorkflowUpdates: true,
    enableNotifications: false // Notifications handled by parent component
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'open': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <CheckCircleIcon className="h-4 w-4" />
      case 'in_progress': return <ClockIcon className="h-4 w-4" />
      case 'completed': return <CheckCircleIcon className="h-4 w-4" />
      case 'cancelled': return <ExclamationTriangleIcon className="h-4 w-4" />
      default: return <ClockIcon className="h-4 w-4" />
    }
  }

  const pendingApplications = request.applications.filter(app => app.status === 'pending')
  const acceptedApplications = request.applications.filter(app => app.status === 'accepted')
  const requestMilestones = milestones.filter(m => 
    request.contracts.some(contract => contract.id === m.contract)
  )

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Request header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <DocumentTextIcon className="h-6 w-6 text-gray-400" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
              <p className="text-sm text-gray-500">
                Created on {new Date(request.created_at).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-400">
                Created by {request.requester.first_name} {request.requester.last_name}
              </p>
            </div>
          </div>
          <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(request.status)}`}>
            {getStatusIcon(request.status)}
            <span className="ml-1">{request.status}</span>
          </span>
        </div>

        <p className="text-sm text-gray-600 mb-4">{request.description}</p>

        {/* Request details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <CurrencyDollarIcon className="h-4 w-4" />
            <span>${request.budget} {request.currency}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <ClockIcon className="h-4 w-4" />
            <span>{new Date(request.deadline).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <DocumentTextIcon className="h-4 w-4" />
            <span>{request.word_count} words</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <span>{request.source_language} → {request.target_language}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('applications')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'applications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Applications ({request.applications.length})
            {pendingApplications.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                {pendingApplications.length} pending
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('contracts')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'contracts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Contracts ({request.contracts.length})
            {acceptedApplications.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                {acceptedApplications.length} active
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Tab content */}
      <div className="p-6">
        {activeTab === 'applications' && (
          <div className="space-y-4">
            {request.applications.length > 0 ? (
              request.applications.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  bookId={bookId}
                  userRole={userRole}
                  onRefresh={onRefresh}
                />
              ))
            ) : (
              <div className="text-center py-6">
                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No applications yet</h3>
                <p className="text-sm text-gray-500">
                  {userRole === 'requester' 
                    ? 'Applications will appear here when translators apply'
                    : 'You can apply to this request if you\'re interested'
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'contracts' && (
          <div className="space-y-4">
            {request.contracts.length > 0 ? (
              request.contracts.map((contract) => (
                <ContractCard
                  key={contract.id}
                  contract={contract}
                  milestones={requestMilestones}
                  bookId={bookId}
                  userRole={userRole}
                  onRefresh={onRefresh}
                />
              ))
            ) : (
              <div className="text-center py-6">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No contracts yet</h3>
                <p className="text-sm text-gray-500">
                  Contracts will appear here when applications are accepted
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Request summary */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Applications:</span>
            <span className="ml-2 font-medium">{request.applications.length}</span>
          </div>
          <div>
            <span className="text-gray-500">Contracts:</span>
            <span className="ml-2 font-medium">{request.contracts.length}</span>
          </div>
          <div>
            <span className="text-gray-500">Milestones:</span>
            <span className="ml-2 font-medium">{requestMilestones.length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
