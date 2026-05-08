import { useEffect, useRef } from 'react'

interface UseIdleLogoutOptions {
  isAuthenticated: boolean
  timeoutMs: number
  onIdle: () => void
}

const EVENTS = [
  'mousemove',
  'keydown',
  'click',
  'scroll',
  'touchstart',
  'pointerdown',
]

export function useIdleLogout({
  isAuthenticated,
  timeoutMs,
  onIdle,
}: UseIdleLogoutOptions) {
  const timeoutIdRef = useRef<number | null>(null)
  const onIdleRef = useRef(onIdle)

  // Keep callback reference updated
  useEffect(() => {
    onIdleRef.current = onIdle
  }, [onIdle])

  useEffect(() => {
    // If not authenticated, we don't track idle time
    if (!isAuthenticated) {
      if (timeoutIdRef.current) {
        window.clearTimeout(timeoutIdRef.current)
        timeoutIdRef.current = null
      }
      return
    }

    const handleActivity = () => {
      if (timeoutIdRef.current) {
        window.clearTimeout(timeoutIdRef.current)
      }
      timeoutIdRef.current = window.setTimeout(() => {
        onIdleRef.current()
      }, timeoutMs)
    }

    // Initialize timer
    handleActivity()

    // Add listeners
    EVENTS.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    // Cleanup
    return () => {
      if (timeoutIdRef.current) {
        window.clearTimeout(timeoutIdRef.current)
        timeoutIdRef.current = null
      }
      EVENTS.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [isAuthenticated, timeoutMs])
}
