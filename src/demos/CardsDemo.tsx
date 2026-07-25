import { useMemo, useState } from 'react'

import { shiftHue } from '../shader/color'
import { GradientSurface } from '../shader/GradientSurface'
import { useGradient } from '../shader/gradientContext'
import { SPHERE_FRAMING } from '../shader/presets'
import type { GradientConfig } from '../shader/types'
import { useIsCompact } from '../shader/useViewport'

const PLANS = [
  {
    id: 'studio',
    name: 'Studio',
    price: '$0',
    cadence: 'forever',
    hue: -40,
    blurb: 'One live surface, presets, and the full prop API.',
    features: ['1 gradient surface', 'All 5 presets', 'Copy-to-JSX export'],
    featured: false,
  },
  {
    id: 'team',
    name: 'Team',
    price: '$24',
    cadence: 'per seat / month',
    hue: 0,
    blurb: 'Shared palettes and per-breakpoint framing, versioned.',
    features: ['Unlimited surfaces', 'Responsive framing sets', 'Brand palette sync', 'Figma plugin'],
    featured: true,
  },
  {
    id: 'scale',
    name: 'Scale',
    price: 'Talk to us',
    cadence: 'annual',
    hue: 50,
    blurb: 'Self-hosted HDR assets and a hard perf budget per route.',
    features: ['Self-hosted env maps', 'Per-route GPU budget', 'SSO + audit log', 'Priority support'],
    featured: false,
  },
]

/**
 * Demo 2 — the gradient as a *contained component*, not a page background.
 *
 * The interesting constraint is cost: three WebGL contexts on one screen is
 * already pushing it, and a grid of twelve would be indefensible. So:
 *
 *  - Every card canvas is `lazy`, mounting only as it nears the viewport.
 *  - `maxScale` is dropped to 1 — the surfaces are small and clipped by
 *    border-radius, where extra pixel density buys nothing.
 *  - On compact viewports the cards fall back to the CSS gradient entirely and
 *    only the featured card keeps its shader. Three stacked canvases on a
 *    phone is a spec sheet decision, not a design one.
 *  - Hover raises `speedScale` instead of swapping the config, so nothing
 *    remounts and the reduced-motion opt-out still wins.
 */
export function CardsDemo() {
  const { config } = useGradient()
  const isCompact = useIsCompact()
  const [hovered, setHovered] = useState<string | null>(null)

  // Derive a family from the shared palette rather than hardcoding per-card
  // colours — retunes the whole grid when the control panel changes.
  const variants = useMemo(
    () =>
      Object.fromEntries(
        PLANS.map((p) => [
          p.id,
          {
            ...config,
            // Only the palette and motion come from the shared config; the
            // framing is swapped wholesale, because a plane's camera settings
            // do not translate to a sphere.
            ...SPHERE_FRAMING,
            uSpeed: config.uSpeed,
            color1: shiftHue(config.color1, p.hue),
            color2: shiftHue(config.color2, p.hue),
            color3: shiftHue(config.color3, p.hue),
            rotationZ: SPHERE_FRAMING.rotationZ! + p.hue,
            grain: 'off',
          } satisfies GradientConfig,
        ]),
      ) as Record<string, GradientConfig>,
    [config],
  )

  return (
    <section className="section cards" id="cards">
      <header className="section__head">
        <p className="eyebrow">Demo 2 · gradient as a component</p>
        <h2 className="section__title">Same shader, card-sized</h2>
        <p className="section__lede">
          Each card owns a clipped sphere derived from the shared palette. Below 900px the
          non-featured cards drop to their CSS fallback — one WebGL context on a phone, not three.
        </p>
      </header>

      <div className="cards__grid">
        {PLANS.map((plan) => {
          const shaded = plan.featured || !isCompact
          return (
            <article
              key={plan.id}
              className="card"
              data-featured={plan.featured}
              onMouseEnter={() => setHovered(plan.id)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(plan.id)}
              onBlur={() => setHovered(null)}
            >
              <div className="card__media">
                {shaded ? (
                  <GradientSurface
                    className="card__canvas"
                    config={variants[plan.id]}
                    maxScale={1}
                    speedScale={hovered === plan.id ? 2.5 : 1}
                    // No responsive framing here: the card holds a fixed 16/9
                    // aspect at every breakpoint, so the camera never needs to
                    // compensate for the viewport.
                  />
                ) : (
                  <div
                    className="card__canvas card__canvas--static"
                    style={{
                      background: `radial-gradient(120% 120% at 30% 20%, ${variants[plan.id].color2}, ${variants[plan.id].color1} 55%, ${variants[plan.id].color3})`,
                    }}
                  />
                )}
                {plan.featured && <span className="card__badge">Most picked</span>}
              </div>

              <div className="card__body">
                <h3 className="card__name">{plan.name}</h3>
                <p className="card__price">
                  {plan.price} <span className="card__cadence">{plan.cadence}</span>
                </p>
                <p className="card__blurb">{plan.blurb}</p>
                <ul className="card__features">
                  {plan.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <button type="button" className={`btn btn--block ${plan.featured ? 'btn--primary' : 'btn--glass'}`}>
                  Choose {plan.name}
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
