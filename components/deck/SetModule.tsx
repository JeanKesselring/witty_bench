'use client'

/* Sets — canonical `flashcard` or `quiz` items carrying several cards.
 *
 * complete_modules.md dedupes these deliberately: a set is presentation data,
 * not a second module type. So
 * this file owns the SEQUENCE and nothing else — each card in the set is
 * rendered by the ordinary ModuleFrame, with the ordinary controls, judged by
 * the ordinary grader. If a set card ever looked or behaved differently from
 * its single-card twin, that would be the bug.
 *
 * What the sequence adds, all of it from the catalogue:
 *   · Prev / Next / go-to-card-n, wrapping, each new card starting at its
 *     front (§1 "Navigation wraps and resets the new card to its front").
 *   · For quizzes: number correct, percentage, one of four result messages,
 *     a per-question review, and Try Again.
 *   · One aggregate outcome for the scheduler when the set is finished.
 *
 * Geometry is unchanged. The nav sits inside the prompt band, which is
 * measured with it present, so the bands and the control band are where they
 * are on every other card in the session.
 */

import { useState } from 'react'
import type { Grade, ModuleItem } from '@/lib/api/types'
import { moduleTypeOrDefault } from '@/lib/modules/registry'
import { ModuleFrame, type Outcome } from './ModuleFrame'

export function hasSet(item: ModuleItem): boolean {
  return (item.cards?.length ?? 0) > 1
}

interface Done {
  index: number
  grade: Grade
  correct: boolean
}

export function SetModule({
  item,
  onResolve,
  onSkip,
}: {
  item: ModuleItem
  onResolve: (o: Outcome) => void
  onSkip: () => void
}) {
  const cards = item.cards ?? []
  const spec = moduleTypeOrDefault(item.moduleType)
  const graded = spec.response === 'choice'

  const [index, setIndex] = useState(0)
  const [done, setDone] = useState<Done[]>([])
  const [showResults, setShowResults] = useState(false)
  const [run, setRun] = useState(0)

  const card = cards[index]

  /* One card of the set, expressed as an ordinary module. The frame has no
   * idea it is in a set, which is the point. */
  const asItem: ModuleItem = {
    ...item,
    prompt: card.prompt,
    answer: card.answer,
    acceptedAnswers: card.acceptedAnswers ?? item.acceptedAnswers,
    promptRuby: card.promptRuby,
    answerRuby: card.answerRuby,
    options: card.options ?? item.options,
    // The catalogue's "display an explanation when supplied" — carried on the
    // judgement rather than added as a fifth row, so geometry is untouched.
    explanation: card.explanation,
    examples: card.examples ?? item.examples,
    cards: undefined,
  }

  const go = (next: number) => {
    // Wraps, and the new card starts at its front — which the remount does.
    setIndex((next + cards.length) % cards.length)
    setRun((r) => r + 1)
  }

  const record = (o: Outcome) => {
    const entry: Done = {
      index,
      grade: o.grade,
      correct: o.judgement ? o.judgement.outcome === 'correct' : o.grade !== 'again',
    }
    const all = [...done.filter((d) => d.index !== index), entry]
    setDone(all)

    if (all.length === cards.length) {
      if (graded) setShowResults(true)
      else finish(all)
    } else {
      // Advance to the first card that has not been answered yet.
      const nextUnanswered = cards.findIndex((_, i) => !all.some((d) => d.index === i))
      go(nextUnanswered === -1 ? index + 1 : nextUnanswered)
    }
  }

  /* The set emits ONE grade, and it is the worst one in the set. A learner
   * who missed two of five has not learned this topic well enough for the
   * scheduler to lengthen the interval, and averaging would hide exactly the
   * card they need to see again. */
  const finish = (all: Done[]) => {
    const order: Grade[] = ['again', 'hard', 'good', 'easy']
    const worst = all.reduce<Grade>(
      (acc, d) => (order.indexOf(d.grade) < order.indexOf(acc) ? d.grade : acc),
      'easy',
    )
    onResolve({ grade: worst, assisted: false })
  }

  if (showResults) {
    const correct = done.filter((d) => d.correct).length
    const pct = Math.round((correct / cards.length) * 100)
    return (
      <section className="k-frame k-frame--results" aria-label="Results">
        <header className="k-frame__header">
          <span className="k-frame__type">Results</span>
          <span className="k-frame__topic">{item.topicTitle}</span>
        </header>

        <div className="k-frame__prompt">
          <p className="k-h3">
            {correct} of {cards.length} correct · {pct}%
          </p>
          <p>{message(pct)}</p>
        </div>

        <div className="k-frame__response" tabIndex={0} aria-label="Per-question review">
          <ol className="k-results">
            {cards.map((c, i) => {
              const d = done.find((x) => x.index === i)
              return (
                <li key={i} className={d?.correct ? 'k-option--ok' : 'k-option--err'}>
                  <span>{c.prompt}</span>
                  <span className="k-meta">{d?.correct ? 'correct' : c.answer}</span>
                </li>
              )
            })}
          </ol>
        </div>

        <div className="k-band" role="group" aria-label="Card controls">
          <button
            type="button"
            className="k-btn k-btn--quiet k-press"
            onClick={() => {
              setDone([])
              setShowResults(false)
              go(0)
            }}
          >
            Try again
            <span className="k-meta">not graded</span>
          </button>
          <button
            type="button"
            className="k-btn k-btn--primary k-press"
            onClick={() => finish(done)}
          >
            Continue
          </button>
        </div>
      </section>
    )
  }

  return (
    <ModuleFrame
      key={`${item.id}-${index}-${run}`}
      item={asItem}
      onResolve={record}
      onSkip={onSkip}
      nav={
        <div className="k-setnav">
          <button
            type="button"
            className="k-btn k-btn--quiet k-press"
            onClick={() => go(index - 1)}
          >
            <span aria-hidden="true">‹</span>
            <span className="k-sr">Previous card</span>
          </button>

          <button
            type="button"
            className="k-btn k-btn--quiet k-press"
            onClick={() => go(index + 1)}
          >
            <span aria-hidden="true">›</span>
            <span className="k-sr">Next card</span>
          </button>

          <span className="k-meta">
            {index + 1} of {cards.length}
          </span>
        </div>
      }
    />
  )
}

/** The catalogue's four result messages, and its thresholds. */
function message(pct: number): string {
  if (pct === 100) return 'Perfect score!'
  if (pct >= 80) return 'Great job!'
  if (pct >= 50) return 'Good effort!'
  return 'Keep practising!'
}
