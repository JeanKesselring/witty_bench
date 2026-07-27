'use client'

import { useEffect, useRef, useState } from 'react'
import type { ModuleItem, Judgement } from '@/lib/api/types'
import type { ModuleTypeSpec } from '@/lib/modules/registry'
import { judgeChoice, judgeOrder, judgeText } from '@/lib/grading'
import { finalise, toKana } from '@/lib/japanese/romaji'

/* §6.12 Response controls. A closed set of six: a new module type reuses
 * one or argues for a seventh. */

export type AnswerValue = string | string[]

export interface ResponseProps {
  item: ModuleItem
  spec: ModuleTypeSpec
  value: AnswerValue
  onChange: (v: AnswerValue) => void
  /** Set once judged — controls stop accepting input (§6.10). */
  judged: Judgement | null
  /** §6.12: using the cloze bank caps the grade at Hard. */
  onAssisted: () => void
  /** Double-tap accelerator on single choice commits directly. */
  onCommit: () => void
}

export function evaluate(
  item: ModuleItem,
  spec: ModuleTypeSpec,
  value: AnswerValue,
): Judgement {
  switch (spec.response) {
    case 'ordering':
      return judgeOrder(
        Array.isArray(value) ? value : [],
        item.answer.split('|'),
      )
    case 'choice':
    case 'map':
      return judgeChoice(String(value), item.answer)
    case 'text':
    case 'cloze':
      return judgeText(String(value), item.answer, spec.tolerance)
    default:
      return { outcome: 'correct', answer: item.answer }
  }
}

export function isAnswered(spec: ModuleTypeSpec, value: AnswerValue): boolean {
  if (spec.response === 'ordering') return Array.isArray(value) && value.length > 0
  if (spec.response === 'none' || spec.response === 'scroll') return true
  return String(value).trim().length > 0
}

/* ── Single choice ──────────────────────────────────────────────────
 * Select, then Check. Selection is reversible until Check, so Check keeps
 * meaning exactly what it means on every other type. Activating an already
 * selected option commits it — an accelerator, never taught, never required.
 * One tab stop, arrows to move (§8.4). */

export function ChoiceResponse({
  item,
  value,
  onChange,
  judged,
  onCommit,
}: ResponseProps) {
  const options = item.options ?? []
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  const selected = String(value)
  // Discrimination pairs carry their glyphs at the §4.3 96px floor.
  const isPair = item.moduleType === 'discrimination'

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    let next = index
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = index + 1
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = index - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = options.length - 1
    else return
    e.preventDefault()
    // §8.4: arrow navigation does not wrap. A hard stop teaches the boundary.
    if (next < 0 || next >= options.length) return
    refs.current[next]?.focus()
  }

  return (
    <div
      className="k-options"
      role="radiogroup"
      aria-label="Answer"
      style={isPair ? { gridAutoFlow: 'column' } : undefined}
    >
      {options.map((opt, i) => {
        const isSelected = selected === opt
        let tone = ''
        if (judged) {
          if (opt === item.answer) tone = ' k-option--ok'
          else if (isSelected) tone = ' k-option--err'
        }
        return (
          <button
            key={opt}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            // Roving tabindex: the selected option holds 0, others -1.
            tabIndex={isSelected || (!selected && i === 0) ? 0 : -1}
            className={`k-option k-press${tone}`}
            disabled={Boolean(judged)}
            onKeyDown={(e) => onKeyDown(e, i)}
            onClick={() => {
              if (isSelected) onCommit()
              else onChange(opt)
            }}
          >
            <span
              lang={item.lang}
              className={isPair ? 'k-glyph-pair' : undefined}
            >
              {opt}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ── Text entry ─────────────────────────────────────────────────────
 * Japanese uses the romaji converter (§4.3); the Latin buffer is visible
 * while composing so the learner sees what they are producing. */

export function TextResponse({ item, value, onChange, judged }: ResponseProps) {
  const japanese = item.lang === 'ja'
  const [raw, setRaw] = useState('')
  const [katakana, setKatakana] = useState(false)

  const converted = japanese ? toKana(raw, katakana) : null

  useEffect(() => {
    if (!japanese) return
    onChange(finalise(toKana(raw, katakana), katakana))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw, katakana])

  if (!japanese) {
    return (
      <div className="k-field">
        <label className="k-field__label" htmlFor="answer">
          Your answer
        </label>
        <input
          id="answer"
          className="k-input"
          value={String(value)}
          disabled={Boolean(judged)}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
        />
      </div>
    )
  }

  return (
    <div className="k-field">
      <label className="k-field__label" htmlFor="answer">
        Your answer — type in romaji
      </label>
      <div className="k-compose">
        <input
          id="answer"
          className="k-input"
          value={raw}
          disabled={Boolean(judged)}
          onChange={(e) => setRaw(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          aria-describedby="compose-out"
        />
        <output id="compose-out" className="k-compose__buffer">
          <span lang="ja" style={{ fontSize: 'var(--size-body)', color: 'var(--ink)' }}>
            {converted?.kana}
          </span>
          {converted?.buffer ? <span> {converted.buffer}</span> : null}
        </output>
      </div>
      <button
        type="button"
        className="k-btn k-btn--quiet k-press"
        aria-pressed={katakana}
        onClick={() => setKatakana((k) => !k)}
        disabled={Boolean(judged)}
      >
        {katakana ? 'Katakana on' : 'Katakana off'}
      </button>
    </div>
  )
}

/* ── Cloze ──────────────────────────────────────────────────────────
 * Typed by default; the bank is a hint reached by an explicit control.
 * Using it caps the grade at Hard (§6.12). The gap does not resize. */

export function ClozeResponse({
  item,
  value,
  onChange,
  judged,
  onAssisted,
}: ResponseProps) {
  const [bankOpen, setBankOpen] = useState(false)
  const [raw, setRaw] = useState('')

  useEffect(() => {
    if (!bankOpen) onChange(finalise(toKana(raw), false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw])

  return (
    <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
      <p className="k-cloze" lang={item.lang}>
        <span>{item.clozeBefore}</span>
        <input
          className="k-cloze__gap"
          value={String(value)}
          disabled={Boolean(judged)}
          onChange={(e) => {
            setRaw(e.target.value)
            onChange(e.target.value)
          }}
          aria-label="Missing particle"
          autoComplete="off"
        />
        <span>{item.clozeAfter}</span>
      </p>

      {!bankOpen ? (
        <button
          type="button"
          className="k-btn k-btn--quiet k-press"
          disabled={Boolean(judged)}
          onClick={() => {
            setBankOpen(true)
            onAssisted()
          }}
        >
          Show candidates — counts as assisted
        </button>
      ) : (
        <div className="k-bank" role="group" aria-label="Candidate particles">
          {(item.bank ?? []).map((b) => (
            <button
              key={b}
              type="button"
              className="k-token k-press"
              lang={item.lang}
              disabled={Boolean(judged)}
              onClick={() => onChange(b)}
            >
              {b}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Ordering ───────────────────────────────────────────────────────
 * Tap to append, tap again to remove — the single-pointer path that
 * satisfies SC 2.5.7 alongside §8.5's keyboard reorder. The answer row
 * reserves its full height from the start, so adding never grows it. */

export function OrderingResponse({ item, value, onChange, judged }: ResponseProps) {
  const placed = Array.isArray(value) ? value : []
  const pool = (item.tokens ?? []).filter((t) => !placed.includes(t))

  return (
    <div className="k-order">
      <div>
        <p className="k-label" style={{ marginBlockEnd: 'var(--optical)' }}>
          Your answer
        </p>
        <div className="k-order__row k-order__row--answer" role="list">
          {placed.map((t, i) => (
            <button
              key={`${t}-${i}`}
              type="button"
              role="listitem"
              className="k-token k-press"
              lang={item.lang}
              disabled={Boolean(judged)}
              onClick={() => onChange(placed.filter((_, j) => j !== i))}
              aria-label={`${t}, position ${i + 1} of ${placed.length}. Activate to remove.`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="k-label" style={{ marginBlockEnd: 'var(--optical)' }}>
          Available
        </p>
        <div className="k-order__row" role="list">
          {pool.map((t) => (
            <button
              key={t}
              type="button"
              role="listitem"
              className="k-token k-press"
              lang={item.lang}
              disabled={Boolean(judged)}
              onClick={() => onChange([...placed, t])}
              aria-label={`${t}. Activate to add to your answer.`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Map click ──────────────────────────────────────────────────────
 * §9.3B: the non-map path is mandatory, not a fallback. Every map question
 * also presents its candidates as a labelled list of buttons, and a learner
 * who never touches the map completes the module at full credit. */

export function MapResponse(props: ResponseProps) {
  return (
    <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
      <div
        className="k-skeleton"
        style={{ blockSize: '8rem', display: 'grid', placeItems: 'center' }}
        aria-hidden="true"
      >
        <span className="k-meta">Map</span>
      </div>
      <p className="k-body-sm" style={{ color: 'var(--ink-dim)' }}>
        Choose on the map, or from the list — both count the same.
      </p>
      <ChoiceResponse {...props} />
    </div>
  )
}

/* ── Handwriting ────────────────────────────────────────────────────
 * §9.3D. The canvas is aria-hidden with state carried in text beside it;
 * undo per stroke and clear are real buttons. The type is optional and
 * never blocking — a learner turns it off in /me/settings.
 *
 * Grading is shape plus stroke order and direction, which needs a stroke
 * database per character (§12.1). Strokes are captured here; the comparison
 * is a backend call that does not exist yet, so this reports capture state
 * honestly rather than pretending to grade. */

export function HandwritingResponse({ judged, onChange }: ResponseProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [strokes, setStrokes] = useState<Array<Array<[number, number]>>>([])
  const drawing = useRef<Array<[number, number]> | null>(null)

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.strokeStyle = getComputedStyle(document.documentElement)
      .getPropertyValue('--ink')
      .trim()
    ctx.lineWidth = 6
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (const stroke of strokes) {
      ctx.beginPath()
      stroke.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
      ctx.stroke()
    }
  }, [strokes])

  useEffect(() => {
    onChange(String(strokes.length))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes])

  function point(e: React.PointerEvent): [number, number] {
    const r = (e.target as HTMLCanvasElement).getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top]
  }

  return (
    <div style={{ display: 'grid', gap: 'var(--space-1)', justifyItems: 'start' }}>
      <canvas
        ref={canvasRef}
        width={256}
        height={256}
        aria-hidden="true"
        style={{
          border: '1px solid var(--line-strong)',
          background: 'var(--bg-raised)',
          touchAction: 'none',
          inlineSize: '16rem',
          blockSize: '16rem',
        }}
        onPointerDown={(e) => {
          if (judged) return
          // §7.3: pointer capture on every drag.
          ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
          const stroke: Array<[number, number]> = [point(e)]
          drawing.current = stroke
          setStrokes((s) => [...s, stroke])
        }}
        onPointerMove={(e) => {
          const stroke = drawing.current
          if (!stroke) return
          stroke.push(point(e))
          // Replace the in-progress stroke by identity so the redraw runs.
          setStrokes((s) => [...s.slice(0, -1), [...stroke]])
        }}
        onPointerUp={() => {
          drawing.current = null
        }}
        onPointerCancel={() => {
          // §7.3: pointercancel reverts to the pre-drag state.
          if (drawing.current) setStrokes((s) => s.slice(0, -1))
          drawing.current = null
        }}
      />
      {/* State in real text, since the canvas is not exposed to AT. */}
      <p className="k-body-sm" role="status">
        {strokes.length === 0
          ? 'Nothing drawn yet.'
          : `${strokes.length} stroke${strokes.length === 1 ? '' : 's'} drawn.`}
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
        <button
          type="button"
          className="k-btn k-btn--secondary k-press"
          disabled={Boolean(judged) || strokes.length === 0}
          onClick={() => setStrokes((s) => s.slice(0, -1))}
        >
          Undo stroke
        </button>
        <button
          type="button"
          className="k-btn k-btn--quiet k-press"
          disabled={Boolean(judged) || strokes.length === 0}
          onClick={() => setStrokes([])}
        >
          Clear
        </button>
      </div>
    </div>
  )
}

export function Response(props: ResponseProps) {
  switch (props.spec.response) {
    case 'choice':
      return <ChoiceResponse {...props} />
    case 'text':
      return <TextResponse {...props} />
    case 'cloze':
      return <ClozeResponse {...props} />
    case 'ordering':
      return <OrderingResponse {...props} />
    case 'map':
      return <MapResponse {...props} />
    case 'handwriting':
      return <HandwritingResponse {...props} />
    case 'none':
    default:
      return null
  }
}
