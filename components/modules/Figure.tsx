'use client'

/* The learning-card figures — complete_modules.md Part 2.
 *
 * One dispatcher, one renderer per kind. The rule that shaped all of them:
 * a figure is a COMPOSITION, not a paragraph. stat_boxes is a row of values,
 * timeline is a spine, comparison is two columns, balance is three. Rendering
 * any of them as prose — which an earlier pass did by flattening them into
 * `body` markdown — throws away the only thing that made them worth
 * generating separately.
 *
 * Colour is deliberately absent. Common Sage's generators emit a per-item
 * `accent`/`color` (one of six hues) on stat_boxes, diagram nodes and globe
 * pins; §3.2 reserves colour for ContentType, so those distinctions are
 * redrawn here with weight, scale, rule and shape. `note` and `shape` survive
 * from those schemas because they are content and a second channel.
 */

import dynamic from 'next/dynamic'
import type { Figure } from '@/lib/api/types'

const Diagram = dynamic(() => import('./Diagram').then((m) => m.Diagram))
const Globe = dynamic(() => import('./Globe').then((m) => m.Globe), {
  ssr: false,
  loading: () => <span className="k-map-skeleton" aria-label="Loading the map" />,
})
const Model3D = dynamic(() => import('./Model3D').then((m) => m.Model3D), {
  ssr: false,
  loading: () => <p className="k-meta">Loading 3D model…</p>,
})
const Formula = dynamic(() => import('./Formula').then((m) => m.Formula))
const Gallery = dynamic(() => import('./Gallery').then((m) => m.Gallery))
const MediaPlayer = dynamic(() => import('./MediaPlayer').then((m) => m.MediaPlayer), {
  ssr: false,
})
const Converter = dynamic(() => import('./Converter').then((m) => m.Converter))
const Composite = dynamic(() => import('./Composite').then((m) => m.Composite))

export function ModuleFigure({ figure }: { figure: Figure }) {
  switch (figure.kind) {
    case 'stats':
      return <Stats figure={figure} />
    case 'pairs':
      return <Pairs figure={figure} />
    case 'timeline':
      return <Timeline figure={figure} />
    case 'comparison':
      return <Comparison figure={figure} />
    case 'mistakes':
      return <Mistakes figure={figure} />
    case 'balance':
      return <Balance figure={figure} />
    case 'diagram':
      return <Diagram figure={figure} />
    case 'globe':
      return <Globe figure={figure} />
    case 'model':
      return <Model3D figure={figure} />
    case 'formula':
      return <Formula figure={figure} />
    case 'gallery':
      return <Gallery figure={figure} />
    case 'media':
      return <MediaPlayer figure={figure} />
    case 'conversion':
      return <Converter figure={figure} />
    case 'composite':
      return <Composite figure={figure} />
    default:
      return null
  }
}

/* ── Stat boxes ──────────────────────────────────────────────────────
 * The value is the thing. It takes the display size and the label sits
 * under it at meta size — a stat box where label and value are the same
 * weight is a table with extra steps. */

function Stats({ figure }: { figure: Extract<Figure, { kind: 'stats' }> }) {
  return (
    <ul className="k-fig k-fig--stats">
      {figure.items.map((s, i) => (
        <li key={i} className="k-stat">
          <span className="k-stat__value">
            {s.value}
            {s.unit ? <span className="k-stat__unit">{s.unit}</span> : null}
          </span>
          <span className="k-meta">{s.label}</span>
          {s.note ? <span className="k-stat__note">{s.note}</span> : null}
        </li>
      ))}
    </ul>
  )
}

/* ── Key/value pairs ─────────────────────────────────────────────────
 * The catalogue gives this one a disclosure: featured facts first, the rest
 * behind `[n] more details` / `Show less`. That is §2.7's tier-2 reveal, and
 * the count is honest because the learner controls it. */

function Pairs({ figure }: { figure: Extract<Figure, { kind: 'pairs' }> }) {
  const FEATURED = 4
  const rest = figure.rows.length - FEATURED
  return (
    <div className="k-fig k-fig--pairs">
      <table className="k-table">
        <tbody>
          {figure.rows.slice(0, FEATURED).map((r, i) => (
            <tr key={i}>
              <th scope="row">{r.key}</th>
              <td>{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {rest > 0 ? (
        <details>
          <summary className="k-btn k-btn--quiet k-press">
            {rest} more {rest === 1 ? 'detail' : 'details'}
          </summary>
          <table className="k-table">
            <tbody>
              {figure.rows.slice(FEATURED).map((r, i) => (
                <tr key={i}>
                  <th scope="row">{r.key}</th>
                  <td>{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      ) : null}

      {figure.note ? <p className="k-fig__note">{figure.note}</p> : null}
    </div>
  )
}

/* ── Timeline ────────────────────────────────────────────────────────
 * The passive one. Its graded sibling is timeline_drag_exercise and lives in
 * the ordering response, not here.
 *
 * The spine is drawn by the list's own border so it cannot detach from the
 * marks — an earlier pass drew it as a separate absolutely-positioned rule
 * and it drifted away from the dots at every zoom level. */

function Timeline({ figure }: { figure: Extract<Figure, { kind: 'timeline' }> }) {
  return (
    <ol className="k-fig k-fig--timeline">
      {figure.events.map((e, i) => (
        <li key={i}>
          <span className="k-timeline__mark" aria-hidden="true" />
          <span className="k-timeline__when">{e.when}</span>
          <span className="k-timeline__what">{e.what}</span>
        </li>
      ))}
    </ol>
  )
}

/* ── Comparison vs similar ───────────────────────────────────────────
 * "Easily confused with". Two columns and the one sentence that says why
 * they get confused, which is the whole reason the module exists. Wide
 * content scrolls horizontally inside its own container (the catalogue asks
 * for it, and §2 forbids the page itself scrolling sideways). */

function Comparison({ figure }: { figure: Extract<Figure, { kind: 'comparison' }> }) {
  return (
    <div className="k-fig k-fig--comparison">
      <div className="k-table-scroll">
        <div className="k-compare">
          <section className="k-compare__side">
            <h3 className="k-h3">{figure.left.title}</h3>
            <ul>
              {figure.left.points.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </section>
          <section className="k-compare__side">
            <h3 className="k-h3">{figure.right.title}</h3>
            <ul>
              {figure.right.points.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
      {figure.note ? <p className="k-compare__note">{figure.note}</p> : null}
    </div>
  )
}

/* ── Common mistakes ─────────────────────────────────────────────────
 * Wrong above right, always in that order, because the misconception is
 * what the learner arrives holding. §3.3: the two are distinguished by rule
 * weight and a written label, never by colour alone. */

function Mistakes({ figure }: { figure: Extract<Figure, { kind: 'mistakes' }> }) {
  return (
    <ul className="k-fig k-fig--mistakes">
      {figure.items.map((m, i) => (
        <li key={i} className="k-mistake">
          <p className="k-mistake__row">
            <span className="k-mistake__label">Wrong</span>
            <span>{m.wrong}</span>
          </p>
          <p className="k-mistake__row">
            <span className="k-mistake__label">Right</span>
            <span>{m.right}</span>
          </p>
          {m.why ? <p className="k-mistake__why">{m.why}</p> : null}
        </li>
      ))}
    </ul>
  )
}

/* ── Input/output balance ────────────────────────────────────────────
 * Three columns with real operators between them, so the equation reads as
 * an equation. The operators are aria-hidden and the columns are headed, so
 * it reads as three lists to a screen reader rather than as "plus plus". */

function Balance({ figure }: { figure: Extract<Figure, { kind: 'balance' }> }) {
  return (
    <div className="k-fig k-fig--balance">
      <section className="k-balance__col">
        <h3 className="k-meta">Inputs</h3>
        <ul>
          {figure.inputs.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </section>
      <span className="k-balance__op" aria-hidden="true">
        →
      </span>
      <section className="k-balance__col">
        <h3 className="k-meta">Outputs</h3>
        <ul>
          {figure.outputs.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </section>
      <span className="k-balance__op" aria-hidden="true">
        +
      </span>
      <section className="k-balance__col">
        <h3 className="k-meta">Stored</h3>
        <ul>
          <li>{figure.stored}</li>
        </ul>
      </section>
      {figure.note ? <p className="k-fig__note">{figure.note}</p> : null}
    </div>
  )
}
