'use client'

import { useState, useEffect } from 'react'
import { 
  MicrophoneIcon, 
  CpuChipIcon,
  CheckIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { getSTTMethod, setSTTMethod, type STTMethod } from '@/lib/userPreferences'

interface STTMethodToggleProps {
  className?: string
  disabled?: boolean
  onMethodChange?: (method: STTMethod) => void
}

export default function STTMethodToggle({ 
  className = '', 
  disabled = false,
  onMethodChange 
}: STTMethodToggleProps) {
  const [currentMethod, setCurrentMethod] = useState<STTMethod>('browser')
  const [showTooltip, setShowTooltip] = useState(false)

  // Load preference on mount
  useEffect(() => {
    const savedMethod = getSTTMethod()
    setCurrentMethod(savedMethod)
  }, [])

  const handleMethodChange = (method: STTMethod) => {
    if (disabled) return
    
    setCurrentMethod(method)
    setSTTMethod(method)
    onMethodChange?.(method)
  }

  const methods = [
    {
      id: 'browser' as STTMethod,
      name: 'Browser',
      description: 'Fast, works offline',
      icon: MicrophoneIcon,
      color: 'blue',
      details: 'Uses your browser\'s built-in speech recognition. Fast and works without internet, but may be less accurate for some languages.'
    },
    {
      id: 'whisper' as STTMethod,
      name: 'Whisper AI',
      description: 'More accurate, requires backend',
      icon: CpuChipIcon,
      color: 'purple',
      details: 'Uses OpenAI Whisper model on the server. More accurate transcription, especially for Urdu and other languages, but requires internet connection.'
    }
  ]

  return (
    <div className={`relative ${className}`}>
      {/* Toggle Container */}
      <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
        {methods.map((method) => {
          const Icon = method.icon
          const isSelected = currentMethod === method.id
          const colorClasses = {
            blue: isSelected ? 'bg-blue-500 text-white' : 'text-blue-600 hover:bg-blue-50',
            purple: isSelected ? 'bg-purple-500 text-white' : 'text-purple-600 hover:bg-purple-50'
          }

          return (
            <button
              key={method.id}
              onClick={() => handleMethodChange(method.id)}
              disabled={disabled}
              className={`
                flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                ${colorClasses[method.color as keyof typeof colorClasses]}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${isSelected ? 'shadow-sm' : ''}
              `}
              title={method.details}
            >
              <Icon className="h-4 w-4" />
              <span>{method.name}</span>
              {isSelected && <CheckIcon className="h-3 w-3" />}
            </button>
          )
        })}
      </div>

      {/* Info Button */}
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        className="absolute -right-8 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
        title="Learn more about STT methods"
      >
        <InformationCircleIcon className="h-4 w-4" />
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Speech-to-Text Methods</h4>
            {methods.map((method) => {
              const Icon = method.icon
              const isSelected = currentMethod === method.id
              
              return (
                <div 
                  key={method.id}
                  className={`p-3 rounded-md border ${
                    isSelected 
                      ? 'border-blue-200 bg-blue-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <Icon className="h-4 w-4 text-gray-600" />
                    <span className="font-medium text-gray-900">{method.name}</span>
                    {isSelected && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{method.details}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Current Method Badge */}
      <div className="mt-2 flex items-center justify-center">
        <span className="text-xs text-gray-500">
          Using: <span className="font-medium">{methods.find(m => m.id === currentMethod)?.name}</span>
        </span>
      </div>
    </div>
  )
}
