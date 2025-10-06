import { FormErrors } from '@/hooks/useFormErrors'

export interface ApiErrorResponse {
  error?: {
    field_errors?: { [key: string]: string[] | string }
    message?: string
    type?: string
    code?: string
  }
  non_field_errors?: string[] | string
  [key: string]: any
}

/**
 * Parses API error responses and extracts field-specific errors
 * @param errorResponse - The error response from the API
 * @returns Object containing field-specific errors
 */
export function parseApiErrors(errorResponse: ApiErrorResponse): FormErrors {
  const fieldErrors: FormErrors = {}

  console.log('Error response data:', errorResponse) // Debug log

  // Handle custom error format from our error handler
  if (errorResponse.error) {
    console.log('Error object:', errorResponse.error) // Debug log

    // Check for field_errors first (new format)
    if (errorResponse.error.field_errors) {
      console.log('Found field_errors:', errorResponse.error.field_errors) // Debug log
      Object.keys(errorResponse.error.field_errors).forEach(field => {
        const fieldError = errorResponse.error!.field_errors![field]
        if (Array.isArray(fieldError)) {
          fieldErrors[field] = fieldError[0]
        } else if (typeof fieldError === 'string') {
          fieldErrors[field] = fieldError
        }
      })
    }
    // Handle error message format (legacy) - parse the string representation
    else if (errorResponse.error.message) {
      console.log('Error message:', errorResponse.error.message) // Debug log
      try {
        // The message contains a string representation of the error dict
        const errorMessage = errorResponse.error.message

        // Try to extract field errors from the string representation
        // Format: "{'password': [ErrorDetail(string='This password is too common.', code='password_too_common')]}"
        if (typeof errorMessage === 'string') {
          // Use regex to extract field errors from the string
          const fieldErrorRegex = /'([^']+)':\s*\[([^\]]+)\]/g
          let match

          while ((match = fieldErrorRegex.exec(errorMessage)) !== null) {
            const fieldName = match[1]
            const errorDetails = match[2]

            // Extract the actual error message from ErrorDetail
            const messageMatch = errorDetails.match(/string='([^']+)'/)
            if (messageMatch) {
              fieldErrors[fieldName] = messageMatch[1]
            }
          }

          // If no field errors were extracted, treat as general error
          if (Object.keys(fieldErrors).length === 0) {
            fieldErrors['general'] = errorMessage
          }
        }
      } catch (parseError) {
        console.log('Parse error:', parseError) // Debug log
        // If parsing fails, treat as general error
        fieldErrors['general'] = errorResponse.error.message
      }
    }
  }
  // Handle standard Django REST Framework validation errors
  else if (errorResponse.non_field_errors) {
    fieldErrors['general'] = Array.isArray(errorResponse.non_field_errors)
      ? errorResponse.non_field_errors[0]
      : errorResponse.non_field_errors
  }
  // Handle direct field errors
  else {
    Object.keys(errorResponse).forEach(field => {
      if (field !== 'non_field_errors' && field !== 'error') {
        const fieldError = errorResponse[field]
        if (Array.isArray(fieldError)) {
          fieldErrors[field] = fieldError[0]
        } else if (typeof fieldError === 'string') {
          fieldErrors[field] = fieldError
        }
      }
    })
  }

  console.log('Final field errors:', fieldErrors) // Debug log
  return fieldErrors
}

/**
 * Handles API errors and extracts field-specific errors
 * @param error - The error object from the API call
 * @param setErrors - Function to set the form errors
 */
export function handleApiError(error: any, setErrors: (errors: FormErrors) => void) {
  if (error.response?.data) {
    const fieldErrors = parseApiErrors(error.response.data)
    setErrors(fieldErrors)
  }
}

/**
 * Creates a generic form submission handler with error handling
 * @param submitFn - The function to call for form submission
 * @param setLoading - Function to set loading state
 * @param setErrors - Function to set form errors
 * @returns Function that handles form submission with error handling
 */
export function createFormHandler<T>(
  submitFn: () => Promise<void>,
  setLoading: (loading: boolean) => void,
  setErrors: (errors: FormErrors) => void
) {
  return async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      await submitFn()
    } catch (error: any) {
      handleApiError(error, setErrors)
    } finally {
      setLoading(false)
    }
  }
}
