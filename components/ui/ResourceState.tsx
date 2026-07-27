import Link from 'next/link'
import type { Route } from 'next'

/* §11.13 / §12.2: one primitive for loading, error and empty, so those
 * states cannot drift per component. Extended per §2.7 to carry a
 * recovery action — Common Sage's version ended at "No X found." */

export function Loading({ label, rows = 3 }: { label: string; rows?: number }) {
  return (
    <div aria-busy="true" aria-label={label} style={{ display: 'grid', gap: 'var(--space-1)' }}>
      {Array.from({ length: rows }).map((_, i) => (
        // Skeletons at final dimensions — no layout shift (§11.13).
        <div
          key={i}
          className="k-skeleton k-shimmer"
          style={{ blockSize: '8rem' }}
        />
      ))}
    </div>
  )
}

export function Empty({
  message,
  action,
}: {
  message: string
  /** Required by §11.13: a sentence naming what would be here, PLUS the
   *  action that creates it. */
  action: { label: string; href: Route }
}) {
  return (
    <div className="k-state">
      <p>{message}</p>
      <Link className="k-btn k-btn--primary k-press" href={action.href}>
        {action.label}
      </Link>
    </div>
  )
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="k-state">
      {/* §11.13: what failed, whether work was lost, one retry action.
          Plain language, no codes. */}
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="k-btn k-btn--secondary k-press" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  )
}

export function PermissionDenied({ role }: { role: string }) {
  return (
    <div className="k-state">
      {/* Never a blank page or a silent redirect (§11.13). */}
      <p>
        This page is for {role}s. Ask the course educator if you think you
        should have access.
      </p>
      <Link className="k-btn k-btn--secondary k-press" href={'/me' as Route}>
        Back to home
      </Link>
    </div>
  )
}
