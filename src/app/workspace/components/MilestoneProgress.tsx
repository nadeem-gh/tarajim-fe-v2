'use client'

import { 
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'

interface Milestone {
  id: number
  title: string
  status: string
  amount: number
  currency: string
}

interface Progress {
  total_sentences: number
  translated_sentences: number
  remaining_sentences: number
  progress_percentage: number
  total_words: number
  translated_words: number
  estimated_hours_remaining: number
}

interface MilestoneProgressProps {
  milestone: Milestone
  progress: Progress
}

export default function MilestoneProgress({ milestone, progress }: MilestoneProgressProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'paid':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <ClockIcon className="h-4 w-4" />
      case 'submitted':
        return <DocumentTextIcon className="h-4 w-4" />
      case 'approved':
      case 'paid':
        return <CheckCircleIcon className="h-4 w-4" />
      default:
        return <ClockIcon className="h-4 w-4" />
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Milestone Progress</h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(milestone.status)}`}>
            {getStatusIcon(milestone.status)}
            <span className="ml-1 capitalize">{milestone.status.replace('_', ' ')}</span>
          </span>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Milestone Details */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">{milestone.title}</h4>
          <div className="flex items-center text-sm text-gray-600">
            <CurrencyDollarIcon className="h-4 w-4 mr-1" />
            <span>{milestone.amount} {milestone.currency}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Translation Progress</span>
            <span className="text-sm text-gray-500">{progress.progress_percentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progress.progress_percentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {progress.translated_sentences}
            </div>
            <div className="text-xs text-gray-500">Translated</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {progress.remaining_sentences}
            </div>
            <div className="text-xs text-gray-500">Remaining</div>
          </div>
        </div>

        {/* Word Count */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Words translated</span>
            <span className="font-medium">{progress.translated_words.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-600">Total words</span>
            <span className="font-medium">{progress.total_words.toLocaleString()}</span>
          </div>
        </div>

        {/* Time Estimation */}
        {progress.estimated_hours_remaining > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center text-sm text-gray-600">
              <ClockIcon className="h-4 w-4 mr-2" />
              <span>Estimated time remaining: {progress.estimated_hours_remaining} hours</span>
            </div>
          </div>
        )}

        {/* Completion Status */}
        {progress.progress_percentage >= 100 && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm text-green-700 font-medium">
                Translation Complete!
              </span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              You can now submit this milestone for review.
            </p>
          </div>
        )}

        {/* Progress Trend */}
        {progress.progress_percentage > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center text-sm text-gray-600">
              <ArrowTrendingUpIcon className="h-4 w-4 mr-2" />
              <span>
                {progress.translated_sentences} of {progress.total_sentences} sentences completed
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
