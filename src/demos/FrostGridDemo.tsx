import { useCallback, useMemo, useState } from 'react'

import { buildEdgeMask, buildFillMask, mulberry32 } from '../frost/grid'
import { GradientSurface } from '../shader/GradientSurface'

/**
 * A 5vw × 5vh cell across a 100vw × 100svh stage is always exactly 20 × 20.
 * The grid never needs to be recounted on resize — only the cells' pixel size
 * changes, which CSS handles on its own.
 */
const COLS = 20
const ROWS = 20
const TOTAL = COLS * ROWS
const ACTIVE_RATIO = 0.38

const rollPattern = (seed: number): boolean[] => {
  const rand = mulberry32(seed)
  // Draw for every cell so the pattern depends only on the seed.
  return Array.from({ length: TOTAL }, () => rand() < ACTIVE_RATIO)
}

/**
 * Demo 5 — one gradient, a frosted grid on top, click to toggle.
 *
 * The frost is pure blur: no veil, no tint, no saturation shift, so a tile is
 * the same hue and the same brightness as its surroundings. That only reads if
 * the surface underneath has texture to lose, which is what `.frost__texture`
 * is for.
 */
export function FrostGridDemo() {
  const [active, setActive] = useState(() => rollPattern(7))

  // Texture is what makes the frost legible. A pure blur over a smooth gradient
  // is nearly invisible — there are no high frequencies to remove — and the
  // usual fixes (a white veil, or desaturating) change the tiles' brightness or
  // colour, which is the one thing frosted glass must not do. Fine noise gives
  // the blur something to remove, so tiles read as *smooth* patches against a
  // textured surround: same hue, same luminance, just resolved differently.
  //
  // The library's own `grain` would do this, but it is a hardcoded halftone
  // (PostProcessing is mounted with no props, so `grainBlending` is ignored)
  // and far too coarse. `.frost__texture` is a soft-light noise layer instead,
  // painted below the glass so it is part of the backdrop the blur samples.
  const mask = useMemo(() => buildFillMask(active.map((v) => (v ? 1 : 0)), COLS, ROWS), [active])
  const edgeMask = useMemo(() => buildEdgeMask(active, COLS, ROWS), [active])
  const count = useMemo(() => active.reduce((n, v) => n + (v ? 1 : 0), 0), [active])

  const toggle = useCallback((i: number) => {
    setActive((prev) => {
      const next = prev.slice()
      next[i] = !next[i]
      return next
    })
  }, [])

  return (
    <section className="section frost" id="frost">
      <header className="section__head">
        <p className="eyebrow">Demo 5 · frosted grid</p>
        <h2 className="section__title">One surface, read through frosted tiles</h2>
        <p className="section__lede">
          A 5vw × 5vh grid over a single gradient — click any cell to frost or clear it. {count} of{' '}
          {TOTAL} are on, rendered as one blurred element rather than {count} of them.
        </p>
      </header>

      <div className="frost__stage">
        <GradientSurface className="frost__canvas" maxScale={1.25} />
        <div className="frost__texture" aria-hidden="true" />

        <div
          className="frost__glass"
          aria-hidden="true"
          style={{ maskImage: mask, WebkitMaskImage: mask }}
        />

        {/* A sibling, not a child: the rim straddles the cluster boundary, so
            clipping it to the tile mask would shave off its outer half. */}
        <div
          className="frost__edge"
          aria-hidden="true"
          style={{ maskImage: edgeMask, WebkitMaskImage: edgeMask }}
        />

        {/* Hit targets only — transparent, and carrying no backdrop-filter, so
            the 400 of them cost nothing. The frost itself stays a single
            element underneath. */}
        <div className="frost__hits" role="group" aria-label="Frosted grid cells">
          {active.map((on, i) => (
            <button
              type="button"
              key={i}
              className="frost__hit"
              aria-pressed={on}
              aria-label={`Cell ${(i % COLS) + 1}, ${Math.floor(i / COLS) + 1}`}
              onClick={() => toggle(i)}
            />
          ))}
        </div>

        <div className="frost__actions">
          <button
            type="button"
            className="btn btn--glass"
            onClick={() => setActive(rollPattern(Math.floor(Math.random() * 1e6)))}
          >
            Re-roll
          </button>
          <button
            type="button"
            className="btn btn--glass"
            onClick={() => setActive(Array<boolean>(TOTAL).fill(false))}
          >
            Clear
          </button>
        </div>
      </div>
    </section>
  )
}
