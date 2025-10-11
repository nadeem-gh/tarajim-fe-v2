'use client'

import SimplifiedWorkflow from './workflow/SimplifiedWorkflow'

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
  return (
    <SimplifiedWorkflow
      bookId={bookId}
      userRole={userRole}
      onRefresh={onRefresh}
    />
  )
}