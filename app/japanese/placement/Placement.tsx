'use client'

/* Japanese Placement Assessment — complete_modules.md Part 1 §8.
 *
 * Its purpose is a CONSERVATIVE starting level, and every interface decision
 * here follows from that word. Placement that guesses high hands a learner a
 * daily lesson they cannot do; placement that guesses low costs them a few
 * easy days. So the result is stated as a working level with an explicit
 * uncertainty, never as a score, and `I don't know — teach me` is offered on
 * every question as a first-class answer rather than a failure.
 *
 * It reuses the Part 3 drill cards exactly ("Those card renderers are not
 * duplicated here"), so what a learner meets in placement is what they will
 * meet every day afterwards.
 */

import { useMemo, useState } from 'react'
import type { ModuleItem } from '@/lib/api/types'
import {
  DIMENSIONS,
  PLACEMENT,
  type Dimension,
  type JlptLevel,
  type PlacementEstimate,
} from '@/lib/api/jkg'
import { ModuleFrame, type Outcome } from '@/components/deck/ModuleFrame'

const LEVELS: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1']

export function Placement() {
  const [status, setStatus] = useState(PLACEMENT.status)
  const [answered, setAnswered] = useState(0)
  const [estimates, setEstimates] = useState<PlacementEstimate[]>(PLACEMENT.estimates)

  const questions = useMemo(() => QUESTIONS, [])
  const question = questions[answered % questions.length]

  const record = (o: Outcome) => {
    const dimension = DIMENSION_OF[question.moduleType] ?? 'vocabulary'
    /* A Bayesian update in spirit and in shape: each answer moves the mean
     * toward or away from the question's level and shrinks the spread. The
     * real engine is placement.py's; what matters for the interface is that
     * uncertainty falls visibly, because that is what tells a learner why
     * they are still being asked things. */
    setEstimates((es) =>
      es.map((e) =>
        e.dimension === dimension
          ? {
              ...e,
              mean: e.mean + (o.grade === 'again' ? -0.25 : 0.35),
              sd: Math.max(0.25, e.sd * 0.88),
              count: e.count + 1,
            }
          : e,
      ),
    )
    setAnswered((a) => a + 1)
  }

  if (status === 'not_started') {
    return (
      <section className="k-panel">
        <h2 className="k-h2">Before the first lesson</h2>
        <p>
          Twenty-four to forty questions across kana, vocabulary, kanji and grammar. It stops as
          soon as it is confident, and you can pause at any point — the answers keep.
        </p>
        <p className="k-meta">
          It deliberately settles low. A level that is slightly too easy costs you a few days; one
          that is too hard costs you the habit.
        </p>
        <div className="k-actions">
          <button
            type="button"
            className="k-btn k-btn--quiet k-press"
            onClick={() => setStatus('complete')}
          >
            Skip placement for now
          </button>
          <button
            type="button"
            className="k-btn k-btn--primary k-press"
            onClick={() => setStatus('in_progress')}
          >
            {answered > 0 ? 'Resume placement' : 'Start placement'}
          </button>
        </div>
      </section>
    )
  }

  if (status === 'complete' || answered >= PLACEMENT.total) {
    const result = resultFrom(estimates, answered)
    return (
      <section className="k-panel">
        <h2 className="k-h2">Where to start</h2>
        <p className="k-h3">{result.workingLevel}</p>
        <p>
          A working level, not a certificate. Lessons will start here and move as your answers do.
        </p>

        <table className="k-table">
          <thead>
            <tr>
              <th scope="col">Area</th>
              <th scope="col">Band</th>
              <th scope="col">Answers</th>
            </tr>
          </thead>
          <tbody>
            {DIMENSIONS.map((d) => (
              <tr key={d}>
                <th scope="row">{d}</th>
                <td>{result.perDimension[d]}</td>
                <td>{estimates.find((e) => e.dimension === d)?.count ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="k-meta">
          Confidence: {result.uncertainty}. About {result.familiarConcepts} concepts look familiar
          already.
        </p>

        <div className="k-actions">
          <button
            type="button"
            className="k-btn k-btn--quiet k-press"
            onClick={() => {
              setStatus('in_progress')
              setAnswered(0)
              setEstimates(PLACEMENT.estimates)
            }}
          >
            Retake
          </button>
          <a className="k-btn k-btn--primary k-press" href="/japanese/lesson">
            Start guided lesson
          </a>
        </div>
      </section>
    )
  }

  return (
    <div className="k-placement-run">
      <div className="k-actions">
        <p className="k-meta">
          {answered} answered of about {PLACEMENT.total}
        </p>
        <button
          type="button"
          className="k-btn k-btn--quiet k-press"
          onClick={() => setStatus('not_started')}
        >
          Pause and return later
        </button>
      </div>

      <ul className="k-estimates">
        {estimates.map((e) => (
          <li key={e.dimension}>
            <span>{e.dimension}</span>
            {/* A spread, not a score. The bar shows how WIDE the estimate
                still is, which is the honest number during a run — a point
                estimate after four questions would be a fiction. */}
            <span
              className="k-estimates__bar"
              style={{ ['--spread' as string]: `${Math.round(e.sd * 100)}%` }}
              aria-hidden="true"
            />
            <span className="k-meta">{e.count === 0 ? 'not begun' : `${e.count} answers`}</span>
          </li>
        ))}
      </ul>

      <ModuleFrame
        key={`${question.id}-${answered}`}
        item={question}
        onResolve={record}
        onSkip={() => setAnswered((a) => a + 1)}
        giveUpLabel="I don’t know — teach me"
      />
    </div>
  )
}

/** A conservative reading of the estimates: the band the mean supports, then
 *  one step DOWN whenever the spread is still wide. */
function resultFrom(estimates: PlacementEstimate[], answered: number) {
  const perDimension = {} as Record<Dimension, JlptLevel>
  for (const e of estimates) {
    const raw = Math.max(0, Math.min(LEVELS.length - 1, Math.round(e.mean)))
    const cautious = e.sd > 0.6 ? Math.max(0, raw - 1) : raw
    perDimension[e.dimension] = LEVELS[cautious]
  }
  const lowest = Math.min(...DIMENSIONS.map((d) => LEVELS.indexOf(perDimension[d])))
  const spread = estimates.reduce((a, e) => a + e.sd, 0) / estimates.length
  return {
    // The working level is the LOWEST band, not the average: a learner whose
    // grammar is N4 and whose kanji is N5 cannot read an N4 lesson.
    workingLevel: LEVELS[Math.max(0, lowest)],
    perDimension,
    uncertainty:
      spread > 0.8 ? ('high' as const) : spread > 0.45 ? ('medium' as const) : ('low' as const),
    familiarConcepts: answered * 7,
  }
}

const DIMENSION_OF: Record<string, Dimension> = {
  quiz: 'kana',
  vocab_recognition: 'vocabulary',
  kanji_meaning: 'kanji',
  grammar_recognition: 'grammar',
}

/* The adaptive question pool. In the live service `placement/<run>/next`
 * chooses these; the shapes are the ordinary module shapes either way. */
const QUESTIONS: ModuleItem[] = [
  {
    id: 'p-1',
    topicId: 'c-kana-fu',
    topicTitle: 'Hiragana',
    moduleType: 'quiz',
    contentType: 'quiz',
    prompt: 'ふ',
    lang: 'ja',
    options: ['fu', 'ha', 'he', 'ho'],
    answer: 'fu',
  },
  {
    id: 'p-2',
    topicId: 'c-eki',
    topicTitle: 'Vocabulary',
    moduleType: 'vocab_recognition',
    contentType: 'quiz',
    prompt: '駅',
    promptRuby: [{ text: '駅', reading: 'えき' }],
    lang: 'ja',
    options: ['station', 'shop', 'school', 'street'],
    answer: 'station',
  },
  {
    id: 'p-3',
    topicId: 'c-kanji-ori',
    topicTitle: 'Kanji',
    moduleType: 'kanji_meaning',
    contentType: 'quiz',
    prompt: '降',
    lang: 'ja',
    options: ['descend', 'ascend', 'depart', 'return'],
    answer: 'descend',
  },
  {
    id: 'p-4',
    topicId: 'c-tara',
    topicTitle: 'Grammar',
    moduleType: 'grammar_recognition',
    contentType: 'quiz',
    prompt: 'What does 〜たら express?',
    lang: 'ja',
    options: ['If or when', 'Because', 'Although', 'In order to'],
    answer: 'If or when',
  },
]
