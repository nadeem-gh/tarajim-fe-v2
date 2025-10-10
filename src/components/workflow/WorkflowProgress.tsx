'use client'

import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import { getWorkflowProgress, getMilestoneProgress } from '@/utils/workflowHelpers'

interface WorkflowProgressProps {
  request: any
  applications?: any[]
  contracts?: any[]
  milestones?: any[]
  showMilestoneProgress?: boolean
}

export default function WorkflowProgress({ 
  request, 
  applications = [], 
  contracts = [], 
  milestones = [],
  showMilestoneProgress = true 
}: WorkflowProgressProps) {
  const workflowProgress = getWorkflowProgress(request, applications, contracts, milestones)
  const milestoneProgress = showMilestoneProgress ? getMilestoneProgress(milestones) : null

  const stages = [
    { 
      key: 'draft', 
      label: 'Draft', 
      icon: ClockIcon,
      completed: request.status !== 'draft',
      current: request.status === 'draft'
    },
    { 
      key: 'open', 
      label: 'Open for Applications', 
      icon: ClockIcon,
      completed: request.status !== 'draft' && request.status !== 'open',
      current: request.status === 'open'
    },
    { 
      key: 'reviewing', 
      label: 'Reviewing Applications', 
      icon: ClockIcon,
      completed: request.status !== 'draft' && request.status !== 'open' && request.status !== 'reviewing',
      current: request.status === 'reviewing'
    },
    { 
      key: 'contracted', 
      label: 'Contract Created', 
      icon: ClockIcon,
      completed: request.status !== 'draft' && request.status !== 'open' && request.status !== 'reviewing' && request.status !== 'contracted',
      current: request.status === 'contracted'
    },
    { 
      key: 'in_progress', 
      label: 'Work in Progress', 
      icon: ClockIcon,
      completed: request.status !== 'draft' && request.status !== 'open' && request.status !== 'reviewing' && request.status !== 'contracted' && request.status !== 'in_progress',
      current: request.status === 'in_progress'
    },
    { 
      key: 'completed', 
      label: 'Completed', 
      icon: CheckCircleIcon,
      completed: request.status === 'completed',
      current: request.status === 'completed'
    }
  ]

  const getStageIcon = (stage: any) => {
    if (stage.completed) {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />
    } else if (stage.current) {
      return <ClockIcon className="h-5 w-5 text-blue-500" />
    } else {
      return <ClockIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getStageColor = (stage: any) => {
    if (stage.completed) {
      return 'text-green-600 bg-green-50 border-green-200'
    } else if (stage.current) {
      return 'text-blue-600 bg-blue-50 border-blue-200'
    } else {
      return 'text-gray-500 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Workflow Progress</h3>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Current Stage: {workflowProgress.stage}</span>
          <span className="text-sm font-medium text-gray-900">{workflowProgress.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${workflowProgress.progress}%` }}
          ></div>
        </div>
        {workflowProgress.nextAction && (
          <p className="text-sm text-blue-600 mt-2">
            Next: {workflowProgress.nextAction}
          </p>
        )}
      </div>

      {/* Workflow Stages */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-900">Workflow Stages</h4>
        <div className="space-y-3">
          {stages.map((stage, index) => (
            <div key={stage.key} className="flex items-center space-x-3">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${getStageColor(stage)}`}>
                {getStageIcon(stage)}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${stage.completed ? 'text-green-600' : stage.current ? 'text-blue-600' : 'text-gray-500'}`}>
                  {stage.label}
                </p>
                {stage.current && (
                  <p className="text-xs text-blue-500">Current stage</p>
                )}
              </div>
              {index < stages.length - 1 && (
                <ArrowRightIcon className="h-4 w-4 text-gray-400" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Milestone Progress */}
      {showMilestoneProgress && milestoneProgress && milestoneProgress.total > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-md font-medium text-gray-900 mb-4">Milestone Progress</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{milestoneProgress.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{milestoneProgress.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{milestoneProgress.inProgress}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{milestoneProgress.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${milestoneProgress.progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            {milestoneProgress.progress}% of milestones completed
          </p>
        </div>
      )}

      {/* Status Indicators */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              request.status === 'completed' ? 'bg-green-500' : 
              request.status === 'cancelled' ? 'bg-red-500' : 
              'bg-blue-500'
            }`}></div>
            <span className="text-sm text-gray-600">
              Status: <span className="font-medium capitalize">{request.status}</span>
            </span>
          </div>
          {request.status === 'cancelled' && (
            <div className="flex items-center space-x-1 text-red-600">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <span className="text-sm">Cancelled</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
