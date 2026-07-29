'use client'

/* kanji_writing — §9.3 carve-out D.
 *
 * Writing by hand is a pointer gesture with no keyboard equivalent, and no
 * amount of design makes one. The carve-out's discipline is therefore met the
 * other way: the concept is covered by other module types (`kanji_meaning`,
 * `kanji_reading`), so a learner who cannot use this control never loses
 * access to the material — and this type is OPTIONAL AND NEVER BLOCKING.
 * That is what makes it shippable; drop either condition and it is not.
 *
 * What it grades: the model is shown on reveal, over the learner's own
 * strokes, and the learner rates their recall. The pad captures stroke count
 * and direction so that a future server-side matcher has something real to
 * read, but nothing here pretends to score stroke order today — a scorer
 * that guesses would be worse than one that abstains.
 */

import { useEffect, useId, useRef, useState } from 'react'
import type { ResponseProps } from './Responses'

interface Point {
  x: number
  y: number
}

export function Handwriting({ item, value, onChange, judged, revealed }: ResponseProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const howToId = useId()
  const [strokes, setStrokes] = useState<Point[][]>([])
  /* The stroke under the pointer is separate state, not an edit to the
   * committed list: mutating the last committed stroke on every pointermove
   * made Undo remove whatever was mid-flight. */
  const [live, setLive] = useState<Point[] | null>(null)

  // The pad is square and cell-derived, like everything else (§2.5).
  const SIDE = 256

  const redraw = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, SIDE, SIDE)

    // Guides: centre cross at 1px, the way squared practice paper does it.
    ctx.strokeStyle = 'rgba(143, 160, 180, 0.35)'
    ctx.setLineDash([4, 6])
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(SIDE / 2, 0)
    ctx.lineTo(SIDE / 2, SIDE)
    ctx.moveTo(0, SIDE / 2)
    ctx.lineTo(SIDE, SIDE / 2)
    ctx.stroke()
    ctx.setLineDash([])

    // The model, once the answer is out. Underneath the learner's ink, so
    // the comparison is direct rather than side by side.
    if (judged !== null || revealed) {
      ctx.fillStyle = 'rgba(91, 167, 255, 0.25)'
      ctx.font = `${SIDE * 0.8}px var(--font-sans, sans-serif)`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(item.answer, SIDE / 2, SIDE / 2 + SIDE * 0.04)
    }

    ctx.strokeStyle = '#f6f2ef'
    ctx.lineWidth = 6
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (const stroke of live ? [...strokes, live] : strokes) {
      if (stroke.length < 2) continue
      ctx.beginPath()
      ctx.moveTo(stroke[0].x, stroke[0].y)
      for (const p of stroke.slice(1)) ctx.lineTo(p.x, p.y)
      ctx.stroke()
    }
  }

  useEffect(redraw, [strokes, live, judged, revealed, item.answer])

  const pointFrom = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * SIDE,
      y: ((e.clientY - rect.top) / rect.height) * SIDE,
    }
  }

  const commit = (next: Point[][]) => {
    setStrokes(next)
    // The value is what a matcher would need: stroke count and the direction
    // of each stroke, as a compact string. Empty means nothing written.
    onChange(
      next
        .map((s) => {
          const from = s[0]
          const to = s[s.length - 1]
          return `${Math.round(to.x - from.x)}:${Math.round(to.y - from.y)}`
        })
        .join('|'),
    )
  }

  const written = typeof value === 'string' && value.length > 0

  return (
    <div className="k-write">
      <p className="k-field__hint" id={howToId}>
        Write the character. This exercise is optional.
      </p>

      <canvas
        ref={canvasRef}
        width={SIDE}
        height={SIDE}
        className="k-write__pad"
        aria-describedby={howToId}
        aria-label={`Writing pad for ${item.prompt}`}
        onPointerDown={(e) => {
          if (judged !== null || revealed) return
          e.currentTarget.setPointerCapture(e.pointerId)
          setLive([pointFrom(e)])
        }}
        onPointerMove={(e) => {
          if (!live) return
          const p = pointFrom(e)
          setLive((s) => (s ? [...s, p] : s))
        }}
        onPointerUp={() => {
          if (!live) return
          if (live.length > 1) commit([...strokes, live])
          setLive(null)
        }}
        onPointerCancel={() => setLive(null)}
      />

      <div className="k-write__controls">
        <button
          type="button"
          className="k-btn k-btn--quiet k-press"
          disabled={judged !== null || revealed || strokes.length === 0}
          onClick={() => commit(strokes.slice(0, -1))}
        >
          Undo stroke
        </button>
        <button
          type="button"
          className="k-btn k-btn--quiet k-press"
          disabled={judged !== null || revealed || strokes.length === 0}
          onClick={() => commit([])}
        >
          Clear
        </button>
        <span className="k-meta" aria-live="polite">
          {written ? `${strokes.length} strokes` : 'Nothing written yet'}
        </span>
      </div>
    </div>
  )
}
