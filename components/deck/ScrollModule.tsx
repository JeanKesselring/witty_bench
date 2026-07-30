'use client'

/* The ungraded shell — §6.10's direct-on-lattice learning behaviour.
 *
 * No fixed frame and no control band. A dense diagram, a long timeline or a
 * rotatable model is crushed by a frame sized for a flashcard, and the two
 * controls a band would offer it are both dead: Check has nothing to mark and
 * Reveal has nothing to show. Fifteen dead controls a session teach a learner
 * to stop reading that region on the cards where it matters.
 *
 * What it keeps from the frame is the promise that matters: the primary
 * action is bottom-right in both, so Continue and Check occupy the same
 * corner of the composition.
 *
 * The catalogue's shared learning-module behaviour adds three things §6.10 did
 * not have, and all three are here:
 *   · `Source ↗` when supplied, opening in a new tab.
 *   · A provenance line — "Sourced from your material" or "Includes external
 *     references" — because a learner deciding whether to trust generated
 *     content is doing the right thing and the card must answer.
 *   · A reversible Hard / Easy. Reversible until the learner leaves the card,
 *     which is the whole difference between a rating and a mistake.
 *
 * Engagement, not completion: nothing gates Continue, but a card scrolled
 * past below a content-scaled dwell threshold contributes nothing to mastery.
 * The clock pauses on a hidden tab, the threshold is never displayed, and it
 * is the absence of a positive — never a penalty (§6.10, §11.7).
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Grade, ModuleItem } from '@/lib/api/types'
import { moduleTypeOrDefault, CONTENT_TYPE_LABEL } from '@/lib/modules/registry'
import { ModuleFigure } from '@/components/modules/Figure'
import { ModuleMenu } from './ModuleMenu'

/** Dwell scales with how much there is to read: ~200 wpm, floored at 3s and
 *  capped at 45s so a very long card is not unreachable. Tier 4 — never
 *  shown to anyone, which is why the constant lives here and not in a token. */
function threshold(item: ModuleItem): number {
  const words = (item.body ?? '').split(/\s+/).filter(Boolean).length
  return Math.min(45_000, Math.max(3_000, (words / 200) * 60_000))
}

export function ScrollModule({
  item,
  onContinue,
  showRating = true,
  showContinue = true,
}: {
  item: ModuleItem
  onContinue?: (engaged: boolean, dwellMs: number, rating: Grade | null) => void
  showRating?: boolean
  showContinue?: boolean
}) {
  const spec = moduleTypeOrDefault(item.moduleType)
  const [rating, setRating] = useState<Grade | null>(null)

  /* Dwell. Accumulated in a ref rather than state — it changes constantly
   * and nothing renders from it, so putting it in state would re-render the
   * card once a second for a number nobody may see. */
  const dwell = useRef(0)
  const since = useRef<number | null>(Date.now())

  useEffect(() => {
    const settle = () => {
      if (since.current !== null) {
        dwell.current += Date.now() - since.current
        since.current = null
      }
    }
    const onVisibility = () => {
      if (document.hidden) settle()
      else since.current = Date.now()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      settle()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [item.id])

  const bar = useMemo(() => threshold(item), [item])

  const leave = () => {
    const total = dwell.current + (since.current ? Date.now() - since.current : 0)
    onContinue?.(total >= bar, total, rating)
  }

  return (
    <article
      className="k-scrollmodule"
      aria-label={`${CONTENT_TYPE_LABEL[spec.contentType]} module`}
      style={{ ['--accent' as string]: `var(--accent-${spec.contentType})` }}
    >
      <header className="k-frame__header">
        <span className="k-frame__topic">{item.topicTitle}</span>
        <ModuleMenu item={item} />
      </header>

      {item.subtitle ? <p className="k-meta">{item.subtitle}</p> : null}

      {item.body ? (
        <div className="k-prose">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.body}</ReactMarkdown>
        </div>
      ) : null}

      {item.figure ? <ModuleFigure figure={item.figure} /> : null}

      {/* Provenance. One line, and only the one that is true. */}
      {item.grounding ? (
        <p className="k-meta k-provenance">
          {item.grounding === 'material' ? 'Course material' : 'External references'}
        </p>
      ) : null}

      {item.sources && item.sources.length > 0 ? (
        <ul className="k-sources">
          {item.sources.map((s) => (
            <li key={s.href}>
              <a href={s.href} target="_blank" rel="noreferrer noopener">
                {s.label} <span aria-hidden="true">↗</span>
                <span className="k-sr">(opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      <footer className="k-scrollmodule__foot">
        {/* Two buttons, not four: this card emits no recall signal, so a
            four-point scale would be asking for a precision the data cannot
            carry. Pressing the pressed one clears it — reversible until the
            learner leaves. */}
        {showRating ? (
          <div className="k-scrollmodule__rate" role="group" aria-label="How was this?">
            {(['hard', 'easy'] as const).map((g) => (
              <button
                key={g}
                type="button"
                className="k-btn k-btn--quiet k-press"
                aria-pressed={rating === g}
                onClick={() => setRating((r) => (r === g ? null : g))}
              >
                {g === 'hard' ? 'Hard' : 'Easy'}
              </button>
            ))}
          </div>
        ) : null}

        {showContinue ? (
          <button type="button" className="k-btn k-btn--primary k-press" onClick={leave}>
            Continue
          </button>
        ) : null}
      </footer>
    </article>
  )
}
