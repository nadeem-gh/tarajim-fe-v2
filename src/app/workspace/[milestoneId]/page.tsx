'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { api } from '@/lib/api'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { 
  ArrowLeftIcon,
  BookOpenIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import EpubReader from '../components/EpubReader'
import TranslationPanel from '../components/TranslationPanel'
import MilestoneProgress from '../components/MilestoneProgress'
import TranslationToolbar from '../components/TranslationToolbar'
// Removed auto-save import

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
}

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

interface PaginatedResponse {
  results: Sentence[]
  pagination: PaginationInfo
}

interface Milestone {
  id: number
  title: string
  status: string
  amount: number
  currency: string
}

interface BookInfo {
  id: number
  title: string
  author: string
  description: string
  language: string
  target_language: string
  word_count: number
  status: string
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

export default function TranslationWorkspace() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  const milestoneId = Array.isArray(params.milestoneId) ? params.milestoneId[0] : params.milestoneId
  const bookId = searchParams.get('book')
  
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0)
  const [sentences, setSentences] = useState<Sentence[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null)
  const [allSentences, setAllSentences] = useState<Sentence[]>([]) // Store all loaded sentences

  // Fetch milestone details
  const { data: milestoneData } = useQuery(
    ['milestone-progress', milestoneId],
    async () => {
      const response = await api.get(`/workspace/milestones/${milestoneId}/progress/`)
      return response.data
    },
    {
      enabled: !!milestoneId,
      onError: (error: any) => {
        toast.error('Failed to load milestone details')
        console.error('Milestone loading error:', error)
      }
    }
  )

  // Fetch book info
  const { data: bookInfo } = useQuery(
    ['book-info', bookId],
    async () => {
      const response = await api.get(`/workspace/books/${bookId}/info/`)
      return response.data as BookInfo
    },
    {
      enabled: !!bookId,
      onError: (error: any) => {
        toast.error('Failed to load book information')
        console.error('Book info loading error:', error)
      }
    }
  )

  // Fetch EPUB sentences with pagination
  const { data: sentencesData, isLoading: sentencesLoading } = useQuery(
    ['epub-sentences', bookId, currentPage],
    async () => {
      const response = await api.get(`/workspace/books/${bookId}/epub/sentences/?page=${currentPage}&limit=10`)
      return response.data as PaginatedResponse
    },
    {
      enabled: !!bookId,
      onSuccess: (data) => {
        setPaginationInfo(data.pagination)
        
        // If this is the first page, replace all sentences
        if (currentPage === 1) {
          setAllSentences(data.results)
          setSentences(data.results)
        } else {
          // For subsequent pages, append to existing sentences
          setAllSentences(prev => [...prev, ...data.results])
          setSentences(prev => [...prev, ...data.results])
        }
        
        setIsLoading(false)
      },
      onError: (error: any) => {
        toast.error('Failed to load EPUB content')
        console.error('EPUB loading error:', error)
        setIsLoading(false)
      }
    }
  )

  // Manual save mutation
  const saveTranslationMutation = useMutation(
    async (data: any) => {
      const response = await api.post(`/workspace/books/${bookId}/translations/`, data)
      return response.data
    },
    {
      onSuccess: () => {
        toast.success('Translation saved successfully')
        // Refresh progress data
        queryClient.invalidateQueries(['milestone-progress', milestoneId])
      },
      onError: (error: any) => {
        toast.error('Failed to save translation')
        console.error('Save translation error:', error)
      }
    }
  )

  // Handle sentence selection
  const handleSentenceSelect = (index: number) => {
    setCurrentSentenceIndex(index)
  }

  // Auto-load more sentences when 2 sentences remain
  useEffect(() => {
    if (sentences.length > 0 && paginationInfo && paginationInfo.has_next) {
      const remainingSentences = sentences.length - currentSentenceIndex - 1
      if (remainingSentences <= 2) {
        // Load next page
        setCurrentPage(prev => prev + 1)
      }
    }
  }, [currentSentenceIndex, sentences.length, paginationInfo])

  // Handle translation update
  const handleTranslationUpdate = (translatedText: string) => {
    const currentSentence = sentences[currentSentenceIndex]
    if (!currentSentence) return

    // Update local state
    const updatedSentences = [...sentences]
    updatedSentences[currentSentenceIndex] = {
      ...currentSentence,
      translated_text: translatedText,
      is_translated: !!translatedText.trim()
    }
    setSentences(updatedSentences)
  }

  // Handle manual save
  const handleSave = () => {
    const currentSentence = sentences[currentSentenceIndex]
    if (!currentSentence || !currentSentence.translated_text.trim()) return

    saveTranslationMutation.mutate({
      chapter_number: currentSentence.chapter_number,
      page_number: currentSentence.page_number,
      sentence_number: currentSentence.sentence_number,
      original_text: currentSentence.original_text,
      translated_text: currentSentence.translated_text,
      translation_method: 'typing'
    })
  }

  // Handle navigation
  const handlePrevious = () => {
    if (currentSentenceIndex > 0) {
      setCurrentSentenceIndex(currentSentenceIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentSentenceIndex < sentences.length - 1) {
      setCurrentSentenceIndex(currentSentenceIndex + 1)
    }
  }

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && e.ctrlKey) {
        e.preventDefault()
        handlePrevious()
      } else if (e.key === 'ArrowRight' && e.ctrlKey) {
        e.preventDefault()
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentSentenceIndex, sentences.length])

  if (isLoading || sentencesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!sentences.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No content available</h3>
          <p className="mt-1 text-sm text-gray-500">
            The EPUB file could not be processed or contains no readable content.
          </p>
          <Link
            href={`/books/${bookId}`}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Book
          </Link>
        </div>
      </div>
    )
  }

  const currentSentence = sentences[currentSentenceIndex]
  const milestone = milestoneData?.milestone
  const progress = milestoneData?.progress

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                href={`/books/${bookId}`}
                className="flex items-center text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Book
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {bookInfo?.title} by {bookInfo?.author}
              </div>
              <div className="text-sm text-gray-500">
                {bookInfo?.language} → {bookInfo?.target_language}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Milestone Progress */}
            {milestone && progress && (
              <MilestoneProgress
                milestone={milestone}
                progress={progress}
              />
            )}

            {/* Translation Toolbar */}
            <TranslationToolbar
              milestoneId={milestoneId}
              bookId={bookId}
              currentIndex={currentSentenceIndex}
              totalSentences={sentences.length}
              paginationInfo={paginationInfo}
              onPrevious={handlePrevious}
              onNext={handleNext}
            />
          </div>

          {/* Main Translation Area - Side by Side */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* EPUB Reader - Left Side */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Source Text</h3>
                <EpubReader
                  sentences={sentences}
                  currentIndex={currentSentenceIndex}
                  onSentenceSelect={handleSentenceSelect}
                  onPrevious={handlePrevious}
                  onNext={handleNext}
                />
              </div>

              {/* Translation Panel - Right Side */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Translation</h3>
                <TranslationPanel
                  sentence={currentSentence}
                  onTranslationUpdate={handleTranslationUpdate}
                  onSave={handleSave}
                  isSaving={saveTranslationMutation.isLoading}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
