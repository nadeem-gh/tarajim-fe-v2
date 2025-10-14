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
    canSignRequester: canPerformAction(contract, 'sign_by_requester'),
    canSignTranslator: canPerformAction(contract, 'sign_by_translator'),
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
    isPreviousMilestoneCompleted(milestone, allMilestones) &&
    userRole === 'translator' // Only translators can start work
  
  return {
    canAssign: canPerformAction(milestone, 'assign') && userRole === 'requester', // Only requesters can assign
    canStart: canStart,
    canSubmit: canPerformAction(milestone, 'submit') && userRole === 'translator', // Only translators can submit
    canApprove: canPerformAction(milestone, 'approve') && userRole === 'requester', // Only requesters can approve
    canMarkPaid: canPerformAction(milestone, 'mark_paid') && userRole === 'requester' // Only requesters can mark as paid
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
  // Handle case where request is undefined or null
  if (!request || !request.status || !request.id) {
    return {
      stage: 'No Request',
      progress: 0,
      completed: false,
      nextAction: 'Create request'
    }
  }

  const stages = [
    { key: 'draft', label: 'Draft', weight: 1 },
    { key: 'open', label: 'Open for Applications', weight: 2 },
    { key: 'reviewing', label: 'Reviewing Applications', weight: 3 },
    { key: 'contracted', label: 'Contract Created', weight: 4 },
    { key: 'in_progress', label: 'Work in Progress', weight: 5 },
    { key: 'completed', label: 'Completed', weight: 6 }
  ]
  
  const currentStage = stages.find(stage => stage.key === request.status)
  const currentStageIndex = stages.findIndex(stage => stage.key === request.status)
  
  // Calculate progress based on current stage and actual workflow data
  let progress = 0
  if (currentStage) {
    // Base progress from stage
    progress = Math.round((currentStage.weight / stages.length) * 100)
    
    // Adjust based on actual data
    if (request.status === 'open' && applications.length > 0) {
      progress = Math.min(progress + 10, 100) // Bonus for having applications
    }
    if (request.status === 'reviewing' && applications.some(app => app.status === 'accepted')) {
      progress = Math.min(progress + 15, 100) // Bonus for accepted applications
    }
    if (request.status === 'contracted' && contracts.length > 0) {
      progress = Math.min(progress + 10, 100) // Bonus for having contracts
    }
    if (request.status === 'in_progress' && milestones.length > 0) {
      progress = Math.min(progress + 10, 100) // Bonus for having milestones
    }
  }
  
  let nextAction = ''
  if (request.status === 'draft') {
    nextAction = 'Publish request'
  } else if (request.status === 'open') {
    nextAction = applications.length > 0 ? 'Review applications' : 'Wait for applications'
  } else if (request.status === 'reviewing') {
    nextAction = 'Accept applications and create contracts'
  } else if (request.status === 'contracted') {
    nextAction = 'Sign contracts to start work'
  } else if (request.status === 'in_progress') {
    nextAction = 'Complete milestones'
  } else if (request.status === 'completed') {
    nextAction = 'Project completed'
  }
  
  return {
    stage: currentStage?.label || 'Unknown',
    progress: Math.max(0, Math.min(100, progress)),
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
