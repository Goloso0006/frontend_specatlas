import { useCallback, useEffect, useRef, useState } from 'react'
import { useApiOperation } from './useLoadingError'

interface ResourceLoaderOptions<T> {
  errorMessage?: string
  onSuccess?: (data: T) => void
}

export function useResourceLoader<T, TArgs extends unknown[]>(
  loader: (...args: TArgs) => Promise<T>,
  options?: ResourceLoaderOptions<T>,
) {
  const { run, isLoading } = useApiOperation()
  const [data, setData] = useState<T | null>(null)

  // Keep a stable ref to the latest loader/options so the `load` callback
  // identity never changes even if the caller recreates the function inline.
  const loaderRef = useRef(loader)
  const errorMessageRef = useRef(options?.errorMessage)
  const onSuccessRef = useRef(options?.onSuccess)

  // Update refs on every render so they always point to the latest values.
  loaderRef.current = loader
  errorMessageRef.current = options?.errorMessage
  onSuccessRef.current = options?.onSuccess

  const load = useCallback(
    async (...args: TArgs) => {
      const result = await run(() => loaderRef.current(...args), {
        errorMessage: errorMessageRef.current,
      })

      if (result !== null) {
        setData(result)
        onSuccessRef.current?.(result)
      }

      return result
    },
    // `run` is stable (comes from useCallback inside useApiOperation).
    // `load` itself is now stable across renders.
    [run],
  )

  const reset = useCallback(() => {
    setData(null)
  }, [])

  return {
    data,
    isLoading,
    load,
    reset,
    setData,
  }
}

export function useAutoResourceLoader<T, TArgs extends unknown[]>(
  loader: (...args: TArgs) => Promise<T>,
  args: TArgs | null,
  options?: ResourceLoaderOptions<T>,
) {
  const resource = useResourceLoader(loader, options)

  // Keep a stable ref to `load` so the effect does NOT re-run when the
  // `resource` object identity changes between renders.
  const loadRef = useRef(resource.load)
  loadRef.current = resource.load

  // Serialize args to a primitive key so the effect only re-fires when the
  // actual argument VALUES change (e.g. a different projectId), not when the
  // args array is recreated with the same contents.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const argsKey = args ? JSON.stringify(args) : null

  useEffect(() => {
    if (!args) return

    let cancelled = false

    const run = async () => {
      if (import.meta.env.DEV) {
        console.debug('[useAutoResourceLoader] loading', argsKey)
      }
      await loadRef.current(...args)
      if (cancelled) return
    }

    void run()

    return () => {
      cancelled = true
    }
    // argsKey is a stable string — effect only re-runs when projectId (or other
    // arg values) actually changes. `args` is intentionally excluded to avoid
    // re-triggering on array identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [argsKey])

  return resource
}