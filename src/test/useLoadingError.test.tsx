import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import type { ReactNode } from 'react'
import { LoadingErrorProvider } from '../context/LoadingErrorProvider'
import { useLoadingError, useApiOperation } from '../hooks/useLoadingError'

function wrapper({ children }: { children: ReactNode }) {
  return <LoadingErrorProvider>{children}</LoadingErrorProvider>
}

describe('useLoadingError', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with no loading and no errors', () => {
    const { result } = renderHook(() => useLoadingError(), { wrapper })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.activeOperations).toBe(0)
    expect(result.current.errors).toEqual([])
  })

  it('increments and decrements loading counter', () => {
    const { result } = renderHook(() => useLoadingError(), { wrapper })

    act(() => result.current.startLoading())
    expect(result.current.isLoading).toBe(true)
    expect(result.current.activeOperations).toBe(1)

    act(() => result.current.startLoading())
    expect(result.current.activeOperations).toBe(2)

    act(() => result.current.stopLoading())
    expect(result.current.isLoading).toBe(true)
    expect(result.current.activeOperations).toBe(1)

    act(() => result.current.stopLoading())
    expect(result.current.isLoading).toBe(false)
    expect(result.current.activeOperations).toBe(0)
  })

  it('does not go below zero on extra stopLoading calls', () => {
    const { result } = renderHook(() => useLoadingError(), { wrapper })

    act(() => result.current.stopLoading())
    act(() => result.current.stopLoading())

    expect(result.current.activeOperations).toBe(0)
    expect(result.current.isLoading).toBe(false)
  })

  it('adds an error to the queue', () => {
    const { result } = renderHook(() => useLoadingError(), { wrapper })

    act(() => result.current.addError('Something failed'))

    expect(result.current.errors).toHaveLength(1)
    expect(result.current.errors[0].message).toBe('Something failed')
  })

  it('supports multiple concurrent errors', () => {
    const { result } = renderHook(() => useLoadingError(), { wrapper })

    act(() => {
      result.current.addError('Error 1')
      result.current.addError('Error 2')
      result.current.addError('Error 3')
    })

    expect(result.current.errors).toHaveLength(3)
  })

  it('clears a specific error by id', () => {
    const { result } = renderHook(() => useLoadingError(), { wrapper })

    act(() => {
      result.current.addError('Error A')
      result.current.addError('Error B')
    })

    const idToRemove = result.current.errors[0].id

    act(() => result.current.clearError(idToRemove))

    expect(result.current.errors).toHaveLength(1)
    expect(result.current.errors[0].message).toBe('Error B')
  })

  it('clears all errors at once', () => {
    const { result } = renderHook(() => useLoadingError(), { wrapper })

    act(() => {
      result.current.addError('Error 1')
      result.current.addError('Error 2')
    })

    act(() => result.current.clearAllErrors())

    expect(result.current.errors).toEqual([])
  })

  it('auto-dismisses errors after 6 seconds', () => {
    const { result } = renderHook(() => useLoadingError(), { wrapper })

    act(() => result.current.addError('Temporary error'))
    expect(result.current.errors).toHaveLength(1)

    act(() => vi.advanceTimersByTime(5_999))
    expect(result.current.errors).toHaveLength(1)

    act(() => vi.advanceTimersByTime(1))
    expect(result.current.errors).toHaveLength(0)
  })

  it('stores retry callback on error entries', () => {
    const retryFn = vi.fn()
    const { result } = renderHook(() => useLoadingError(), { wrapper })

    act(() => result.current.addError('Retriable error', retryFn))

    expect(result.current.errors[0].retry).toBe(retryFn)
  })
})

describe('useApiOperation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns data on successful operation', async () => {
    const { result } = renderHook(
      () => ({ op: useApiOperation(), ctx: useLoadingError() }),
      { wrapper },
    )

    let data: string | null = null

    await act(async () => {
      data = await result.current.op.run(() => Promise.resolve('success'))
    })

    expect(data).toBe('success')
    expect(result.current.ctx.isLoading).toBe(false)
    expect(result.current.ctx.errors).toHaveLength(0)
  })

  it('returns null and adds error on failed operation', async () => {
    const { result } = renderHook(
      () => ({ op: useApiOperation(), ctx: useLoadingError() }),
      { wrapper },
    )

    let data: string | null = null

    await act(async () => {
      data = await result.current.op.run(
        () => Promise.reject(new Error('network fail')),
        { errorMessage: 'Custom error message' },
      )
    })

    expect(data).toBeNull()
    expect(result.current.ctx.isLoading).toBe(false)
    expect(result.current.ctx.errors).toHaveLength(1)
    expect(result.current.ctx.errors[0].message).toBe('Custom error message')
  })

  it('uses error.message when no custom errorMessage is provided', async () => {
    const { result } = renderHook(
      () => ({ op: useApiOperation(), ctx: useLoadingError() }),
      { wrapper },
    )

    await act(async () => {
      await result.current.op.run(() => Promise.reject(new Error('native error')))
    })

    expect(result.current.ctx.errors[0].message).toBe('native error')
  })

  it('manages loading state during operation', async () => {
    const { result } = renderHook(
      () => ({ op: useApiOperation(), ctx: useLoadingError() }),
      { wrapper },
    )

    let resolveOp: (value: string) => void
    const pendingOp = new Promise<string>((resolve) => { resolveOp = resolve })

    let runPromise: Promise<string | null>

    act(() => {
      runPromise = result.current.op.run(() => pendingOp)
    })

    // Loading should be true while operation is pending
    expect(result.current.ctx.isLoading).toBe(true)
    expect(result.current.ctx.activeOperations).toBe(1)

    await act(async () => {
      resolveOp!('done')
      await runPromise!
    })

    // Loading should be false after operation completes
    expect(result.current.ctx.isLoading).toBe(false)
    expect(result.current.ctx.activeOperations).toBe(0)
  })

  it('handles concurrent operations correctly', async () => {
    const { result } = renderHook(
      () => ({ op: useApiOperation(), ctx: useLoadingError() }),
      { wrapper },
    )

    let resolve1: (v: string) => void
    let resolve2: (v: string) => void
    const op1 = new Promise<string>((r) => { resolve1 = r })
    const op2 = new Promise<string>((r) => { resolve2 = r })

    let promise1: Promise<string | null>
    let promise2: Promise<string | null>

    act(() => {
      promise1 = result.current.op.run(() => op1)
      promise2 = result.current.op.run(() => op2)
    })

    expect(result.current.ctx.activeOperations).toBe(2)

    // Complete first operation — still loading because op2 is pending
    await act(async () => {
      resolve1!('result1')
      await promise1!
    })

    expect(result.current.ctx.activeOperations).toBe(1)
    expect(result.current.ctx.isLoading).toBe(true)

    // Complete second operation — now fully done
    await act(async () => {
      resolve2!('result2')
      await promise2!
    })

    expect(result.current.ctx.activeOperations).toBe(0)
    expect(result.current.ctx.isLoading).toBe(false)
  })
})
