'use client'

import { useState, useEffect } from 'react'
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
  PhotoIcon
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
}

export default function SampleSubmissionPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookId = searchParams.get('book')
  const queryClient = useQueryClient()

  const [selectedPage, setSelectedPage] = useState<SamplePage | null>(null)
  const [translatedText, setTranslatedText] = useState('')
  const [translationMethod, setTranslationMethod] = useState<'typing' | 'speech'>('typing')
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)

  // Fetch book details
  const { data: book, isLoading: bookLoading } = useQuery(
    ['book-detail', bookId],
    async () => {
      const response = await api.get(`/books/${bookId}/`)
      return response.data
    },
    { enabled: !!bookId }
  )

  // Fetch available sample pages
  const { data: availablePages, isLoading: pagesLoading } = useQuery(
    ['sample-pages', bookId],
    async () => {
      const response = await api.get(`/samples/available-pages/?book=${bookId}`)
      return response.data
    },
    { enabled: !!bookId }
  )

  // Submit sample translation mutation
  const submitSampleMutation = useMutation(
    async (sampleData: any) => {
      const response = await api.post('/samples/submit/', sampleData)
      return response.data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['sample-pages', bookId])
        setTranslatedText('')
        toast.success('Sample translation submitted successfully!')
      },
      onError: (error: any) => {
        console.error('Submit sample error:', error)
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

  const handlePageSelect = (page: SamplePage) => {
    setSelectedPage(page)
    setTranslatedText('')
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
    if (!selectedPage || !translatedText.trim()) {
      toast.error('Please select a page and provide a translation')
      return
    }

    submitSampleMutation.mutate({
      book: bookId,
      chapter_number: selectedPage.chapter_number,
      page_number: selectedPage.page_number,
      original_text: selectedPage.original_text,
      translated_text: translatedText,
      translation_method: translationMethod
    })
  }

  const getValidationMessage = () => {
    if (!translatedText.trim()) return null
    
    const words = translatedText.trim().split(/\s+/).filter(word => word.length > 0)
    const originalWords = selectedPage?.original_text.trim().split(/\s+/).filter(word => word.length > 0).length || 0
    
    if (words.length < originalWords * 0.5) {
      return 'Translation seems too short. Please provide a more complete translation.'
    }
    
    if (words.length > originalWords * 2) {
      return 'Translation seems too long. Please provide a more concise translation.'
    }
    
    return null
  }

  if (bookLoading || pagesLoading) {
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
          {/* Sidebar - Page Selection */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Page</h3>
              <div className="space-y-3">
                {availablePages?.map((page: SamplePage) => (
                  <button
                    key={`${page.chapter_number}-${page.page_number}`}
                    onClick={() => handlePageSelect(page)}
                    className={`w-full text-left p-3 rounded-lg border ${
                      selectedPage?.chapter_number === page.chapter_number && 
                      selectedPage?.page_number === page.page_number
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{page.title}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {page.word_count} words • {page.difficulty}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                      {page.preview_text}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Translation Stats */}
            {selectedPage && (
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
                    <span className="text-sm font-medium">{selectedPage.word_count}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Translation Area */}
          <div className="lg:col-span-3">
            {selectedPage ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Source Text - Left Side */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Source Text</h3>
                  <div className="bg-white rounded-lg shadow">
                    <div className="p-6">
                      <div className="mb-4">
                        <div className="text-sm text-gray-500 mb-2">
                          Chapter {selectedPage.chapter_number}, Page {selectedPage.page_number}
                        </div>
                        <div className="text-lg font-medium text-gray-900">
                          {selectedPage.title}
                        </div>
                      </div>
                      <div className="prose max-w-none">
                        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {selectedPage.original_text}
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
                              ? 'bg-blue-100 text-blue-700'
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
                              ? 'bg-blue-100 text-blue-700'
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
                      {translationMethod === 'typing' ? (
                        <textarea
                          value={translatedText}
                          onChange={(e) => handleTranslationUpdate(e.target.value)}
                          placeholder="Enter your translation here..."
                          className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                      ) : (
                        <div className="space-y-4">
                          <SpeechToTextButton
                            onTranscription={handleSpeechTranscription}
                            language={book.target_language}
                            className="w-full"
                          />
                          <textarea
                            value={translatedText}
                            onChange={(e) => handleTranslationUpdate(e.target.value)}
                            placeholder="Your speech will be transcribed here, or you can type directly..."
                            className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          />
                        </div>
                      )}

                      {/* Validation Message */}
                      {getValidationMessage() && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 text-yellow-600 mr-2" />
                            <span className="text-sm text-yellow-800">{getValidationMessage()}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                      <button
                        onClick={handleSubmit}
                        disabled={!translatedText.trim() || submitSampleMutation.isLoading}
                        className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitSampleMutation.isLoading ? (
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Page to Translate</h3>
                <p className="text-gray-600">Choose a page from the sidebar to start your sample translation.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
