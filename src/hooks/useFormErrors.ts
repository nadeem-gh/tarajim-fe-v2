import { useState } from 'react'

export interface FormErrors {
  [key: string]: string
}

export interface UseFormErrorsReturn {
  errors: FormErrors
  setErrors: (errors: FormErrors) => void
  clearErrors: () => void
  setFieldError: (field: string, error: string) => void
  clearFieldError: (field: string) => void
  hasErrors: boolean
  getFieldError: (field: string) => string | undefined
}

export function useFormErrors(): UseFormErrorsReturn {
  const [errors, setErrors] = useState<FormErrors>({})

  const clearErrors = () => {
    setErrors({})
  }

  const setFieldError = (field: string, error: string) => {
    setErrors(prev => ({
      ...prev,
      [field]: error
    }))
  }

  const clearFieldError = (field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }

  const hasErrors = Object.keys(errors).length > 0

  const getFieldError = (field: string) => {
    return errors[field]
  }

  return {
    errors,
    setErrors,
    clearErrors,
    setFieldError,
    clearFieldError,
    hasErrors,
    getFieldError
  }
}
