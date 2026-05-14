import { useCallback, useEffect, useState } from 'react'
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

  const load = useCallback(
    async (...args: TArgs) => {
      const result = await run(() => loader(...args), {
        errorMessage: options?.errorMessage,
      })

      if (result !== null) {
        setData(result)
        options?.onSuccess?.(result)
      }

      return result
    },
    [loader, options?.errorMessage, options?.onSuccess, run],
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

  useEffect(() => {
    if (!args) return
    void resource.load(...args)
  }, [args, resource])

  return resource
}