'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { getMilestoneWorkflowState } from '@/utils/workflowHelpers'
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  PencilIcon,
  TrashIcon,
  UserIcon
} from '@heroicons/react/24/outline'

interface Milestone {
  id: number
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'approved' | 'paid'
  completion_percentage: number
  amount: number
  currency: string
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

interface MilestoneCardProps {
  milestone: Milestone
  userRole: 'requester' | 'translator'
  contractId: number
  bookId: string
  onUpdate: () => void
  contractTranslator?: number | {
    id: number
    first_name: string
    last_name: string
    email: string
  }
}

export default function MilestoneCard({ 
  milestone, 
  userRole, 
  contractId, 
  bookId, 
  onUpdate,
  contractTranslator
}: MilestoneCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    title: milestone.title,
    description: milestone.description,
    amount: milestone.amount
  })
  const queryClient = useQueryClient()

  // Update milestone mutation
  const updateMilestoneMutation = useMutation(
    async (data: any) => {
      const response = await api.patch(`/books/${bookId}/milestones/${milestone.id}/`, data)
      return response.data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['book-workflow', bookId])
        toast.success('Milestone updated successfully')
        setIsEditing(false)
        onUpdate()
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update milestone')
      }
    }
  )

  // Delete milestone mutation
  const deleteMilestoneMutation = useMutation(
    async () => {
      const response = await api.delete(`/books/${bookId}/milestones/${milestone.id}/delete/`)
      return response.data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['book-workflow', bookId])
        toast.success('Milestone deleted successfully')
        onUpdate()
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to delete milestone')
      }
    }
  )

  // Assign milestone mutation
  const assignMilestoneMutation = useMutation(
    async (translatorId: number) => {
      console.log('Assigning milestone:', milestone.id, 'to translator:', translatorId)
      console.log('Translator ID type:', typeof translatorId)
      console.log('Translator ID value:', translatorId)
      
      const requestData = { translator_id: translatorId }
      console.log('Request data:', requestData)
      console.log('Request data stringified:', JSON.stringify(requestData))
      
      const url = `/books/${bookId}/milestones/${milestone.id}/assign/`
      console.log('API URL:', url)
      
      try {
        const response = await api.post(url, requestData)
        console.log('Response received:', response.data)
        return response.data
      } catch (error) {
        console.error('API call failed:', error)
        throw error
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['book-workflow', bookId])
        toast.success('Milestone assigned successfully')
        onUpdate()
      },
      onError: (error: any) => {
        console.error('Assignment error:', error.response?.data)
        toast.error(error.response?.data?.error || 'Failed to assign milestone')
      }
    }
  )

  // Status transition mutation
  const transitionStatusMutation = useMutation(
    async (newStatus: string) => {
      const response = await api.patch(`/books/${bookId}/milestones/${milestone.id}/`, {
        status: newStatus
      })
      return response.data
    },
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries(['book-workflow', bookId])
        toast.success(`Milestone status updated to ${variables}`)
        onUpdate()
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update milestone status')
      }
    }
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'paid': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <ClockIcon className="h-4 w-4" />
      case 'in_progress': return <ClockIcon className="h-4 w-4" />
      case 'completed': return <CheckCircleIcon className="h-4 w-4" />
      case 'approved': return <CheckCircleIcon className="h-4 w-4" />
      case 'paid': return <CheckCircleIcon className="h-4 w-4" />
      default: return <ClockIcon className="h-4 w-4" />
    }
  }

  const canEdit = userRole === 'requester' && milestone.status === 'pending'
  const canDelete = userRole === 'requester' && milestone.status === 'pending'
  const canAssign = userRole === 'requester' && !milestone.translator
  const canStart = userRole === 'translator' && milestone.status === 'pending' && milestone.translator
  const canComplete = userRole === 'translator' && milestone.status === 'in_progress'
  const canApprove = userRole === 'requester' && milestone.status === 'completed'

  const handleSave = () => {
    updateMilestoneMutation.mutate(editData)
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this milestone?')) {
      deleteMilestoneMutation.mutate()
    }
  }

  const handleAssign = () => {
    if (!contractTranslator) {
      toast.error('Contract translator information not available')
      return
    }
    
    console.log('Contract translator:', contractTranslator)
    console.log('Contract translator type:', typeof contractTranslator)
    
    // Get translator ID - it could be a number or an object with id property
    let translatorId: number
    let translatorName = 'the contract translator'
    
    if (typeof contractTranslator === 'number') {
      translatorId = contractTranslator
    } else if (typeof contractTranslator === 'object' && contractTranslator.id) {
      translatorId = contractTranslator.id
      translatorName = `${contractTranslator.first_name} ${contractTranslator.last_name}`
    } else {
      toast.error('Invalid contract translator data')
      console.error('Contract translator structure:', contractTranslator)
      return
    }
    
    console.log('Translator ID:', translatorId)
    
    if (confirm(`Assign this milestone to ${translatorName}?`)) {
      console.log('Calling mutation with translator ID:', translatorId)
      
      // Test direct API call first
      const testData = { translator_id: translatorId }
      console.log('Test data:', testData)
      
      // Make direct API call to test
      api.post(`/books/${bookId}/milestones/${milestone.id}/assign/`, testData)
        .then(response => {
          console.log('Direct API call success:', response.data)
          toast.success('Milestone assigned successfully')
          onUpdate()
        })
        .catch(error => {
          console.error('Direct API call error:', error.response?.data)
          toast.error(error.response?.data?.error || 'Failed to assign milestone')
        })
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-900">
            Milestone {milestone.id}
          </span>
          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(milestone.status)}`}>
            {getStatusIcon(milestone.status)}
            <span className="ml-1">{milestone.status.replace('_', ' ')}</span>
          </span>
        </div>
        
        {userRole === 'requester' && (
          <div className="flex space-x-1">
            {canEdit && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={deleteMilestoneMutation.isLoading}
                className="p-1 text-red-400 hover:text-red-600 disabled:opacity-50"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              value={editData.amount}
              onChange={(e) => setEditData({ ...editData, amount: parseFloat(e.target.value) })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              disabled={updateMilestoneMutation.isLoading}
              className="px-3 py-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <h4 className="text-sm font-medium text-gray-900 mb-2">{milestone.title}</h4>
          <p className="text-sm text-gray-600 mb-3">{milestone.description}</p>
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>${milestone.amount} {milestone.currency}</span>
              {milestone.translator && (
                <div className="flex items-center space-x-1">
                  <UserIcon className="h-4 w-4" />
                  <span>Assigned to {milestone.translator.first_name} {milestone.translator.last_name}</span>
                </div>
              )}
              {milestone.approved_by && (
                <div className="flex items-center space-x-1 text-green-600">
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>Approved by {milestone.approved_by.first_name} {milestone.approved_by.last_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{milestone.completion_percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${milestone.completion_percentage}%` }}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-2">
            {canAssign && (
              <button
                onClick={handleAssign}
                className="px-3 py-1 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded"
              >
                Assign Translator
              </button>
            )}
            {canStart && (
              <button
                onClick={() => transitionStatusMutation.mutate('in_progress')}
                disabled={transitionStatusMutation.isLoading}
                className="px-3 py-1 text-xs font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded disabled:opacity-50"
              >
                Start Work
              </button>
            )}
            {canComplete && (
              <button
                onClick={() => transitionStatusMutation.mutate('completed')}
                disabled={transitionStatusMutation.isLoading}
                className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
              >
                Mark Complete
              </button>
            )}
            {canApprove && (
              <button
                onClick={() => transitionStatusMutation.mutate('approved')}
                disabled={transitionStatusMutation.isLoading}
                className="px-3 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded disabled:opacity-50"
              >
                Approve
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
