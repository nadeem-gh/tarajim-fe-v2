'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
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
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        const response = await api.get('/accounts/stats/')
        setUser(response.data.user)
      }
    } catch (error) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
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
      toast.error(error.response?.data?.error || 'Login failed')
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
      toast.error(error.response?.data?.error || 'Registration failed')
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    router.push('/')
    toast.success('Logged out successfully')
  }

  const updateProfile = async (profileData: any) => {
    try {
      const response = await api.patch('/accounts/profile/', profileData)
      setUser(response.data.user)
      toast.success('Profile updated successfully')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Profile update failed')
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
