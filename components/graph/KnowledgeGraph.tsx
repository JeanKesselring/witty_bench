'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { api } from '@/lib/api/client'
import { TOPICS } from '@/lib/api/fixtures'
import { keys } from '@/lib/api/keys'
import { spring } from '@/lib/motion'
import { Surface } from '@/components/ui/Surface'
import { Inspector } from '@/components/ui/Inspector'
import { ErrorState, Loading } from '@/components/ui/ResourceState'
import type { Mastery as MasteryState, Topic } from '@/lib/api/types'

/* The course graph uses the spatial instrument from the demo, but consumes
 * the real flat Topic response. A background is deliberately a slot rather
 * than an import: the host can supply a shader, image, or future course
 * material without coupling graph navigation to a rendering technology. */

type TileRect = {
  x: number
  y: number
  w: number
  h: number
}

export interface KnowledgeGraphProps {
  courseId: string
  /** Visual-only layer beneath the field. The ordinary app wave remains the fallback. */
  background?: ReactNode
}

const MASTERY_COLOR: Record<MasteryState, string> = {
  unstarted: 'var(--graph-low)',
  in_progress: 'var(--graph-mid)',
  mastered: 'var(--graph-high)',
}

const MASTERY_PROGRESS: Record<MasteryState, number> = {
  unstarted: 0,
  in_progress: 50,
  mastered: 100,
}

function topicProgress(topic: Topic) {
  return Math.min(
    100,
    Math.max(0, Math.round(topic.progressPercent ?? MASTERY_PROGRESS[topic.mastery])),
  )
}

function progressColor(progress: number) {
  if (progress < 25) return MASTERY_COLOR.unstarted
  if (progress < 80) return MASTERY_COLOR.in_progress
  return MASTERY_COLOR.mastered
}

function ProgressFlag({ topic }: { topic: Topic }) {
  const progress = topicProgress(topic)
  return (
    <span
      className="k-graph-progress"
      aria-label={`${progress}% complete`}
      style={{ '--progress-color': progressColor(progress) } as CSSProperties}
    >
      <span className="k-graph-progress__dot" aria-hidden="true" />
      <span>{progress}%</span>
    </span>
  )
}

/* The original demo field was 10 × 6 cells. The integrated graph is 12 × 8,
 * while remaining horizontally scrollable on a viewport that cannot expose
 * all 12 columns at once. */
const FIELD_COLS = 12
const FIELD_ROWS = 8

/**
 * Partition an exact cell rectangle into balanced contiguous tiles.
 * This is the demo's layout idea made data-driven: no topic carries screen
 * coordinates, and a different API response still fills the available field.
 */
function buildBalancedLayout(count: number, cols: number, rows: number): TileRect[] {
  if (count <= 0) return []
  if (count === 1) return [{ x: 0, y: 0, w: cols, h: rows }]

  const memo = new Map<string, TileRect[]>()
  const score = (rects: TileRect[], width: number, height: number) => {
    const averageArea = (width * height) / rects.length
    const worstAspect = Math.max(...rects.map((rect) => Math.max(rect.w / rect.h, rect.h / rect.w)))
    const areaSpread = Math.max(
      ...rects.map((rect) => Math.abs(rect.w * rect.h - averageArea) / averageArea),
    )
    return (worstAspect > 2 ? 100 + (worstAspect - 2) * 10 : worstAspect) + areaSpread * 0.65
  }

  const solve = (items: number, width: number, height: number): TileRect[] => {
    if (items === 1) return [{ x: 0, y: 0, w: width, h: height }]
    const key = `${items}:${width}:${height}`
    const cached = memo.get(key)
    if (cached) return cached

    let best: TileRect[] | null = null
    let bestScore = Number.POSITIVE_INFINITY

    for (let firstCount = 1; firstCount < items; firstCount += 1) {
      const secondCount = items - firstCount

      for (let cut = 1; cut < width; cut += 1) {
        if (cut * height < firstCount || (width - cut) * height < secondCount) continue
        const candidate = [
          ...solve(firstCount, cut, height),
          ...solve(secondCount, width - cut, height).map((rect) => ({
            ...rect,
            x: rect.x + cut,
          })),
        ]
        const candidateScore = score(candidate, width, height)
        if (candidateScore < bestScore) {
          best = candidate
          bestScore = candidateScore
        }
      }

      for (let cut = 1; cut < height; cut += 1) {
        if (width * cut < firstCount || width * (height - cut) < secondCount) continue
        const candidate = [
          ...solve(firstCount, width, cut),
          ...solve(secondCount, width, height - cut).map((rect) => ({
            ...rect,
            y: rect.y + cut,
          })),
        ]
        const candidateScore = score(candidate, width, height)
        if (candidateScore < bestScore) {
          best = candidate
          bestScore = candidateScore
        }
      }
    }

    const result = best ?? [{ x: 0, y: 0, w: width, h: height }]
    memo.set(key, result)
    return result
  }

  return solve(count, cols, rows)
}

function pathTo(all: Topic[], id: string | null) {
  const path: Topic[] = []
  let cursor = id
  const seen = new Set<string>()
  while (cursor && !seen.has(cursor)) {
    seen.add(cursor)
    const topic = all.find((candidate) => candidate.id === cursor)
    if (!topic) break
    path.unshift(topic)
    cursor = topic.parentId
  }
  return path
}

function TopicTile({
  topic,
  childTopics,
  rect,
  selected,
  index,
  focusIndex,
  buttonRef,
  onSelect,
  onOpen,
  onMoveFocus,
}: {
  topic: Topic
  childTopics: Topic[]
  rect: TileRect
  selected: boolean
  index: number
  focusIndex: number
  buttonRef: (element: HTMLButtonElement | null) => void
  onSelect: () => void
  onOpen: () => void
  onMoveFocus: (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => void
}) {
  const [previewing, setPreviewing] = useState(false)
  const previewRows = Math.max(1, rect.h - 1)
  const previewChildren = childTopics.slice(0, rect.w * previewRows)
  const previewLayout = useMemo(
    () => buildBalancedLayout(previewChildren.length, rect.w, previewRows),
    [previewChildren.length, rect.w, previewRows],
  )
  const titleDensity = topic.title.length / Math.max(1, rect.w)
  const titleSize =
    titleDensity > 4
      ? 'var(--size-body-sm)'
      : titleDensity > 3
        ? 'var(--size-h3)'
        : 'var(--size-h2)'

  return (
    <button
      ref={buttonRef}
      type="button"
      role="gridcell"
      className="k-graph-topic k-press"
      data-selected={selected ? 'true' : undefined}
      data-branch={childTopics.length ? 'true' : undefined}
      aria-selected={selected}
      aria-label={`${topic.title}, ${topicProgress(topic)}% complete, ${topic.moduleCount} modules${childTopics.length ? `, ${childTopics.length} topics inside` : ''}`}
      tabIndex={index === focusIndex ? 0 : -1}
      style={
        {
          '--topic-w': rect.w,
          '--topic-h': rect.h,
          gridColumn: `${rect.x + 1} / span ${rect.w}`,
          gridRow: `${rect.y + 1} / span ${rect.h}`,
        } as CSSProperties
      }
      onClick={onSelect}
      onDoubleClick={onOpen}
      onKeyDown={(event) => onMoveFocus(event, index)}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse' && childTopics.length) setPreviewing(true)
      }}
      onPointerLeave={() => setPreviewing(false)}
    >
      <motion.span
        className="k-graph-topic__meta"
        initial={false}
        animate={{ opacity: previewing ? 0 : 1, y: previewing ? -8 : 0 }}
        transition={spring.settle}
      >
        <ProgressFlag topic={topic} />
        <span aria-hidden="true">·</span>
        <span>{topic.moduleCount} modules</span>
      </motion.span>
      <motion.span
        className="k-graph-topic__depth"
        initial={false}
        animate={{ opacity: previewing ? 0 : 0.72, y: previewing ? -8 : 0 }}
        transition={spring.settle}
      >
        {childTopics.length ? `${childTopics.length} inside` : 'Atomic'}
      </motion.span>
      <motion.strong
        initial={false}
        animate={{ scale: previewing ? 0.78 : 1 }}
        transition={spring.settle}
        style={{ fontSize: titleSize, transformOrigin: 'left bottom' }}
      >
        {topic.title}
      </motion.strong>

      {childTopics.length ? (
        <motion.span
          className="k-graph-topic__preview"
          aria-hidden="true"
          initial={false}
          animate={
            previewing
              ? {
                  opacity: 1,
                  y: 0,
                  clipPath: 'inset(0% 0% 0% 0%)',
                }
              : {
                  opacity: 0,
                  y: -16,
                  clipPath: 'inset(0% 0% 100% 0%)',
                }
          }
          transition={spring.settle}
          style={{
            gridTemplateColumns: `repeat(${rect.w}, var(--cell))`,
            gridTemplateRows: `repeat(${previewRows}, var(--cell))`,
          }}
        >
          {previewChildren.map((child, childIndex) => {
            const childRect = previewLayout[childIndex]
            return (
              <span
                key={child.id}
                className="k-graph-topic__preview-child"
                style={{
                  gridColumn: `${childRect.x + 1} / span ${childRect.w}`,
                  gridRow: `${childRect.y + 1} / span ${childRect.h}`,
                }}
              >
                <b>{child.title}</b>
                <small>
                  <ProgressFlag topic={child} />
                </small>
              </span>
            )
          })}
        </motion.span>
      ) : null}
    </button>
  )
}

export function KnowledgeGraph({ courseId, background }: KnowledgeGraphProps) {
  const fixtureTopics = useMemo(
    () => TOPICS.filter((topic) => topic.courseId === courseId),
    [courseId],
  )
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: keys.courseTopics(courseId),
    // Fixture course slugs are intentionally local demo identities, not API
    // UUIDs. Sending them to the live proxy creates a guaranteed 404 before
    // the graph can be tested.
    queryFn: () =>
      fixtureTopics.length ? Promise.resolve(fixtureTopics) : api.courseTopics(courseId),
  })

  const all = useMemo(() => data ?? [], [data])
  const sceneRef = useRef<HTMLElement>(null)
  const topicRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [parentId, setParentId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [focusIndex, setFocusIndex] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const [sceneGrid, setSceneGrid] = useState({
    cols: FIELD_COLS,
    rows: FIELD_ROWS,
    cell: 64,
  })

  const field = useMemo(() => all.filter((topic) => topic.parentId === parentId), [all, parentId])
  const crumbs = useMemo(() => pathTo(all, parentId), [all, parentId])
  const current = parentId ? (all.find((topic) => topic.id === parentId) ?? null) : null
  const selected =
    field.find((topic) => topic.id === selectedId) ?? (field.length === 0 ? current : null)
  const layout = useMemo(
    () => buildBalancedLayout(field.length, sceneGrid.cols, sceneGrid.rows),
    [field.length, sceneGrid.cols, sceneGrid.rows],
  )

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    const measure = () => {
      const rawCell = Number.parseFloat(getComputedStyle(scene).getPropertyValue('--cell'))
      const cell = Number.isFinite(rawCell) && rawCell > 0 ? rawCell : 64
      const cols = FIELD_COLS
      const rows = Math.max(FIELD_ROWS, Math.ceil(field.length / cols) * 3)
      setSceneGrid((value) =>
        value.cols === cols && value.rows === rows && value.cell === cell
          ? value
          : { cols, rows, cell },
      )
    }
    measure()
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null
    observer?.observe(scene)
    window.addEventListener('resize', measure)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [field.length])

  const moveTo = (topic: Topic) => {
    const children = all.filter((candidate) => candidate.parentId === topic.id)
    if (!children.length || transitioning) return
    setTransitioning(true)
    window.setTimeout(() => {
      setParentId(topic.id)
      setSelectedId(null)
      setFocusIndex(0)
      setTransitioning(false)
      window.requestAnimationFrame(() => topicRefs.current[0]?.focus())
    }, 600)
  }

  const moveUpTo = (id: string | null) => {
    if (id === parentId || transitioning) return
    const previous = current
    const nextField = all.filter((topic) => topic.parentId === id)
    const nextIndex = Math.max(
      0,
      nextField.findIndex((topic) => topic.id === previous?.id),
    )
    setTransitioning(true)
    window.setTimeout(() => {
      setParentId(id)
      setSelectedId(null)
      setFocusIndex(nextIndex)
      setTransitioning(false)
      window.requestAnimationFrame(() => topicRefs.current[nextIndex]?.focus())
    }, 600)
  }

  const moveFocus = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index
    if (event.key === 'ArrowRight') next = Math.min(field.length - 1, index + 1)
    else if (event.key === 'ArrowLeft') next = Math.max(0, index - 1)
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = field.length - 1
    else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      const origin = layout[index]
      const originX = origin.x + origin.w / 2
      const originY = origin.y + origin.h / 2
      const direction = event.key === 'ArrowUp' ? -1 : 1
      const candidates = layout
        .map((rect, candidateIndex) => ({
          candidateIndex,
          x: rect.x + rect.w / 2,
          y: rect.y + rect.h / 2,
        }))
        .filter(({ y }) => (y - originY) * direction > 0)
        .sort(
          (a, b) =>
            Math.abs(a.y - originY) +
            Math.abs(a.x - originX) * 0.35 -
            (Math.abs(b.y - originY) + Math.abs(b.x - originX) * 0.35),
        )
      next = candidates[0]?.candidateIndex ?? index
    } else {
      return
    }

    event.preventDefault()
    setFocusIndex(next)
    topicRefs.current[next]?.focus()
  }

  const graph = isPending ? (
    <Loading label="Loading the graph" rows={1} />
  ) : isError ? (
    <ErrorState
      message="The course topics could not be loaded. Nothing in the graph was changed."
      onRetry={() => void refetch()}
    />
  ) : (
    <section
      ref={sceneRef}
      className="k-graph-scene"
      data-transitioning={transitioning ? 'true' : undefined}
      aria-label={current ? `Topics inside ${current.title}` : 'Course topics'}
    >
      <motion.div
        className="k-graph-field"
        role="grid"
        aria-label={`${field.length} topics at level ${crumbs.length}`}
        animate={{
          opacity: transitioning ? 0 : 1,
          scale: transitioning ? 1.025 : 1,
        }}
        transition={spring.stage}
        style={{
          inlineSize: `${sceneGrid.cols * sceneGrid.cell}px`,
          minBlockSize: `${sceneGrid.rows * sceneGrid.cell}px`,
          gridTemplateColumns: `repeat(${sceneGrid.cols}, ${sceneGrid.cell}px)`,
          gridTemplateRows: `repeat(${sceneGrid.rows}, ${sceneGrid.cell}px)`,
        }}
      >
        {field.length ? (
          field.map((topic, index) => (
            <TopicTile
              key={topic.id}
              topic={topic}
              childTopics={all.filter((candidate) => candidate.parentId === topic.id)}
              rect={layout[index]}
              selected={selected?.id === topic.id}
              index={index}
              focusIndex={focusIndex}
              buttonRef={(element) => {
                topicRefs.current[index] = element
              }}
              onSelect={() => {
                setSelectedId(topic.id)
                setFocusIndex(index)
              }}
              onOpen={() => moveTo(topic)}
              onMoveFocus={moveFocus}
            />
          ))
        ) : current ? (
          <div className="k-graph-empty">
            <ProgressFlag topic={current} />
            <strong>{current.title}</strong>
            <p>This is an atomic topic — the smallest field in this graph.</p>
            <Link className="k-btn k-btn--primary k-press" href={`/topics/${current.id}` as Route}>
              Open topic detail
            </Link>
          </div>
        ) : (
          <div className="k-state">This course has no topics yet.</div>
        )}
      </motion.div>
    </section>
  )

  return (
    <div className="k-knowledgegraph" data-background={background ? 'custom' : 'global'}>
      {background ? (
        <div className="k-knowledgegraph__background" aria-hidden="true">
          {background}
        </div>
      ) : null}

      <Surface
        title={current?.title ?? 'Knowledge graph'}
        orientation="Topics contain topics. Hover to reveal what is inside; select for details; open to make it the new field."
        context={
          <div className="k-graph-crumbs">
            <button
              type="button"
              className="k-btn k-btn--quiet k-press"
              aria-current={parentId === null ? 'page' : undefined}
              onClick={() => moveUpTo(null)}
            >
              All topics
            </button>
            {crumbs.map((crumb, index) => (
              <span key={crumb.id}>
                <span aria-hidden="true">/</span>
                <button
                  type="button"
                  className="k-btn k-btn--quiet k-press"
                  aria-current={index === crumbs.length - 1 ? 'page' : undefined}
                  onClick={() => moveUpTo(crumb.id)}
                >
                  {crumb.title}
                </button>
              </span>
            ))}
            <span className="k-meta">Level {String(crumbs.length).padStart(2, '0')}</span>
          </div>
        }
        inspector={
          <Inspector
            subject={selected?.title}
            empty="This field has no selectable topic."
            rows={
              selected
                ? [
                    ['Progress', <ProgressFlag key="progress" topic={selected} />],
                    ['Modules', selected.moduleCount],
                    [
                      'Contains',
                      all.filter((topic) => topic.parentId === selected.id).length || '—',
                    ],
                  ]
                : undefined
            }
          >
            {selected ? (
              <div className="k-graph-inspector">
                <p className="k-body-sm">{selected.blurb}</p>
                {all.some((topic) => topic.parentId === selected.id) ? (
                  <button
                    type="button"
                    className="k-btn k-btn--primary k-press"
                    onClick={() => moveTo(selected)}
                  >
                    Open topic
                    <span aria-hidden="true">↘</span>
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
        }
      >
        {graph}
      </Surface>
    </div>
  )
}
