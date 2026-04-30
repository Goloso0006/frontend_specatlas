import { createContext } from 'react'

export interface ErrorEntry {
  id: string
  message: string
  timestamp: number
  retry?: () => void
}

export interface LoadingErrorContextValue {
  /** Whether any async operation is currently in progress. */
  isLoading: boolean
  /** Number of concurrent operations in progress. */
  activeOperations: number
  /** Queue of active errors. */
  errors: ErrorEntry[]
  /** Signal that an async operation has started. */
  startLoading: () => void
  /** Signal that an async operation has finished. */
  stopLoading: () => void
  /** Push a new error to the queue. Auto-dismissed after timeout. */
  addError: (message: string, retry?: () => void) => void
  /** Manually dismiss an error by id. */
  clearError: (id: string) => void
  /** Dismiss all errors at once. */
  clearAllErrors: () => void
}

export const LoadingErrorContext = createContext<LoadingErrorContextValue | null>(null)
