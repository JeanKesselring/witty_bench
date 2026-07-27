import type { ReactNode } from 'react'

/* §2.7: the inspector rail is tier 2, on every surface. It fills on Select
 * and never navigates. Selecting a second object replaces the contents —
 * it does not stack, and there is never a second rail. */

export function Inspector({
  subject,
  rows,
  children,
  empty = 'Select an item to preview it.',
}: {
  subject?: string
  rows?: Array<[string, ReactNode]>
  children?: ReactNode
  empty?: string
}) {
  if (!subject) {
    // §2.7: the empty state names what selecting would show rather than
    // sitting blank.
    return (
      <div className="k-panel">
        <p className="k-body-sm" style={{ color: 'var(--ink-faint)' }}>
          {empty}
        </p>
      </div>
    )
  }

  return (
    <div className="k-panel" aria-live="polite">
      <h2 className="k-h3">{subject}</h2>
      {rows?.length ? (
        <dl
          style={{
            display: 'grid',
            gap: 'var(--space-1)',
            marginBlockStart: 'var(--space-2)',
          }}
        >
          {rows.map(([term, value]) => (
            <div
              key={term}
              style={{
                display: 'grid',
                gridTemplateColumns: '40% 1fr',
                gap: 'var(--space-2)',
              }}
            >
              <dt className="k-label" style={{ color: 'var(--ink-faint)' }}>
                {term}
              </dt>
              <dd className="k-body-sm">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {children}
    </div>
  )
}
