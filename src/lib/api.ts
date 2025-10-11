import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

// Global refresh token promise to prevent multiple simultaneous refresh attempts
let refreshTokenPromise: Promise<any> | null = null

// Global logout function to be set by AuthContext
let globalLogout: (() => void) | null = null

export const setGlobalLogout = (logoutFn: () => void) => {
  console.log('API: Setting global logout function')
  globalLogout = logoutFn
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    console.log('API Request Interceptor - Original config:', {
      url: config.url,
      method: config.method,
      data: config.data,
      headers: config.headers
    })
    
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    console.log('API Request Interceptor - Modified config:', {
      url: config.url,
      method: config.method,
      data: config.data,
      headers: config.headers
    })
    
    return config
  },
  (error) => {
    console.error('API Request Interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh and error formatting
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('API Interceptor: 401 error detected, attempting token refresh')
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        console.log('API Interceptor: Refresh token exists:', !!refreshToken)
        
        if (refreshToken) {
          // Check if a refresh is already in progress
          if (refreshTokenPromise) {
            console.log('API Interceptor: Refresh already in progress, waiting...')
            await refreshTokenPromise
            // Update the original request with the new token from the ongoing refresh
            const newToken = localStorage.getItem('access_token')
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`
              return api(originalRequest)
            }
          } else {
            // Start a new refresh attempt
            refreshTokenPromise = axios.post(`${API_URL}/accounts/token/refresh/`, {
              refresh: refreshToken
            })
            
            const response = await refreshTokenPromise
            const { access, refresh: newRefreshToken } = response.data
            
            console.log('API Interceptor: Token refresh successful')
            console.log('API Interceptor: Response data:', response.data)
            console.log('API Interceptor: New refresh token received:', !!newRefreshToken)
            
            // Save both access and refresh tokens
            localStorage.setItem('access_token', access)
            if (newRefreshToken) {
              localStorage.setItem('refresh_token', newRefreshToken)
              console.log('API Interceptor: New refresh token saved')
            }
            
            api.defaults.headers.common['Authorization'] = `Bearer ${access}`
            
            // Update the original request with the new token
            originalRequest.headers.Authorization = `Bearer ${access}`
            
            return api(originalRequest)
          }
        } else {
          console.log('API Interceptor: No refresh token available')
          // No refresh token available, logout immediately
          if (globalLogout) {
            console.log('API Interceptor: Using global logout function (no refresh token)')
            try {
              globalLogout()
            } catch (logoutError) {
              console.error('API Interceptor: Error calling global logout:', logoutError)
              // Fallback to direct redirect
              if (window.location.pathname !== '/login') {
                window.location.href = '/login'
              }
            }
          } else {
            console.log('API Interceptor: No global logout function available, redirecting directly')
            if (window.location.pathname !== '/login') {
              window.location.href = '/login'
            }
          }
        }
      } catch (refreshError) {
        console.log('API Interceptor: Token refresh failed:', refreshError)
        // Clear tokens and use global logout function if available
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        delete api.defaults.headers.common['Authorization']
        
        // Use global logout function if available, otherwise redirect
        if (globalLogout) {
          console.log('API Interceptor: Using global logout function')
          try {
            globalLogout()
          } catch (logoutError) {
            console.error('API Interceptor: Error calling global logout:', logoutError)
            // Fallback to direct redirect
            if (window.location.pathname !== '/login') {
              window.location.href = '/login'
            }
          }
        } else {
          console.log('API Interceptor: No global logout function available, redirecting directly')
          if (window.location.pathname !== '/login') {
            window.location.href = '/login'
          }
        }
      } finally {
        // Clear the refresh promise after completion
        refreshTokenPromise = null
      }
    }

    // Handle 500 errors - ensure we have proper error structure
    if (error.response?.status >= 500) {
      // If the response is HTML (Django's default 500 page), create a proper error structure
      if (error.response.headers['content-type']?.includes('text/html')) {
        error.response.data = {
          error: {
            type: 'InternalServerError',
            message: 'An internal server error occurred',
            details: 'Please try again later'
          }
        }
      }
    }

    // Ensure error response data is properly formatted
    if (error.response?.data && typeof error.response.data === 'object') {
      // If the error data is an object with type, message, details, ensure it's properly structured
      if (error.response.data.type && error.response.data.message) {
        error.response.data = {
          error: {
            type: error.response.data.type,
            message: error.response.data.message,
            details: error.response.data.details || error.response.data.message
          }
        }
      }
    }

    return Promise.reject(error)
  }
)

export default api
