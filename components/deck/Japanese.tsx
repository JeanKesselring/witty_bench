'use client'

/* The Japanese layer — design_system.md §4.3, §6.9, and the shared drill
 * behaviour in complete_modules.md ("Show furigana" / "Hide furigana",
 * unlimited uncounted replays, example sentences on the flip).
 *
 * Everything here is shared by the drill families rather than owned by one:
 * furigana state lives at the frame so a single control governs every run of
 * ruby on the card, and the audio prompt is one component because §6.9 wants
 * one media behaviour, not one per module type.
 */

import { createContext, useContext, useEffect, useId, useRef, useState } from 'react'
import type { ExampleSentence, RubySegment } from '@/lib/api/types'
import { finalise, toKana } from '@/lib/japanese/romaji'

/** `hidden="until-found"` is a real HTML value and React's prop types still
 *  declare `hidden` as a boolean, so the attribute is spread rather than
 *  assigned. It matters: `until-found` is what makes hidden text reachable by
 *  find-in-page, and `display: none` is not (§9.3). */
export function untilFound(hidden: boolean): Record<string, string> {
  return hidden ? { hidden: 'until-found' } : {}
}

/* ── Furigana ────────────────────────────────────────────────────────
 * Three states, not two. The catalogue's drills carry a binary Show/Hide,
 * but the Reading Lab has `auto` as well, and `auto` is the honest default
 * for a mixed deck: readings appear on kanji above the learner's level and
 * stay off the ones they are being tested on. A module that must never show
 * a reading (kanji_reading, where the reading IS the answer) passes `never`
 * and the control is not offered at all. */

export type FuriganaMode = 'auto' | 'all' | 'off' | 'never'

const FuriganaContext = createContext<FuriganaMode>('auto')

export function FuriganaProvider({
  mode,
  children,
}: {
  mode: FuriganaMode
  children: React.ReactNode
}) {
  return <FuriganaContext.Provider value={mode}>{children}</FuriganaContext.Provider>
}

export function useFurigana(): FuriganaMode {
  return useContext(FuriganaContext)
}

/** The header aid control. Its visible label stays constant while
 *  `aria-pressed` communicates state, so toggling readings cannot resize the
 *  header. `never` renders nothing, and §6.10 reserves that slot. */
export function FuriganaToggle({
  mode,
  onChange,
}: {
  mode: FuriganaMode
  onChange: (m: FuriganaMode) => void
}) {
  if (mode === 'never') return null
  const showing = mode !== 'off'
  return (
    <button
      type="button"
      className="k-btn k-btn--quiet k-press"
      aria-label={showing ? 'Hide furigana' : 'Show furigana'}
      aria-pressed={showing}
      onClick={() => onChange(showing ? 'off' : 'all')}
    >
      Furigana
    </button>
  )
}

/* ── Ruby ────────────────────────────────────────────────────────────
 * Readings attach to RUNS, not to a line: 図書館 takes one reading and the
 * particle after it takes none. `<ruby>` is the element for exactly this,
 * and it degrades to parenthesised readings in browsers that lack it via
 * the <rp> fallbacks — which is also what a screen reader without ruby
 * support will read, so nothing is lost. */

export function Ruby({ segments, className }: { segments: RubySegment[]; className?: string }) {
  const mode = useFurigana()
  const show = mode === 'all' || mode === 'auto'

  return (
    <span className={className ? `k-ruby ${className}` : 'k-ruby'} lang="ja">
      {segments.map((seg, i) =>
        seg.reading ? (
          <ruby key={i} data-furigana={show ? 'on' : 'off'}>
            {seg.text}
            <rp aria-hidden={!show}>(</rp>
            <rt aria-hidden={!show}>{seg.reading}</rt>
            <rp aria-hidden={!show}>)</rp>
          </ruby>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </span>
  )
}

/** Flatten ruby back to its surface text — for measuring, for grading, and
 *  for anywhere the plain string is what the DOM needs. */
export function rubyText(segments: RubySegment[] | undefined): string {
  return (segments ?? []).map((s) => s.text).join('')
}

/* ── Example sentences ───────────────────────────────────────────────
 * JKG's flashcards flip to the answer AND two examples. They are part of the
 * revealed state rather than an afterthought appended elsewhere. */

export function ExampleSentences({ examples }: { examples: ExampleSentence[] }) {
  if (examples.length === 0) return null
  return (
    <div className="k-examples">
      <ul>
        {examples.map((ex, i) => (
          <li key={i}>
            <Ruby segments={ex.ja} className="k-ja" />
            <span className="k-body-sm">{ex.en}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ── Audio prompt ────────────────────────────────────────────────────
 * §6.9's reduced player: play/pause, replay, rate, transcript. Replays are
 * unlimited and uncounted — a learner who needs six listens is doing the
 * exercise, not cheating at it.
 */

const RATES = [0.5, 0.75, 1, 1.25] as const

export function AudioPrompt({
  src,
  transcript,
  label,
  autoPlay = false,
}: {
  src: string
  transcript?: RubySegment[]
  label: string
  autoPlay?: boolean
}) {
  const ref = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [rate, setRate] = useState<number>(1)
  const [failed, setFailed] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  const transcriptId = useId()

  useEffect(() => {
    const el = ref.current
    if (el) el.playbackRate = rate
  }, [rate])

  useEffect(() => {
    if (!autoPlay) return
    // Autoplay is a request, not a guarantee: browsers refuse it without a
    // gesture, and the catalogue only says audio MAY begin automatically.
    // A refusal is not an error — the Play control is right there.
    ref.current?.play().then(
      () => setPlaying(true),
      () => setPlaying(false),
    )
  }, [autoPlay])

  return (
    <div className="k-audio">
      <audio
        ref={ref}
        src={src}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => setFailed(true)}
      />

      <div className="k-audio__controls">
        <button
          type="button"
          className="k-btn k-btn--secondary k-press"
          disabled={failed}
          onClick={() => {
            const el = ref.current
            if (!el) return
            if (el.paused) {
              setFailed(false)
              el.play().catch(() => setFailed(true))
            } else {
              el.pause()
            }
          }}
        >
          {playing ? 'Pause' : 'Play'}
          {label ? ` ${label}` : ''}
        </button>

        <button
          type="button"
          className="k-btn k-btn--quiet k-press"
          disabled={failed}
          onClick={() => {
            const el = ref.current
            if (!el) return
            el.currentTime = 0
            el.play().catch(() => setFailed(true))
          }}
        >
          Replay
        </button>

        <span className="k-audio__rate">
          <label className="k-meta" htmlFor={`${transcriptId}-rate`}>
            Speed
          </label>{' '}
          <select
            id={`${transcriptId}-rate`}
            className="k-input"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
          >
            {RATES.map((r) => (
              <option key={r} value={r}>
                {r}×
              </option>
            ))}
          </select>
        </span>

        {failed ? (
          <button
            type="button"
            className="k-btn k-btn--quiet k-press"
            onClick={() => {
              setFailed(false)
              const el = ref.current
              if (el) el.load()
            }}
          >
            Retry audio
          </button>
        ) : null}

        {transcript ? (
          <button
            type="button"
            className="k-btn k-btn--quiet k-press"
            aria-expanded={showTranscript}
            aria-controls={transcriptId}
            onClick={() => setShowTranscript((s) => !s)}
          >
            {showTranscript ? 'Hide transcript' : 'Transcript'}
          </button>
        ) : null}
      </div>

      {transcript ? (
        <div
          id={transcriptId}
          className="k-audio__transcript"
          /* `until-found` keeps it findable by find-in-page while hidden —
             the transcript is the equivalent path for the audio, so it must
             never be truly unreachable (§9.3). */
          {...untilFound(!showTranscript)}
        >
          <Ruby segments={transcript} className="k-ja" />
        </div>
      ) : null}
    </div>
  )
}

/* ── Romaji input ────────────────────────────────────────────────────
 * §6.13: conversion happens in-app, kana is accepted directly, kanji is
 * never required, and grading reads the CONVERTED kana rather than the
 * keystrokes. The pending tail (a lone `n`, a half-typed `ky`) is shown as
 * typed so the learner can see what the converter is still waiting on. */

export function RomajiInput({
  value,
  onChange,
  onCommit,
  katakana = false,
  disabled = false,
  id,
  describedBy,
  placeholder = 'Rōmaji or kana',
  multiline = false,
}: {
  value: string
  onChange: (kana: string) => void
  onCommit?: () => void
  katakana?: boolean
  disabled?: boolean
  id?: string
  describedBy?: string
  placeholder?: string
  multiline?: boolean
}) {
  const [raw, setRaw] = useState(value)

  // The field shows the converted text; `raw` only carries the unconverted
  // tail, so a controlled reset from outside (a new card) clears both.
  useEffect(() => {
    if (value === '') setRaw('')
  }, [value])

  const handle = (next: string) => {
    setRaw(next)
    const converted = toKana(next, katakana)
    onChange(finalise(converted, katakana))
  }

  const shared = {
    id,
    value: raw,
    disabled,
    placeholder,
    lang: 'ja' as const,
    'aria-describedby': describedBy,
    autoComplete: 'off',
    autoCorrect: 'off',
    spellCheck: false,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      handle(e.target.value),
  }

  return (
    <div className="k-romaji">
      {multiline ? (
        <textarea {...shared} className="k-textarea k-ja" rows={2} />
      ) : (
        <input
          {...shared}
          className="k-input k-ja"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onCommit) {
              e.preventDefault()
              onCommit()
            }
          }}
        />
      )}
      {/* What will actually be graded. Visible, because a converter that
          silently disagrees with the learner is the worst kind. */}
      {value ? (
        <p className="k-meta" aria-live="polite">
          Reads as <span lang="ja">{value}</span>
        </p>
      ) : null}
    </div>
  )
}
