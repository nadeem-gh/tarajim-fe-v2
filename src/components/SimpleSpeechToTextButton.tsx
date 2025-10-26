'use client'

import { useState, useEffect } from 'react'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import toast from 'react-hot-toast'
import { 
  MicrophoneIcon, 
  StopIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface SimpleSpeechToTextButtonProps {
  onTranscription: (text: string) => void
  language?: string
  disabled?: boolean
  className?: string
}

export default function SimpleSpeechToTextButton({
  onTranscription,
  language = 'ur',
  disabled = false,
  className = ''
}: SimpleSpeechToTextButtonProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [currentText, setCurrentText] = useState('')
  const [confidence, setConfidence] = useState(0)

  // Speech recognition hook
  const {
    isSupported,
    isListening,
    currentText: speechText,
    confidence: speechConfidence,
    startListening,
    stopListening,
    reset,
    currentLanguage,
    setLanguage
  } = useSpeechRecognition({
    language,
    onResult: (result) => {
      setCurrentText(result.text)
      setConfidence(result.confidence)
    },
    onError: (error) => {
      toast.error(error)
      setIsRecording(false)
    },
    onStart: () => {
      setIsRecording(true)
      toast.success('Speech recognition started')
    },
    onEnd: () => {
      setIsRecording(false)
      if (currentText.trim()) {
        toast.success('Speech recognition completed')
      }
    }
  })

  // Update language when prop changes
  useEffect(() => {
    if (language !== currentLanguage) {
      setLanguage(language)
    }
  }, [language, currentLanguage, setLanguage])

  // Handle start/stop recording
  const handleToggleRecording = () => {
    if (isRecording) {
      console.log('Stopping speech recognition...')
      stopListening()
    } else {
      console.log('Starting speech recognition...')
      if (!isSupported) {
        toast.error('Speech recognition is not supported in this browser')
        return
      }
      startListening()
    }
  }

  // Handle transcription acceptance
  const handleAcceptTranscription = () => {
    if (currentText.trim()) {
      onTranscription(currentText.trim())
      setCurrentText('')
      setConfidence(0)
      reset()
      toast.success('Transcription accepted')
    }
  }

  // Handle transcription rejection
  const handleRejectTranscription = () => {
    setCurrentText('')
    setConfidence(0)
    reset()
    toast('Transcription rejected', { icon: 'ℹ️' })
  }

  if (!isSupported) {
    return (
      <div className={`p-4 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        <div className="flex items-center space-x-2 text-yellow-800">
          <ClockIcon className="h-5 w-5" />
          <span className="text-sm">Speech recognition is not supported in this browser</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Speech Recognition Button */}
      <div className="flex space-x-2">
        <button
          onClick={handleToggleRecording}
          disabled={disabled}
          className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
            isRecording
              ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isRecording ? (
            <>
              <StopIcon className="h-5 w-5" />
              <span>Stop Recording</span>
            </>
          ) : (
            <>
              <MicrophoneIcon className="h-5 w-5" />
              <span>Start Recording</span>
            </>
          )}
        </button>
      </div>

      {/* Current Transcription */}
      {currentText && (
        <div className="space-y-2">
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="text-sm text-gray-600 mb-1">
              Transcription {isListening ? '(listening...)' : '(completed)'}
            </div>
            <div className="text-sm text-gray-800">
              {currentText}
            </div>
            {confidence > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                Confidence: {Math.round(confidence * 100)}%
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={handleAcceptTranscription}
              className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm"
            >
              <CheckCircleIcon className="h-4 w-4" />
              <span>Accept</span>
            </button>
            <button
              onClick={handleRejectTranscription}
              className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm"
            >
              <XCircleIcon className="h-4 w-4" />
              <span>Reject</span>
            </button>
          </div>
        </div>
      )}

      {/* Status Indicator */}
      {isListening && (
        <div className="flex items-center space-x-2 text-sm text-blue-600">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          <span>Listening for speech...</span>
        </div>
      )}

      {/* Debug Information - only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <div>Supported: {isSupported ? 'Yes' : 'No'}</div>
          <div>Listening: {isListening ? 'Yes' : 'No'}</div>
          <div>Language: {currentLanguage}</div>
          <div>Current Text: {currentText ? `"${currentText.substring(0, 50)}..."` : 'None'}</div>
        </div>
      )}
    </div>
  )
}
