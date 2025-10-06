'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { GenericForm } from '@/components/GenericForm'
import { FormFieldWrapper } from '@/components/FormField'

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'reader' as 'reader' | 'requester' | 'translator',
    password: '',
    password_confirm: '',
  })
  const { register } = useAuth()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
              sign in to your existing account
            </Link>
          </p>
        </div>
        <GenericForm onSubmit={async () => await register(formData)} className="mt-8 space-y-6">
          {({ errors, loading, handleSubmit }) => (
            <>
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {errors.general}
                </div>
              )}
              
              <div className="space-y-4">
                <FormFieldWrapper fieldName="username" errors={errors}>
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                      Username
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      className="mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Username"
                      value={formData.username}
                      onChange={handleChange}
                    />
                  </div>
                </FormFieldWrapper>
                
                <FormFieldWrapper fieldName="email" errors={errors}>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Email address"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </FormFieldWrapper>

                <div className="grid grid-cols-2 gap-4">
                  <FormFieldWrapper fieldName="first_name" errors={errors}>
                    <div>
                      <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                        First name
                      </label>
                      <input
                        id="first_name"
                        name="first_name"
                        type="text"
                        required
                        className="mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="First name"
                        value={formData.first_name}
                        onChange={handleChange}
                      />
                    </div>
                  </FormFieldWrapper>
                  
                  <FormFieldWrapper fieldName="last_name" errors={errors}>
                    <div>
                      <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                        Last name
                      </label>
                      <input
                        id="last_name"
                        name="last_name"
                        type="text"
                        required
                        className="mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="Last name"
                        value={formData.last_name}
                        onChange={handleChange}
                      />
                    </div>
                  </FormFieldWrapper>
                </div>

                <FormFieldWrapper fieldName="role" errors={errors}>
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                      Account type
                    </label>
                    <select
                      id="role"
                      name="role"
                      required
                      className="mt-1 block w-full px-3 py-2 border bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={formData.role}
                      onChange={handleChange}
                    >
                      <option value="reader">Reader - Buy and read translated books</option>
                      <option value="requester">Requester - Request translations and fund projects</option>
                      <option value="translator">Translator - Provide translation services</option>
                    </select>
                  </div>
                </FormFieldWrapper>

                <FormFieldWrapper fieldName="password" errors={errors}>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      className="mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>
                </FormFieldWrapper>

                <FormFieldWrapper fieldName="password_confirm" errors={errors}>
                  <div>
                    <label htmlFor="password_confirm" className="block text-sm font-medium text-gray-700">
                      Confirm password
                    </label>
                    <input
                      id="password_confirm"
                      name="password_confirm"
                      type="password"
                      autoComplete="new-password"
                      required
                      className="mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Confirm password"
                      value={formData.password_confirm}
                      onChange={handleChange}
                    />
                  </div>
                </FormFieldWrapper>
          </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {loading ? 'Creating account...' : 'Create account'}
                  </button>
                </div>
            </>
          )}
        </GenericForm>
      </div>
    </div>
  )
}
