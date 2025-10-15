'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export interface AudioChunk {
  blob: Blob
  index: number
  timestamp: number
}

export interface UseAudioRecorderOptions {
  chunkInterval?: number // milliseconds between chunks
  audioFormat?: string // MIME type for audio format
  onChunkReady?: (chunk: AudioChunk) => void
  onError?: (error: string) => void
  onStart?: () => void
  onStop?: () => void
}

export interface UseAudioRecorderReturn {
  isRecording: boolean
  isSupported: boolean
  audioChunks: AudioChunk[]
  error: string | null
  startRecording: (chunkInterval?: number) => Promise<void>
  stopRecording: () => void
  clearChunks: () => void
  getTotalDuration: () => number
}

export function useAudioRecorder({
  chunkInterval = 1000, // 1 second default
  audioFormat = 'audio/webm;codecs=opus',
  onChunkReady,
  onError,
  onStart,
  onStop
}: UseAudioRecorderOptions = {}): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [audioChunks, setAudioChunks] = useState<AudioChunk[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunkIndexRef = useRef(0)
  const startTimeRef = useRef<number | null>(null)

  // Check if MediaRecorder is supported
  useEffect(() => {
    const checkSupport = () => {
      const supported = !!(
        navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia &&
        window.MediaRecorder
      )
      setIsSupported(supported)
      
      if (!supported) {
        setError('Audio recording is not supported in this browser')
      }
    }

    checkSupport()
  }, [])

  const startRecording = useCallback(async (customChunkInterval?: number) => {
    if (!isSupported) {
      const errorMsg = 'Audio recording is not supported'
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    if (isRecording) {
      console.warn('Recording is already in progress')
      return
    }

    try {
      setError(null)
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      })
      
      streamRef.current = stream
      startTimeRef.current = Date.now()
      chunkIndexRef.current = 0
      setAudioChunks([])

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: audioFormat
      })
      
      mediaRecorderRef.current = mediaRecorder

      // Handle data available event (chunk ready)
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          const chunk: AudioChunk = {
            blob: event.data,
            index: chunkIndexRef.current++,
            timestamp: Date.now()
          }
          
          setAudioChunks(prev => [...prev, chunk])
          onChunkReady?.(chunk)
        }
      }

      // Handle recording stop
      mediaRecorder.onstop = () => {
        setIsRecording(false)
        onStop?.()
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
      }

      // Handle errors
      mediaRecorder.onerror = (event) => {
        const errorMsg = `Recording error: ${event.error}`
        setError(errorMsg)
        onError?.(errorMsg)
        setIsRecording(false)
      }

      // Start recording with chunk interval
      const interval = customChunkInterval || chunkInterval
      mediaRecorder.start(interval)
      setIsRecording(true)
      onStart?.()

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start recording'
      setError(errorMsg)
      onError?.(errorMsg)
      console.error('Failed to start audio recording:', err)
    }
  }, [isSupported, isRecording, chunkInterval, audioFormat, onChunkReady, onError, onStart, onStop])

  const stopRecording = useCallback(() => {
    if (!isRecording || !mediaRecorderRef.current) {
      return
    }

    try {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    } catch (err) {
      console.error('Error stopping recording:', err)
      setError('Failed to stop recording')
    }
  }, [isRecording])

  const clearChunks = useCallback(() => {
    setAudioChunks([])
    chunkIndexRef.current = 0
  }, [])

  const getTotalDuration = useCallback(() => {
    if (!startTimeRef.current) return 0
    return Date.now() - startTimeRef.current
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [isRecording])

  return {
    isRecording,
    isSupported,
    audioChunks,
    error,
    startRecording,
    stopRecording,
    clearChunks,
    getTotalDuration
  }
}
