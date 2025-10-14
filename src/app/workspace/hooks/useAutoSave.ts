'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useMutation } from 'react-query'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface TranslationData {
  chapter_number: number
  page_number: number
  sentence_number: number
  original_text: string
  translated_text: string
  translation_method: string
}

interface UseAutoSaveProps {
  bookId: number
  onSaveSuccess?: () => void
}

export function useAutoSave({ bookId, onSaveSuccess }: UseAutoSaveProps) {
  const [isSaving, setIsSaving] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedDataRef = useRef<string>('')

  // Save translation mutation
  const saveTranslationMutation = useMutation(
    async (data: TranslationData) => {
      const response = await api.post(`/workspace/books/${bookId}/translations/`, data)
      return response.data
    },
    {
      onSuccess: () => {
        setIsSaving(false)
        onSaveSuccess?.()
      },
      onError: (error: any) => {
        setIsSaving(false)
        console.error('Auto-save error:', error)
        // Don't show toast for auto-save errors to avoid spam
      }
    }
  )

  // Update translation mutation
  const updateTranslationMutation = useMutation(
    async ({ translationId, data }: { translationId: number; data: Partial<TranslationData> }) => {
      const response = await api.patch(`/workspace/translations/${translationId}/`, data)
      return response.data
    },
    {
      onSuccess: () => {
        setIsSaving(false)
        onSaveSuccess?.()
      },
      onError: (error: any) => {
        setIsSaving(false)
        console.error('Auto-save error:', error)
      }
    }
  )

  const saveTranslation = useCallback((data: TranslationData) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Create a unique key for this translation data
    const dataKey = JSON.stringify({
      chapter_number: data.chapter_number,
      page_number: data.page_number,
      sentence_number: data.sentence_number,
      translated_text: data.translated_text
    })

    // Skip if data hasn't changed
    if (dataKey === lastSavedDataRef.current) {
      return
    }

    // Set saving state
    setIsSaving(true)

    // Debounce the save operation
    saveTimeoutRef.current = setTimeout(() => {
      // Check if this is an update to existing translation
      const existingTranslationId = data.translation_id
      
      if (existingTranslationId) {
        // Update existing translation
        updateTranslationMutation.mutate({
          translationId: existingTranslationId,
          data: {
            translated_text: data.translated_text,
            translation_method: data.translation_method
          }
        })
      } else {
        // Create new translation
        saveTranslationMutation.mutate(data)
      }

      lastSavedDataRef.current = dataKey
    }, 3000) // 3 second debounce
  }, [bookId, saveTranslationMutation, updateTranslationMutation])

  // Manual save function
  const saveNow = useCallback((data: TranslationData) => {
    // Clear any pending auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    setIsSaving(true)

    const existingTranslationId = data.translation_id
    
    if (existingTranslationId) {
      updateTranslationMutation.mutate({
        translationId: existingTranslationId,
        data: {
          translated_text: data.translated_text,
          translation_method: data.translation_method
        }
      })
    } else {
      saveTranslationMutation.mutate(data)
    }

    lastSavedDataRef.current = JSON.stringify({
      chapter_number: data.chapter_number,
      page_number: data.page_number,
      sentence_number: data.sentence_number,
      translated_text: data.translated_text
    })
  }, [saveTranslationMutation, updateTranslationMutation])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return {
    saveTranslation,
    saveNow,
    isSaving,
    isError: saveTranslationMutation.isError || updateTranslationMutation.isError,
    error: saveTranslationMutation.error || updateTranslationMutation.error
  }
}
