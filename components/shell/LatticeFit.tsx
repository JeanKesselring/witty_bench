'use client'

import { useEffect } from 'react'

/**
 * §2.5 quantised growth, for the axis CSS cannot express.
 *
 * "Content determines how many cells; the lattice determines that it is a
 * whole number of them. A card whose content needs 143px of height is 192px
 * tall (3 cells)."
 *
 * Widths are handled in CSS with `round(down, 100%, var(--cell))`, because a
 * percentage there resolves against the containing block. Heights cannot be:
 * `100%` in a block-size means the container, not the content, and there is
 * no CSS length that means "how tall this box wants to be". So the rounding
 * happens here — measure the natural height, snap it UP to the next whole
 * cell. Never down, so nothing is ever clipped (§4.4).
 *
 * Deliberately a single pass over a selector list rather than per-component
 * wiring: the rule is systemic, and a component that had to remember to opt
 * in is a component that will eventually forget.
 */

/* Boxes that explicitly opt into whole-cell outer heights. Assessment cards
 * are excluded: their internal spacing follows the lattice, while their
 * outer height stays content-driven to avoid blank rows. */
const TARGETS = [
  '.k-head',
  '.k-card',
  '.k-tile',
  '.k-panel',
  '.k-state',
  '.k-scrollmodule',
  '.k-inspector',
  '.k-lattice-chat__log .k-bubble',
].join(', ')

export function LatticeFit() {
  useEffect(() => {
    let frame = 0
    let applying = false

    const run = () => {
      frame = 0
      applying = true

      const cell =
        Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell')) ||
        64
      const nodes = Array.from(document.querySelectorAll<HTMLElement>(TARGETS))

      // Release every override BEFORE measuring, in one batch. Measuring a
      // box while it still carries last pass's height would just re-snap the
      // value it already had, so a box could never shrink back.
      for (const el of nodes) el.style.blockSize = ''
      const natural = nodes.map((el) => el.getBoundingClientRect().height)

      for (let i = 0; i < nodes.length; i++) {
        const h = natural[i]
        if (h <= 0) continue
        const snapped = Math.ceil(h / cell) * cell
        // Sub-pixel differences are rounding noise, not a cell short.
        if (snapped - h > 0.5) nodes[i].style.blockSize = `${snapped}px`
      }

      applying = false
    }

    const schedule = () => {
      if (applying || frame) return
      frame = requestAnimationFrame(run)
    }

    schedule()
    window.addEventListener('resize', schedule)

    // Route changes and data arriving both replace content without a resize.
    const mo = new MutationObserver(schedule)
    mo.observe(document.body, { childList: true, subtree: true })

    // Fonts land after first paint and change every text box's height.
    document.fonts?.ready.then(schedule).catch(() => {})

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('resize', schedule)
      mo.disconnect()
    }
  }, [])

  return null
}
