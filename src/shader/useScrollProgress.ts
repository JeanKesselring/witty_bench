import { useEffect, useRef, useState } from 'react'

/**
 * Progress (0→1) of an element travelling through the viewport.
 *
 * Two deliberate choices:
 *  - Reads are batched into a rAF, so a scroll burst produces one measurement
 *    per frame instead of one per event.
 *  - The value is quantised to `steps` buckets. Feeding raw float progress into
 *    shader props re-renders the React tree on every pixel of scroll; 1/120th
 *    granularity is past what anyone can see in a gradient.
 */
export function useScrollProgress(steps = 120) {
  const ref = useRef<HTMLElement | null>(null)
  const [progress, setProgress] = useState(0)
  const frame = useRef(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const measure = () => {
      frame.current = 0
      const rect = el.getBoundingClientRect()
      const span = rect.height + window.innerHeight
      const raw = span <= 0 ? 0 : (window.innerHeight - rect.top) / span
      const clamped = Math.min(1, Math.max(0, raw))
      const quantised = Math.round(clamped * steps) / steps
      setProgress((prev) => (prev === quantised ? prev : quantised))
    }

    const schedule = () => {
      if (frame.current) return
      frame.current = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [steps])

  return { ref, progress }
}
