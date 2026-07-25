import { lazy, Suspense, useMemo, useState } from 'react'

import { useGradient } from '../shader/gradientContext'
import { fallbackCss } from '../shader/presets'
import type { GradientConfig } from '../shader/types'
import { usePrefersReducedMotion, useRenderScale } from '../shader/useViewport'
import { useTheme } from '../theme/themeContext'

const SyncedGradientCanvas = lazy(() => import('../shader/SyncedGradientCanvas'))

/** Pinned instant used when the visitor has asked for reduced motion. */
const FROZEN_AT = 4

/**
 * Demo 4 — two identical renders, one masked into windows.
 *
 * Both layers are fully opaque and share the same noise field, the same
 * camera, and the same clock, so they are the same wave at the same instant.
 * The front layer differs only in amplitude (`uStrength`) and `brightness`,
 * and is masked down to two squares — so the squares read as windows onto a
 * more intense version of the same surface, not as two unrelated gradients.
 *
 * The whole effect depends on phase-lock. See `sharedClock.ts` for why the
 * library's built-in animation cannot provide it.
 */
export function WindowDemo() {
  const { config } = useGradient()
  const { theme } = useTheme()
  const reduced = usePrefersReducedMotion()
  const pixelDensity = useRenderScale(1.25)
  const [peek, setPeek] = useState(false)

  // Identical in every respect that affects the shape of the wave: same
  // uDensity, same uSpeed, same camera. Only the two intensity knobs move.
  //
  // The back layer is deliberately dimmed below the shared config. Most
  // presets already run close to clipping, and without that headroom the
  // brighter front layer lands on flat white — which reads as a hole punched
  // in the page rather than as the same surface turned up.
  const back = useMemo<GradientConfig>(
    () => ({
      ...config,
      grain: 'off',
      // Light palettes are pale and already sit near the top of the range, so
      // they need to come down further than the dark ones to leave headroom.
      brightness: config.brightness * (theme === 'light' ? 0.5 : 0.62),
    }),
    [config, theme],
  )
  // Amplitude has to stay modest, and the reason is in the fragment shader:
  // the base colour is `mix(..., color3, vPos.z)` where vPos.z is the raw,
  // unclamped wave height. Push uStrength far and vPos.z leaves the 0..1 range,
  // so `mix` extrapolates — crests invert past color3 into black and troughs
  // overshoot into blown white. Past roughly 1.5x the window stops reading as
  // the same wave and turns into unrelated black and white blobs.
  const front = useMemo<GradientConfig>(
    () => ({
      ...back,
      uStrength: config.uStrength * 1.45,
      brightness: back.brightness * 1.35,
    }),
    [config, back],
  )

  const frozenAt = reduced ? FROZEN_AT : undefined

  return (
    <section className="section windows" id="windows">
      <header className="section__head">
        <p className="eyebrow">Demo 4 · masked layers</p>
        <h2 className="section__title">Two windows onto a louder wave</h2>
        <p className="section__lede">
          Two opaque renders of the same wave, phase-locked to one clock. The front layer has 1.45×
          the amplitude and 1.35× the brightness, and is masked to two squares.
        </p>
      </header>

      <div className="windows__stage" data-peek={peek}>
        <div className="windows__layer" style={{ background: fallbackCss(back) }}>
          <Suspense fallback={null}>
            <SyncedGradientCanvas config={back} pixelDensity={pixelDensity} frozenAt={frozenAt} />
          </Suspense>
        </div>

        <div
          className="windows__layer windows__layer--front"
          style={{ background: fallbackCss(front) }}
        >
          <Suspense fallback={null}>
            <SyncedGradientCanvas config={front} pixelDensity={pixelDensity} frozenAt={frozenAt} />
          </Suspense>
        </div>

        {/* Outlines are positioned with the same expression as the mask, from
            the same custom properties, so the two can never drift apart. */}
        <div className="windows__frames" aria-hidden="true">
          <span className="windows__frame windows__frame--a" />
          <span className="windows__frame windows__frame--b" />
        </div>

        <button
          type="button"
          className="btn btn--glass windows__toggle"
          onClick={() => setPeek((v) => !v)}
        >
          {peek ? 'Re-apply mask' : 'Drop the mask'}
        </button>
      </div>
    </section>
  )
}
