'use client'

/* The Karaoke / read-aloud lab.
 *
 * Speech recognition, which means Chrome or Edge — the catalogue says so and
 * there is no polyfill worth pretending about. What makes that acceptable
 * rather than exclusionary is that this activity is UNGRADED: nothing here
 * feeds mastery, so a learner without recognition loses a practice aid, not
 * access to any material. The page says which browser it needs rather than
 * silently doing nothing, and `Skip word` means the exercise can be walked
 * through by hand from any browser.
 *
 * The hint ladder is from the source: after about five seconds stuck on a
 * word, kanji gets a kana hint and kana gets a rōmaji one. It is a ladder
 * because the two hints are not equivalent — a reading tells you what to say,
 * a rōmaji spelling tells you how to say it.
 */

import { useEffect, useRef, useState } from 'react'
import type { ReaderText } from '@/lib/api/jkg'

const STUCK_MS = 5000

interface RecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult: ((e: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}

function ctor(): (new () => RecognitionLike) | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: new () => RecognitionLike
    webkitSpeechRecognition?: new () => RecognitionLike
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function Karaoke({ text }: { text: ReaderText }) {
  const words = text.paragraphs.flat().flatMap((s) => s.tokens.filter((t) => t.gloss))
  const [index, setIndex] = useState(0)
  const [listening, setListening] = useState(false)
  const [hint, setHint] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)
  const [supported, setSupported] = useState(false)
  const rec = useRef<RecognitionLike | null>(null)
  const stuckTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => setSupported(ctor() !== null), [])

  // The stuck clock restarts on every advance, so a hint is offered for the
  // word the learner is actually on rather than for the whole passage.
  useEffect(() => {
    setHint(false)
    if (!listening) return
    stuckTimer.current = setTimeout(() => setHint(true), STUCK_MS)
    return () => {
      if (stuckTimer.current) clearTimeout(stuckTimer.current)
    }
  }, [index, listening])

  useEffect(() => () => rec.current?.stop(), [])

  const start = () => {
    const Ctor = ctor()
    if (!Ctor) return
    const r = new Ctor()
    rec.current = r
    r.lang = 'ja-JP'
    r.continuous = true
    r.interimResults = true
    r.onresult = (e) => {
      const heard = Array.from({ length: e.results.length }, (_, i) => e.results[i][0].transcript)
        .join('')
        .replace(/\s/g, '')
      // Local matching, in the same spirit as the source's server-side
      // phonetic match: a word counts as read when its kana appears in what
      // was heard. Deliberately forgiving — this is fluency practice, and
      // stopping a learner mid-sentence to argue about a vowel helps nobody.
      setIndex((i) => {
        let next = i
        while (next < words.length && heard.includes(words[next].kana)) next++
        return next
      })
    }
    r.onerror = () => setListening(false)
    r.onend = () => setListening(false)
    setListening(true)
    r.start()
  }

  const done = index >= words.length

  return (
    <div className="k-karaoke">
      <header className="k-lab-focus-head">
        <div>
          <p className="k-meta">Read-aloud practice</p>
          <h2 className="k-h2" lang="ja">
            {text.title}
          </h2>
          <p>{text.titleEn}</p>
        </div>
        <p className="k-meta">
          {Math.min(index, words.length)} / {words.length} words
        </p>
      </header>

      <div className="k-karaoke__controls">
        {supported ? (
          <button
            type="button"
            className="k-btn k-btn--primary k-press"
            onClick={() => {
              if (listening) {
                rec.current?.stop()
                setListening(false)
              } else start()
            }}
          >
            {listening ? 'Stop' : 'Start reading'}
          </button>
        ) : (
          <p className="k-judge k-judge--warn">
            Reading aloud needs Chrome or Edge for speech recognition. You can still step through
            the passage with <strong>Skip word</strong>.
          </p>
        )}

        <button
          type="button"
          className="k-btn k-btn--secondary k-press"
          disabled={done}
          onClick={() => setIndex((i) => Math.min(words.length, i + 1))}
        >
          Skip word
        </button>
        <button
          type="button"
          className="k-btn k-btn--secondary k-press"
          aria-pressed={showTranslation}
          onClick={() => setShowTranslation((t) => !t)}
        >
          Translation
        </button>
        <button
          type="button"
          className="k-btn k-btn--secondary k-press"
          onClick={() => {
            setIndex(0)
            setHint(false)
          }}
        >
          Restart
        </button>
      </div>

      <p className="k-karaoke__line k-ja" lang="ja">
        {words.map((w, i) => (
          <span key={i} data-state={i < index ? 'read' : i === index ? 'current' : 'ahead'}>
            {w.surface}
          </span>
        ))}
      </p>

      <p className="k-meta" aria-live="polite">
        {done
          ? 'That is the whole passage — nicely done.'
          : hint
            ? words[index].hasKanji
              ? `Hint · ${words[index].kana}`
              : `Hint · ${words[index].romaji}`
            : listening
              ? 'Listening… read the highlighted word.'
              : 'Press start, then read aloud.'}
      </p>

      {showTranslation ? (
        <ul className="k-karaoke__translation">
          {text.paragraphs.flat().map((s, i) => (
            <li key={i}>{s.translation}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
