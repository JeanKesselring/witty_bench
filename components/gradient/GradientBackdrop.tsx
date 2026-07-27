'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { configFor, fallbackCss } from './presets'
import type { GradientConfig } from './types'

/* §3.5 The shader substrate. A material, not a surface: aria-hidden, fixed to
 * the viewport, behind every content layer, drifting on its own clock.
 *
 * Ported from the prototype's shader surface, which already solved the five
 * ways a raw ShaderGradientCanvas misbehaves in a layout:
 *   1. ~1.1MB of three.js in the initial bundle — kept behind a lazy boundary
 *      so the chunk arrives after first paint (§10.7).
 *   2. Full devicePixelRatio cooks phones — render scale is capped.
 *   3. prefers-reduced-motion is ignored — animate="off" pins a still frame
 *      rather than blanking the box (§9.3A).
 *   4. Nothing paints before WebGL is up, and nothing at all without it — the
 *      CSS gradient underlay covers both (§11.13).
 */

const ShaderGradientCanvas = dynamic(
  () => import('@shadergradient/react').then((m) => m.ShaderGradientCanvas),
  { ssr: false },
)
const ShaderGradient = dynamic(
  () => import('@shadergradient/react').then((m) => m.ShaderGradient),
  { ssr: false },
)

function useTheme(): 'light' | 'dark' {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  useEffect(() => {
    const read = () => {
      const attr = document.documentElement.getAttribute('data-theme')
      if (attr === 'light' || attr === 'dark') return setTheme(attr)
      setTheme(
        window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark',
      )
    }
    read()
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => observer.disconnect()
  }, [])
  return theme
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

function useRenderScale(max = 1.25): number {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    // §10.7: 1× on phones, 1.25× on tablets.
    const dpr = window.devicePixelRatio || 1
    const phone = window.matchMedia('(max-width: 640px)').matches
    setScale(Math.min(phone ? 1 : max, dpr))
  }, [max])
  return scale
}

export function GradientBackdrop({
  presetId = 'mono',
  className = 'frost__canvas',
}: {
  presetId?: string
  className?: string
}) {
  const theme = useTheme()
  const reduced = useReducedMotion()
  const pixelDensity = useRenderScale()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const config: GradientConfig = configFor(presetId, theme)

  return (
    <div
      className={className}
      aria-hidden="true"
      // Paints before WebGL is up, and instead of it when WebGL is absent.
      style={{ background: fallbackCss(config) }}
    >
      {mounted ? (
        <ShaderGradientCanvas
          style={{ width: '100%', height: '100%' }}
          pixelDensity={pixelDensity}
          pointerEvents="none"
          lazyLoad={false}
          powerPreference="high-performance"
          fov={45}
        >
          <ShaderGradient
            control="props"
            {...config}
            animate={reduced ? 'off' : 'on'}
          />
        </ShaderGradientCanvas>
      ) : null}
    </div>
  )
}
