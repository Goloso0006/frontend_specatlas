import { useEffect, useMemo, useState } from 'react'

interface TypewriterProps {
  texts: string[]
  speed?: number
  deleteSpeed?: number
  pause?: number
  className?: string
}

export default function Typewriter({
  texts,
  speed = 100,
  deleteSpeed = 50,
  pause = 2000,
  className = ''
}: TypewriterProps) {
  const [index, setIndex] = useState(0)
  const [subIndex, setSubIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  const maxLen = useMemo(() => {
    return texts.reduce((max, t) => Math.max(max, t.length), 0)
  }, [texts])

  useEffect(() => {
    if (!texts || texts.length === 0) return

    let timeout: ReturnType<typeof setTimeout>

    // finished typing current
    if (!isDeleting && subIndex === texts[index].length) {
      timeout = setTimeout(() => setIsDeleting(true), pause)
    } else if (isDeleting && subIndex === 0) {
      // finished deleting, move to next
      timeout = setTimeout(() => {
        setIsDeleting(false)
        setIndex((i) => (i + 1) % texts.length)
      }, speed)
    } else {
      timeout = setTimeout(() => {
        setSubIndex((s) => s + (isDeleting ? -1 : 1))
      }, isDeleting ? deleteSpeed : speed)
    }

    return () => clearTimeout(timeout)
  }, [subIndex, isDeleting, index, texts, speed, deleteSpeed, pause])

  const display = texts[index].slice(0, Math.max(0, subIndex))

  return (
    <span
      className={`${className} inline-block align-middle whitespace-nowrap`}
      style={{ minWidth: `${maxLen}ch` }}
      aria-live="polite"
    >
      <span>{display}</span>
      <span className="ml-1 inline-block text-[#4ade80] animate-pulse">|</span>
    </span>
  )
}
