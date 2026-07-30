'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type { ResponseProps } from './Responses'

interface Point {
  x: number
  y: number
  pressure: number
}

type RecognitionState = 'idle' | 'scanning' | 'keep-going' | 'recognized'

const SIDE = 256
const SAMPLE_SIDE = 64
const MATCH_THRESHOLD = 0.58

/**
 * Draw one stroke as short, overlapping quadratic segments. Varying each
 * segment's width gives the line a brush-like taper without sacrificing the
 * smooth joins learners expect from a writing pad.
 */
function paintStroke(ctx: CanvasRenderingContext2D, stroke: Point[], scale = 1) {
  if (stroke.length === 0) return

  ctx.strokeStyle = '#0b0b0a'
  ctx.fillStyle = '#0b0b0a'
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (stroke.length === 1) {
    ctx.beginPath()
    ctx.arc(stroke[0].x * scale, stroke[0].y * scale, 2.5 * scale, 0, Math.PI * 2)
    ctx.fill()
    return
  }

  for (let index = 1; index < stroke.length; index += 1) {
    const previous = stroke[index - 1]
    const current = stroke[index]
    const next = stroke[index + 1] ?? current
    const progress = (index - 0.5) / (stroke.length - 1)
    const taper = 0.28 + Math.pow(Math.sin(Math.PI * progress), 0.45) * 0.72
    const pressure = Math.max(0.42, (previous.pressure + current.pressure) / 2)
    const width = (3.2 + 6.8 * pressure) * taper * scale
    const start =
      index === 1
        ? previous
        : {
            x: (previous.x + current.x) / 2,
            y: (previous.y + current.y) / 2,
          }
    const end =
      index === stroke.length - 1
        ? current
        : {
            x: (current.x + next.x) / 2,
            y: (current.y + next.y) / 2,
          }

    ctx.lineWidth = width
    ctx.beginPath()
    ctx.moveTo(start.x * scale, start.y * scale)
    ctx.quadraticCurveTo(current.x * scale, current.y * scale, end.x * scale, end.y * scale)
    ctx.stroke()
  }
}

function inkMask(ctx: CanvasRenderingContext2D): Uint8Array {
  const pixels = ctx.getImageData(0, 0, SAMPLE_SIDE, SAMPLE_SIDE).data
  const mask = new Uint8Array(SAMPLE_SIDE * SAMPLE_SIDE)
  for (let index = 0; index < mask.length; index += 1) {
    if (pixels[index * 4 + 3] > 32) mask[index] = 1
  }
  return mask
}

/** Two-pass chamfer field: sufficient for comparing a handwritten skeleton
 * with a filled font glyph, and much cheaper than running OCR on every stroke. */
function distanceField(mask: Uint8Array): Float32Array {
  const field = new Float32Array(mask.length)
  field.fill(SAMPLE_SIDE * 2)

  for (let y = 0; y < SAMPLE_SIDE; y += 1) {
    for (let x = 0; x < SAMPLE_SIDE; x += 1) {
      const index = y * SAMPLE_SIDE + x
      if (mask[index]) {
        field[index] = 0
        continue
      }
      if (x > 0) field[index] = Math.min(field[index], field[index - 1] + 1)
      if (y > 0) field[index] = Math.min(field[index], field[index - SAMPLE_SIDE] + 1)
      if (x > 0 && y > 0)
        field[index] = Math.min(field[index], field[index - SAMPLE_SIDE - 1] + 1.4)
      if (x < SAMPLE_SIDE - 1 && y > 0)
        field[index] = Math.min(field[index], field[index - SAMPLE_SIDE + 1] + 1.4)
    }
  }

  for (let y = SAMPLE_SIDE - 1; y >= 0; y -= 1) {
    for (let x = SAMPLE_SIDE - 1; x >= 0; x -= 1) {
      const index = y * SAMPLE_SIDE + x
      if (x < SAMPLE_SIDE - 1) field[index] = Math.min(field[index], field[index + 1] + 1)
      if (y < SAMPLE_SIDE - 1) field[index] = Math.min(field[index], field[index + SAMPLE_SIDE] + 1)
      if (x < SAMPLE_SIDE - 1 && y < SAMPLE_SIDE - 1)
        field[index] = Math.min(field[index], field[index + SAMPLE_SIDE + 1] + 1.4)
      if (x > 0 && y < SAMPLE_SIDE - 1)
        field[index] = Math.min(field[index], field[index + SAMPLE_SIDE - 1] + 1.4)
    }
  }

  return field
}

function directedDistance(mask: Uint8Array, field: Float32Array): number {
  let distance = 0
  let count = 0
  for (let index = 0; index < mask.length; index += 1) {
    if (!mask[index]) continue
    distance += Math.min(field[index], 12)
    count += 1
  }
  return count === 0 ? 12 : distance / count
}

function normalizedStrokes(strokes: Point[][]): Point[][] | null {
  const points = strokes.flat()
  if (points.length < 4) return null

  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const width = maxX - minX
  const height = maxY - minY
  if (Math.max(width, height) < 18) return null

  const contentSide = SAMPLE_SIDE - 14
  const fit = contentSide / Math.max(width, height)
  const offsetX = (SAMPLE_SIDE - width * fit) / 2
  const offsetY = (SAMPLE_SIDE - height * fit) / 2

  return strokes.map((stroke) =>
    stroke.map((point) => ({
      x: offsetX + (point.x - minX) * fit,
      y: offsetY + (point.y - minY) * fit,
      pressure: point.pressure,
    })),
  )
}

/**
 * This is target-aware recognition rather than open-ended OCR: the exercise
 * already knows which kanji it requested, so it compares the normalized ink
 * with that glyph and accepts only a sufficiently close shape.
 */
function matchExpectedKanji(strokes: Point[][], expected: string): number {
  const [glyph, ...extra] = [...expected.trim()]
  if (!glyph || extra.length > 0) return 0
  const normalized = normalizedStrokes(strokes)
  if (!normalized) return 0

  const writtenCanvas = document.createElement('canvas')
  writtenCanvas.width = SAMPLE_SIDE
  writtenCanvas.height = SAMPLE_SIDE
  const writtenContext = writtenCanvas.getContext('2d')
  if (!writtenContext) return 0
  normalized.forEach((stroke) => paintStroke(writtenContext, stroke))
  const written = inkMask(writtenContext)

  const modelCanvas = document.createElement('canvas')
  modelCanvas.width = SAMPLE_SIDE
  modelCanvas.height = SAMPLE_SIDE
  const modelContext = modelCanvas.getContext('2d')
  if (!modelContext) return 0
  modelContext.fillStyle = '#0b0b0a'
  modelContext.font =
    '52px "Hiragino Sans", "Yu Gothic", "Noto Sans CJK JP", "Noto Sans JP", sans-serif'
  modelContext.textAlign = 'center'
  modelContext.textBaseline = 'middle'
  modelContext.fillText(glyph, SAMPLE_SIDE / 2, SAMPLE_SIDE / 2 + 2)
  const model = inkMask(modelContext)

  const writtenToModel = directedDistance(written, distanceField(model))
  const modelToWritten = directedDistance(model, distanceField(written))
  const averageDistance = writtenToModel * 0.58 + modelToWritten * 0.42
  return Math.max(0, 1 - averageDistance / 8.5)
}

export function Handwriting({ item, value, onChange, judged, onRecognize }: ResponseProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const recognitionTimer = useRef<number | null>(null)
  const recognitionVersion = useRef(0)
  const statusId = useId()
  const [strokes, setStrokes] = useState<Point[][]>([])
  const [live, setLive] = useState<Point[] | null>(null)
  const [recognition, setRecognition] = useState<RecognitionState>('idle')

  const redraw = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, SIDE, SIDE)

    ctx.strokeStyle = 'rgba(109, 105, 96, 0.24)'
    ctx.setLineDash([4, 7])
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(SIDE / 2, 0)
    ctx.lineTo(SIDE / 2, SIDE)
    ctx.moveTo(0, SIDE / 2)
    ctx.lineTo(SIDE, SIDE / 2)
    ctx.stroke()
    ctx.setLineDash([])

    for (const stroke of live ? [...strokes, live] : strokes) paintStroke(ctx, stroke)
  }

  useEffect(redraw, [strokes, live])

  useEffect(
    () => () => {
      if (recognitionTimer.current !== null) window.clearTimeout(recognitionTimer.current)
    },
    [],
  )

  const pointFrom = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * SIDE,
      y: ((event.clientY - rect.top) / rect.height) * SIDE,
      pressure: event.pressure > 0 ? event.pressure : 0.5,
    }
  }

  const serialize = (next: Point[][]) =>
    next
      .map((stroke) => {
        const from = stroke[0]
        const to = stroke[stroke.length - 1]
        return `${Math.round(to.x - from.x)}:${Math.round(to.y - from.y)}`
      })
      .join('|')

  const recognize = (next: Point[][]) => {
    recognitionVersion.current += 1
    const version = recognitionVersion.current
    if (recognitionTimer.current !== null) window.clearTimeout(recognitionTimer.current)

    if (next.length === 0) {
      setRecognition('idle')
      return
    }

    setRecognition('scanning')
    recognitionTimer.current = window.setTimeout(() => {
      if (version !== recognitionVersion.current) return
      const confidence = matchExpectedKanji(next, item.answer)
      if (confidence >= MATCH_THRESHOLD) {
        setRecognition('recognized')
        onRecognize?.(item.answer)
      } else {
        setRecognition('keep-going')
      }
    }, 180)
  }

  const commit = (next: Point[][]) => {
    setStrokes(next)
    onChange(serialize(next))
    recognize(next)
  }

  const written = typeof value === 'string' && value.length > 0
  const locked = judged !== null || recognition === 'recognized'
  const status =
    recognition === 'scanning'
      ? 'Recognizing…'
      : recognition === 'recognized'
        ? `Recognized ${item.answer}`
        : recognition === 'keep-going'
          ? 'Keep writing…'
          : ''

  return (
    <div className="k-write">
      <canvas
        ref={canvasRef}
        width={SIDE}
        height={SIDE}
        className="k-write__pad"
        data-recognized={recognition === 'recognized' ? 'true' : undefined}
        aria-describedby={statusId}
        aria-label={`Writing pad for ${item.prompt}`}
        onPointerDown={(event) => {
          if (locked) return
          event.currentTarget.setPointerCapture(event.pointerId)
          setLive([pointFrom(event)])
        }}
        onPointerMove={(event) => {
          if (!live) return
          const point = pointFrom(event)
          setLive((stroke) => {
            if (!stroke) return stroke
            const previous = stroke[stroke.length - 1]
            if (Math.hypot(point.x - previous.x, point.y - previous.y) < 1.5) return stroke
            return [...stroke, point]
          })
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
          disabled={locked || strokes.length === 0}
          onClick={() => commit(strokes.slice(0, -1))}
        >
          Undo stroke
        </button>
        <button
          type="button"
          className="k-btn k-btn--quiet k-press"
          disabled={locked || strokes.length === 0}
          onClick={() => commit([])}
        >
          Clear
        </button>
      </div>

      <p
        className="k-write__status"
        id={statusId}
        aria-live="polite"
        data-visible={written || status ? 'true' : undefined}
      >
        {status}
      </p>
    </div>
  )
}
