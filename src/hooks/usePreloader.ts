import { useEffect, useState } from 'react'

export default function usePreloader(options?: { textSpeed?: number; iterations?: number; holdMs?: number; fadeMs?: number }) {
  const preloaderTextSpeed = options?.textSpeed ?? 45
  const preloaderTextIterations = options?.iterations ?? 30
  const preloaderHoldMs = options?.holdMs ?? 900
  const preloaderFadeMs = options?.fadeMs ?? 700

  const [show, setShow] = useState(true)
  const [hide, setHide] = useState(false)

  useEffect(() => {
    const textDuration = preloaderTextSpeed * preloaderTextIterations
    const showDuration = textDuration + preloaderHoldMs

    const startFadeTimer = window.setTimeout(() => setHide(true), showDuration)
    const removeTimer = window.setTimeout(() => setShow(false), showDuration + preloaderFadeMs)

    return () => {
      window.clearTimeout(startFadeTimer)
      window.clearTimeout(removeTimer)
    }
  }, [preloaderTextSpeed, preloaderTextIterations, preloaderHoldMs, preloaderFadeMs])

  return { show, hide }
}
