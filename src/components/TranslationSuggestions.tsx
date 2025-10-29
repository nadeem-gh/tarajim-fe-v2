'use client'

import React from 'react'
import { 
  CheckCircleIcon, 
  PencilIcon, 
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface TranslationSuggestion {
  id: number
  translated_text: string
  translated_by_name: string
  created_at: string
  translation_method: string
}

interface TranslationSuggestionsProps {
  suggestions: TranslationSuggestion[]
  onAccept: (suggestion: TranslationSuggestion) => void
  onImprove: (suggestion: TranslationSuggestion) => void
  onDismiss: () => void
}

export default function TranslationSuggestions({
  suggestions,
  onAccept,
  onImprove,
  onDismiss
}: TranslationSuggestionsProps) {
  if (!suggestions || suggestions.length === 0) {
    return null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'speech':
        return '🎤'
      case 'typing':
        return '✍️'
      default:
        return '📝'
    }
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-blue-900">
          Translation Suggestions ({suggestions.length})
        </h4>
        <button
          onClick={onDismiss}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Dismiss
        </button>
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div key={suggestion.id} className="bg-white rounded-md p-3 border border-blue-100">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 mb-2 line-clamp-3">
                  {suggestion.translated_text}
                </p>
                
                <div className="flex items-center space-x-3 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <UserIcon className="h-3 w-3" />
                    <span>{suggestion.translated_by_name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="h-3 w-3" />
                    <span>{formatDate(suggestion.created_at)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <span>{getMethodIcon(suggestion.translation_method)}</span>
                    <span className="capitalize">{suggestion.translation_method}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-3">
              <button
                onClick={() => onAccept(suggestion)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-xs font-medium"
              >
                <CheckCircleIcon className="h-3 w-3" />
                <span>Accept</span>
              </button>
              
              <button
                onClick={() => onImprove(suggestion)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-xs font-medium"
              >
                <PencilIcon className="h-3 w-3" />
                <span>Improve</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs text-blue-700">
        💡 These suggestions are based on identical sentences translated by other users
      </div>
    </div>
  )
}

