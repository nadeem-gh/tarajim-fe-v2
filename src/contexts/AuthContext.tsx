'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api, setGlobalLogout } from '@/lib/api'
import toast from 'react-hot-toast'

interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: 'reader' | 'requester' | 'translator'
  is_verified: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => void
  updateProfile: (profileData: any) => Promise<void>
}

interface RegisterData {
  username: string
  email: string
  first_name: string
  last_name: string
  role: 'reader' | 'requester' | 'translator'
  password: string
  password_confirm: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const refreshToken = localStorage.getItem('refresh_token')
      console.log('Checking auth with token:', token ? 'Token exists' : 'No token')
      console.log('Refresh token exists:', refreshToken ? 'Yes' : 'No')
      
      if (token && refreshToken) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        const response = await api.get('/accounts/stats/')
        console.log('Auth check successful:', response.data.user)
        setUser(response.data.user)
      } else {
        console.log('No valid tokens found, clearing auth state')
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        delete api.defaults.headers.common['Authorization']
        setUser(null)
      }
    } catch (error: any) {
      console.log('Auth check failed:', error.response?.status, error.message)
      
      // Clear tokens and reset auth state
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      delete api.defaults.headers.common['Authorization']
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/accounts/login/', { email, password })
      const { user, tokens } = response.data
      
      localStorage.setItem('access_token', tokens.access)
      localStorage.setItem('refresh_token', tokens.refresh)
      api.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`
      
      setUser(user)
      toast.success('Login successful!')
      router.push('/dashboard')
    } catch (error: any) {
      // Show generic error in toast
      toast.error('Login failed. Please check your credentials.')
      throw error
    }
  }

  const register = async (userData: RegisterData) => {
    try {
      const response = await api.post('/accounts/register/', userData)
      const { user, tokens } = response.data
      
      localStorage.setItem('access_token', tokens.access)
      localStorage.setItem('refresh_token', tokens.refresh)
      api.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`
      
      setUser(user)
      toast.success('Registration successful!')
      router.push('/dashboard')
    } catch (error: any) {
      // Show generic error in toast
      toast.error('Registration failed. Please check your information.')
      throw error
    }
  }

  const logout = useCallback(() => {
    console.log('AuthContext: Logout function called')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    router.push('/')
    toast.success('Logged out successfully')
  }, [router])

  // Register logout function with API interceptor
  useEffect(() => {
    console.log('AuthContext: Registering global logout function')
    setGlobalLogout(logout)
  }, [logout])

  const updateProfile = async (profileData: any) => {
    try {
      const response = await api.patch('/accounts/profile/', profileData)
      setUser(response.data.user)
      toast.success('Profile updated successfully')
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 
                         error.response?.data?.message || 
                         'Profile update failed'
      toast.error(errorMessage)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
