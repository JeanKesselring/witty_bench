'use client'

import { useMemo, useState } from 'react'
import type { Grade, ModuleItem } from '@/lib/api/types'
import { DIMENSIONS, PLAN, type Dimension, type PlanItem } from '@/lib/api/jkg'
import { ModuleFrame, type Outcome } from '@/components/deck/ModuleFrame'

type Phase = 'plan' | 'study' | 'summary'

export function DailyLesson() {
  const [phase, setPhase] = useState<Phase>('plan')
  const [items, setItems] = useState<PlanItem[]>(PLAN.items)
  const [run, setRun] = useState<PlanItem[]>([])
  const [cursor, setCursor] = useState(0)
  const [done, setDone] = useState<Array<{ name: string; grade: Grade }>>([])

  const active = items.filter((item) => !item.suppressed)
  const counts = countsByDimension(active)
  const modules = useMemo(() => run.map(toModule), [run])
  const current = modules[cursor]

  const resolve = (outcome: Outcome) => {
    setDone((currentDone) => [
      ...currentDone,
      { name: run[cursor]?.name ?? '', grade: outcome.grade },
    ])
    if (cursor + 1 < modules.length) setCursor((currentCursor) => currentCursor + 1)
    else setPhase('summary')
  }

  if (phase === 'study') {
    return (
      <section className="k-lesson-card k-lesson-card--runner" aria-label="Today’s lesson">
        <header className="k-lesson-card__head">
          <div>
            <p className="k-meta">Today · {PLAN.theme}</p>
            <h2 className="k-h2">Your lesson</h2>
          </div>
          <p className="k-meta" aria-live="polite">
            {cursor + 1} / {modules.length}
          </p>
        </header>

        {current ? (
          <ModuleFrame
            key={current.id}
            item={current}
            onResolve={resolve}
            onSkip={() =>
              cursor + 1 < modules.length
                ? setCursor((currentCursor) => currentCursor + 1)
                : setPhase('summary')
            }
          />
        ) : (
          <p>There are no items in today’s lesson.</p>
        )}

        <div className="k-actions">
          <button
            type="button"
            className="k-btn k-btn--quiet k-press"
            disabled={cursor === 0}
            onClick={() => setCursor((currentCursor) => currentCursor - 1)}
          >
            Previous card
          </button>
        </div>
      </section>
    )
  }

  if (phase === 'summary') {
    return (
      <section className="k-lesson-card" aria-label="Lesson summary">
        <header className="k-lesson-card__head">
          <div>
            <p className="k-meta">Today · {PLAN.theme}</p>
            <h2 className="k-h2">Lesson complete</h2>
          </div>
          <p>{done.length} cards</p>
        </header>
        <p>
          You worked with {new Set(done.map((item) => item.name)).size} concepts. The same topic mix
          can carry into reading, listening, read-aloud practice, and the language tutor.
        </p>
        <div className="k-actions">
          <a className="k-btn k-btn--secondary k-press" href="/japanese/read">
            Read with this topic
          </a>
          <a className="k-btn k-btn--secondary k-press" href="/japanese/listen">
            Listen with this topic
          </a>
          <button
            type="button"
            className="k-btn k-btn--primary k-press"
            onClick={() => {
              setCursor(0)
              setDone([])
              setPhase('plan')
            }}
          >
            Back to today
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="k-lesson-card" aria-label="Today’s plan">
      <header className="k-lesson-card__head">
        <div>
          <p className="k-meta">Today’s topic</p>
          <h2 className="k-h2">{PLAN.theme}</h2>
          <p>{PLAN.goal}</p>
        </div>
      </header>

      <section className="k-lesson-counts" aria-label="Items by area">
        {DIMENSIONS.map((dimension) => (
          <div className="k-count-row" key={dimension}>
            <span className="k-count-row__label">{dimension}</span>
            <button
              type="button"
              className="k-cell-button k-press"
              onClick={() => setItems((currentItems) => removeOne(currentItems, dimension))}
            >
              <span aria-hidden="true">−</span>
              <span className="k-sr">Remove one {dimension} item</span>
            </button>
            <output aria-label={`${counts[dimension]} ${dimension} items`}>
              {counts[dimension]}
            </output>
            <button
              type="button"
              className="k-cell-button k-press"
              onClick={() => setItems((currentItems) => addOne(currentItems, dimension))}
            >
              <span aria-hidden="true">+</span>
              <span className="k-sr">Add one {dimension} item</span>
            </button>
          </div>
        ))}
      </section>

      <ul className="k-planlist k-planlist--lesson">
        {items.map((item) => (
          <li key={item.conceptId} data-suppressed={item.suppressed ?? undefined}>
            <span className="k-planlist__word">
              <span lang="ja" className="k-ja">
                {item.name}
              </span>
              <small className="k-meta">
                {item.reading ? `${item.reading} · ` : ''}
                {item.meaning}
              </small>
            </span>
            <span className="k-planlist__acts">
              {item.suppressed ? (
                <button
                  type="button"
                  className="k-btn k-btn--secondary k-press k-plan-action"
                  onClick={() =>
                    setItems((currentItems) => suppress(currentItems, item.conceptId, undefined))
                  }
                >
                  Put back
                </button>
              ) : (
                <button
                  type="button"
                  className="k-btn k-btn--secondary k-press k-plan-action"
                  onClick={() => {
                    // Knowledge evidence is emitted independently from the
                    // temporary plan composition. Put back does not retract it.
                    markKnown(item.conceptId)
                    setItems((currentItems) => suppress(currentItems, item.conceptId, 'known'))
                  }}
                >
                  <span aria-hidden="true">✓</span>
                  Already know
                </button>
              )}
              <button
                type="button"
                className="k-btn k-btn--secondary k-press k-plan-action"
                onClick={() => setItems((currentItems) => reroll(currentItems, item.conceptId))}
              >
                <span aria-hidden="true">↻</span>
                Reroll
              </button>
            </span>
          </li>
        ))}
      </ul>

      <footer className="k-lesson-card__foot">
        <button
          type="button"
          className="k-btn k-btn--primary k-btn--study k-press"
          disabled={active.length === 0}
          onClick={() => {
            setRun(active)
            setCursor(0)
            setDone([])
            setPhase('study')
          }}
        >
          Start today’s lesson
        </button>
      </footer>
    </section>
  )
}

function countsByDimension(items: PlanItem[]): Record<Dimension, number> {
  const out = { kana: 0, vocabulary: 0, kanji: 0, grammar: 0 }
  for (const item of items) out[item.dimension]++
  return out
}

function addOne(items: PlanItem[], dimension: Dimension): PlanItem[] {
  const missing = PLAN.items.find(
    (item) =>
      item.dimension === dimension &&
      !items.some((currentItem) => currentItem.conceptId === item.conceptId),
  )
  return missing ? [...items, missing] : items
}

function removeOne(items: PlanItem[], dimension: Dimension): PlanItem[] {
  const last = [...items].reverse().find((item) => item.dimension === dimension && !item.suppressed)
  return last ? items.filter((item) => item !== last) : items
}

function suppress(items: PlanItem[], id: string, how: PlanItem['suppressed']): PlanItem[] {
  return items.map((item) => (item.conceptId === id ? { ...item, suppressed: how } : item))
}

/** In production this is the mastery-network mutation. It is deliberately
 * separate from the row's suppression state: changing the visible plan later
 * must never retract evidence that the learner already knew the concept. */
function markKnown(id: string): void {
  window.dispatchEvent(new CustomEvent('common-sage:concept-known', { detail: { conceptId: id } }))
}

const REROLL_ALTERNATES: PlanItem[] = [
  {
    conceptId: 'c-kaisatsu',
    dimension: 'vocabulary',
    name: '改札',
    reading: 'かいさつ',
    meaning: 'ticket gate',
    due: false,
  },
  {
    conceptId: 'c-homu',
    dimension: 'vocabulary',
    name: 'ホーム',
    meaning: 'platform',
    due: false,
  },
  {
    conceptId: 'c-kanji-kuchi',
    dimension: 'kanji',
    name: '口',
    reading: 'コウ',
    meaning: 'mouth / opening',
    due: false,
  },
  {
    conceptId: 'c-kanji-setsu',
    dimension: 'kanji',
    name: '切',
    reading: 'セツ',
    meaning: 'cut',
    due: false,
  },
  {
    conceptId: 'c-kana-shi',
    dimension: 'kana',
    name: 'し',
    meaning: 'shi',
    due: false,
  },
  {
    conceptId: 'c-kana-chi',
    dimension: 'kana',
    name: 'ち',
    meaning: 'chi',
    due: false,
  },
  {
    conceptId: 'c-te-mo-ii',
    dimension: 'grammar',
    name: '〜てもいいですか',
    meaning: 'may I —?',
    due: false,
  },
  {
    conceptId: 'c-nakereba',
    dimension: 'grammar',
    name: '〜なければなりません',
    meaning: 'must —',
    due: false,
  },
]

function reroll(items: PlanItem[], id: string): PlanItem[] {
  const current = items.find((item) => item.conceptId === id)
  if (!current) return items
  const occupied = new Set(items.map((item) => item.conceptId))
  const replacement = [...REROLL_ALTERNATES, ...PLAN.items].find(
    (candidate) => candidate.dimension === current.dimension && !occupied.has(candidate.conceptId),
  )
  if (!replacement) return items
  return items.map((item) =>
    item.conceptId === id ? { ...replacement, suppressed: undefined } : item,
  )
}

/* The learning modes are mixed invisibly. The learner gets a coherent topic
 * for the day without being marched through a setup/review/context/check
 * wizard. */
function toModule(item: PlanItem, index: number): ModuleItem {
  const base = {
    id: `today-${index}-${item.conceptId}`,
    topicId: item.conceptId,
    topicTitle: item.meaning,
    lang: 'ja' as const,
  }

  if (item.dimension === 'grammar') {
    return {
      ...base,
      moduleType: 'particle_cloze',
      contentType: 'quiz',
      prompt: 'Complete the sentence.',
      clozeBefore: '駅に着い',
      clozeAfter: '電話してください。',
      bank: ['たら', 'ても', 'ては', 'たり'],
      answer: 'たら',
    }
  }

  if (!item.due || index % 3 === 0) {
    return {
      ...base,
      moduleType: 'flashcard',
      contentType: 'flashcard',
      prompt: item.name,
      promptRuby: item.reading ? [{ text: item.name, reading: item.reading }] : undefined,
      answer: item.meaning,
    }
  }

  if (index % 3 === 1) {
    return {
      ...base,
      moduleType: 'vocab_production',
      contentType: 'quiz',
      prompt: `Write the Japanese for “${item.meaning}”.`,
      answer: item.reading ?? item.name,
    }
  }

  return {
    ...base,
    moduleType: 'vocab_recognition',
    contentType: 'quiz',
    prompt: item.name,
    promptRuby: item.reading ? [{ text: item.name, reading: item.reading }] : undefined,
    options: distractors(item),
    answer: item.meaning,
  }
}

function distractors(item: PlanItem): string[] {
  const others = PLAN.items
    .filter(
      (candidate) =>
        candidate.dimension === item.dimension && candidate.conceptId !== item.conceptId,
    )
    .slice(0, 3)
    .map((candidate) => candidate.meaning)
  return [item.meaning, ...others].sort()
}
