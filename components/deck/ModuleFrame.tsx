'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Grade, Judgement, ModuleItem } from '@/lib/api/types'
import { moduleTypeOrDefault } from '@/lib/modules/registry'
import { Response, evaluate, isAnswered, type AnswerValue } from './Responses'

/* §6.10 Module frame. Four bands, fixed heights, chosen once per session and
 * held for every card in it. Revealing an answer never resizes anything —
 * the response band already reserved the space. The judgement renders inside
 * the response band, so it cannot push the controls. */

export interface Outcome {
  grade: Grade
  assisted: boolean
  judgement: Judgement | null
}

const RATINGS: Array<{ grade: Grade; label: string }> = [
  { grade: 'again', label: 'Again' },
  { grade: 'hard', label: 'Hard' },
  { grade: 'good', label: 'Good' },
  { grade: 'easy', label: 'Easy' },
]

export function ModuleFrame({
  item,
  onResolve,
  onSkip,
}: {
  item: ModuleItem
  onResolve: (o: Outcome) => void
  onSkip: () => void
}) {
  const spec = moduleTypeOrDefault(item.moduleType)
  const selfGraded = spec.response === 'none'

  const [value, setValue] = useState<AnswerValue>(spec.response === 'ordering' ? [] : '')
  const [judged, setJudged] = useState<Judgement | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [assisted, setAssisted] = useState(false)
  const frameRef = useRef<HTMLDivElement | null>(null)

  // Reset when the card changes — geometry stays, state does not.
  useEffect(() => {
    setValue(spec.response === 'ordering' ? [] : '')
    setJudged(null)
    setRevealed(false)
    setAssisted(false)
  }, [item.id, spec.response])

  const check = useCallback(() => {
    if (judged || selfGraded) return
    if (!isAnswered(spec, value)) return
    setJudged(evaluate(item, spec, value))
  }, [item, spec, value, judged, selfGraded])

  const reveal = useCallback(() => {
    if (selfGraded) {
      setRevealed(true)
      return
    }
    // §6.10: on an objectively graded type, Reveal means giving up and
    // counts as Again. The control says so before it is pressed.
    setJudged({ outcome: 'incorrect', answer: item.answer })
    setRevealed(true)
  }, [item.answer, selfGraded])

  const advance = useCallback(
    (grade?: Grade) => {
      if (selfGraded) {
        if (!grade) return
        onResolve({ grade, assisted, judgement: null })
        return
      }
      if (!judged) return
      const auto: Grade =
        revealed || judged.outcome === 'incorrect'
          ? 'again'
          : judged.outcome === 'partial' || assisted
            ? 'hard'
            : 'good'
      onResolve({ grade: auto, assisted, judgement: judged })
    },
    [selfGraded, judged, revealed, assisted, onResolve],
  )

  /* §6.10 keyboard loop: Enter checks, Space advances. Two keys, so a
   * repeated Enter can never carry a learner past a judgement they have
   * not read. Space collides with Toggle (§7.1) and the collision is
   * resolved by focus: where focus is inside a control that consumes
   * Space, Space toggles it and nothing else. */
  function consumesSpace(el: Element | null): boolean {
    if (!el) return false
    const tag = el.tagName.toLowerCase()
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
    if (tag === 'button' || el.getAttribute('role') === 'radio') return true
    return false
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const root = frameRef.current
      if (!root || !root.contains(document.activeElement)) return

      if (e.key === 'Enter') {
        if (!judged && !selfGraded) {
          e.preventDefault()
          check()
        } else if (selfGraded && !revealed) {
          e.preventDefault()
          reveal()
        }
        return
      }

      if (e.key === ' ') {
        if (consumesSpace(document.activeElement)) return
        e.preventDefault()
        advance()
        return
      }

      // §8.8: the system's only single-character shortcuts. Module-scoped,
      // after reveal, and each maps to a visible control.
      if (selfGraded && revealed && /^[1-4]$/.test(e.key)) {
        e.preventDefault()
        advance(RATINGS[Number(e.key) - 1].grade)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [check, reveal, advance, judged, selfGraded, revealed])

  const canCheck = isAnswered(spec, value)
  const showRatings = selfGraded && revealed

  return (
    <article
      ref={frameRef}
      className="k-frame"
      aria-label={`${spec.id.replace(/_/g, ' ')} module`}
      style={{ '--accent': `var(--accent-${spec.contentType})` } as React.CSSProperties}
    >
      {/* HEADER — 1 cell. Type always; topic per §6.14's topic rule. */}
      <header className="k-frame__header">
        <span className="k-frame__type">{spec.contentType}</span>
        {spec.showTopic ? (
          <span className="k-frame__topic">{item.topicTitle}</span>
        ) : (
          // The slot is reserved whether or not the type fills it, so the
          // band never changes height and ⋯ never moves (§6.10).
          <span className="k-frame__topic" aria-hidden="true" />
        )}
        <button type="button" className="k-btn k-btn--quiet k-press" aria-label="Module options">
          ⋯
        </button>
      </header>

      {/* PROMPT — fixed per session. */}
      <div className="k-frame__prompt">
        <p lang={item.lang}>{item.prompt}</p>
      </div>

      {/* RESPONSE — fixed per session. The judgement renders in here, not
          appended below it, so it cannot push the controls. */}
      <div className="k-frame__response">
        {selfGraded ? (
          revealed ? (
            <p className="k-h3" lang={item.lang}>
              {item.answer}
            </p>
          ) : (
            <p className="k-body-sm" style={{ color: 'var(--ink-faint)' }}>
              Recall the answer, then reveal it.
            </p>
          )
        ) : (
          <Response
            item={item}
            spec={spec}
            value={value}
            onChange={setValue}
            judged={judged}
            onAssisted={() => setAssisted(true)}
            onCommit={check}
          />
        )}

        {judged ? <JudgementBanner judgement={judged} lang={item.lang} /> : null}
      </div>

      {/* CONTROLS — 1 cell, four slots, never moves. */}
      <div className="k-band">
        {showRatings ? (
          RATINGS.map((r, i) => (
            <button
              key={r.grade}
              type="button"
              className="k-btn k-btn--secondary k-btn--study k-press k-band__slot"
              onClick={() => advance(r.grade)}
            >
              {r.label}
              <span className="k-visually-hidden"> — shortcut {i + 1}</span>
            </button>
          ))
        ) : (
          <>
            <button
              type="button"
              className="k-btn k-btn--quiet k-btn--study k-press k-band__slot"
              onClick={reveal}
              disabled={Boolean(judged)}
              // §6.10: the control states what it costs before it is pressed.
              title={selfGraded ? undefined : 'Counts as Again'}
            >
              Reveal
              {!selfGraded ? (
                <span className="k-visually-hidden"> — counts as Again</span>
              ) : null}
            </button>
            <button
              type="button"
              className="k-btn k-btn--quiet k-btn--study k-press k-band__slot"
              onClick={onSkip}
            >
              Skip
            </button>
            {/* The empty third slot holds the position Good will occupy. */}
            <span className="k-band__slot" aria-hidden="true" />
            {judged ? (
              <button
                type="button"
                className="k-btn k-btn--primary k-btn--study k-press k-band__slot"
                onClick={() => advance()}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                className="k-btn k-btn--primary k-btn--study k-press k-band__slot"
                onClick={selfGraded ? reveal : check}
                aria-disabled={!selfGraded && !canCheck}
              >
                {selfGraded ? 'Reveal' : 'Check'}
              </button>
            )}
          </>
        )}
      </div>
    </article>
  )
}

/* §3.3: colour is never the sole channel — glyph, rule and text alongside
 * hue. §11.6: the correct answer is ALWAYS shown after an incorrect
 * response, never just "wrong". §9.4: judgement is the assertive region. */

function JudgementBanner({
  judgement,
  lang,
}: {
  judgement: Judgement
  lang?: string
}) {
  const tone =
    judgement.outcome === 'correct'
      ? 'ok'
      : judgement.outcome === 'partial'
        ? 'warn'
        : 'err'
  const glyph =
    judgement.outcome === 'correct' ? '✓' : judgement.outcome === 'partial' ? '~' : '✕'

  return (
    <div className={`k-judge k-judge--${tone}`} role="alert">
      <p>
        <span aria-hidden="true">{glyph} </span>
        {judgement.outcome === 'correct'
          ? 'Correct'
          : judgement.outcome === 'partial'
            ? 'Partly right'
            : 'Not quite'}
      </p>
      {judgement.outcome !== 'correct' ? (
        <p>
          The answer is{' '}
          <strong lang={lang}>{judgement.answer}</strong>
          {judgement.note ? ` — ${judgement.note}` : ''}
        </p>
      ) : null}
    </div>
  )
}
