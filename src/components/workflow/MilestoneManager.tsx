'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { PlusIcon } from '@heroicons/react/24/outline'
import MilestoneCard from './MilestoneCard'

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

interface MilestoneManagerProps {
  milestones: Milestone[]
  contractId: number
  bookId: string
  userRole: 'requester' | 'translator'
  onRefresh: () => void
  contractTranslator?: number | {
    id: number
    first_name: string
    last_name: string
    email: string
  }
}

export default function MilestoneManager({ 
  milestones, 
  contractId, 
  bookId, 
  userRole, 
  onRefresh,
  contractTranslator
}: MilestoneManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    amount: 0,
    currency: 'USD'
  })
  const queryClient = useQueryClient()

  // Create milestone mutation
  const createMilestoneMutation = useMutation(
    async (data: any) => {
      const response = await api.post(`/books/${bookId}/contracts/${contractId}/milestones/`, data)
      return response.data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['book-workflow', bookId])
        toast.success('Milestone created successfully')
        setShowCreateForm(false)
        setNewMilestone({ title: '', description: '', amount: 0, currency: 'USD' })
        onRefresh()
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.error?.message || 
                           error.response?.data?.message || 
                           'Failed to create milestone'
        toast.error(errorMessage)
      }
    }
  )

  const handleCreateMilestone = () => {
    if (!newMilestone.title || !newMilestone.description) {
      toast.error('Please fill in all required fields')
      return
    }
    createMilestoneMutation.mutate(newMilestone)
  }

  const canCreateMilestone = userRole === 'requester'

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Milestones</h3>
        {canCreateMilestone && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Milestone
          </button>
        )}
      </div>

      {/* Create milestone form */}
      {showCreateForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Create New Milestone</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={newMilestone.title}
                onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="e.g., Chapter 1 Translation"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={newMilestone.description}
                onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                rows={3}
                placeholder="Describe what needs to be completed for this milestone"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  value={newMilestone.amount}
                  onChange={(e) => setNewMilestone({ ...newMilestone, amount: parseFloat(e.target.value) || 0 })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Currency</label>
                <select
                  value={newMilestone.currency}
                  onChange={(e) => setNewMilestone({ ...newMilestone, currency: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleCreateMilestone}
                disabled={createMilestoneMutation.isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
              >
                {createMilestoneMutation.isLoading ? 'Creating...' : 'Create Milestone'}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Milestones list */}
      {milestones.length > 0 ? (
        <div className="space-y-4">
          {milestones.map((milestone) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              userRole={userRole}
              contractId={contractId}
              bookId={bookId}
              onUpdate={onRefresh}
              contractTranslator={contractTranslator}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="text-gray-400 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900">No milestones yet</h3>
          <p className="text-sm text-gray-500">
            {canCreateMilestone 
              ? 'Create your first milestone to get started' 
              : 'Milestones will appear here once created by the requester'
            }
          </p>
        </div>
      )}

      {/* Milestone summary */}
      {milestones.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Total Milestones:</span>
              <span className="ml-2 font-medium">{milestones.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Completed:</span>
              <span className="ml-2 font-medium">
                {milestones.filter(m => m.status === 'completed' || m.status === 'approved' || m.status === 'paid').length}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Total Value:</span>
              <span className="ml-2 font-medium">
                ${(() => {
                  try {
                    const total = milestones?.reduce((sum, m) => {
                      const amount = typeof m.amount === 'string' ? parseFloat(m.amount) : m.amount
                      return sum + (isNaN(amount) ? 0 : amount)
                    }, 0) || 0
                    return total.toFixed(2)
                  } catch (error) {
                    console.error('Error calculating total value:', error)
                    return '0.00'
                  }
                })()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
