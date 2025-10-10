/**
 * Frontend workflow helper utilities for checking action availability
 */

export interface WorkflowTransition {
  name: string
  target: string
  description: string
  permission: string
}

export interface TranslationRequest {
  id: number
  status: string
  available_transitions: WorkflowTransition[]
  [key: string]: any
}

export interface TranslationApplication {
  id: number
  status: string
  available_transitions: WorkflowTransition[]
  [key: string]: any
}

export interface TranslationContract {
  id: number
  status: string
  available_transitions: WorkflowTransition[]
  [key: string]: any
}

export interface TranslationMilestone {
  id: number
  status: string
  milestone_number: number
  available_transitions: WorkflowTransition[]
  [key: string]: any
}

/**
 * Check if a specific action can be performed on an object
 */
export const canPerformAction = (
  obj: any,
  actionName: string
): boolean => {
  return obj.available_transitions?.some(
    (transition: WorkflowTransition) => transition.name === actionName
  ) || false
}

/**
 * Get workflow state for a translation request
 */
export const getRequestWorkflowState = (
  request: TranslationRequest
): Record<string, boolean> => {
  return {
    canPublish: canPerformAction(request, 'publish'),
    canStartReview: canPerformAction(request, 'start_review'),
    canCreateContract: canPerformAction(request, 'create_contract'),
    canStartWork: canPerformAction(request, 'start_work'),
    canComplete: canPerformAction(request, 'complete_project'),
    canCancel: canPerformAction(request, 'cancel')
  }
}

/**
 * Get workflow state for a translation application
 */
export const getApplicationWorkflowState = (
  application: TranslationApplication
): Record<string, boolean> => {
  return {
    canAccept: canPerformAction(application, 'accept'),
    canReject: canPerformAction(application, 'reject'),
    canWithdraw: canPerformAction(application, 'withdraw')
  }
}

/**
 * Get workflow state for a translation contract
 */
export const getContractWorkflowState = (
  contract: TranslationContract,
  userRole: string
): Record<string, boolean> => {
  return {
    canSendToRequester: canPerformAction(contract, 'send_to_requester'),
    canSignRequester: canPerformAction(contract, 'sign_by_requester') && userRole === 'requester',
    canSignTranslator: canPerformAction(contract, 'sign_by_translator') && userRole === 'translator',
    canActivate: canPerformAction(contract, 'activate'),
    canComplete: canPerformAction(contract, 'complete')
  }
}

/**
 * Get workflow state for a translation milestone
 */
export const getMilestoneWorkflowState = (
  milestone: TranslationMilestone,
  userRole: string,
  allMilestones: TranslationMilestone[] = []
): Record<string, boolean> => {
  const canStart = canPerformAction(milestone, 'start') && 
    isPreviousMilestoneCompleted(milestone, allMilestones)
  
  return {
    canAssign: canPerformAction(milestone, 'assign') && userRole === 'requester',
    canStart: canStart && userRole === 'translator',
    canSubmit: canPerformAction(milestone, 'submit') && userRole === 'translator',
    canApprove: canPerformAction(milestone, 'approve') && userRole === 'requester',
    canPay: canPerformAction(milestone, 'mark_paid') && userRole === 'requester'
  }
}

/**
 * Check if previous milestone is completed
 */
export const isPreviousMilestoneCompleted = (
  milestone: TranslationMilestone,
  allMilestones: TranslationMilestone[]
): boolean => {
  if (milestone.milestone_number === 1) {
    return true
  }
  
  const previousMilestone = allMilestones.find(
    m => m.milestone_number === milestone.milestone_number - 1
  )
  
  if (!previousMilestone) {
    return true
  }
  
  return previousMilestone.status === 'approved' || previousMilestone.status === 'paid'
}

/**
 * Get workflow progress for a request
 */
export const getWorkflowProgress = (
  request: TranslationRequest,
  applications: TranslationApplication[] = [],
  contracts: TranslationContract[] = [],
  milestones: TranslationMilestone[] = []
): {
  stage: string
  progress: number
  completed: boolean
  nextAction?: string
} => {
  const stages = [
    { key: 'draft', label: 'Draft', completed: request.status !== 'draft' },
    { key: 'open', label: 'Open for Applications', completed: request.status !== 'draft' && request.status !== 'open' },
    { key: 'reviewing', label: 'Reviewing Applications', completed: request.status !== 'draft' && request.status !== 'open' && request.status !== 'reviewing' },
    { key: 'contracted', label: 'Contract Created', completed: request.status !== 'draft' && request.status !== 'open' && request.status !== 'reviewing' && request.status !== 'contracted' },
    { key: 'in_progress', label: 'Work in Progress', completed: request.status !== 'draft' && request.status !== 'open' && request.status !== 'reviewing' && request.status !== 'contracted' && request.status !== 'in_progress' },
    { key: 'completed', label: 'Completed', completed: request.status === 'completed' }
  ]
  
  const currentStageIndex = stages.findIndex(stage => stage.key === request.status)
  const completedStages = stages.filter(stage => stage.completed).length
  
  let nextAction = ''
  if (request.status === 'draft') {
    nextAction = 'Publish request'
  } else if (request.status === 'open') {
    nextAction = 'Review applications'
  } else if (request.status === 'reviewing') {
    nextAction = 'Create contracts'
  } else if (request.status === 'contracted') {
    nextAction = 'Sign contracts'
  } else if (request.status === 'in_progress') {
    nextAction = 'Complete milestones'
  }
  
  return {
    stage: stages[currentStageIndex]?.label || 'Unknown',
    progress: Math.round((completedStages / stages.length) * 100),
    completed: request.status === 'completed',
    nextAction: nextAction || undefined
  }
}

/**
 * Get milestone workflow progress
 */
export const getMilestoneProgress = (
  milestones: TranslationMilestone[]
): {
  total: number
  completed: number
  inProgress: number
  pending: number
  progress: number
} => {
  const total = milestones.length
  const completed = milestones.filter(m => m.status === 'approved' || m.status === 'paid').length
  const inProgress = milestones.filter(m => m.status === 'in_progress' || m.status === 'submitted').length
  const pending = milestones.filter(m => m.status === 'pending' || m.status === 'assigned').length
  
  return {
    total,
    completed,
    inProgress,
    pending,
    progress: total > 0 ? Math.round((completed / total) * 100) : 0
  }
}

/**
 * Check if user can create milestones for a contract
 */
export const canCreateMilestones = (
  contract: TranslationContract,
  userRole: string
): boolean => {
  return (
    userRole === 'requester' &&
    contract.status === 'signed' &&
    contract.requester_signed &&
    contract.translator_signed
  )
}

/**
 * Get available actions for a specific object type
 */
export const getAvailableActions = (obj: any): string[] => {
  return obj.available_transitions?.map((t: WorkflowTransition) => t.name) || []
}

/**
 * Get action description
 */
export const getActionDescription = (obj: any, actionName: string): string => {
  const transition = obj.available_transitions?.find(
    (t: WorkflowTransition) => t.name === actionName
  )
  return transition?.description || ''
}

/**
 * Check if workflow is in a terminal state
 */
export const isWorkflowComplete = (request: TranslationRequest): boolean => {
  return request.status === 'completed' || request.status === 'cancelled'
}

/**
 * Check if workflow can be cancelled
 */
export const canCancelWorkflow = (request: TranslationRequest): boolean => {
  return canPerformAction(request, 'cancel')
}
