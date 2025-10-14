'use client'

import { useState } from 'react'
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  PhotoIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

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

interface EpubReaderProps {
  sentences: Sentence[]
  currentIndex: number
  onSentenceSelect: (index: number) => void
  onPrevious: () => void
  onNext: () => void
}

export default function EpubReader({
  sentences,
  currentIndex,
  onSentenceSelect,
  onPrevious,
  onNext
}: EpubReaderProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTranslated, setFilterTranslated] = useState<'all' | 'translated' | 'untranslated'>('all')

  // Filter sentences based on search and translation status
  const filteredSentences = sentences.filter(sentence => {
    const matchesSearch = sentence.original_text.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = 
      filterTranslated === 'all' ||
      (filterTranslated === 'translated' && sentence.is_translated) ||
      (filterTranslated === 'untranslated' && !sentence.is_translated)
    
    return matchesSearch && matchesFilter
  })

  const currentSentence = sentences[currentIndex]
  const translatedCount = sentences.filter(s => s.is_translated).length
  const totalCount = sentences.length

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-medium text-gray-900">Source Text</h3>
            <div className="flex items-center text-sm text-gray-500">
              <DocumentTextIcon className="h-4 w-4 mr-1" />
              {translatedCount} / {totalCount} translated
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={onPrevious}
              disabled={currentIndex === 0}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <span className="text-sm text-gray-500">
              {currentIndex + 1} of {sentences.length}
            </span>
            <button
              onClick={onNext}
              disabled={currentIndex === sentences.length - 1}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search sentences..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <select
            value={filterTranslated}
            onChange={(e) => setFilterTranslated(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All sentences</option>
            <option value="translated">Translated only</option>
            <option value="untranslated">Untranslated only</option>
          </select>
        </div>
      </div>

      {/* Current Sentence Display */}
      <div className="px-6 py-6">
        {currentSentence && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Chapter {currentSentence.chapter_number}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Sentence {currentSentence.sentence_number}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {currentSentence.word_count} words
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                {currentSentence.is_translated ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    <span className="text-sm">Translated</span>
                  </div>
                ) : (
                  <div className="flex items-center text-gray-500">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span className="text-sm">Pending</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900 leading-relaxed">
                {currentSentence.original_text}
              </p>
              
              {/* Associated Images */}
              {currentSentence.associated_images && currentSentence.associated_images.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <PhotoIcon className="h-4 w-4 mr-1" />
                    <span>Associated Images ({currentSentence.associated_images.length})</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentSentence.associated_images.map((image, imgIndex) => (
                      <div key={imgIndex} className="relative group">
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          <div className="aspect-w-16 aspect-h-9 bg-gray-100 flex items-center justify-center">
                            <div className="text-center p-4">
                              <PhotoIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">
                                {image.alt || 'Image'}
                              </p>
                              {image.title && (
                                <p className="text-xs text-gray-400 mt-1">
                                  {image.title}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 truncate">
                                {image.src}
                              </span>
                              <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600">
                                <EyeIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sentence List */}
      <div className="border-t border-gray-200">
        <div className="max-h-96 overflow-y-auto">
          {filteredSentences.map((sentence, index) => {
            const actualIndex = sentences.indexOf(sentence)
            const isSelected = actualIndex === currentIndex
            
            return (
              <div
                key={`${sentence.chapter_number}-${sentence.sentence_number}`}
                onClick={() => onSentenceSelect(actualIndex)}
                className={`px-6 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  isSelected ? 'bg-primary-50 border-primary-200' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs text-gray-500">
                        Ch.{sentence.chapter_number} - Sent.{sentence.sentence_number}
                      </span>
                      <span className="text-xs text-gray-500">
                        {sentence.word_count} words
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 truncate">
                      {sentence.original_text}
                    </p>
                  </div>
                  
                  <div className="ml-4 flex-shrink-0">
                    {sentence.is_translated ? (
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <ClockIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
