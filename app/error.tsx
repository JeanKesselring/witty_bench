'use client'

/* §13.5: one error boundary per route. A single failing surface renders
 * §11.13's error state — what failed, whether work was lost, one retry
 * action, in plain language with no codes. */

export default function RouteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="k-main" tabIndex={-1} className="k-main">
      <section className="k-head">
        <h1 className="k-h1">That didn’t load</h1>
      </section>
      <div className="k-state">
        <p>
          Something went wrong loading this page. Nothing you were working on
          was lost.
        </p>
        <button type="button" className="k-btn k-btn--primary k-press" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  )
}
