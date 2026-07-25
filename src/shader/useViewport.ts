import { useEffect, useState } from 'react'

function useMatchMedia(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : false,
  )

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    }
    mql.addListener(onChange)
    return () => mql.removeListener(onChange)
  }, [query])

  return matches
}

/** Matches the breakpoints used in the stylesheets. Keep the two in sync. */
export const BREAKPOINTS = { sm: 640, md: 900, lg: 1280 } as const

export const useIsPhone = () => useMatchMedia(`(max-width: ${BREAKPOINTS.sm - 1}px)`)
export const useIsCompact = () => useMatchMedia(`(max-width: ${BREAKPOINTS.md - 1}px)`)
export const useIsPortrait = () => useMatchMedia('(orientation: portrait)')
export const usePrefersReducedMotion = () => useMatchMedia('(prefers-reduced-motion: reduce)')

/**
 * Render scale for the WebGL canvas.
 *
 * A full-bleed shader at devicePixelRatio 3 is a battery fire for close to zero
 * visual gain — a gradient has no fine detail to alias. Cap hard on small
 * screens, and let the caller lower `max` further for decorative surfaces.
 */
export function useRenderScale(max = 1.5): number {
  const isPhone = useIsPhone()
  const isCompact = useIsCompact()
  const ceiling = isPhone ? 1 : isCompact ? 1.25 : max
  return Math.min(window.devicePixelRatio || 1, ceiling)
}
