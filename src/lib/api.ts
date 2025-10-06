import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh and error formatting
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/accounts/token/refresh/`, {
            refresh: refreshToken
          })
          
          const { access } = response.data
          localStorage.setItem('access_token', access)
          api.defaults.headers.common['Authorization'] = `Bearer ${access}`
          
          return api(originalRequest)
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
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

    return Promise.reject(error)
  }
)

export default api
