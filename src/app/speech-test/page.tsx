'use client'

import { useState } from 'react'
import SpeechToTextButton from '../workspace/components/SpeechToTextButton'
import { useQuery } from 'react-query'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

export default function SpeechTestPage() {
  const [transcription, setTranscription] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('ur')

  // Fetch supported languages
  const { data: languagesData } = useQuery(
    'supportedLanguages',
    async () => {
      const response = await api.get('/speech/languages/')
      return response.data
    },
    {
      onError: (error: any) => {
        toast.error('Failed to load supported languages')
        console.error('Error fetching languages:', error)
      }
    }
  )

  // Fetch language configuration
  const { data: languageConfig } = useQuery(
    ['languageConfig', selectedLanguage],
    async () => {
      const response = await api.get(`/speech/config/${selectedLanguage}/`)
      return response.data
    },
    {
      enabled: !!selectedLanguage,
      onError: (error: any) => {
        toast.error('Failed to load language configuration')
        console.error('Error fetching language config:', error)
      }
    }
  )

  const handleTranscription = (text: string) => {
    setTranscription(text)
    toast.success('Transcription received!')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Speech-to-Text Test Page
            </h1>
            <p className="text-gray-600">
              Test the speech-to-text functionality with multiple language support
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Language Selection */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Language Configuration
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Language
                    </label>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {languagesData?.languages?.map((lang: any) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name} ({lang.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {languageConfig && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        Language Configuration
                      </h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div><strong>Name:</strong> {languageConfig.language_config?.name}</div>
                        <div><strong>Code:</strong> {languageConfig.language_config?.code}</div>
                        <div><strong>RTL:</strong> {languageConfig.language_config?.rtl ? 'Yes' : 'No'}</div>
                        <div><strong>Speech Recognition:</strong> {languageConfig.speech_config?.language}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Speech-to-Text Component */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Speech-to-Text
                </h2>
                <SpeechToTextButton
                  onTranscription={handleTranscription}
                  language={selectedLanguage}
                  className="w-full"
                />
              </div>
            </div>

            {/* Transcription Results */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Transcription Results
                </h2>
                
                <div className="bg-gray-50 p-4 rounded-lg min-h-[200px]">
                  {transcription ? (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        <strong>Language:</strong> {selectedLanguage}
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Transcription:</strong>
                      </div>
                      <div className="p-3 bg-white rounded border text-gray-900">
                        {transcription}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <p>No transcription yet.</p>
                      <p className="text-sm mt-1">Click "Start Speech to Text" to begin recording.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* API Status */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  API Status
                </h2>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${languagesData ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-gray-600">
                      Languages API: {languagesData ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${languageConfig ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-gray-600">
                      Language Config API: {languageConfig ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              How to Test Speech-to-Text
            </h3>
            <ol className="list-decimal list-inside text-blue-800 space-y-1">
              <li>Select your preferred language from the dropdown</li>
              <li>Click "Start Speech to Text" button</li>
              <li>Allow microphone permissions when prompted</li>
              <li>Speak clearly in the selected language</li>
              <li>Click "Stop Recording" when finished</li>
              <li>Review the transcription results</li>
            </ol>
            <div className="mt-4 p-3 bg-blue-100 rounded text-blue-800 text-sm">
              <strong>Note:</strong> Speech recognition works best in Chrome and Edge browsers. 
              Make sure you have a working microphone and speak clearly.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
