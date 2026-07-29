'use client'

/* The Reading Lab's reading view.
 *
 * Furigana has three modes here, not two: `auto` shows readings only on kanji
 * above the learner's current level, which is the mode that makes an
 * authentic text readable without turning it into a kana text. `all` and
 * `off` are the honest extremes.
 *
 * The word explanation is a POPOVER, not a tooltip (§6.11): it is opened by
 * an explicit action, it holds focusable content — the link into the graph —
 * and it closes on Escape or an outside click. A tooltip could not hold that
 * link, and hover-only would put the entire glossary out of reach of a
 * keyboard.
 */

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { ReaderText, Token } from '@/lib/api/jkg'

type Mode = 'auto' | 'all' | 'off'

/** Which kanji `auto` leaves un-annotated. In the real service this comes
 *  from the learner's mastery; here it is the N5 set, which is the honest
 *  default for a learner who has not been placed yet. */
const KNOWN = new Set(['right', 'left', 'road', 'two'])

export function Reader({ text }: { text: ReaderText }) {
  const [mode, setMode] = useState<Mode>('auto')
  const [translations, setTranslations] = useState(false)
  const [open, setOpen] = useState<{ token: Token; key: string; top: number } | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    dialogRef.current?.focus()
    const close = () => {
      setOpen(null)
      window.requestAnimationFrame(() => triggerRef.current?.focus())
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open])

  return (
    <div className="k-reader" ref={rootRef}>
      <div className="k-reader__controls">
        <div className="k-option-row" role="group" aria-label="Furigana">
          <span className="k-field__label">Furigana</span>
          <div className="k-option-row__buttons">
            {(['auto', 'all', 'off'] as const).map((m) => (
              <button
                key={m}
                type="button"
                className="k-btn k-btn--secondary k-press"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="k-btn k-btn--secondary k-press"
          aria-pressed={translations}
          onClick={() => setTranslations((t) => !t)}
        >
          {translations ? 'Translations on' : 'Translations off'}
        </button>
      </div>

      <article className="k-reader__text">
        <h2 className="k-h2" lang="ja">
          {text.title}
        </h2>
        <p className="k-meta">{text.titleEn}</p>

        {text.paragraphs.map((para, pi) => (
          <div key={pi} className="k-reader__para">
            {para.map((sentence, si) => (
              <p key={si} className="k-ja" lang="ja">
                {sentence.tokens.map((token, ti) => {
                  const key = `${pi}-${si}-${ti}`
                  const showReading =
                    token.hasKanji &&
                    (mode === 'all' || (mode === 'auto' && !KNOWN.has(token.gloss)))
                  if (!token.gloss) return <span key={key}>{token.surface}</span>
                  return (
                    <button
                      key={key}
                      type="button"
                      className="k-word"
                      aria-expanded={open?.key === key}
                      onClick={(event) => {
                        triggerRef.current = event.currentTarget
                        const rootBounds = rootRef.current?.getBoundingClientRect()
                        const triggerBounds = event.currentTarget.getBoundingClientRect()
                        const top = rootBounds
                          ? triggerBounds.bottom - rootBounds.top + 8
                          : triggerBounds.height + 8
                        setOpen((o) => (o?.key === key ? null : { token, key, top }))
                      }}
                    >
                      {showReading ? (
                        <ruby>
                          {token.surface}
                          <rp>(</rp>
                          <rt>{token.kana}</rt>
                          <rp>)</rp>
                        </ruby>
                      ) : (
                        token.surface
                      )}
                    </button>
                  )
                })}
                {translations ? (
                  <span className="k-reader__gloss">{sentence.translation}</span>
                ) : null}
              </p>
            ))}
          </div>
        ))}
      </article>

      {open ? (
        <div
          ref={dialogRef}
          className="k-wordcard"
          role="dialog"
          tabIndex={-1}
          aria-label={`About ${open.token.surface}`}
          style={{ '--wordcard-top': `${open.top}px` } as CSSProperties}
        >
          <button
            type="button"
            className="k-icon-close k-press"
            onClick={() => {
              setOpen(null)
              window.requestAnimationFrame(() => triggerRef.current?.focus())
            }}
          >
            <span aria-hidden="true">×</span>
            <span className="k-sr">Close</span>
          </button>
          <p className="k-h3" lang="ja">
            {open.token.surface}
          </p>
          <dl className="k-formula__legend">
            <div>
              <dt>Kana</dt>
              <dd lang="ja">{open.token.kana}</dd>
            </div>
            <div>
              <dt>Rōmaji</dt>
              <dd>{open.token.romaji}</dd>
            </div>
            <div>
              <dt>Meaning</dt>
              <dd>{open.token.gloss}</dd>
            </div>
            {open.token.grammar ? (
              <div>
                <dt>Grammar</dt>
                <dd>{open.token.grammar}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : null}
    </div>
  )
}
