'use client'

import { useState, useEffect, Suspense } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { 
  MicrophoneIcon, 
  PencilIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  PhotoIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import SpeechToTextButton from '@/app/workspace/components/SpeechToTextButton'

interface Book {
  id: number
  title: string
  author: string
  language: string
  target_language: string
  word_count: number
  cover_image: string
}

interface SamplePage {
  chapter_number: number
  page_number: number
  title: string
  preview_text: string
  word_count: number
  difficulty: string
  original_text: string
  associated_images?: Array<{
    src: string
    alt: string
    title?: string
  }>
}

function SampleSubmissionContent() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookId = searchParams.get('book')
  const queryClient = useQueryClient()

  const [selectedSentence, setSelectedSentence] = useState<any>(null)
  const [translatedText, setTranslatedText] = useState('')
  const [translationMethod, setTranslationMethod] = useState<'typing' | 'speech'>('typing')
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [sentences, setSentences] = useState<any[]>([])
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0)
  const [paginationInfo, setPaginationInfo] = useState<any>(null)

  // Fetch book details
  const { data: book, isLoading: bookLoading } = useQuery(
    ['book-detail', bookId],
    async () => {
      const response = await api.get(`/books/${bookId}/`)
      return response.data
    },
    { enabled: !!bookId }
  )

  // Fetch EPUB sentences with pagination (same as workplace)
  const { data: sentencesData, isLoading: sentencesLoading } = useQuery(
    ['epub-sentences', bookId, currentPage],
    async () => {
      const response = await api.get(`/workspace/books/${bookId}/epub/sentences/?page=${currentPage}&limit=10`)
      return response.data
    },
    {
      enabled: !!bookId,
      onSuccess: (data) => {
        setPaginationInfo(data.pagination)
        
        // If this is the first page, replace all sentences
        if (currentPage === 1) {
          setSentences(data.results)
        } else {
          // For subsequent pages, append to existing sentences
          setSentences(prev => [...prev, ...data.results])
        }
        
        // Set first sentence as selected if none selected
        if (data.results.length > 0 && !selectedSentence) {
          setSelectedSentence(data.results[0])
          setCurrentSentenceIndex(0)
        }
      },
      onError: (error: any) => {
        toast.error('Failed to load EPUB content')
        console.error('EPUB loading error:', error)
      }
    }
  )

  // Submit sample translation mutation
  const submitSampleMutation = useMutation(
    async (sampleData: any) => {
      setIsSubmitting(true)
      const response = await api.post('/samples/submit/', sampleData)
      return response.data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['sample-pages', bookId])
        setTranslatedText('')
        setIsSubmitting(false)
        toast.success('Sample translation submitted successfully!')
      },
      onError: (error: any) => {
        console.error('Submit sample error:', error)
        setIsSubmitting(false)
        const errorMessage = error.response?.data?.error?.message || 
                           error.response?.data?.message || 
                           'Failed to submit sample translation'
        toast.error(errorMessage)
      }
    }
  )

  // Update word and character counts
  useEffect(() => {
    const words = translatedText.trim().split(/\s+/).filter(word => word.length > 0)
    setWordCount(words.length)
    setCharCount(translatedText.length)
  }, [translatedText])

  // Navigation functions (same as workplace)
  const handleSentenceSelect = (index: number) => {
    setCurrentSentenceIndex(index)
    setSelectedSentence(sentences[index])
    setTranslatedText(sentences[index]?.translated_text || '')
  }

  const handlePrevious = () => {
    if (currentSentenceIndex > 0) {
      const newIndex = currentSentenceIndex - 1
      setCurrentSentenceIndex(newIndex)
      setSelectedSentence(sentences[newIndex])
      setTranslatedText(sentences[newIndex]?.translated_text || '')
    }
  }

  const handleNext = () => {
    if (currentSentenceIndex < sentences.length - 1) {
      const newIndex = currentSentenceIndex + 1
      setCurrentSentenceIndex(newIndex)
      setSelectedSentence(sentences[newIndex])
      setTranslatedText(sentences[newIndex]?.translated_text || '')
    } else if (paginationInfo?.has_next) {
      // Load next page
      setCurrentPage(prev => prev + 1)
    }
  }

  const handleTranslationUpdate = (text: string) => {
    setTranslatedText(text)
  }

  const handleMethodChange = (method: 'typing' | 'speech') => {
    setTranslationMethod(method)
  }

  const handleSpeechTranscription = (text: string) => {
    setTranslatedText(text)
  }

  const handleSubmit = () => {
    if (!selectedSentence || !translatedText.trim()) {
      toast.error('Please select a sentence and provide a translation')
      return
    }

    submitSampleMutation.mutate({
      book: bookId,
      chapter_number: selectedSentence.chapter_number,
      page_number: selectedSentence.page_number,
      sentence_number: selectedSentence.sentence_number,
      original_text: selectedSentence.original_text,
      translated_text: translatedText,
      translation_method: translationMethod
    })
  }

  const getValidationMessage = () => {
    if (!translatedText.trim()) return null
    
    const words = translatedText.trim().split(/\s+/).filter(word => word.length > 0)
    const originalWords = selectedSentence?.word_count || 0
    const ratio = words.length / originalWords
    
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

  if (bookLoading || sentencesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ClockIcon className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <DocumentTextIcon className="h-8 w-8 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Book not found</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-blue-600 hover:text-blue-500"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Submit Sample Translation</h1>
                <p className="text-gray-600">{book.title} by {book.author}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {book.language} → {book.target_language}
              </div>
              <div className="text-sm text-gray-500">
                {book.word_count.toLocaleString()} words
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Sentence Navigation */}
          <div className="space-y-6">
            {/* Translation Toolbar */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Navigation</h3>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handlePrevious}
                  disabled={currentSentenceIndex === 0}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="h-4 w-4 mr-1" />
                  Previous
                </button>
                <span className="text-sm text-gray-500">
                  {currentSentenceIndex + 1} of {sentences.length}
                </span>
                <button
                  onClick={handleNext}
                  disabled={currentSentenceIndex === sentences.length - 1 && !paginationInfo?.has_next}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRightIcon className="h-4 w-4 ml-1" />
                </button>
              </div>
              
              {paginationInfo && (
                <div className="text-xs text-gray-500 text-center">
                  Page {paginationInfo.page} of {paginationInfo.total_pages}
                </div>
              )}
            </div>

            {/* Translation Stats */}
            {selectedSentence && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Translation Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Words:</span>
                    <span className="text-sm font-medium">{wordCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Characters:</span>
                    <span className="text-sm font-medium">{charCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Original Words:</span>
                    <span className="text-sm font-medium">{selectedSentence.word_count}</span>
                  </div>
                  {selectedSentence.word_count > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Length Ratio:</span>
                      <span className="text-sm font-medium">
                        {Math.round((wordCount / selectedSentence.word_count) * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Main Translation Area */}
          <div className="lg:col-span-3">
            {selectedSentence ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Source Text - Left Side */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Source Text</h3>
                  <div className="bg-white rounded-lg shadow">
                    <div className="p-6">
                      <div className="mb-4">
                        <div className="text-sm text-gray-500 mb-2">
                          Chapter {selectedSentence.chapter_number}, Page {selectedSentence.page_number}, Sentence {selectedSentence.sentence_number}
                        </div>
                      </div>
                      <div className="prose max-w-none">
                        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {selectedSentence.original_text}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Translation Panel - Right Side */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Your Translation</h3>
                  <div className="bg-white rounded-lg shadow">
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
                            <span>Original: {selectedSentence.word_count} words</span>
                            {selectedSentence.word_count > 0 && (
                              <span className="text-xs">
                                ({Math.round((wordCount / selectedSentence.word_count) * 100)}% length)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Validation Message */}
                        {getValidationMessage() && (
                          <div className={`flex items-center p-3 rounded-md ${
                            getValidationMessage()?.type === 'warning' 
                              ? 'bg-yellow-50 border border-yellow-200' 
                              : 'bg-red-50 border border-red-200'
                          }`}>
                            <ExclamationTriangleIcon className={`h-4 w-4 mr-2 ${
                              getValidationMessage()?.type === 'warning' ? 'text-yellow-600' : 'text-red-600'
                            }`} />
                            <span className={`text-sm ${
                              getValidationMessage()?.type === 'warning' ? 'text-yellow-700' : 'text-red-700'
                            }`}>
                              {getValidationMessage()?.message}
                            </span>
                          </div>
                        )}

                        {/* Image Context */}
                        {selectedSentence.associated_images && selectedSentence.associated_images.length > 0 && (
                          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center mb-3">
                              <PhotoIcon className="h-4 w-4 text-blue-600 mr-2" />
                              <span className="text-sm font-medium text-blue-900">
                                Context Images ({selectedSentence.associated_images.length})
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {selectedSentence.associated_images.map((image: any, index: number) => (
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
                            onChange={(e) => handleTranslationUpdate(e.target.value)}
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
                              language={book.target_language}
                              disabled={isSubmitting}
                              className="w-full"
                              savedTranslation={translatedText}
                            />
                          </div>
                        )}

                        {/* Quick Actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleTranslationUpdate('')}
                              className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
                            >
                              Clear
                            </button>
                            <button
                              onClick={() => handleTranslationUpdate(selectedSentence.original_text)}
                              className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
                            >
                              Copy Original
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                      <button
                        onClick={handleSubmit}
                        disabled={!translatedText.trim() || isSubmitting}
                        className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <ClockIcon className="h-4 w-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="h-4 w-4 mr-2" />
                            Submit Sample Translation
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Sentence to Translate</h3>
                <p className="text-gray-600">Use the navigation buttons to browse through sentences and start your sample translation.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SampleSubmissionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ClockIcon className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SampleSubmissionContent />
    </Suspense>
  )
}
