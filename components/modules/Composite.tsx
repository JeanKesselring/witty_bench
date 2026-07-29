'use client'

/* topic_card — the composite.
 *
 * Up to two visual modules, collapsible explanatory panels, one unified
 * source list. It is a LAYOUT module: the figures inside it are the same
 * canonical figures rendered by the same components, never copies with
 * different behaviour. That is why this file is short and why it must stay
 * short — every line of bespoke rendering here is a place the composite and
 * the standalone card can drift apart.
 *
 * The panels use `<details>`, so they are open-able by keyboard, findable by
 * find-in-page, and printable — three things a div with a click handler
 * silently gives up. The first is open, because a topic card whose content
 * is entirely behind closed panels reads as an empty card.
 */

import { ModuleFigure } from './Figure'
import type { Figure } from '@/lib/api/types'

/** The catalogue permits four visual kinds inside a topic card. Anything
 *  else is content and belongs in a panel; enforcing it here stops a
 *  generator quietly nesting a composite in a composite. */
const VISUAL: ReadonlyArray<Figure['kind']> = ['model', 'globe', 'gallery', 'diagram']

export function Composite({ figure }: { figure: Extract<Figure, { kind: 'composite' }> }) {
  const visuals = figure.figures.filter((f) => VISUAL.includes(f.kind)).slice(0, 2)
  const rest = figure.figures.filter((f) => !VISUAL.includes(f.kind))

  return (
    <div className="k-fig k-fig--composite">
      {visuals.map((f, i) => (
        <ModuleFigure key={`v${i}`} figure={f} />
      ))}

      {figure.panels.map((panel, i) => (
        <details key={panel.title} open={i === 0} className="k-panel">
          <summary className="k-h3">{panel.title}</summary>
          <p>{panel.body}</p>
        </details>
      ))}

      {rest.map((f, i) => (
        <ModuleFigure key={`r${i}`} figure={f} />
      ))}
    </div>
  )
}
