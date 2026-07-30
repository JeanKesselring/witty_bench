'use client'

/* The shared assessment card.
 *
 * It is intentionally content-sized. The former session-wide fixed bands
 * aligned every button by reserving the tallest prompt, answer and verdict
 * on every card; mixed sessions consequently contained more blank space than
 * content. The lattice now comes from padding, target sizes and the outer
 * boundary rather than from empty placeholder rows.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { Grade, Judgement, ModuleItem } from '@/lib/api/types'
import { moduleTypeOrDefault, CONTENT_TYPE_LABEL } from '@/lib/modules/registry'
import { judgeChoice, judgeOrder, judgeText } from '@/lib/grading'
import { Response, PromptText, type ResponseValue } from './Responses'
import {
  AudioPrompt,
  ExampleSentences,
  FuriganaProvider,
  FuriganaToggle,
  Ruby,
  type FuriganaMode,
} from './Japanese'
import { distanceKm, NEAR_KM, PART_KM, parsePick } from '@/lib/modules/geo'
import { ModuleMenu } from './ModuleMenu'
import { spring } from '@/lib/motion'

export interface Outcome {
  grade: Grade
  /** A hint bank was used — the engine caps the interval at Hard. */
  assisted: boolean
  /** Present for objectively graded types; absent when the learner self-rated. */
  judgement?: Judgement
}

/** A prompt that is one or two CJK characters is a glyph, not a sentence. */
function isGlyphPrompt(text: string, lang?: string): boolean {
  if (lang !== 'ja') return false
  return text.trim().length <= 3 && /[぀-ヿ一-龯]/.test(text)
}

/** Only offer furigana when this card contains an actual optional reading.
 * Recognition of kana and discrimination between glyphs test the form
 * itself, so a reading aid would either be meaningless or leak the answer. */
function supportsFurigana(item: ModuleItem): boolean {
  if (item.lang !== 'ja') return false
  if (['kana_recognition', 'discrimination', 'kana_production'].includes(item.moduleType))
    return false
  if (['kanji_reading', 'transcription'].includes(item.moduleType)) return false
  const hasReading = (segments?: Array<{ reading?: string }>) =>
    segments?.some((segment) => Boolean(segment.reading)) ?? false
  return (
    hasReading(item.promptRuby) ||
    hasReading(item.answerRuby) ||
    hasReading(item.transcript) ||
    (item.examples?.some((example) => hasReading(example.ja)) ?? false)
  )
}

const RATINGS: Array<{ grade: Grade; label: string; key: string }> = [
  { grade: 'again', label: 'Again', key: '1' },
  { grade: 'hard', label: 'Hard', key: '2' },
  { grade: 'good', label: 'Good', key: '3' },
  { grade: 'easy', label: 'Easy', key: '4' },
]

export function ModuleFrame({
  item,
  onResolve,
  onSkip,
  nav,
  giveUpLabel = "I don't know",
}: {
  item: ModuleItem
  onResolve: (o: Outcome) => void
  onSkip: () => void
  /* Set navigation, when this canonical flashcard or quiz carries several
   * cards. It renders INSIDE the prompt band rather than in
   * the control band, because the band's four slots are spoken for and
   * because moving between cards is not an answer. The band is measured with
   * it present, so nothing shifts on the cards that have no nav. */
  nav?: React.ReactNode
  giveUpLabel?: string
}) {
  const spec = moduleTypeOrDefault(item.moduleType)
  const selfGraded = spec.response === 'none' || spec.response === 'handwriting'
  const flashcard = spec.response === 'none'
  const furiganaAllowed = supportsFurigana(item)
  const reduceMotion = useReducedMotion()

  const [value, setValue] = useState<ResponseValue>(
    spec.id === 'timeline_drag_exercise'
      ? (item.tokens ?? [])
      : spec.response === 'ordering'
        ? []
        : '',
  )
  const [judged, setJudged] = useState<Judgement | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [backVisible, setBackVisible] = useState(false)
  const [assisted, setAssisted] = useState(false)
  const [gaveUp, setGaveUp] = useState(false)
  const [furigana, setFurigana] = useState<FuriganaMode>(furiganaAllowed ? 'auto' : 'never')
  const frameRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    setValue(
      spec.id === 'timeline_drag_exercise'
        ? (item.tokens ?? [])
        : spec.response === 'ordering'
          ? []
          : '',
    )
    setJudged(null)
    setRevealed(false)
    setBackVisible(false)
    setAssisted(false)
    setGaveUp(false)
    setFurigana(furiganaAllowed ? 'auto' : 'never')
  }, [item.id, item.tokens, spec.id, spec.response, furiganaAllowed])

  const answered = judged !== null || revealed
  const controlJudgement: Judgement | null =
    judged ?? (gaveUp ? { outcome: 'incorrect', answer: item.answer } : null)
  const ready =
    spec.response === 'ordering'
      ? Array.isArray(value) && value.length === (item.tokens?.length ?? 0) && value.length > 0
      : String(value).trim().length > 0

  /* Marking. The control reports a value; this decides what it was worth,
   * and it is the only place that decides. */
  const check = useCallback(() => {
    if (answered || !ready) return
    if (spec.response === 'choice') {
      setJudged(judgeChoice(String(value), item.answer))
    } else if (spec.response === 'ordering') {
      setJudged(judgeOrder(Array.isArray(value) ? value : [], item.answer.split('|')))
    } else if (spec.response === 'map') {
      setJudged(judgeMap(String(value), item))
    } else {
      setJudged(judgeText(String(value), item.answer, spec.tolerance))
    }
  }, [answered, ready, spec.response, spec.tolerance, value, item])

  const reveal = useCallback(() => {
    if (answered) return
    setRevealed(true)
    setBackVisible(true)
    // §6.10: on an objectively graded type this is giving up, and it costs
    // an `again`. The control says so before it is pressed; this is only
    // where the cost is applied.
    if (!selfGraded) setGaveUp(true)
  }, [answered, selfGraded])

  const rate = useCallback(
    (grade: Grade) => {
      onResolve({ grade, assisted, judgement: judged ?? undefined })
    },
    [assisted, judged, onResolve],
  )

  /* §6.10's keyboard loop. Enter checks, Space advances, 1–4 rate. Space is
   * bound at the frame and steps aside whenever focus is inside a control
   * that consumes it, which is why this listens on the frame rather than on
   * the document. */
  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const inControl =
        !!target &&
        (target.matches(
          'button, input, textarea, select, [role="radio"], [role="checkbox"], canvas',
        ) ||
          target.isContentEditable)

      if (e.key === 'Enter' && !answered && !inControl) {
        e.preventDefault()
        if (selfGraded) reveal()
        else check()
        return
      }
      if (e.key === ' ' && selfGraded && !inControl) {
        e.preventDefault()
        if (!answered) reveal()
        else if (flashcard) setBackVisible((shown) => !shown)
        return
      }
      if (answered && selfGraded && /^[1-4]$/.test(e.key) && !inControl) {
        const rating = RATINGS[Number(e.key) - 1]
        e.preventDefault()
        rate(rating.grade)
      }
    }
    el.addEventListener('keydown', onKey)
    return () => el.removeEventListener('keydown', onKey)
  }, [answered, check, reveal, rate, selfGraded, judged, gaveUp, flashcard])

  return (
    <FuriganaProvider mode={furigana}>
      <section
        ref={frameRef}
        className={`k-frame${flashcard ? ' k-frame--flip' : ''}`}
        data-response={spec.response}
        data-module={item.moduleType}
        data-presentation={spec.presentation ?? 'frame'}
        tabIndex={-1}
        aria-label={`${CONTENT_TYPE_LABEL[spec.contentType]} module`}
        style={{ ['--accent' as string]: `var(--accent-${spec.contentType})` }}
      >
        {!flashcard ? (
          <div className="k-frame__menu">
            <ModuleMenu item={item} />
          </div>
        ) : null}

        {!flashcard && (spec.showTopic || furiganaAllowed) ? (
          <header className="k-frame__header">
            {spec.showTopic ? <span className="k-frame__topic">{item.topicTitle}</span> : null}
            {furiganaAllowed ? (
              <span className="k-frame__aid">
                <FuriganaToggle mode={furigana} onChange={setFurigana} />
              </span>
            ) : null}
          </header>
        ) : null}

        {/* ── Prompt ────────────────────────────────────────────────── */}
        {flashcard ? (
          <>
            {nav}
            <div className="k-flipscene">
              <motion.span
                className="k-flipcard"
                data-back={backVisible}
                animate={
                  reduceMotion
                    ? { opacity: 1 }
                    : {
                        rotateY: backVisible ? 180 : 0,
                      }
                }
                transition={{ type: 'spring', visualDuration: 0.55, bounce: 0.06 }}
              >
                <button
                  type="button"
                  className="k-flipcard__surface"
                  aria-label={
                    revealed
                      ? backVisible
                        ? 'Answer shown. Turn to front.'
                        : 'Question shown. Turn to answer.'
                      : 'Question shown. Reveal answer.'
                  }
                  onClick={() => {
                    if (!revealed) reveal()
                    else setBackVisible((shown) => !shown)
                  }}
                >
                  <span className="k-flipcard__face k-flipcard__front" aria-hidden={backVisible}>
                    <span
                      className={isGlyphPrompt(item.prompt, item.lang) ? 'k-glyph-prompt' : 'k-h3'}
                    >
                      <PromptText item={item} />
                    </span>
                  </span>
                  <span className="k-flipcard__face k-flipcard__back" aria-hidden={!backVisible}>
                    <span className="k-h3" lang={item.lang}>
                      {item.answerRuby ? <Ruby segments={item.answerRuby} /> : item.answer}
                    </span>
                    {item.examples ? <ExampleSentences examples={item.examples} /> : null}
                  </span>
                </button>
                <span className="k-flipcard__menu" data-back={backVisible}>
                  <ModuleMenu item={item} />
                </span>
              </motion.span>
            </div>
          </>
        ) : (
          <div className="k-frame__prompt" tabIndex={0} aria-label="Prompt">
            {nav}
            <p className={isGlyphPrompt(item.prompt, item.lang) ? 'k-glyph-prompt' : undefined}>
              <PromptText item={item} />
            </p>
            {item.audioSrc ? (
              <AudioPrompt
                src={item.audioSrc}
                transcript={answered ? item.transcript : undefined}
                label="the sentence"
                autoPlay={spec.id === 'transcription'}
              />
            ) : null}
          </div>
        )}

        {/* ── Response ──────────────────────────────────────────────── */}
        {!flashcard ? (
          <div className="k-frame__response" tabIndex={0} aria-label="Your response">
            <Response
              item={item}
              spec={spec}
              value={value}
              onChange={setValue}
              judged={controlJudgement}
              revealed={revealed}
              onAssisted={() => setAssisted(true)}
              onCommit={check}
            />
            {revealed && !judged && !['choice', 'ordering', 'map'].includes(spec.response) ? (
              <p className="k-h3" lang={item.lang}>
                {item.answerRuby ? <Ruby segments={item.answerRuby} /> : item.answer}
              </p>
            ) : null}
          </div>
        ) : null}

        {!flashcard && answered && !['choice', 'ordering', 'map'].includes(spec.response) ? (
          <motion.div
            className="k-frame__judge"
            aria-live="assertive"
            animate={
              judged?.outcome === 'incorrect' && !reduceMotion
                ? { x: [0, -6, 5, -3, 2, 0] }
                : { x: 0 }
            }
            transition={judged?.outcome === 'incorrect' ? { duration: 0.32 } : spring.settle}
          >
            {judged ? (
              <p
                className={
                  judged.outcome === 'correct'
                    ? 'k-judge k-judge--ok'
                    : judged.outcome === 'partial'
                      ? 'k-judge k-judge--warn'
                      : 'k-judge k-judge--err'
                }
              >
                <strong>
                  {judged.outcome === 'correct'
                    ? 'Correct'
                    : judged.outcome === 'partial'
                      ? 'Nearly'
                      : 'Try again'}
                </strong>
                {judged.outcome !== 'correct' ? (
                  <span lang={item.lang}>{judged.answer}</span>
                ) : null}
                {judged.note ? <span className="k-meta">{judged.note}</span> : null}
                {item.explanation ? <span>{item.explanation}</span> : null}
              </p>
            ) : (
              <p className="k-judge k-judge--warn">Answer shown</p>
            )}
          </motion.div>
        ) : null}

        {flashcard && !answered ? (
          <div className="k-band k-band--single">
            <button type="button" className="k-btn k-btn--quiet k-press" onClick={onSkip}>
              Skip
            </button>
          </div>
        ) : (
          <div
            className={`k-band${answered ? ' k-band--ratings' : ''}`}
            role="group"
            aria-label="Card controls"
          >
            {!answered ? (
              <>
                {!selfGraded ? (
                  <button type="button" className="k-btn k-btn--quiet k-press" onClick={reveal}>
                    {giveUpLabel}
                  </button>
                ) : null}
                <button type="button" className="k-btn k-btn--quiet k-press" onClick={onSkip}>
                  Skip
                </button>
                <button
                  type="button"
                  className="k-btn k-btn--primary k-press"
                  disabled={!selfGraded && !ready}
                  onClick={selfGraded ? reveal : check}
                >
                  {selfGraded ? 'Reveal' : 'Check'}
                </button>
              </>
            ) : !selfGraded ? (
              <button
                type="button"
                className="k-btn k-btn--primary k-press"
                onClick={() => rate(objectiveGrade(judged, gaveUp, assisted))}
              >
                Continue
              </button>
            ) : (
              RATINGS.map((rating) => (
                <button
                  key={rating.grade}
                  type="button"
                  className={`k-btn ${
                    rating.grade === 'good' ? 'k-btn--primary' : 'k-btn--quiet'
                  } k-press`}
                  onClick={() => rate(rating.grade)}
                  aria-keyshortcuts={rating.key}
                >
                  {rating.label}
                </button>
              ))
            )}
          </div>
        )}
      </section>
    </FuriganaProvider>
  )
}

/** Objectively checked cards leave with the grade the check already earned.
 * Ratings belong only to flashcards, where the learner has information the
 * machine does not. */
function objectiveGrade(judged: Judgement | null, gaveUp: boolean, assisted: boolean): Grade {
  if (gaveUp) return 'again'
  if (judged?.outcome === 'incorrect') return 'again'
  if (judged?.outcome === 'partial') return 'hard'
  if (assisted) return 'hard'
  return 'good'
}

/** Distance grading for map-click quizzes, with the partial credit the Module
 *  Factory's default configuration gives point questions. */
function judgeMap(value: string, item: ModuleItem): Judgement {
  const targets = item.mapTargets ?? []
  const answer = targets.find((t) => t.label === item.answer) ?? targets[0]
  const picked = parsePick(value)
  if (!answer || !picked) {
    return { outcome: 'incorrect', answer: item.answer }
  }
  const km = distanceKm(picked, answer)
  if (km <= NEAR_KM) return { outcome: 'correct', answer: item.answer }
  if (km <= PART_KM)
    return {
      outcome: 'partial',
      answer: item.answer,
      note: `${Math.round(km)} km off`,
    }
  return { outcome: 'incorrect', answer: item.answer, note: `${Math.round(km)} km off` }
}
