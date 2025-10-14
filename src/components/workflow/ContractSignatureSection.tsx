'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { extractErrorMessage } from '@/utils/errorHandling'
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
  available_transitions: Array<{
    name: string
    target: string
    description: string
    permission: string
  }>
}

interface ContractSignatureSectionProps {
  contract: Contract
  bookId: string
  userRole: 'requester' | 'translator'
  onRefresh: () => void
}

export default function ContractSignatureSection({ 
  contract, 
  bookId, 
  userRole, 
  onRefresh 
}: ContractSignatureSectionProps) {
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmationText, setConfirmationText] = useState('')
  const queryClient = useQueryClient()

  // Sign contract mutation
  const signContractMutation = useMutation(
    async () => {
      const response = await api.post(`/books/${bookId}/contracts/${contract.id}/sign/`)
      return response.data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['book-workflow', bookId])
        toast.success('Contract signed successfully')
        setShowConfirmation(false)
        setConfirmationText('')
        onRefresh()
      },
      onError: (error: any) => {
        console.error('Contract signing error:', error)
        const errorMessage = extractErrorMessage(error, 'Failed to sign contract')
        const errorMsg = error.response?.data?.error?.message || 
                        error.response?.data?.message || 
                        errorMessage
        toast.error(errorMsg)
      }
    }
  )

  // Get workflow state for this contract
  const workflowState = getContractWorkflowState(contract, userRole)
  
  const canSign = () => {
    if (userRole === 'requester') {
      return workflowState.canSignRequester
    } else if (userRole === 'translator') {
      return workflowState.canSignTranslator
    }
    return false
  }

  const hasUserSigned = () => {
    if (userRole === 'requester') {
      return contract.requester_signed
    } else if (userRole === 'translator') {
      return contract.translator_signed
    }
    return false
  }

  const getSignatureStatus = () => {
    if (contract.status === 'signed') {
      return {
        status: 'signed',
        message: 'Contract is fully signed by both parties',
        color: 'text-green-600',
        icon: <CheckCircleIcon className="h-5 w-5" />
      }
    } else if (contract.requester_signed && !contract.translator_signed) {
      return {
        status: 'pending_translator',
        message: 'Waiting for translator signature',
        color: 'text-yellow-600',
        icon: <ExclamationTriangleIcon className="h-5 w-5" />
      }
    } else if (!contract.requester_signed && contract.translator_signed) {
      return {
        status: 'pending_requester',
        message: 'Waiting for requester signature',
        color: 'text-yellow-600',
        icon: <ExclamationTriangleIcon className="h-5 w-5" />
      }
    } else {
      return {
        status: 'pending',
        message: 'Contract needs signatures from both parties',
        color: 'text-gray-600',
        icon: <ExclamationTriangleIcon className="h-5 w-5" />
      }
    }
  }

  const handleSign = () => {
    if (confirmationText !== 'I AGREE') {
      toast.error('Please type "I AGREE" to confirm')
      return
    }
    signContractMutation.mutate()
  }

  const signatureStatus = getSignatureStatus()
  const canUserSign = canSign() && !hasUserSigned()
  
  // Debug logging
  console.log('ContractSignatureSection Debug:', {
    contract: contract,
    userRole: userRole,
    workflowState: workflowState,
    canSignResult: canUserSign,
    hasUserSigned: hasUserSigned(),
    availableTransitions: contract.available_transitions,
    canSignRequester: workflowState.canSignRequester,
    canSignTranslator: workflowState.canSignTranslator
  })

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Contract Signatures</h3>
        <div className={`flex items-center space-x-2 ${signatureStatus.color}`}>
          {signatureStatus.icon}
          <span className="text-sm font-medium">{signatureStatus.message}</span>
        </div>
      </div>

      {/* Signature status */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className={`p-3 rounded-lg border ${
          contract.requester_signed 
            ? 'border-green-200 bg-green-50' 
            : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircleIcon className={`h-4 w-4 ${
              contract.requester_signed ? 'text-green-600' : 'text-gray-400'
            }`} />
            <span className="text-sm font-medium text-gray-900">Requester</span>
          </div>
          <div className="text-xs text-gray-500">
            {contract.requester_signed 
              ? `Signed on ${new Date(contract.requester_signature_date!).toLocaleDateString()}`
              : 'Not signed yet'
            }
          </div>
        </div>

        <div className={`p-3 rounded-lg border ${
          contract.translator_signed 
            ? 'border-green-200 bg-green-50' 
            : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircleIcon className={`h-4 w-4 ${
              contract.translator_signed ? 'text-green-600' : 'text-gray-400'
            }`} />
            <span className="text-sm font-medium text-gray-900">Translator</span>
          </div>
          <div className="text-xs text-gray-500">
            {contract.translator_signed 
              ? `Signed on ${new Date(contract.translator_signature_date!).toLocaleDateString()}`
              : 'Not signed yet'
            }
          </div>
        </div>
      </div>

      {/* Contract details */}
      <div className="space-y-4 mb-6">
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Contract Terms</h4>
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            {contract.contract_terms}
          </p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Deliverables</h4>
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            {contract.deliverables}
          </p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Quality Requirements</h4>
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            {contract.quality_requirements}
          </p>
        </div>
      </div>

      {/* Sign button or signed status */}
      {canUserSign ? (
        <div className="border-t border-gray-200 pt-4">
          <button
            onClick={() => setShowConfirmation(true)}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            Sign Contract
          </button>
        </div>
      ) : hasUserSigned() ? (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-center px-4 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-md">
            <CheckCircleIcon className="h-4 w-4 mr-2" />
            You have signed this contract
          </div>
        </div>
      ) : null}

      {/* Confirmation modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Contract Signature</h3>
            <p className="text-sm text-gray-600 mb-4">
              By signing this contract, you agree to the terms and conditions outlined above. 
              This action cannot be undone.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type "I AGREE" to confirm:
              </label>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="I AGREE"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleSign}
                disabled={signContractMutation.isLoading || confirmationText !== 'I AGREE'}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
              >
                {signContractMutation.isLoading ? 'Signing...' : 'Sign Contract'}
              </button>
              <button
                onClick={() => {
                  setShowConfirmation(false)
                  setConfirmationText('')
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
