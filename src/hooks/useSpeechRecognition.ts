'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface SpeechRecognitionConfig {
  language: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  rtl: boolean
}

interface SpeechRecognitionResult {
  text: string
  confidence: number
  isFinal: boolean
}

interface UseSpeechRecognitionOptions {
  language?: string
  onResult?: (result: SpeechRecognitionResult) => void
  onError?: (error: string) => void
  onStart?: () => void
  onEnd?: () => void
}

interface UseSpeechRecognitionReturn {
  isSupported: boolean
  isListening: boolean
  isProcessing: boolean
  currentText: string
  confidence: number
  startListening: () => void
  stopListening: () => void
  reset: () => void
  supportedLanguages: Array<{ code: string; name: string; rtl: boolean }>
  currentLanguage: string
  setLanguage: (language: string) => void
}

export function useSpeechRecognition({
  language = 'ur',
  onResult,
  onError,
  onStart,
  onEnd
}: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const [isSupported, setIsSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentText, setCurrentText] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [supportedLanguages, setSupportedLanguages] = useState<Array<{ code: string; name: string; rtl: boolean }>>([])
  const [currentLanguage, setCurrentLanguage] = useState(language)
  const [speechConfig, setSpeechConfig] = useState<SpeechRecognitionConfig | null>(null)
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const finalTranscriptRef = useRef('')

  // Check if speech recognition is supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
    setIsSupported(!!SpeechRecognition)
  }, [])

  // Load supported languages and configuration
  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const response = await api.get('/speech/languages/')
        setSupportedLanguages(response.data.languages)
      } catch (error) {
        console.error('Failed to load languages:', error)
        toast.error('Failed to load supported languages')
      }
    }

    const loadSpeechConfig = async () => {
      try {
        const response = await api.get(`/speech/config/${currentLanguage}/`)
        setSpeechConfig(response.data.speech_config)
      } catch (error) {
        console.error('Failed to load speech config:', error)
        toast.error('Failed to load speech configuration')
      }
    }

    loadLanguages()
    loadSpeechConfig()
  }, [currentLanguage])

  // Initialize speech recognition
  const initializeRecognition = useCallback(() => {
    if (!isSupported || !speechConfig) {
      console.log('Speech recognition not supported or config not loaded')
      return
    }

    console.log('Initializing speech recognition with config:', speechConfig)

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = speechConfig.continuous
    recognition.interimResults = speechConfig.interimResults
    recognition.lang = speechConfig.language
    recognition.maxAlternatives = speechConfig.maxAlternatives

    recognition.onstart = () => {
      console.log('Speech recognition started')
      setIsListening(true)
      setIsProcessing(false)
      onStart?.()
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      console.log('Speech recognition result:', event.results)
      let interimTranscript = ''
      let finalTranscript = finalTranscriptRef.current

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0].transcript
        const confidence = result[0].confidence || 0

        console.log('Result:', { transcript, confidence, isFinal: result.isFinal })

        if (result.isFinal) {
          finalTranscript += transcript
          finalTranscriptRef.current = finalTranscript
        } else {
          interimTranscript += transcript
        }

        const fullText = finalTranscript + interimTranscript
        setCurrentText(fullText)
        setConfidence(confidence)

        onResult?.({
          text: fullText,
          confidence,
          isFinal: result.isFinal
        })
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
      setIsProcessing(false)
      
      let errorMessage = 'Speech recognition failed'
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.'
          break
        case 'audio-capture':
          errorMessage = 'Microphone not accessible. Please check permissions.'
          break
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access.'
          break
        case 'network':
          errorMessage = 'Network error. Please check your connection.'
          break
        default:
          errorMessage = `Speech recognition error: ${event.error}`
      }
      
      onError?.(errorMessage)
      toast.error(errorMessage)
    }

    recognition.onend = () => {
      console.log('Speech recognition ended')
      setIsListening(false)
      setIsProcessing(false)
      onEnd?.()
    }

    recognitionRef.current = recognition
  }, [isSupported, speechConfig, onResult, onError, onStart, onEnd])

  // Start listening
  const startListening = useCallback(() => {
    if (!isSupported) {
      toast.error('Speech recognition is not supported in this browser')
      return
    }

    if (!speechConfig) {
      toast.error('Speech configuration not loaded')
      return
    }

    if (isListening) {
      console.log('Speech recognition already listening')
      return
    }

    try {
      // Only initialize if not already initialized
      if (!recognitionRef.current) {
        initializeRecognition()
      }
      
      if (recognitionRef.current) {
        recognitionRef.current.start()
        
        // Set timeout to auto-stop after 30 seconds
        timeoutRef.current = setTimeout(() => {
          console.log('Auto-stopping speech recognition after timeout')
          stopListening()
        }, 30000)
      }
    } catch (error) {
      console.error('Failed to start speech recognition:', error)
      toast.error('Failed to start speech recognition')
    }
  }, [isSupported, speechConfig, isListening, initializeRecognition])

  // Stop listening
  const stopListening = useCallback(() => {
    // Clear timeout if it exists
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
        console.log('Speech recognition stopped')
      } catch (error) {
        console.error('Error stopping speech recognition:', error)
      }
    }
  }, [])

  // Reset state
  const reset = useCallback(() => {
    setCurrentText('')
    setConfidence(0)
    finalTranscriptRef.current = ''
    setIsProcessing(false)
    setIsListening(false)
  }, [])

  // Cleanup recognition
  const cleanup = useCallback(() => {
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        console.error('Error stopping recognition during cleanup:', error)
      }
      recognitionRef.current = null
    }
  }, [])

  // Set language
  const setLanguage = useCallback((language: string) => {
    setCurrentLanguage(language)
    reset()
  }, [reset])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    isSupported,
    isListening,
    isProcessing,
    currentText,
    confidence,
    startListening,
    stopListening,
    reset,
    supportedLanguages,
    currentLanguage,
    setLanguage,
    speechConfig
  }
}

// Type declarations for browser APIs
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  [index: number]: SpeechRecognitionAlternative
  length: number
  item(index: number): SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}
