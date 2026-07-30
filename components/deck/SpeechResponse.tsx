'use client'

/* vocab_guess — spoken vocabulary production.
 *
 * The catalogue is explicit that this needs Chrome or Edge, and equally
 * explicit that there is a typed path when recognition is unavailable. That
 * second sentence is what makes the module shippable: speech is the
 * preferred input, never the required one, and the typed field is present
 * ALWAYS — not swapped in on failure. A learner in a quiet carriage, a
 * learner on Firefox and a learner with a speech difference all take the
 * same route without having to discover it.
 *
 * What is graded is the kana, not the waveform: the recogniser's
 * interpretation lands in the same field the typed path writes to, the
 * learner can correct it, and lib/grading marks the text.
 */

import { useEffect, useRef, useState } from 'react'
import type { ResponseProps } from './Responses'
import { RomajiInput } from './Japanese'

/* The Web Speech API is not in lib.dom's stable surface, so it is typed here
 * rather than cast away at each call site. */
interface SpeechRecognitionResultLike {
  0: { transcript: string }
  isFinal: boolean
}
interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>
}
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult: ((e: SpeechRecognitionEventLike) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function recogniser(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function SpeechResponse({ value, onChange, judged, onCommit }: ResponseProps) {
  const [listening, setListening] = useState(false)
  const [heard, setHeard] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const ref = useRef<SpeechRecognitionLike | null>(null)
  const [supported, setSupported] = useState(false)

  // Support is read after mount: deciding it during render would make the
  // server and the client disagree about what the card contains.
  useEffect(() => setSupported(recogniser() !== null), [])

  useEffect(() => () => ref.current?.stop(), [])

  const start = () => {
    const Ctor = recogniser()
    if (!Ctor) return
    const rec = new Ctor()
    ref.current = rec
    rec.lang = 'ja-JP'
    rec.continuous = false
    rec.interimResults = true
    rec.onresult = (e) => {
      const last = e.results[e.results.length - 1]
      const text = last[0].transcript.trim()
      setHeard(text)
      if (last.isFinal) onChange(text)
    }
    rec.onerror = () => {
      setFailed(true)
      setListening(false)
    }
    rec.onend = () => setListening(false)
    setFailed(false)
    setHeard(null)
    setListening(true)
    rec.start()
  }

  const text = typeof value === 'string' ? value : ''

  return (
    <div className="k-speech">
      <div className="k-speech__controls">
        {supported ? (
          listening ? (
            <button
              type="button"
              className="k-btn k-btn--secondary k-press"
              onClick={() => ref.current?.stop()}
            >
              Stop
            </button>
          ) : (
            <button
              type="button"
              className="k-btn k-btn--secondary k-press"
              disabled={judged !== null}
              onClick={start}
            >
              {heard ? 'Try again' : 'Record'}
            </button>
          )
        ) : null}

        <span className="k-meta" aria-live="polite">
          {listening
            ? 'Listening…'
            : failed
              ? 'Not heard. Try again or type.'
              : supported
                ? heard
                  ? 'Edit the result if needed.'
                  : 'Speak or type.'
                : 'Speech unavailable. Type instead.'}
        </span>
      </div>

      {heard ? (
        <p className="k-speech__heard" lang="ja">
          <span className="k-meta">Heard</span> {heard}
        </p>
      ) : null}

      {/* Always present, never conditional. This is the graded field. */}
      <RomajiInput
        value={text}
        onChange={onChange}
        onCommit={onCommit}
        disabled={judged !== null}
        placeholder="Type in rōmaji or kana…"
      />
    </div>
  )
}
