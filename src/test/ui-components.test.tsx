import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'
import { LoadingErrorProvider } from '../context/LoadingErrorProvider'
import { LoadingOverlay } from '../components/ui/LoadingOverlay'
import { ErrorToast } from '../components/ui/ErrorToast'
import { useLoadingError } from '../hooks/useLoadingError'
import { act } from '@testing-library/react'
import { useEffect } from 'react'



/** Helper component that triggers loading via context */
function LoadingTrigger({ shouldLoad }: { shouldLoad: boolean }) {
  const { startLoading, stopLoading } = useLoadingError()

  useEffect(() => {
    if (shouldLoad) {
      startLoading()
      return () => stopLoading()
    }
  }, [shouldLoad, startLoading, stopLoading])

  return null
}

/** Helper component that triggers an error via context */
function ErrorTrigger({ message, retry }: { message: string; retry?: () => void }) {
  const { addError } = useLoadingError()

  useEffect(() => {
    addError(message, retry)
  }, []) // intentionally run once

  return null
}

describe('LoadingOverlay', () => {
  it('does not render when not loading', () => {
    const { container } = render(
      <LoadingErrorProvider>
        <LoadingOverlay />
      </LoadingErrorProvider>,
    )

    expect(container.querySelector('.animate-spin')).toBeNull()
  })

  it('renders spinner when loading', () => {
    render(
      <LoadingErrorProvider>
        <LoadingTrigger shouldLoad={true} />
        <LoadingOverlay />
      </LoadingErrorProvider>,
    )

    expect(screen.getByText('Procesando…')).toBeInTheDocument()
  })
})

describe('ErrorToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not render when there are no errors', () => {
    const { container } = render(
      <LoadingErrorProvider>
        <ErrorToast />
      </LoadingErrorProvider>,
    )

    expect(container.querySelector('[role="alert"]')).toBeNull()
  })

  it('renders error message when an error is added', () => {
    render(
      <LoadingErrorProvider>
        <ErrorTrigger message="Connection failed" />
        <ErrorToast />
      </LoadingErrorProvider>,
    )

    expect(screen.getByText('Connection failed')).toBeInTheDocument()
  })

  it('shows retry button when error has a retry callback', () => {
    const retryFn = vi.fn()

    render(
      <LoadingErrorProvider>
        <ErrorTrigger message="Retry me" retry={retryFn} />
        <ErrorToast />
      </LoadingErrorProvider>,
    )

    expect(screen.getByText('Reintentar')).toBeInTheDocument()
  })

  it('does not show retry button when error has no retry callback', () => {
    render(
      <LoadingErrorProvider>
        <ErrorTrigger message="No retry" />
        <ErrorToast />
      </LoadingErrorProvider>,
    )

    expect(screen.queryByText('Reintentar')).toBeNull()
  })

  it('dismisses error when close button is clicked', async () => {
    render(
      <LoadingErrorProvider>
        <ErrorTrigger message="Closeable error" />
        <ErrorToast />
      </LoadingErrorProvider>,
    )

    expect(screen.getByText('Closeable error')).toBeInTheDocument()

    await act(async () => {
      screen.getByText('Cerrar').click()
    })

    expect(screen.queryByText('Closeable error')).toBeNull()
  })

  it('auto-dismisses errors after timeout', async () => {
    render(
      <LoadingErrorProvider>
        <ErrorTrigger message="Temporary" />
        <ErrorToast />
      </LoadingErrorProvider>,
    )

    expect(screen.getByText('Temporary')).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(6_000)
    })

    expect(screen.queryByText('Temporary')).toBeNull()
  })

  it('renders multiple errors simultaneously', () => {
    render(
      <LoadingErrorProvider>
        <ErrorTrigger message="Error A" />
        <ErrorTrigger message="Error B" />
        <ErrorToast />
      </LoadingErrorProvider>,
    )

    expect(screen.getByText('Error A')).toBeInTheDocument()
    expect(screen.getByText('Error B')).toBeInTheDocument()
  })
})
