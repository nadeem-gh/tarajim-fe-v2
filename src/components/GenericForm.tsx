import React from 'react'
import { useFormErrors, FormErrors } from '@/hooks/useFormErrors'
import { createFormHandler } from '@/utils/errorHandling'

interface GenericFormProps {
  onSubmit: () => Promise<void>
  children: (props: {
    errors: FormErrors
    loading: boolean
    handleSubmit: (e: React.FormEvent) => void
    setErrors: (errors: FormErrors) => void
    clearErrors: () => void
    setFieldError: (field: string, error: string) => void
    clearFieldError: (field: string) => void
    hasErrors: boolean
    getFieldError: (field: string) => string | undefined
  }) => React.ReactNode
  className?: string
}

export function GenericForm({ onSubmit, children, className = '' }: GenericFormProps) {
  const {
    errors,
    setErrors,
    clearErrors,
    setFieldError,
    clearFieldError,
    hasErrors,
    getFieldError
  } = useFormErrors()

  const [loading, setLoading] = React.useState(false)

  const handleSubmit = createFormHandler(onSubmit, setLoading, setErrors)

  return (
    <form className={className} onSubmit={handleSubmit}>
      {children({
        errors,
        loading,
        handleSubmit,
        setErrors,
        clearErrors,
        setFieldError,
        clearFieldError,
        hasErrors,
        getFieldError
      })}
    </form>
  )
}
