'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { subscribeReactions } from './reactions'
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
 *
 * The one exception to "atmosphere, never information": the field reacts to a
 * judgement — a wrong answer reddens it and quickens the wave, a right one
 * greens it and settles the wave flat. Both are *second* channels — the
 * judgement text carries the same news at the same moment, and the canvas stays
 * aria-hidden — so nothing is said here alone (§9.3's carve-out discipline).
 */

const WaveCanvas = dynamic(() => import('./WaveCanvas'), { ssr: false })

function useTheme(): 'light' | 'dark' {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  useEffect(() => {
    const read = () => {
      const attr = document.documentElement.getAttribute('data-theme')
      if (attr === 'light' || attr === 'dark') return setTheme(attr)
      setTheme(window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
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
  const root = useRef<HTMLDivElement | null>(null)

  useEffect(() => setMounted(true), [])

  /* Reaction levels are written straight onto the element as custom properties.
   * State would re-render the tree 60×/second and, worse, rebuild the shader
   * material with it (see WaveCanvas). The washes themselves are pseudo-elements
   * in kite.css; the `data-` gates keep them out of the paint entirely between
   * judgements, so there is no blend group to composite while the field is
   * simply drifting. */
  useEffect(
    () =>
      subscribeReactions(({ wrong, right }) => {
        const el = root.current
        if (!el) return
        el.style.setProperty('--wave-wrong', String(wrong))
        el.style.setProperty('--wave-right', String(right))
        if (wrong > 0) el.dataset.wrong = 'on'
        else delete el.dataset.wrong
        if (right > 0) el.dataset.right = 'on'
        else delete el.dataset.right
      }),
    [],
  )

  const config: GradientConfig = configFor(presetId, theme)

  return (
    <div
      ref={root}
      className={className}
      aria-hidden="true"
      // Paints before WebGL is up, and instead of it when WebGL is absent.
      style={{ background: fallbackCss(config) }}
    >
      {mounted ? <WaveCanvas config={config} pixelDensity={pixelDensity} frozen={reduced} /> : null}

      {/* The judgement washes. Siblings *after* the canvas rather than
          pseudo-elements, because among positioned boxes with `z-index: auto`
          paint order is DOM order — so this puts them above the canvas without
          a literal z-index, which §2.6 does not allow. kite.css keeps them out
          of the paint entirely until the matching gate above turns on. */}
      <div className="frost__wash frost__wash--wrong" />
      <div className="frost__wash frost__wash--right" />
    </div>
  )
}
