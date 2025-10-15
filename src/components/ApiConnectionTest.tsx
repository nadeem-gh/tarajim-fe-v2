'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

export default function ApiConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'error'>('testing')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test basic API connection
        const response = await api.get('/accounts/stats/')
        setConnectionStatus('connected')
      } catch (err: any) {
        setConnectionStatus('error')
        if (err.response?.status === 401) {
          setError('Authentication required - please log in')
        } else if (err.response?.status === 404) {
          setError('API endpoint not found')
        } else if (err.code === 'ECONNREFUSED') {
          setError('Backend server is not running')
        } else if (err.message?.includes('CORS')) {
          setError('CORS error - check backend CORS settings')
        } else {
          setError(`Connection failed: ${err.message}`)
        }
      }
    }

    testConnection()
  }, [])

  if (connectionStatus === 'testing') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <div className="animate-spin h-5 w-5 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Testing API Connection</h3>
            <p className="mt-1 text-sm text-yellow-700">Checking connection to backend server...</p>
          </div>
        </div>
      </div>
    )
  }

  if (connectionStatus === 'connected') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <div className="h-5 w-5 bg-green-400 rounded-full"></div>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">API Connected</h3>
            <p className="mt-1 text-sm text-green-700">Backend server is running and accessible.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <div className="h-5 w-5 bg-red-400 rounded-full"></div>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">API Connection Failed</h3>
          <p className="mt-1 text-sm text-red-700">{error}</p>
          <div className="mt-2">
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-red-600 hover:text-red-500 underline"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
