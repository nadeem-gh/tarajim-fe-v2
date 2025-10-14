'use client'

import { useState } from 'react'
import { useMutation } from 'react-query'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { 
  ChevronLeftIcon,
  ChevronRightIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  DocumentCheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface PaginationInfo {
  page: number
  limit: number
  total_sentences: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
  next_page?: number
  previous_page?: number
}

interface TranslationToolbarProps {
  milestoneId: string
  bookId: string | null
  currentIndex: number
  totalSentences: number
  paginationInfo?: PaginationInfo | null
  onPrevious: () => void
  onNext: () => void
}

export default function TranslationToolbar({
  milestoneId,
  bookId,
  currentIndex,
  totalSentences,
  paginationInfo,
  onPrevious,
  onNext
}: TranslationToolbarProps) {
  const [isAutoPlay, setIsAutoPlay] = useState(false)
  const [autoPlaySpeed, setAutoPlaySpeed] = useState(3000) // milliseconds

  // Submit milestone for review
  const submitMilestoneMutation = useMutation(
    async () => {
      const response = await api.post(`/workspace/milestones/${milestoneId}/submit/`)
      return response.data
    },
    {
      onSuccess: () => {
        toast.success('Milestone submitted for review')
      },
      onError: (error: any) => {
        toast.error('Failed to submit milestone')
        console.error('Submit milestone error:', error)
      }
    }
  )

  // Auto-play functionality
  const handleAutoPlay = () => {
    setIsAutoPlay(!isAutoPlay)
  }

  // Auto-play effect
  useState(() => {
    let interval: NodeJS.Timeout
    if (isAutoPlay && currentIndex < totalSentences - 1) {
      interval = setInterval(() => {
        onNext()
      }, autoPlaySpeed)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  })

  const handleSubmitMilestone = () => {
    if (window.confirm('Are you sure you want to submit this milestone for review? This action cannot be undone.')) {
      submitMilestoneMutation.mutate()
    }
  }

  const handleSpeedChange = (speed: number) => {
    setAutoPlaySpeed(speed)
  }

  const canGoPrevious = currentIndex > 0
  const canGoNext = currentIndex < totalSentences - 1
  const isFirst = currentIndex === 0
  const isLast = currentIndex === totalSentences - 1

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Translation Tools</h3>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Navigation Controls */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Navigation</h4>
          <div className="flex items-center space-x-2">
            <button
              onClick={onPrevious}
              disabled={!canGoPrevious}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="h-4 w-4 mr-1" />
              Previous
            </button>
            
            <div className="flex items-center px-3 py-2 text-sm text-gray-500 bg-gray-50 rounded-md">
              {currentIndex + 1} / {totalSentences}
            </div>
            
            <button
              onClick={onNext}
              disabled={!canGoNext}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>

        {/* Pagination Info */}
        {paginationInfo && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Pagination</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Page {paginationInfo.page} of {paginationInfo.total_pages}</div>
              <div>Showing {totalSentences} of {paginationInfo.total_sentences} sentences</div>
              {paginationInfo.has_next && (
                <div className="text-blue-600 text-xs">More sentences will load automatically</div>
              )}
            </div>
          </div>
        )}

        {/* Auto-play Controls */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Auto-play</h4>
          <div className="space-y-3">
            <button
              onClick={handleAutoPlay}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                isAutoPlay
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {isAutoPlay ? (
                <>
                  <PauseIcon className="h-4 w-4 mr-2" />
                  Stop Auto-play
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Start Auto-play
                </>
              )}
            </button>
            
            {isAutoPlay && (
              <div className="space-y-2">
                <label className="text-xs text-gray-500">Speed (seconds per sentence)</label>
                <select
                  value={autoPlaySpeed / 1000}
                  onChange={(e) => handleSpeedChange(parseInt(e.target.value) * 1000)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value={1}>1 second</option>
                  <option value={2}>2 seconds</option>
                  <option value={3}>3 seconds</option>
                  <option value={5}>5 seconds</option>
                  <option value={10}>10 seconds</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h4>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh Page
            </button>
            
            <button
              onClick={() => {
                if (bookId) {
                  window.open(`/books/${bookId}`, '_blank')
                }
              }}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <DocumentCheckIcon className="h-4 w-4 mr-2" />
              View Book Details
            </button>
          </div>
        </div>

        {/* Milestone Actions */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Milestone Actions</h4>
          <button
            onClick={handleSubmitMilestone}
            disabled={submitMilestoneMutation.isLoading}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitMilestoneMutation.isLoading ? (
              <>
                <ClockIcon className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <DocumentCheckIcon className="h-4 w-4 mr-2" />
                Submit for Review
              </>
            )}
          </button>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Keyboard Shortcuts</h4>
          <div className="text-xs text-gray-500 space-y-1">
            <div>Ctrl + ← Previous sentence</div>
            <div>Ctrl + → Next sentence</div>
            <div>Space Play/Pause auto-play</div>
          </div>
        </div>
      </div>
    </div>
  )
}
