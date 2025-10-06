import React from 'react'
import { FormErrors } from '@/hooks/useFormErrors'

interface FormFieldProps {
  children: React.ReactNode
  fieldName: string
  errors: FormErrors
  className?: string
}

export function FormField({ children, fieldName, errors, className = '' }: FormFieldProps) {
  const hasError = errors[fieldName]
  
  return (
    <div className={className}>
      {children}
      {hasError && (
        <p className="mt-1 text-sm text-red-600">{hasError}</p>
      )}
    </div>
  )
}

interface FormFieldWrapperProps {
  children: React.ReactNode
  fieldName: string
  errors: FormErrors
  className?: string
}

export function FormFieldWrapper({ children, fieldName, errors, className = '' }: FormFieldWrapperProps) {
  const hasError = errors[fieldName]
  
  return (
    <div className={className}>
      {React.cloneElement(children as React.ReactElement, {
        className: `${(children as React.ReactElement).props.className || ''} ${
          hasError ? 'border-red-300' : 'border-gray-300'
        }`
      })}
      {hasError && (
        <p className="mt-1 text-sm text-red-600">{hasError}</p>
      )}
    </div>
  )
}
