'use client'

import { useState, useEffect } from 'react'
import { 
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MicrophoneIcon,
  PencilIcon,
  PhotoIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import SpeechToTextButton from './SpeechToTextButton'

interface Sentence {
  chapter_number: number
  page_number: number
  sentence_number: number
  original_text: string
  word_count: number
  is_translated: boolean
  translated_text: string
  translation_id?: number
  translated_by?: string
  translation_method?: string
  created_at?: string
  updated_at?: string
  associated_images?: Array<{
    src: string
    alt: string
    title?: string
  }>
}

interface TranslationPanelProps {
  sentence: Sentence
  onTranslationUpdate: (translatedText: string) => void
  onSave: () => void
  isSaving: boolean
}

export default function TranslationPanel({
  sentence,
  onTranslationUpdate,
  onSave,
  isSaving
}: TranslationPanelProps) {
  const [translatedText, setTranslatedText] = useState(sentence?.translated_text || '')
  const [translationMethod, setTranslationMethod] = useState<'typing' | 'speech'>('typing')
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)

  // Update local state when sentence changes
  useEffect(() => {
    setTranslatedText(sentence?.translated_text || '')
  }, [sentence])

  // Update word and character counts
  useEffect(() => {
    const words = translatedText.trim().split(/\s+/).filter(word => word.length > 0)
    setWordCount(words.length)
    setCharCount(translatedText.length)
  }, [translatedText])

  const handleTextChange = (value: string) => {
    setTranslatedText(value)
    onTranslationUpdate(value)
  }

  const handleMethodChange = (method: 'typing' | 'speech') => {
    setTranslationMethod(method)
  }

  const handleSpeechTranscription = (text: string) => {
    setTranslatedText(text)
    onTranslationUpdate(text)
  }

  const getStatusIcon = () => {
    if (isSaving) {
      return <ClockIcon className="h-4 w-4 text-blue-500 animate-spin" />
    }
    if (sentence?.is_translated) {
      return <CheckCircleIcon className="h-4 w-4 text-green-500" />
    }
    return <ClockIcon className="h-4 w-4 text-gray-400" />
  }

  const getStatusText = () => {
    if (isSaving) return 'Saving...'
    if (sentence?.is_translated) return 'Translated'
    return 'Pending'
  }

  const getValidationMessage = () => {
    if (!translatedText.trim()) return null
    
    const originalWords = sentence?.word_count || 0
    const translatedWords = wordCount
    const ratio = translatedWords / originalWords
    
    if (ratio < 0.5) {
      return {
        type: 'warning',
        message: 'Translation seems too short compared to original'
      }
    } else if (ratio > 2) {
      return {
        type: 'warning', 
        message: 'Translation seems too long compared to original'
      }
    }
    
    return null
  }

  const validation = getValidationMessage()

  if (!sentence) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-8 text-center">
          <PencilIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No sentence selected</h3>
          <p className="mt-1 text-sm text-gray-500">
            Select a sentence from the source text to begin translation.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Translation</h3>
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="text-sm text-gray-500">{getStatusText()}</span>
          </div>
        </div>
      </div>

      {/* Translation Method Selector */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex space-x-4">
          <button
            onClick={() => handleMethodChange('typing')}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
              translationMethod === 'typing'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Type Translation
          </button>
          <button
            onClick={() => handleMethodChange('speech')}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
              translationMethod === 'speech'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MicrophoneIcon className="h-4 w-4 mr-2" />
            Speech to Text
          </button>
        </div>
      </div>

      {/* Translation Input */}
      <div className="px-6 py-6">
        <div className="space-y-4">
          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>{wordCount} words</span>
              <span>{charCount} characters</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Original: {sentence.word_count} words</span>
              {sentence.word_count > 0 && (
                <span className="text-xs">
                  ({Math.round((wordCount / sentence.word_count) * 100)}% length)
                </span>
              )}
            </div>
          </div>

          {/* Validation Message */}
          {validation && (
            <div className={`flex items-center p-3 rounded-md ${
              validation.type === 'warning' 
                ? 'bg-yellow-50 border border-yellow-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <ExclamationTriangleIcon className={`h-4 w-4 mr-2 ${
                validation.type === 'warning' ? 'text-yellow-600' : 'text-red-600'
              }`} />
              <span className={`text-sm ${
                validation.type === 'warning' ? 'text-yellow-700' : 'text-red-700'
              }`}>
                {validation.message}
              </span>
            </div>
          )}

          {/* Image Context */}
          {sentence.associated_images && sentence.associated_images.length > 0 && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center mb-3">
                <PhotoIcon className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-900">
                  Context Images ({sentence.associated_images.length})
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {sentence.associated_images.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="bg-white rounded border border-blue-200 overflow-hidden">
                      <div className="aspect-w-16 aspect-h-9 bg-gray-100 flex items-center justify-center">
                        <div className="text-center p-2">
                          <PhotoIcon className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                          <p className="text-xs text-gray-500 truncate">
                            {image.alt || 'Image'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 truncate">
                            {image.src}
                          </span>
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600">
                            <EyeIcon className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <p className="text-xs text-blue-700 mt-2">
                These images provide context for the sentence you're translating. Consider their content when crafting your translation.
              </p>
            </div>
          )}

          {/* Text Area */}
          <div className="relative">
            <textarea
              value={translatedText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Enter your translation here..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              rows={6}
            />
          </div>

          {/* Speech to Text Section */}
          {translationMethod === 'speech' && (
            <div className="border-t border-gray-200 pt-4">
              <SpeechToTextButton
                onTranscription={handleSpeechTranscription}
                language="ur"
                disabled={isSaving}
                className="w-full"
                savedTranslation={sentence.translation}
              />
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                onClick={() => handleTextChange('')}
                className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
              <button
                onClick={() => handleTextChange(sentence.original_text)}
                className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
              >
                Copy Original
              </button>
            </div>
            
            <button
              onClick={onSave}
              disabled={isSaving || !translatedText.trim()}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <ClockIcon className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>Save Translation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
