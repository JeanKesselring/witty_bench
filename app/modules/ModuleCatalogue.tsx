'use client'

import { useMemo, useRef, useState } from 'react'
import { ModuleFrame, type Outcome } from '@/components/deck/ModuleFrame'
import { SetModule, hasSet } from '@/components/deck/SetModule'
import { ScrollModule } from '@/components/deck/ScrollModule'
import type { ModuleItem } from '@/lib/api/types'
import type { ModuleTypeSpec } from '@/lib/modules/registry'

/* A test harness, not a listing.
 *
 * The first version of this page described each type in prose, which is
 * useless for the thing it exists for: you cannot tell from a paragraph
 * whether a cloze gap is reachable, whether the ordering control can be
 * driven by keyboard, or whether a long Japanese prompt breaks the frame.
 * So every example renders through the REAL components — ModuleFrame for
 * graded types, ScrollModule for ungraded — with the real response controls,
 * the real Check/Reveal loop and the real judgement.
 *
 * One module is live at a time rather than all 36 at once: each frame
 * carries a backdrop-filter, and thirty-six of them on one page is a
 * different performance question than the deck ever asks.
 */

interface Entry {
  spec: ModuleTypeSpec
  example: ModuleItem | null
}

interface Resolution {
  at: string
  label: string
}

export function ModuleCatalogue({ entries }: { entries: Entry[] }) {
  const [selected, setSelected] = useState(entries[0]?.spec.id ?? '')
  const [log, setLog] = useState<Resolution[]>([])
  const [query, setQuery] = useState('')
  const stageRef = useRef<HTMLDivElement | null>(null)
  // Remounts the live module so a type can be re-tested from a clean state
  // without navigating away and back.
  const [run, setRun] = useState(0)

  const current = entries.find((e) => e.spec.id === selected)
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return entries
    return entries.filter(({ spec }) =>
      [spec.id, spec.contentType, spec.response, spec.mode].some((value) =>
        value.toLowerCase().includes(needle),
      ),
    )
  }, [entries, query])

  /* The harness reviews ONE type at a time, so its "session" is that single
   * card — bands fit the type on screen. Measuring across all 36 would size
   * every card to the tallest in the catalogue, which is the right answer
   * for a real mixed session and the wrong one for judging a type's own
   * proportions, which is what this page is for. */
  const record = (label: string) => {
    setLog((l) => [{ at: new Date().toLocaleTimeString(), label }, ...l].slice(0, 6))
    setRun((r) => r + 1)
  }

  const onResolve = (o: Outcome) =>
    record(
      `resolved — grade ${o.grade}${o.assisted ? ', assisted' : ''}${
        o.judgement ? `, judged ${o.judgement.outcome}` : ''
      }`,
    )

  return (
    <div className="k-harness">
      {/* The picker. Every type, grouped by whether it is graded, with its
          response control shown — that is the axis that decides what the
          module actually looks like. */}
      <nav className="k-harness__list" aria-label="Module types">
        <label className="k-field">
          <span className="k-field__label">Find a module</span>
          <input
            type="search"
            className="k-input"
            value={query}
            placeholder="Flashcard, map, timeline…"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <p className="k-meta" aria-live="polite">
          {visible.length} of {entries.length} types
        </p>
        {(['graded', 'ungraded'] as const).map((group) => (
          <section key={group}>
            <h2 className="k-meta">{group}</h2>
            <ul>
              {visible
                .filter((e) => (group === 'graded') === e.spec.graded)
                .map(({ spec, example }) => (
                  <li key={spec.id}>
                    <button
                      type="button"
                      className="k-btn k-btn--quiet k-press k-harness__item"
                      aria-current={spec.id === selected ? 'true' : undefined}
                      data-current={spec.id === selected ? 'true' : undefined}
                      onClick={() => {
                        setSelected(spec.id)
                        setRun((r) => r + 1)
                        if (window.matchMedia('(max-width: 1023px)').matches) {
                          window.requestAnimationFrame(() =>
                            stageRef.current?.scrollIntoView({
                              behavior: 'smooth',
                              block: 'start',
                            }),
                          )
                        }
                      }}
                    >
                      <span>{spec.id.replace(/_/g, ' ')}</span>
                      <small>{example ? spec.response : 'no example'}</small>
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        ))}
        {visible.length === 0 ? <p className="k-body-sm">No module types match.</p> : null}
      </nav>

      <div ref={stageRef} className="k-harness__stage">
        {current?.example ? (
          <>
            {/* The live module. Keyed on run so Reset gives a clean state. */}
            {current.spec.graded ? (
              hasSet(current.example) ? (
                <SetModule
                  key={`${current.spec.id}-${run}`}
                  item={current.example}
                  onResolve={onResolve}
                  onSkip={() => record('skipped — leaves the session, ungraded')}
                />
              ) : (
                <ModuleFrame
                  key={`${current.spec.id}-${run}`}
                  item={current.example}
                  onResolve={onResolve}
                  onSkip={() => record('skipped — leaves the session, ungraded')}
                />
              )
            ) : (
              <ScrollModule
                key={`${current.spec.id}-${run}`}
                item={current.example}
                onContinue={(engaged: boolean, dwellMs: number) =>
                  record(
                    `continued — ${engaged ? 'engaged' : 'below threshold'}, ${
                      Math.round(dwellMs / 100) / 10
                    }s`,
                  )
                }
              />
            )}

            <div className="k-harness__foot">
              <button
                type="button"
                className="k-btn k-btn--secondary k-press"
                onClick={() => setRun((r) => r + 1)}
              >
                Reset this module
              </button>
              <details>
                <summary className="k-meta">Test output</summary>
                <ul className="k-harness__log" aria-live="polite" aria-label="Outcomes">
                  {log.map((l, i) => (
                    <li key={`${l.at}-${i}`} className="k-body-sm">
                      <span className="k-meta">{l.at}</span> {l.label}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          </>
        ) : (
          <p className="k-body-sm">No example written for this type yet.</p>
        )}
      </div>
    </div>
  )
}
