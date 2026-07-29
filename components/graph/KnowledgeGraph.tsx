'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { keys } from '@/lib/api/keys'
import { Surface } from '@/components/ui/Surface'
import { Inspector } from '@/components/ui/Inspector'
import { Loading } from '@/components/ui/ResourceState'
import { Mastery } from '@/components/ui/Mastery'
import type { Topic } from '@/lib/api/types'

/* §7.2 Knowledge graph. Topics contain topics — and the graph IS the
 * progress map (§11.7), so every tile carries its mastery state.
 * §9.3: SVG, not canvas. It is fully accessible and is NOT a carve-out.
 * §8.4: the topic field is one tab stop, navigated by arrows, no wrapping. */

const CELL = 64
const GAP = 8

export function KnowledgeGraph({ courseId }: { courseId: string }) {
  const { data, isPending } = useQuery({
    queryKey: keys.courseTopics(courseId),
    queryFn: () => api.courseTopics(courseId),
  })

  const [parentId, setParentId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Topic | null>(null)
  const [query, setQuery] = useState('')
  const [detailOpen, setDetailOpen] = useState(true)
  const refs = useRef<Array<SVGGElement | null>>([])

  const all = useMemo(() => data ?? [], [data])
  const field = useMemo(() => all.filter((t) => t.parentId === parentId), [all, parentId])
  const crumbs = useMemo(() => {
    const chain: Topic[] = []
    let id = parentId
    while (id) {
      const found = all.find((t) => t.id === id)
      if (!found) break
      chain.unshift(found)
      id = found.parentId
    }
    return chain
  }, [all, parentId])
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return []
    return all
      .filter((topic) => `${topic.title} ${topic.blurb}`.toLowerCase().includes(needle))
      .slice(0, 8)
  }, [all, query])

  const focusTopic = (topic: Topic) => {
    setParentId(topic.parentId)
    setSelected(topic)
    setQuery('')
  }

  // Cell-snapped tile packing, 1×1 to 3×3 (§2.4).
  const placed = useMemo(() => {
    let x = 0
    let y = 0
    let rowHeight = 0
    const perRow = 6
    return field.map((t) => {
      if (x + t.span > perRow) {
        x = 0
        y += rowHeight
        rowHeight = 0
      }
      const pos = { topic: t, x, y }
      x += t.span
      rowHeight = Math.max(rowHeight, t.span)
      return pos
    })
  }, [field])

  const width = 6 * (CELL + GAP)
  const height = (placed.reduce((m, p) => Math.max(m, p.y + p.topic.span), 0) || 1) * (CELL + GAP)

  function onKeyDown(e: React.KeyboardEvent, i: number) {
    let next = i
    if (e.key === 'ArrowRight') next = i + 1
    else if (e.key === 'ArrowLeft') next = i - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = placed.length - 1
    else if (e.key === 'Escape') {
      ;(e.currentTarget.parentElement as SVGSVGElement | null)?.focus()
      return
    } else return
    e.preventDefault()
    // §8.4: arrow navigation does not wrap. A hard stop teaches the boundary.
    if (next < 0 || next >= placed.length) return
    refs.current[next]?.focus()
  }

  return (
    <Surface
      title="Knowledge graph"
      orientation="Topics contain topics. Every tile shows where you stand."
      context={
        <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: 'var(--space-1)' }}>
          {/* §7.2: breadcrumbs are the sole ascent path; every crumb is a button. */}
          <button type="button" className="k-chip k-press" onClick={() => setParentId(null)}>
            Top
          </button>
          {crumbs.map((c) => (
            <button
              key={c.id}
              type="button"
              className="k-chip k-press"
              onClick={() => setParentId(c.id)}
              aria-current={c.id === parentId ? 'true' : undefined}
            >
              {c.title}
            </button>
          ))}
        </nav>
      }
      inspector={
        detailOpen ? (
          <Inspector
            subject={selected?.title}
            empty="Select a topic to preview it."
            rows={
              selected
                ? [
                    ['Mastery', <Mastery key="m" state={selected.mastery} />],
                    ['Modules', selected.moduleCount],
                    ['Contains', selected.childIds.length || '—'],
                  ]
                : undefined
            }
          >
            {selected ? (
              <div
                style={{
                  display: 'grid',
                  gap: 'var(--space-1)',
                  marginBlockStart: 'var(--space-2)',
                }}
              >
                <p className="k-body-sm">{selected.blurb}</p>
                {/* §7.1: only the explicit open control descends. Selecting
                  previews; it must never cost a navigation. */}
                {selected.childIds.length ? (
                  <button
                    type="button"
                    className="k-btn k-btn--primary k-press"
                    onClick={() => {
                      setParentId(selected.id)
                      setSelected(null)
                    }}
                  >
                    Open — {selected.childIds.length} topics inside
                  </button>
                ) : null}
                <Link
                  className="k-btn k-btn--secondary k-press"
                  href={`/topics/${selected.id}` as Route}
                >
                  Topic detail
                </Link>
              </div>
            ) : null}
          </Inspector>
        ) : undefined
      }
    >
      <div className="k-graphsearch">
        <label className="k-field">
          <span className="k-field__label">Search concepts</span>
          <input
            type="search"
            className="k-input"
            value={query}
            placeholder="Search concepts…"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && results[0]) {
                event.preventDefault()
                focusTopic(results[0])
              }
              if (event.key === 'Escape') {
                event.preventDefault()
                setQuery('')
              }
            }}
          />
        </label>
        <button
          type="button"
          className="k-btn k-btn--quiet k-press"
          aria-pressed={detailOpen}
          onClick={() => setDetailOpen((open) => !open)}
        >
          {detailOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        </button>
        {results.length > 0 ? (
          <ul className="k-graphsearch__results" aria-label="Search results">
            {results.map((topic) => (
              <li key={topic.id}>
                <button
                  type="button"
                  className="k-btn k-btn--quiet k-press"
                  onClick={() => focusTopic(topic)}
                >
                  {topic.title}
                  <small className="k-meta">{topic.blurb}</small>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {isPending ? (
        <Loading label="Loading the graph" rows={1} />
      ) : placed.length === 0 ? (
        // §7.2: an atomic topic shows an empty-state tile, not an empty grid.
        <div className="k-state">
          <p>This topic contains no further topics.</p>
          <button
            type="button"
            className="k-btn k-btn--secondary k-press"
            onClick={() => setParentId(null)}
          >
            Back to the top
          </button>
        </div>
      ) : (
        <svg
          role="grid"
          aria-label={`Topic field, ${placed.length} topics`}
          width="100%"
          viewBox={`0 0 ${width} ${height}`}
          style={{ maxInlineSize: `${width}px` }}
        >
          {placed.map((p, i) => {
            const w = p.topic.span * CELL + (p.topic.span - 1) * GAP
            const isSel = selected?.id === p.topic.id
            return (
              <g
                key={p.topic.id}
                ref={(el) => {
                  refs.current[i] = el
                }}
                role="gridcell"
                tabIndex={i === 0 ? 0 : -1}
                aria-selected={isSel}
                aria-label={`${p.topic.title}, ${p.topic.mastery.replace('_', ' ')}, ${p.topic.moduleCount} modules`}
                onKeyDown={(e) => onKeyDown(e, i)}
                onClick={() => setSelected(p.topic)}
                onFocus={() => setSelected(p.topic)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={p.x * (CELL + GAP)}
                  y={p.y * (CELL + GAP)}
                  width={w}
                  height={w}
                  fill={p.topic.mastery === 'mastered' ? 'var(--bg-raised)' : 'var(--glass)'}
                  stroke={isSel ? 'var(--ink)' : 'var(--line-strong)'}
                  strokeWidth={isSel ? 2 : 1}
                />
                {/* Mastery by fill weight AND a text label (§11.7). */}
                {p.topic.mastery !== 'unstarted' ? (
                  <rect
                    x={p.x * (CELL + GAP)}
                    y={p.y * (CELL + GAP)}
                    width={p.topic.mastery === 'mastered' ? w : w / 2}
                    height={4}
                    fill="var(--ink)"
                  />
                ) : null}
                <text
                  x={p.x * (CELL + GAP) + 8}
                  y={p.y * (CELL + GAP) + 24}
                  fontSize="11"
                  fill="var(--ink)"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  {p.topic.title.length > 14 ? `${p.topic.title.slice(0, 13)}…` : p.topic.title}
                </text>
                <text
                  x={p.x * (CELL + GAP) + 8}
                  y={p.y * (CELL + GAP) + 40}
                  fontSize="9"
                  fill="var(--ink-faint)"
                  style={{ fontFamily: 'var(--font-sans)', textTransform: 'uppercase' }}
                >
                  {p.topic.mastery.replace('_', ' ')}
                </text>
              </g>
            )
          })}
        </svg>
      )}
    </Surface>
  )
}
