'use client'

/* Response controls — design_system.md §6.12, widened by complete_modules.md.
 *
 * The closed set is: none · choice · text · cloze · ordering · map ·
 * handwriting · speech. Nothing else may be invented per module type; a new
 * type picks one of these or the set is reopened deliberately.
 *
 * Every control here obeys three rules:
 *   1. It reports its value up. It never grades — grading is lib/grading.ts,
 *      because a control that decides whether it was right will eventually
 *      disagree with the server that also decided.
 *   2. Its POST-JUDGEMENT state is the same size as its pre-judgement state.
 *      Marks are drawn on the controls that already existed (§6.10).
 *   3. It is fully operable from the keyboard, including the ones whose
 *      primary gesture is a drag or a click on a map (SC 2.5.7, 2.1.1).
 */

import { useId, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'motion/react'
import type { Judgement, ModuleItem } from '@/lib/api/types'
import type { ModuleTypeSpec } from '@/lib/modules/registry'
import { RomajiInput, Ruby } from './Japanese'
import { spring } from '@/lib/motion'

/* Both are client-only: one measures a canvas, the other reaches for
 * Leaflet's window-bound globals. They are also the two heaviest controls in
 * the set, and most sessions contain neither. */
const MapResponse = dynamic(() => import('./MapResponse').then((m) => m.MapResponse), {
  ssr: false,
  loading: () => <span className="k-map-skeleton" aria-label="Loading the map" />,
})
const Handwriting = dynamic(() => import('./Handwriting').then((m) => m.Handwriting), {
  ssr: false,
  loading: () => <p className="k-meta">Loading the writing pad…</p>,
})
const SpeechResponse = dynamic(() => import('./SpeechResponse').then((m) => m.SpeechResponse), {
  ssr: false,
  loading: () => <p className="k-meta">Loading the recorder…</p>,
})

export type ResponseValue = string | string[]

export interface ResponseProps {
  item: ModuleItem
  spec: ModuleTypeSpec
  value: ResponseValue
  onChange: (v: ResponseValue) => void
  /** Non-null once the attempt has been marked; controls go read-only. */
  judged: Judgement | null
  /** True once a self-graded response has been revealed. */
  revealed?: boolean
  /** Raised when the learner used a hint bank — caps the grade at Hard. */
  onAssisted: () => void
  /** The double-tap / Enter accelerator: commit without leaving the control. */
  onCommit: () => void
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
      return <Handwriting {...props} />
    case 'speech':
      return <SpeechResponse {...props} />
    default:
      return null
  }
}

/* ── Choice ──────────────────────────────────────────────────────────
 * Select, then Check. Not select-to-answer: the first version of this in
 * Common Sage locked on first click, which turns a misclick into a wrong
 * answer and a scheduling penalty. The accelerator for people who find that
 * slow is a second click on the same option, which commits — so the fast
 * path costs one extra tap and the slow path costs nothing.
 *
 * A radiogroup, not buttons: arrow keys move between options and Space
 * selects, which is what a screen-reader user expects from a single choice
 * and what §8 requires. */

function ChoiceResponse({ item, value, onChange, judged, onCommit }: ResponseProps) {
  const options = item.options ?? []
  const name = useId()
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const selected = typeof value === 'string' ? value : ''

  // A set of short CJK options tiles as glyphs rather than stacking as
  // full-width bars — §4.3's floors make a 40px glyph the readable size.
  const glyphs = options.every((o) => o.length <= 3 && /[぀-ヿ一-龯]/.test(o))

  return (
    <div
      role="radiogroup"
      aria-label="Answer"
      className={glyphs ? 'k-options k-options--glyph' : 'k-options'}
    >
      {options.map((opt, index) => {
        const isSelected = selected === opt
        const isAnswer = judged !== null && opt === judged.answer
        const isWrongPick = judged !== null && isSelected && opt !== judged.answer

        return (
          <button
            key={opt}
            type="button"
            role="radio"
            name={name}
            aria-checked={isSelected}
            tabIndex={isSelected || (!selected && index === 0) ? 0 : -1}
            ref={(node) => {
              optionRefs.current[index] = node
            }}
            disabled={judged !== null}
            className={[
              'k-option',
              'k-press',
              isAnswer ? 'k-option--ok' : '',
              isWrongPick ? 'k-option--err' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            data-selected={isSelected ? 'true' : undefined}
            onClick={() => {
              if (judged !== null) return
              if (isSelected) onCommit()
              else onChange(opt)
            }}
            onKeyDown={(event) => {
              if (judged !== null) return
              const last = options.length - 1
              let next: number | null = null
              if (event.key === 'ArrowDown' || event.key === 'ArrowRight')
                next = Math.min(last, index + 1)
              if (event.key === 'ArrowUp' || event.key === 'ArrowLeft')
                next = Math.max(0, index - 1)
              if (event.key === 'Home') next = 0
              if (event.key === 'End') next = last
              if (next !== null) {
                event.preventDefault()
                onChange(options[next])
                optionRefs.current[next]?.focus()
              }
              if (event.key === 'Enter') {
                event.preventDefault()
                if (isSelected) onCommit()
                else onChange(opt)
              }
            }}
          >
            <span className={glyphs ? 'k-glyph-option' : undefined} lang={item.lang}>
              {opt}
            </span>
            {/* §3.3: the verdict is never colour alone. */}
            {isAnswer ? <span className="k-meta">correct</span> : null}
            {isWrongPick ? <span className="k-meta">your answer</span> : null}
          </button>
        )
      })}
    </div>
  )
}

/* ── Text ────────────────────────────────────────────────────────────
 * One field, sized to what is being asked for. A prose answer in a
 * single-line input is the mistake the last pass made: `grammar_production`
 * asks for a sentence and got a box one line tall with the start of the
 * answer scrolled out of sight. Tolerance decides the shape — `tolerant`
 * means the answer is meaning in prose, which is multiline. */

function TextResponse({ item, spec, value, onChange, judged, onCommit }: ResponseProps) {
  const id = useId()
  const text = typeof value === 'string' ? value : ''
  const japanese = item.lang === 'ja' && spec.tolerance === 'exact'
  const prose = spec.tolerance === 'tolerant'

  return (
    <div className="k-field">
      <label className="k-field__label" htmlFor={id}>
        Your answer
      </label>

      {japanese ? (
        <RomajiInput
          id={id}
          value={text}
          onChange={onChange}
          onCommit={onCommit}
          disabled={judged !== null}
          multiline={prose}
          describedBy={`${id}-hint`}
        />
      ) : prose ? (
        <textarea
          id={id}
          className="k-textarea"
          rows={3}
          value={text}
          disabled={judged !== null}
          aria-describedby={`${id}-hint`}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={id}
          className="k-input"
          value={text}
          disabled={judged !== null}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-describedby={`${id}-hint`}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onCommit()
            }
          }}
        />
      )}

      {/* §6.12: tolerance is declared, and declared BEFORE the attempt.
          A learner who knows spelling counts here types differently. */}
      <p className="k-field__hint" id={`${id}-hint`}>
        {spec.tolerance === 'exact' ? 'Exact spelling' : 'Near matches accepted'}
      </p>
    </div>
  )
}

/* ── Cloze ───────────────────────────────────────────────────────────
 * The sentence stays whole and the gap sits in it, because a cloze whose
 * sentence is above and whose input is below is not a cloze, it is a
 * question with context. Typed, with an optional hint bank; taking a hint
 * raises `assisted`, which caps the grade at Hard rather than voiding it. */

function ClozeResponse({ item, value, onChange, judged, onAssisted, onCommit }: ResponseProps) {
  const id = useId()
  const text = typeof value === 'string' ? value : ''
  const [bankOpen, setBankOpen] = useState(false)
  const bank = item.bank ?? []

  return (
    <div className="k-cloze">
      {/* A div, not a p: RomajiInput renders its "reads as" line as a
          paragraph, and a <p> inside a <p> is invalid — the browser closes
          the outer one and the sentence breaks in half mid-gap. */}
      <div className={item.lang === 'ja' ? 'k-ja' : undefined} lang={item.lang}>
        <span>{item.clozeBefore}</span>
        <label className="k-cloze__gap">
          <span className="k-sr">Missing word</span>
          {item.lang === 'ja' ? (
            <RomajiInput
              id={id}
              value={text}
              onChange={onChange}
              onCommit={onCommit}
              disabled={judged !== null}
            />
          ) : (
            <input
              id={id}
              className="k-input"
              value={text}
              disabled={judged !== null}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  onCommit()
                }
              }}
            />
          )}
        </label>
        <span>{item.clozeAfter}</span>
      </div>

      {bank.length > 0 && judged === null ? (
        <div className="k-bank">
          <button
            type="button"
            className="k-btn k-btn--quiet k-press"
            aria-expanded={bankOpen}
            onClick={() => setBankOpen((o) => !o)}
          >
            {bankOpen ? 'Hide the options' : 'Show the options'}
          </button>
          {/* Stated at the control, before it is pressed — the same rule the
              Reveal control follows (§6.10). */}
          <span className="k-meta">Hint used · maximum Hard</span>
          {bankOpen ? (
            <ul>
              {bank.map((word) => (
                <li key={word}>
                  <button
                    type="button"
                    className="k-token k-press"
                    lang={item.lang}
                    onClick={() => {
                      onAssisted()
                      onChange(word)
                    }}
                  >
                    {word}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

/* ── Ordering ────────────────────────────────────────────────────────
 * Two module types share this: `sentence_scramble` (tap chunks into place)
 * and `timeline_drag_exercise` (drag events between Earlier and Later).
 *
 * Drag is the primary gesture and it is NOT the only one. Every row carries
 * explicit Move up / Move down buttons — SC 2.5.7 wants a non-drag path, and
 * the catalogue names those buttons directly. Tapping a token in the bank
 * appends it; tapping a placed token removes it.
 */

function OrderingResponse({ item, spec, value, onChange, judged }: ResponseProps) {
  const tokens = useMemo(() => item.tokens ?? [], [item.tokens])
  const timeline = spec.id === 'timeline_drag_exercise'

  /* The timeline variant starts fully placed — its exercise is reordering,
   * not selecting. That was an effect that ran on mount, which meant the
   * MEASURING pass (which renders with an empty value and never commits an
   * effect's result) sized the band for an empty list and the real card
   * overflowed it. Deriving it makes both passes see the same thing. */
  const raw = Array.isArray(value) ? value : []
  const placed = timeline && raw.length === 0 ? tokens : raw
  const remaining = useMemo(() => {
    const left = [...tokens]
    for (const p of placed) {
      const at = left.indexOf(p)
      if (at !== -1) left.splice(at, 1)
    }
    return left
  }, [tokens, placed])

  const dragIndex = useRef<number | null>(null)
  const correct = item.answer.split('|')

  const move = (from: number, to: number) => {
    if (to < 0 || to >= placed.length) return
    const next = [...placed]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange(next)
  }

  return (
    <div className="k-order">
      {timeline ? <p className="k-meta">Earlier</p> : null}

      <ol aria-label="Your order">
        {placed.map((token, i) => {
          // Post-judgement, each position says whether it is where it belongs.
          const right = judged !== null && correct[i] === token
          return (
            <motion.li
              key={occurrenceKey(placed, i)}
              layout
              transition={spring.drag}
              className={[
                'k-order__row',
                judged !== null ? (right ? 'k-option--ok' : 'k-option--err') : '',
              ]
                .filter(Boolean)
                .join(' ')}
              draggable={judged === null}
              onDragStart={() => (dragIndex.current = i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                if (dragIndex.current !== null) move(dragIndex.current, i)
                dragIndex.current = null
              }}
            >
              <span lang={item.lang}>{token}</span>

              {judged === null ? (
                <span className="k-order__grip">
                  <button
                    type="button"
                    className="k-btn k-btn--quiet k-press"
                    disabled={i === 0}
                    onClick={() => move(i, i - 1)}
                  >
                    <span aria-hidden="true">↑</span>
                    <span className="k-sr">{`Move "${token}" up`}</span>
                  </button>
                  <button
                    type="button"
                    className="k-btn k-btn--quiet k-press"
                    disabled={i === placed.length - 1}
                    onClick={() => move(i, i + 1)}
                  >
                    <span aria-hidden="true">↓</span>
                    <span className="k-sr">{`Move "${token}" down`}</span>
                  </button>
                  {!timeline ? (
                    <button
                      type="button"
                      className="k-btn k-btn--quiet k-press"
                      onClick={() => onChange(placed.filter((_, j) => j !== i))}
                    >
                      <span aria-hidden="true">×</span>
                      <span className="k-sr">{`Remove "${token}"`}</span>
                    </button>
                  ) : null}
                </span>
              ) : (
                <span className="k-meta">{right ? 'in place' : 'out of place'}</span>
              )}
            </motion.li>
          )
        })}
      </ol>

      {timeline ? <p className="k-meta">Later</p> : null}

      {/* The bank. Empty for the timeline variant, which never has one. */}
      {!timeline && judged === null ? (
        <ul className="k-bank" aria-label="Chunks to place">
          {remaining.map((token, i) => (
            <li key={`${token}-${i}`}>
              <button
                type="button"
                className="k-token k-press"
                lang={item.lang}
                onClick={() => onChange([...placed, token])}
              >
                {item.lang === 'ja' ? <span className="k-ja">{token}</span> : token}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Shuffle is a response-local control, not a band slot: the band's
          four slots are spoken for, and shuffling is part of composing an
          answer rather than submitting one. */}
      {timeline && judged === null ? (
        <button
          type="button"
          className="k-btn k-btn--quiet k-press"
          onClick={() => onChange(shuffle(placed))}
        >
          Shuffle
        </button>
      ) : null}
    </div>
  )
}

function shuffle<T>(items: T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function occurrenceKey(items: string[], index: number): string {
  const token = items[index]
  const occurrence = items.slice(0, index).filter((item) => item === token).length
  return `${token}-${occurrence}`
}

/** Ruby-aware prompt text, shared by the frame and the measurer. */
export function PromptText({ item }: { item: ModuleItem }) {
  if (item.promptRuby) return <Ruby segments={item.promptRuby} />
  return (
    <span lang={item.lang} className={item.lang === 'ja' ? 'k-ja' : undefined}>
      {item.prompt}
    </span>
  )
}
