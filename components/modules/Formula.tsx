'use client'

/* formula_equation — LaTeX, typeset.
 *
 * KaTeX ships its own fonts, which is a deliberate exception to §4.1's
 * system-stack-only rule and the only one in the product. The reason it is
 * worth making: mathematical layout is not typography with a different
 * alphabet — the placement of a limit under a sigma, the size of a nested
 * fraction and the reach of a radical are semantic, and no system face
 * supplies the metrics for them. The exception is bounded to elements
 * inside `.k-formula__expression`; nothing else on any surface may use it.
 *
 * `renderToString` with `throwOnError: false` means malformed generated
 * LaTeX degrades to the source text in red rather than throwing away the
 * card — generated content must never be able to blank a module.
 *
 * The output is trusted HTML from a library, not user content: the LaTeX
 * source is escaped by KaTeX itself, and `strict: false` only relaxes
 * warnings about unusual commands, not sanitisation.
 */

import { useMemo, useState } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import type { Figure } from '@/lib/api/types'

export function Formula({ figure }: { figure: Extract<Figure, { kind: 'formula' }> }) {
  const [copied, setCopied] = useState(false)

  const html = useMemo(
    () =>
      katex.renderToString(figure.expression, {
        displayMode: true,
        throwOnError: false,
        strict: false,
        output: 'htmlAndMathml',
      }),
    [figure.expression],
  )

  return (
    <div className="k-fig k-fig--formula">
      {/* Oversized expressions scroll inside their own box; the page never
          scrolls sideways (§2). */}
      <div
        className="k-formula__expression k-table-scroll"
        // KaTeX emits both HTML and MathML; the MathML half is what a screen
        // reader reads, so the whole thing must not be aria-hidden.
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* The legend's symbols are LaTeX too. Printing them raw put
          `P(A \mid B)` and `A_i` on screen — the one place on the card where
          the notation the learner has to recognise appeared in source form. */}
      <dl className="k-formula__legend">
        {figure.terms.map((t) => (
          <div key={t.symbol}>
            <dt
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(t.symbol, {
                  throwOnError: false,
                  strict: false,
                  output: 'htmlAndMathml',
                }),
              }}
            />
            <dd>{t.meaning}</dd>
          </div>
        ))}
      </dl>

      <button
        type="button"
        className="k-btn k-btn--quiet k-press"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(figure.expression)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          } catch {
            // Clipboard access can be refused outright. Saying nothing would
            // read as "copied"; the source is selectable above either way.
            setCopied(false)
          }
        }}
      >
        {copied ? 'Copied!' : 'Copy LaTeX'}
      </button>
    </div>
  )
}
