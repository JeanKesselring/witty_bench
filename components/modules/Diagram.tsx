'use client'

/* diagram_schematic — flowchart, tree, network, cycle.
 *
 * The catalogue's interaction list is the spec: hover highlights a node and
 * its direct relationships, its description appears near the pointer, click
 * keeps it selected, clicking again clears, unrelated nodes dim, and the
 * relationship flow animates.
 *
 * Two things it does that the source does not:
 *   · The same interaction is reachable by keyboard. Each node is a real
 *     <button> in the SVG's tab order, focus does what hover does, and Enter
 *     does what click does. §9.3 calls the SVG graph fully accessible and
 *     says to keep it that way; a hover-only diagram would not be.
 *   · The relationships are also written out as sentences under the figure.
 *     Not a fallback — a diagram whose edges cannot be read is a picture of
 *     information rather than information.
 *
 * The flow animation is a dash offset on the edges, and it is off under
 * prefers-reduced-motion (handled in kite.css, not here).
 */

import { useId, useMemo, useState } from 'react'
import { describeEdges, layoutDiagram } from '@/lib/modules/diagram'
import type { Figure } from '@/lib/api/types'

export function Diagram({ figure }: { figure: Extract<Figure, { kind: 'diagram' }> }) {
  const [active, setActive] = useState<string | null>(null)
  const [pinned, setPinned] = useState<string | null>(null)
  const arrowId = useId()

  const geometry = useMemo(() => layoutDiagram(figure.layout, figure.nodes, figure.edges), [figure])
  const relations = useMemo(() => describeEdges(figure.nodes, figure.edges), [figure])

  const current = pinned ?? active
  /* A node is "related" if an edge touches it and the current node. The set
   * is computed rather than stored so a diagram whose edges change never
   * carries a stale highlight. */
  const related = useMemo(() => {
    if (!current) return null
    const set = new Set<string>([current])
    for (const e of figure.edges) {
      if (e.from === current) set.add(e.to)
      if (e.to === current) set.add(e.from)
    }
    return set
  }, [current, figure.edges])

  const described = current ? figure.nodes.find((n) => n.id === current) : undefined

  return (
    <div className="k-fig k-fig--diagram">
      <div className="k-diagram__scroll">
        <svg
          className="k-diagram"
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          width={geometry.width}
          height={geometry.height}
          role="group"
          aria-label={`${figure.layout} diagram`}
        >
          <defs>
            <marker
              id={arrowId}
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L8,4 L0,8 Z" fill="currentColor" />
            </marker>
          </defs>

          <g className="k-diagram__edges">
            {geometry.edges.map((e, i) => {
              const lit = related !== null && (e.from === current || e.to === current)
              return (
                <g key={i} className={related === null ? undefined : lit ? 'is-lit' : 'is-dim'}>
                  <line
                    x1={e.x1}
                    y1={e.y1}
                    x2={e.x2}
                    y2={e.y2}
                    strokeDasharray={e.style === 'dashed' ? '6 4' : undefined}
                    markerEnd={`url(#${arrowId})`}
                  />
                  {e.label ? (
                    <text className="k-diagram__edgelabel" x={e.mx} y={e.my - 4}>
                      {e.label}
                    </text>
                  ) : null}
                </g>
              )
            })}
          </g>

          {geometry.nodes.map((n) => {
            const dim = related !== null && !related.has(n.id)
            return (
              <g
                key={n.id}
                className={[
                  'k-diagram__node',
                  dim ? 'is-dim' : '',
                  current === n.id ? 'is-current' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                transform={`translate(${n.x} ${n.y})`}
                data-shape={n.shape ?? 'box'}
                tabIndex={0}
                role="button"
                aria-pressed={pinned === n.id}
                aria-label={n.description ? `${n.label}. ${n.description}` : n.label}
                onMouseEnter={() => setActive(n.id)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(n.id)}
                onBlur={() => setActive(null)}
                onClick={() => setPinned((p) => (p === n.id ? null : n.id))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setPinned((p) => (p === n.id ? null : n.id))
                  }
                }}
              >
                <NodeShape shape={n.shape} hw={n.hw} hh={n.hh} />
                <text className="k-diagram__text" textAnchor="middle" dy="0.35em">
                  {n.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* The description, in a fixed slot under the figure rather than
          floating at the pointer. A tooltip that follows the cursor is
          unreachable by keyboard and unreadable on touch (§6.11); this says
          the same thing in a place that does not move. */}
      {current ? (
        <p className="k-diagram__gloss" aria-live="polite">
          {described?.description ?? described?.label}
        </p>
      ) : null}

      <details className="k-diagram__relations">
        <summary className="k-btn k-btn--quiet k-press">
          Read the {relations.length} relationships
        </summary>
        <ul>
          {relations.map((r) => (
            <li key={r.key}>
              {r.from} {r.label ? <em>{r.label}</em> : '→'} {r.to}
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}

/* §3.3's second channel, doing real work: the source encodes node kind as a
 * colour, which Kite does not have available, so the SHAPE carries it —
 * which is also what a schematic conventionally does. */
function NodeShape({
  shape,
  hw,
  hh,
}: {
  shape?: 'box' | 'diamond' | 'circle' | 'oval'
  hw: number
  hh: number
}) {
  switch (shape) {
    case 'diamond':
      return <polygon points={`0,${-hh} ${hw},0 0,${hh} ${-hw},0`} />
    case 'circle':
      return <circle r={Math.max(hw, hh)} />
    case 'oval':
      return <ellipse rx={hw} ry={hh} />
    default:
      return <rect x={-hw} y={-hh} width={hw * 2} height={hh * 2} />
  }
}
