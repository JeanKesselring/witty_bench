import { GradientSurface } from '../shader/GradientSurface'
import { useGradient } from '../shader/gradientContext'

const STATS = [
  { value: '18ms', label: 'p95 render' },
  { value: '1 canvas', label: 'per viewport' },
  { value: '0 images', label: 'shipped' },
]

/**
 * Demo 1 — full-bleed hero background.
 *
 * The classic use: the gradient replaces a hero image entirely. Three things
 * make it work as design rather than as a tech demo:
 *
 *  - The camera is re-framed for portrait (see the `phone` / `portrait` props).
 *    Without it, the interesting part of the mesh sits off-canvas on a phone.
 *  - A scrim sits between the canvas and the copy. Shader output is
 *    unpredictable, so text contrast cannot be left to chance.
 *  - Type scales with `clamp()` against the viewport, so the composition holds
 *    at every width instead of snapping at three breakpoints.
 */
export function HeroDemo() {
  const { config } = useGradient()

  return (
    <section className="hero">
      <GradientSurface
        className="hero__canvas"
        // Portrait crops the plane badly at the default distance: back the
        // camera off and tilt it so the light band still lands behind the copy.
        portrait={{ cDistance: config.cDistance + 1.4, positionY: -0.4 }}
        compact={{ cPolarAngle: 100 }}
        phone={{ cDistance: config.cDistance + 2.2, cameraZoom: 0.85 }}
        lazy={false}
        maxScale={1.5}
      />
      <div className="hero__scrim" />

      <div className="hero__inner">
        <p className="eyebrow">Demo 1 · full-bleed background</p>
        <h1 className="hero__title">
          Ship a hero that <em>moves</em>, without shipping a video.
        </h1>
        <p className="hero__lede">
          One WebGL surface, re-framed per breakpoint, with a CSS gradient underneath so the page
          never flashes empty — and never breaks if WebGL is unavailable.
        </p>

        <div className="hero__actions">
          <a className="btn btn--primary btn--lg" href="#cards">
            See it as a component
          </a>
          <a className="btn btn--glass btn--lg" href="#editorial">
            See it react to scroll
          </a>
        </div>

        <dl className="hero__stats">
          {STATS.map((s) => (
            <div key={s.label} className="hero__stat">
              <dt className="hero__stat-value">{s.value}</dt>
              <dd className="hero__stat-label">{s.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
