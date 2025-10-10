'use client'

import { useState } from 'react'
import { 
  DocumentTextIcon, 
  UserIcon, 
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import ContractSignatureSection from './ContractSignatureSection'
import MilestoneManager from './MilestoneManager'
import { getContractWorkflowState } from '@/utils/workflowHelpers'

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

interface ContractCardProps {
  contract: Contract
  milestones: Milestone[]
  bookId: string
  userRole: 'requester' | 'translator'
  onRefresh: () => void
}

export default function ContractCard({ 
  contract, 
  milestones, 
  bookId, 
  userRole, 
  onRefresh 
}: ContractCardProps) {
  const [activeTab, setActiveTab] = useState<'signature' | 'milestones'>('signature')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'pending_requester': return 'bg-yellow-100 text-yellow-800'
      case 'pending_translator': return 'bg-yellow-100 text-yellow-800'
      case 'signed': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'terminated': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'signed': return <CheckCircleIcon className="h-4 w-4" />
      case 'completed': return <CheckCircleIcon className="h-4 w-4" />
      default: return <ClockIcon className="h-4 w-4" />
    }
  }

  const contractMilestones = milestones?.filter(m => {
    console.log('Milestone contract field:', m.contract, 'Contract ID:', contract.id)
    return m.contract === contract.id
  }) || []

  // Debug logging for milestones data
  console.log('All milestones:', milestones)
  console.log('Contract milestones:', contractMilestones)
  console.log('Contract milestones amounts:', contractMilestones.map(m => ({ id: m.id, amount: m.amount, type: typeof m.amount })))

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Contract header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <DocumentTextIcon className="h-6 w-6 text-gray-400" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Contract #{contract.id}</h3>
              <p className="text-sm text-gray-500">
                Created on {new Date(contract.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(contract.status)}`}>
            {getStatusIcon(contract.status)}
            <span className="ml-1">{contract.status.replace('_', ' ')}</span>
          </span>
        </div>

        {/* Contract parties */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Requester info */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <UserIcon className="h-5 w-5 text-gray-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {contract.requester.first_name} {contract.requester.last_name}
              </p>
              <p className="text-xs text-gray-500">{contract.requester.email}</p>
              <div className="flex items-center mt-1">
                {contract.requester_signed ? (
                  <span className="inline-flex items-center text-xs text-green-600">
                    <CheckCircleIcon className="h-3 w-3 mr-1" />
                    Signed {contract.requester_signature_date && new Date(contract.requester_signature_date).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="text-xs text-yellow-600">Pending signature</span>
                )}
              </div>
            </div>
          </div>

          {/* Translator info */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <UserIcon className="h-5 w-5 text-gray-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {contract.translator.first_name} {contract.translator.last_name}
              </p>
              <p className="text-xs text-gray-500">{contract.translator.email}</p>
              <div className="flex items-center mt-1">
                {contract.translator_signed ? (
                  <span className="inline-flex items-center text-xs text-green-600">
                    <CheckCircleIcon className="h-3 w-3 mr-1" />
                    Signed {contract.translator_signature_date && new Date(contract.translator_signature_date).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="text-xs text-yellow-600">Pending signature</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('signature')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'signature'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Signature
          </button>
          <button
            onClick={() => setActiveTab('milestones')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'milestones'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Milestones ({contractMilestones.length})
          </button>
        </nav>
      </div>

      {/* Tab content */}
      <div className="p-6">
        {activeTab === 'signature' && (
          <ContractSignatureSection
            contract={contract}
            bookId={bookId}
            userRole={userRole}
            onRefresh={onRefresh}
          />
        )}
        
        {activeTab === 'milestones' && (
          <MilestoneManager
            milestones={contractMilestones}
            contractId={contract.id}
            bookId={bookId}
            userRole={userRole}
            onRefresh={onRefresh}
            contractTranslator={contract.translator}
          />
        )}
      </div>

      {/* Contract summary */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Total Milestones:</span>
            <span className="ml-2 font-medium">{contractMilestones.length}</span>
          </div>
          <div>
            <span className="text-gray-500">Completed:</span>
            <span className="ml-2 font-medium">
              {contractMilestones.filter(m => 
                m.status === 'completed' || m.status === 'approved' || m.status === 'paid'
              ).length}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Total Value:</span>
            <span className="ml-2 font-medium">
              ${(() => {
                try {
                  const total = contractMilestones?.reduce((sum, m) => {
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
    </div>
  )
}
