import { useCallback, useContext } from 'react'
import { LoadingErrorContext, type LoadingErrorContextValue } from '../context/LoadingErrorContext'
import { monitor } from '../utils/monitor'

export function useLoadingError(): LoadingErrorContextValue {
  const context = useContext(LoadingErrorContext)
  if (!context) {
    throw new Error('useLoadingError must be used within LoadingErrorProvider')
  }
  return context
}

/**
 * Wraps an async operation with automatic loading/error handling + monitoring.
 *
 * Usage:
 * ```ts
 * const { run } = useApiOperation()
 * await run(() => projectsApi.create(payload), {
 *   operationName: 'createProject',
 *   errorMessage: 'No fue posible crear el proyecto.'
 * })
 * ```
 */
export function useApiOperation() {
  const { startLoading, stopLoading, addError } = useLoadingError()

  const run = useCallback(
    async <T>(
      operation: () => Promise<T>,
      options?: {
        /** Label for the monitor log. Defaults to 'unnamed_operation'. */
        operationName?: string
        errorMessage?: string
        retry?: () => void
      },
    ): Promise<T | null> => {
      const name = options?.operationName ?? 'unnamed_operation'
      startLoading()
      try {
        const result = await monitor.track(name, operation)
        return result
      } catch (error) {
        const message =
          options?.errorMessage ??
          (error instanceof Error ? error.message : 'Ocurrió un error inesperado.')
        addError(message, options?.retry)
        return null
      } finally {
        stopLoading()
      }
    },
    [startLoading, stopLoading, addError],
  )

  return { run }
}

