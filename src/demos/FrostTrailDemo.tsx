import { useEffect, useRef, useState } from 'react'

import { buildEdgeMask, buildFillMask } from '../frost/grid'
import { GradientSurface } from '../shader/GradientSurface'
import { usePrefersReducedMotion } from '../shader/useViewport'

/** Fixed cell size, so the grid count depends on the stage rather than the viewport. */
const CELL = 40
/** Time for a cleared cell to return to full frost. */
const REFROST_MS = 2600
/** Coverage above which a cell counts as solid for the rim outline. */
const SOLID_AT = 0.55

/**
 * Demo 6 — frost that the pointer wipes clear, and that creeps back.
 *
 * Same single-blurred-element trick as demo 5, but the mask alpha is now
 * continuous per cell rather than on/off: a cell the pointer just crossed is
 * fully transparent, and it re-frosts over `REFROST_MS`. Mask alpha doubles as
 * the frost amount, which is what makes a *partly* frosted tile possible
 * without giving each tile its own blur.
 *
 * The decay runs on a raw rAF that writes `style.maskImage` straight to the
 * DOM. Routing per-frame values through React state would re-render the tree
 * 120 times a second for something no component needs to know about.
 */
export function FrostTrailDemo() {
  const stageRef = useRef<HTMLDivElement>(null)
  const glassRef = useRef<HTMLDivElement>(null)
  const edgeRef = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()
  const [grid, setGrid] = useState({ cols: 0, rows: 0 })

  // Cell size is fixed, so the count follows the stage's measured size.
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const cols = Math.max(1, Math.ceil(width / CELL))
      const rows = Math.max(1, Math.ceil(height / CELL))
      setGrid((p) => (p.cols === cols && p.rows === rows ? p : { cols, rows }))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const { cols, rows } = grid
    const stage = stageRef.current
    const glass = glassRef.current
    const edge = edgeRef.current
    if (!cols || !rows || !stage || !glass || !edge) return

    const total = cols * rows
    // Start fully frosted: last touched infinitely long ago.
    const seen = new Float32Array(total).fill(-REFROST_MS * 10)
    const alpha = new Float32Array(total)
    const solid = new Array<boolean>(total).fill(true)

    const onPointer = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect()
      const c = Math.floor((e.clientX - r.left) / CELL)
      const row = Math.floor((e.clientY - r.top) / CELL)
      if (c < 0 || c >= cols || row < 0 || row >= rows) return
      seen[row * cols + c] = performance.now()
    }
    stage.addEventListener('pointermove', onPointer, { passive: true })

    let frame = 0
    let lastEdge = ''
    const tick = () => {
      const now = performance.now()
      let solidChanged = false
      for (let i = 0; i < total; i++) {
        const a = Math.min(1, (now - seen[i]) / REFROST_MS)
        alpha[i] = a
        const s = a >= SOLID_AT
        if (s !== solid[i]) {
          solid[i] = s
          solidChanged = true
        }
      }

      glass.style.maskImage = glass.style.webkitMaskImage = buildFillMask(alpha, cols, rows)
      // The rim only changes when a cell crosses the solid threshold, which is
      // far rarer than every frame — so it is rebuilt on change, not on tick.
      if (solidChanged) {
        const next = buildEdgeMask(solid, cols, rows)
        if (next !== lastEdge) {
          lastEdge = next
          edge.style.maskImage = edge.style.webkitMaskImage = next
        }
      }
      frame = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(frame)
      stage.removeEventListener('pointermove', onPointer)
    }
  }, [grid])

  return (
    <section className="section frost frost--trail" id="trail">
      <header className="section__head">
        <p className="eyebrow">Demo 6 · frost trail</p>
        <h2 className="section__title">Wipe the frost, watch it creep back</h2>
        <p className="section__lede">
          {CELL}px cells over one gradient. Move the pointer to clear them; each cell re-frosts over{' '}
          {(REFROST_MS / 1000).toFixed(1)}s, so the trail fades from clear to blurred behind you.
          {reduced && ' Motion is reduced, so the frost is held still.'}
        </p>
      </header>

      <div className="frost__stage" ref={stageRef}>
        <GradientSurface className="frost__canvas" maxScale={1.25} />
        <div className="frost__texture" aria-hidden="true" />
        <div className="frost__glass" ref={glassRef} aria-hidden="true" />
        <div className="frost__edge" ref={edgeRef} aria-hidden="true" />
      </div>
    </section>
  )
}
