import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { LoadingErrorContext, type ErrorEntry, type LoadingErrorContextValue } from './LoadingErrorContext'

/** How long (ms) an error stays visible before auto-dismissing. */
const AUTO_DISMISS_MS = 6_000

export function LoadingErrorProvider({ children }: { children: ReactNode }) {
  const [activeOperations, setActiveOperations] = useState(0)
  const [errors, setErrors] = useState<ErrorEntry[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const isLoading = activeOperations > 0

  const startLoading = useCallback((): void => {
    setActiveOperations((count) => count + 1)
  }, [])

  const stopLoading = useCallback((): void => {
    setActiveOperations((count) => Math.max(0, count - 1))
  }, [])

  const clearError = useCallback((id: string): void => {
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
    setErrors((current) => current.filter((entry) => entry.id !== id))
  }, [])

  const addError = useCallback((message: string, retry?: () => void): void => {
    const id = `err_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`

    const entry: ErrorEntry = {
      id,
      message,
      timestamp: Date.now(),
      retry,
    }

    setErrors((current) => [...current, entry])

    const timer = setTimeout(() => {
      timersRef.current.delete(id)
      setErrors((current) => current.filter((e) => e.id !== id))
    }, AUTO_DISMISS_MS)

    timersRef.current.set(id, timer)
  }, [])

  const clearAllErrors = useCallback((): void => {
    for (const timer of timersRef.current.values()) {
      clearTimeout(timer)
    }
    timersRef.current.clear()
    setErrors([])
  }, [])

  const value = useMemo<LoadingErrorContextValue>(
    () => ({
      isLoading,
      activeOperations,
      errors,
      startLoading,
      stopLoading,
      addError,
      clearError,
      clearAllErrors,
    }),
    [isLoading, activeOperations, errors, startLoading, stopLoading, addError, clearError, clearAllErrors],
  )

  return (
    <LoadingErrorContext.Provider value={value}>
      {children}
    </LoadingErrorContext.Provider>
  )
}
