'use client'

import { useEffect, useRef, useState } from 'react'
import type { ModuleItem } from '@/lib/api/types'
import { moduleTypeOrDefault } from '@/lib/modules/registry'

/* §6.10: the ungraded types get no control band and no fixed frame. They
 * keep the header, their content scrolls, and a single Continue sits where
 * the primary action always sits.
 *
 * Engagement, not completion: nothing gates Continue, but a module scrolled
 * past below a dwell threshold contributes nothing to mastery (§11.7).
 * Three constraints, because a hidden metric is easy to get wrong:
 *   — absence of a positive, never a penalty
 *   — the clock pauses when the tab is hidden
 *   — the threshold and the learner's dwell are tier 4 (§2.7): never shown */

const MS_PER_CHAR = 18
const MIN_DWELL = 3000
const MAX_DWELL = 30000

function threshold(item: ModuleItem): number {
  const length = (item.body?.length ?? 0) + item.prompt.length
  return Math.min(MAX_DWELL, Math.max(MIN_DWELL, length * MS_PER_CHAR))
}

export function ScrollModule({
  item,
  onContinue,
}: {
  item: ModuleItem
  onContinue: (engaged: boolean, dwellMs: number) => void
}) {
  const spec = moduleTypeOrDefault(item.moduleType)
  const [dwell, setDwell] = useState(0)
  const visible = useRef(true)

  useEffect(() => {
    setDwell(0)
    const tick = setInterval(() => {
      if (visible.current) setDwell((d) => d + 250)
    }, 250)
    const onVisibility = () => {
      visible.current = document.visibilityState === 'visible'
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(tick)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [item.id])

  return (
    <article
      className="k-scrollmodule"
      aria-label={`${spec.id.replace(/_/g, ' ')} module`}
      style={{ '--accent': `var(--accent-${spec.contentType})` } as React.CSSProperties}
    >
      <header className="k-frame__header" style={{ blockSize: '56px' }}>
        <span className="k-frame__type">{spec.contentType}</span>
        <span className="k-frame__topic">{item.topicTitle}</span>
        <button type="button" className="k-btn k-btn--quiet k-press" aria-label="Module options">
          ⋯
        </button>
      </header>

      <h2 className="k-h3">{item.prompt}</h2>

      <div className="k-md">
        {(item.body ?? '').split('\n\n').map((para, i) =>
          para.startsWith('- ') ? (
            <ul key={i}>
              {para.split('\n').map((li) => (
                <li key={li}>{li.replace(/^- /, '')}</li>
              ))}
            </ul>
          ) : (
            <p key={i}>{renderEmphasis(para)}</p>
          ),
        )}
      </div>

      <div className="k-scrollmodule__foot">
        <button
          type="button"
          className="k-btn k-btn--primary k-btn--study k-press"
          onClick={() => onContinue(dwell >= threshold(item), dwell)}
        >
          Continue
        </button>
      </div>
    </article>
  )
}

/** Minimal **bold** handling, so fixture prose renders as §6.13 intends. */
function renderEmphasis(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? (
      <strong key={i}>{p.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  )
}
