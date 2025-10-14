'use client'

import { useState, useEffect } from 'react'
import { useMutation } from 'react-query'
import { api } from '@/lib/api'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import toast from 'react-hot-toast'
import { 
  MicrophoneIcon, 
  StopIcon, 
  LanguageIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon
} from '@heroicons/react/24/outline'

interface SpeechToTextButtonProps {
  onTranscription: (text: string) => void
  language?: string
  disabled?: boolean
  className?: string
  savedTranslation?: string // Add saved translation text for TTS
}

export default function SpeechToTextButton({
  onTranscription,
  language = 'ur',
  disabled = false,
  className = '',
  savedTranslation
}: SpeechToTextButtonProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [currentText, setCurrentText] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [showLanguageSelector, setShowLanguageSelector] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  // Speech recognition hook
  const {
    isSupported,
    isListening,
    currentText: speechText,
    confidence: speechConfidence,
    startListening,
    stopListening,
    reset,
    supportedLanguages,
    currentLanguage,
    setLanguage,
    speechConfig
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

  // Save transcription mutation
  const saveTranscriptionMutation = useMutation(
    async (data: { text: string; language: string; confidence: number }) => {
      const response = await api.post('/speech/save-transcription/', data)
      return response.data
    },
    {
      onSuccess: (data) => {
        toast.success('Transcription saved successfully')
        setSaveError(false)
        // Reset state only after successful save
        setCurrentText('')
        setConfidence(0)
        reset()
      },
      onError: (error: any) => {
        toast.error('Failed to save transcription')
        console.error('Save transcription error:', error)
        setSaveError(true)
        // Don't reset state on error - keep the transcription for retry
      }
    }
  )

  // Handle start/stop recording
  const handleToggleRecording = () => {
    if (isRecording) {
      console.log('Stopping speech recognition...')
      stopListening()
    } else {
      console.log('Starting speech recognition...')
      reset()
      startListening()
    }
  }

  // Force stop function for emergency stop
  const handleForceStop = () => {
    console.log('Force stopping speech recognition...')
    stopListening()
    reset()
    toast.info('Speech recognition force stopped')
  }

  // Text-to-Speech functionality
  const handlePlaySavedTranslation = () => {
    if (!savedTranslation?.trim()) {
      toast.error('No saved translation to play')
      return
    }

    if (isPlaying) {
      // Stop current speech
      window.speechSynthesis.cancel()
      setIsPlaying(false)
      toast.info('Speech stopped')
      return
    }

    try {
      const utterance = new SpeechSynthesisUtterance(savedTranslation)
      utterance.lang = currentLanguage
      utterance.rate = 0.8
      utterance.pitch = 1
      utterance.volume = 1

      utterance.onstart = () => {
        setIsPlaying(true)
        toast.success('Playing saved translation...')
      }

      utterance.onend = () => {
        setIsPlaying(false)
        toast.success('Speech completed')
      }

      utterance.onerror = (event) => {
        setIsPlaying(false)
        toast.error('Speech synthesis failed')
        console.error('Speech synthesis error:', event.error)
      }

      window.speechSynthesis.speak(utterance)
    } catch (error) {
      console.error('Text-to-speech error:', error)
      toast.error('Failed to play speech')
    }
  }

  // Handle transcription acceptance
  const handleAcceptTranscription = () => {
    if (currentText.trim()) {
      // First update the parent component
      onTranscription(currentText.trim())
      
      // Then save transcription to database
      // State will be reset in the mutation's onSuccess callback
      saveTranscriptionMutation.mutate({
        text: currentText.trim(),
        language: currentLanguage,
        confidence: confidence
      })
    }
  }

  // Handle retry save
  const handleRetrySave = () => {
    if (currentText.trim()) {
      saveTranscriptionMutation.mutate({
        text: currentText.trim(),
        language: currentLanguage,
        confidence: confidence
      })
    }
  }

  // Handle transcription rejection
  const handleRejectTranscription = () => {
    setCurrentText('')
    setConfidence(0)
    reset()
    toast.info('Transcription discarded')
  }

  // Handle language change
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage)
    setShowLanguageSelector(false)
    reset()
    toast.success(`Language changed to ${supportedLanguages.find(l => l.code === newLanguage)?.name}`)
  }

  // Update current text when speech recognition updates
  useEffect(() => {
    if (speechText !== currentText) {
      setCurrentText(speechText)
    }
    setConfidence(speechConfidence)
  }, [speechText, speechConfidence])

  if (!isSupported) {
    return (
      <div className="text-sm text-gray-500 p-2">
        Speech recognition not supported in this browser
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Language Selector */}
      <div className="relative">
        <button
          onClick={() => setShowLanguageSelector(!showLanguageSelector)}
          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
          disabled={disabled}
        >
          <LanguageIcon className="h-4 w-4" />
          <span>
            {supportedLanguages.find(l => l.code === currentLanguage)?.name || 'Urdu'}
          </span>
        </button>

        {showLanguageSelector && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-10">
            <div className="py-1">
              {supportedLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between ${
                    lang.code === currentLanguage ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <span>{lang.name}</span>
                  {lang.rtl && <span className="text-xs text-gray-500">RTL</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

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
        
        {/* Force Stop Button - only show when recording */}
        {isRecording && (
          <button
            onClick={handleForceStop}
            className="flex items-center space-x-1 px-3 py-2 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 border border-orange-300 text-sm"
            title="Force stop speech recognition"
          >
            <XCircleIcon className="h-4 w-4" />
            <span>Force Stop</span>
          </button>
        )}
        
        {/* Text-to-Speech Button - only show when there's saved translation */}
        {savedTranslation?.trim() && (
          <button
            onClick={handlePlaySavedTranslation}
            className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm ${
              isPlaying 
                ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
                : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
            }`}
            title={isPlaying ? 'Stop playing saved translation' : 'Play saved translation'}
          >
            {isPlaying ? (
              <>
                <SpeakerXMarkIcon className="h-4 w-4" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <SpeakerWaveIcon className="h-4 w-4" />
                <span>Listen</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Current Transcription */}
      {currentText && (
        <div className="space-y-2">
          <div className={`p-3 rounded-md ${saveError ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
            <div className="text-sm text-gray-600 mb-1">
              Transcription {isListening ? '(listening...)' : saveError ? '(save failed)' : '(completed)'}
            </div>
            <div 
              className={`text-sm ${
                supportedLanguages.find(l => l.code === currentLanguage)?.rtl ? 'text-right' : 'text-left'
              }`}
              dir={supportedLanguages.find(l => l.code === currentLanguage)?.rtl ? 'rtl' : 'ltr'}
            >
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
            {saveError ? (
              <button
                onClick={handleRetrySave}
                disabled={saveTranscriptionMutation.isLoading}
                className="flex items-center space-x-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 text-sm disabled:opacity-50"
              >
                <ArrowPathIcon className="h-4 w-4" />
                <span>{saveTranscriptionMutation.isLoading ? 'Retrying...' : 'Retry Save'}</span>
              </button>
            ) : (
              <button
                onClick={handleAcceptTranscription}
                disabled={saveTranscriptionMutation.isLoading}
                className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm disabled:opacity-50"
              >
                <CheckCircleIcon className="h-4 w-4" />
                <span>{saveTranscriptionMutation.isLoading ? 'Saving...' : 'Accept'}</span>
              </button>
            )}
            <button
              onClick={handleRejectTranscription}
              disabled={saveTranscriptionMutation.isLoading}
              className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm disabled:opacity-50"
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
          <div>Config: {speechConfig ? 'Loaded' : 'Not loaded'}</div>
          <div>Saved Translation: {savedTranslation ? `"${savedTranslation.substring(0, 50)}..."` : 'None'}</div>
          <div>Has Saved Translation: {savedTranslation?.trim() ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  )
}
