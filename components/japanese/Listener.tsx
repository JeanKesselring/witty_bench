'use client'

/* The Listening Lab.
 *
 * The text starts HIDDEN — that is the whole exercise, and it is the one
 * thing this lab must not get wrong. Everything else follows from it: play
 * all, play one sentence, four speeds, `Show text` as a deliberate act, and
 * comprehension questions that appear either when the audio finishes or when
 * the learner says they are done.
 *
 * The questions are graded locally and do NOT feed the scheduler — the
 * catalogue is explicit that this result "does not currently update
 * spaced-repetition mastery", and inventing that link here would put a grade
 * into FSRS that no backend agreed to.
 */

import { useEffect, useRef, useState } from 'react'
import type { ReaderText } from '@/lib/api/jkg'

const SPEEDS = [0.5, 0.75, 1, 1.25] as const

export function Listener({ text }: { text: ReaderText }) {
  const sentences = text.paragraphs.flat()
  const [showText, setShowText] = useState(false)
  const [showQuestions, setShowQuestions] = useState(false)
  const [showEnglish, setShowEnglish] = useState(false)
  const [rate, setRate] = useState<number>(1)
  const [playingAll, setPlayingAll] = useState(false)
  const [at, setAt] = useState(-1)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const audio = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (audio.current) audio.current.playbackRate = rate
  }, [rate, at])

  const play = (index: number) => {
    const src = sentences[index]?.audioSrc
    if (!src) return
    setAt(index)
    const el = audio.current
    if (!el) return
    el.src = src
    el.playbackRate = rate
    el.play().catch(() => setPlayingAll(false))
  }

  const onEnded = () => {
    if (playingAll && at + 1 < sentences.length) {
      play(at + 1)
    } else {
      setPlayingAll(false)
      setAt(-1)
      // The catalogue: questions also appear when the complete text finishes.
      if (playingAll) setShowQuestions(true)
    }
  }

  const correct = text.questions.filter((q, i) => answers[i] === q.answer).length
  const answered = Object.keys(answers).length

  return (
    <div className="k-listen">
      <audio ref={audio} onEnded={onEnded} preload="none" />

      <header className="k-lab-focus-head">
        <div>
          <p className="k-meta">Listening practice</p>
          <h2 className="k-h2" lang="ja">
            {text.title}
          </h2>
          <p>{text.titleEn}</p>
        </div>
        <p className="k-meta">
          {text.targetLevel} · {sentences.length} sentences
        </p>
      </header>

      <div className="k-listen__controls">
        <button
          type="button"
          className="k-btn k-btn--primary k-press"
          onClick={() => {
            if (playingAll) {
              audio.current?.pause()
              setPlayingAll(false)
            } else {
              setPlayingAll(true)
              play(0)
            }
          }}
        >
          {playingAll ? 'Stop' : 'Play all'}
        </button>

        <label>
          <span className="k-sr">Playback speed</span>
          <select
            className="k-input"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
          >
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}×
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="k-btn k-btn--quiet k-press"
          aria-pressed={showText}
          onClick={() => setShowText((s) => !s)}
        >
          {showText ? 'Hide text' : 'Show text'}
        </button>
      </div>

      <ol className="k-listen__lines">
        {sentences.map((s, i) => (
          <li key={i} data-current={i === at ? 'true' : undefined}>
            <button
              type="button"
              className="k-btn k-btn--quiet k-press"
              onClick={() => {
                setPlayingAll(false)
                play(i)
              }}
            >
              <span aria-hidden="true">▶</span>
              <span className="k-sr">Play sentence {i + 1}</span>
            </button>
            {showText ? (
              <span className="k-ja" lang="ja">
                {s.tokens.map((t) => t.surface).join('')}
              </span>
            ) : (
              <span className="k-meta">Sentence {i + 1}</span>
            )}
          </li>
        ))}
      </ol>

      {!showQuestions ? (
        <div className="k-lab-next">
          <p className="k-meta">Listen as often as you need. Reveal the text only when useful.</p>
          <button
            type="button"
            className="k-btn k-btn--primary k-press"
            onClick={() => setShowQuestions(true)}
          >
            I’m ready for the questions
          </button>
        </div>
      ) : null}

      {showQuestions ? (
        <section className="k-comprehension" aria-label="Comprehension">
          <div className="k-actions">
            <h3 className="k-h3">Comprehension</h3>
            <button
              type="button"
              className="k-btn k-btn--quiet k-press"
              aria-pressed={showEnglish}
              onClick={() => setShowEnglish((e) => !e)}
            >
              EN
            </button>
          </div>

          {text.questions.map((q, i) => {
            const given = answers[i]
            return (
              <fieldset key={i} className="k-field">
                <legend className="k-field__label" lang="ja">
                  {showEnglish ? q.promptEn : q.prompt}
                </legend>
                <div className="k-options">
                  {q.options.map((o) => {
                    const isGiven = given === o
                    const isRight = o === q.answer
                    return (
                      <button
                        key={o}
                        type="button"
                        className={[
                          'k-option',
                          'k-press',
                          given && isRight ? 'k-option--ok' : '',
                          given && isGiven && !isRight ? 'k-option--err' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        disabled={!!given}
                        aria-pressed={isGiven}
                        onClick={() => setAnswers((a) => ({ ...a, [i]: o }))}
                      >
                        <span lang="ja">{o}</span>
                        {given && isRight ? <span className="k-meta">correct</span> : null}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            )
          })}

          {answered === text.questions.length ? (
            <p className="k-judge k-judge--ok" aria-live="polite">
              {correct} of {text.questions.length} correct.
              <span className="k-meta">
                {' '}
                Listening practice is not scheduled — this score is for you, not for the planner.
              </span>
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
