import {
  Component,
  lazy,
  Suspense,
  useMemo,
  type CSSProperties,
  type ErrorInfo,
  type ReactNode,
} from 'react'

import { useGradient } from './gradientContext'
import { fallbackCss } from './presets'
import type { GradientConfig, ResponsiveFraming } from './types'
import {
  useIsCompact,
  useIsPhone,
  useIsPortrait,
  usePrefersReducedMotion,
  useRenderScale,
} from './useViewport'

const GradientCanvas = lazy(() => import('./GradientCanvas'))

class ShaderErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.warn('Shader background unavailable; using the CSS fallback.', error, info)
    }
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

export type GradientSurfaceProps = {
  /** Defaults to the shared store config, so the control panel drives it. */
  config?: GradientConfig
  /** Re-frame the camera below 900px. */
  compact?: ResponsiveFraming
  /** Re-frame again below 640px. Merged on top of `compact`. */
  phone?: ResponsiveFraming
  /** Applied whenever the viewport is taller than it is wide. */
  portrait?: ResponsiveFraming
  /** Upper bound on render scale. Lower it for small decorative surfaces. */
  maxScale?: number
  /** Skip mounting until the surface scrolls near the viewport. */
  lazy?: boolean
  /** Multiplier on animation speed — 0 freezes without unmounting. */
  speedScale?: number
  className?: string
  style?: CSSProperties
}

/**
 * A ShaderGradient canvas that behaves like a well-mannered page element.
 *
 * Everything here exists because a raw <ShaderGradientCanvas> dropped into a
 * layout misbehaves in five predictable ways:
 *
 *  1. It drags ~1.1MB of three.js into the initial bundle. Fixed by the
 *     `lazy()` boundary — the chunk arrives after first paint.
 *  2. It renders at full devicePixelRatio, so phones cook. Fixed by
 *     `useRenderScale`.
 *  3. Camera framing tuned in landscape gets cropped to mush in portrait.
 *     Fixed by the `compact` / `phone` / `portrait` overrides.
 *  4. It animates straight through `prefers-reduced-motion: reduce`. Fixed by
 *     pinning `animate="off"`, which leaves a still frame rather than a blank.
 *  5. It paints nothing before WebGL is up — and nothing at all without WebGL.
 *     Fixed by the CSS gradient underlay, which doubles as the Suspense
 *     fallback for free.
 */
export function GradientSurface({
  config: override,
  compact,
  phone,
  portrait,
  maxScale = 1.5,
  lazy: lazyMount = true,
  speedScale = 1,
  className,
  style,
}: GradientSurfaceProps) {
  const { config: shared, motion } = useGradient()
  const config = override ?? shared

  const isCompact = useIsCompact()
  const isPhone = useIsPhone()
  const isPortrait = useIsPortrait()
  const reduced = usePrefersReducedMotion()
  const pixelDensity = useRenderScale(maxScale)

  const framed = useMemo<GradientConfig>(
    () => ({
      ...config,
      ...(isPortrait ? portrait : null),
      ...(isCompact ? compact : null),
      ...(isPhone ? phone : null),
      uSpeed: config.uSpeed * speedScale,
      // Grain is a fullscreen post-pass — the most expensive thing on this
      // surface, and it reads as mud at phone sizes anyway.
      grain: isPhone ? 'off' : config.grain,
    }),
    [config, compact, phone, portrait, isCompact, isPhone, isPortrait, speedScale],
  )

  const animate = motion && !reduced && speedScale > 0 ? 'on' : 'off'

  return (
    <div
      className={className}
      style={{ ...style, background: fallbackCss(config) }}
      aria-hidden="true"
    >
      <ShaderErrorBoundary>
        <Suspense fallback={null}>
          <GradientCanvas
            config={framed}
            animate={animate}
            pixelDensity={pixelDensity}
            lazy={lazyMount}
          />
        </Suspense>
      </ShaderErrorBoundary>
    </div>
  )
}
