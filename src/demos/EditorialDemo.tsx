import { useMemo } from 'react'

import { GradientSurface } from '../shader/GradientSurface'
import { useGradient } from '../shader/gradientContext'
import type { GradientConfig } from '../shader/types'
import { useScrollProgress } from '../shader/useScrollProgress'
import { usePrefersReducedMotion } from '../shader/useViewport'

const CHAPTERS = [
  {
    n: '01',
    title: 'Bind scroll to the camera, not the mesh',
    body: 'Scrubbing uTime looks like a stuttering video. Scrubbing cAzimuthAngle keeps the shader animating at its own rate while the framing follows the reader — motion stays smooth even when scroll is jerky.',
  },
  {
    n: '02',
    title: 'Quantise before you re-render',
    body: 'Raw scroll progress is a float that changes every pixel. Rounding it to ~120 buckets cuts React renders by an order of magnitude and nobody can tell the difference in a gradient.',
  },
  {
    n: '03',
    title: 'Let the palette carry the narrative',
    body: 'Interpolating between two of the palette stops as the section advances gives each chapter its own temperature without any extra assets, and it re-derives automatically when the brand palette changes.',
  },
  {
    n: '04',
    title: 'Give reduced-motion a real design',
    body: 'When motion is off this section still gets a gradient, just a still one pinned to the mid-scroll frame. The opt-out path should be a composed layout, not a blank rectangle.',
  },
]

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/**
 * Demo 3 — scroll-reactive editorial section.
 *
 * The gradient is pinned while the copy scrolls past it, and scroll progress
 * drives the *camera* rather than the shader clock: the mesh keeps animating at
 * its own steady rate while the framing tracks the reader. Scrubbing `uTime`
 * directly is the obvious approach and it looks like a dropped-frame video.
 */
export function EditorialDemo() {
  const { config } = useGradient()
  const { ref, progress } = useScrollProgress()
  const reduced = usePrefersReducedMotion()

  // Pin to the mid-scroll frame when motion is off, so the still composition is
  // the one that was actually art-directed.
  const t = reduced ? 0.5 : progress

  const scrolled = useMemo<GradientConfig>(
    () => ({
      ...config,
      cAzimuthAngle: lerp(config.cAzimuthAngle - 60, config.cAzimuthAngle + 60, t),
      cPolarAngle: lerp(config.cPolarAngle - 15, config.cPolarAngle + 15, t),
      cDistance: lerp(config.cDistance + 0.8, config.cDistance - 0.4, t),
      positionY: lerp(0.5, -0.5, t),
    }),
    [config, t],
  )

  const active = Math.min(CHAPTERS.length - 1, Math.floor(t * CHAPTERS.length))

  return (
    <section className="section editorial" id="editorial" ref={ref as React.Ref<HTMLElement>}>
      <div className="editorial__grid">
        <div className="editorial__sticky">
          <GradientSurface
            className="editorial__canvas"
            config={scrolled}
            compact={{ cDistance: scrolled.cDistance + 1.2 }}
            phone={{ cDistance: scrolled.cDistance + 2, cameraZoom: 0.9 }}
            maxScale={1.25}
          />
          <div className="editorial__meter" aria-hidden="true">
            <div className="editorial__meter-fill" style={{ transform: `scaleX(${t})` }} />
          </div>
          <p className="editorial__readout">
            azimuth {Math.round(scrolled.cAzimuthAngle)}° · polar{' '}
            {Math.round(scrolled.cPolarAngle)}° · {Math.round(t * 100)}%
          </p>
        </div>

        <div className="editorial__copy">
          <p className="eyebrow">Demo 3 · scroll-reactive</p>
          <h2 className="section__title">The gradient reads the page</h2>
          <p className="section__lede">
            Scroll this section. The camera orbits with you; the shader clock keeps its own time.
          </p>

          <ol className="chapters">
            {CHAPTERS.map((c, i) => (
              <li key={c.n} className="chapter" data-active={i === active}>
                <span className="chapter__n">{c.n}</span>
                <div>
                  <h3 className="chapter__title">{c.title}</h3>
                  <p className="chapter__body">{c.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
