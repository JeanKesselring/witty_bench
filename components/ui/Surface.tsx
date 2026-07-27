import type { ReactNode } from 'react'

/* §2.3: every surface, every role, the same four regions in the same DOM
 * order. main carries id="k-main" and is the primary skip-link target;
 * exactly one <h1> per surface, in .k-head. */

export function Surface({
  title,
  orientation,
  context,
  inspector,
  children,
}: {
  title: string
  /** One sentence. §2.3 calls this orientation, not a subtitle. */
  orientation?: string
  context?: ReactNode
  inspector?: ReactNode
  children: ReactNode
}) {
  return (
    <main
      id="k-main"
      // §8.7: route change moves focus here, so it must be focusable.
      tabIndex={-1}
      className={inspector ? 'k-main k-main--railed' : 'k-main'}
    >
      <section className="k-head">
        <h1 className="k-h1">{title}</h1>
        {orientation ? <p>{orientation}</p> : null}
      </section>

      {context ? (
        <nav className="k-context" aria-label="Context">
          {context}
        </nav>
      ) : null}

      <div id="k-work" tabIndex={-1}>
        {children}
      </div>

      {inspector ? (
        // §2.3: below lg this becomes a block after the work region —
        // never a modal, never a drawer.
        <aside className="k-inspector" aria-label="Inspector">
          {inspector}
        </aside>
      ) : null}
    </main>
  )
}
