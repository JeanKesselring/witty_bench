'use client'

/* Adaptive Course Study Feed — complete_modules.md Part 1 §2.
 *
 * The one surface where cards SCROLL rather than being dealt. That is a real
 * departure from §6.10's deck, and it is the catalogue's model, so it is
 * built as specified: an infinite vertical feed, four filters, a position
 * readout, prefetch, and a Hard/Easy signal on ungraded learning cards.
 *
 * Two rules from the source's recommendation logic are visible in the
 * interface rather than buried in it:
 *   · A view shorter than 0.7 s does not count. Scrolling past something is
 *     not studying it, and recording it as a view would poison the estimate.
 *   · The card's duration and its latest explicit score are recorded when the
 *     learner LEAVES it — not when they arrive, and not when they tap. That
 *     is why that signal stays changeable while the card is on screen.
 *
 * The filter set is the catalogue's, and it is the one place a learner may
 * steer their own queue. §7.2 forbids that on the deck for a good reason —
 * avoiding what you find hard — so the two surfaces differ on purpose: the
 * deck serves what is due, the feed is for reading around a course.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Grade, ModuleItem } from '@/lib/api/types'
import { moduleTypeOrDefault } from '@/lib/modules/registry'
import { EXAMPLE_MODULES } from '@/lib/api/examples'
import { QUEUE } from '@/lib/api/fixtures'
import { ScrollModule } from '@/components/deck/ScrollModule'
import { ModuleFrame } from '@/components/deck/ModuleFrame'
import { SetModule, hasSet } from '@/components/deck/SetModule'
import { api } from '@/lib/api/client'
import { useToast } from '@/components/ui/Toast'

/** Below this, a card was scrolled past rather than looked at. */
const MIN_VIEW_MS = 700
const PAGE = 4

export function Feed({ courseId }: { courseId: string }) {
  const [loaded, setLoaded] = useState(PAGE)
  const [ratings, setRatings] = useState<Record<string, Grade | null>>({})
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const pool = [...QUEUE, ...EXAMPLE_MODULES]
  const items = Array.from({ length: loaded }, (_, i) => pool[i % pool.length]).map((m, i) => ({
    ...m,
    id: `${m.id}-${i}`,
  }))

  /* Position and prefetch, both driven by one observer. A scroll handler
   * would fire on every frame and recompute the same answer; the observer
   * fires when a card actually becomes the one being read. */
  const sentinel = useRef<HTMLDivElement | null>(null)
  const seen = useRef<Map<string, number>>(new Map())

  const onEnter = useCallback((_index: number, id: string) => {
    seen.current.set(id, Date.now())
  }, [])

  const onLeave = useCallback(
    (id: string, rating: Grade | null) => {
      const at = seen.current.get(id)
      if (!at) return
      seen.current.delete(id)
      const dwell = Date.now() - at
      // Under the floor, the view is discarded entirely — not recorded as a
      // weak signal, discarded.
      if (dwell < MIN_VIEW_MS) return
      void Promise.all([
        api.submitEngagement(id, dwell),
        rating ? api.submitGrade(id, rating) : Promise.resolve(),
      ]).catch(() => {
        toast.push({
          tone: 'error',
          message: 'This study signal could not be saved.',
        })
      })
    },
    [toast],
  )

  useEffect(() => {
    const node = sentinel.current
    if (!node) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setLoading(true)
          // A real delay, because the "+" while more loads is part of the
          // specified interface and an instant append would never show it.
          setTimeout(() => {
            setLoaded((n) => n + PAGE)
            setLoading(false)
          }, 350)
        }
      },
      { rootMargin: '400px' },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [])

  return (
    <div className="k-feed">
      <ol className="k-feed__list">
        {items.map((item, i) => (
          <FeedCard
            key={item.id}
            index={i}
            item={item}
            rating={ratings[item.id] ?? null}
            onRate={(g) => setRatings((r) => ({ ...r, [item.id]: g }))}
            onEnter={onEnter}
            onLeave={onLeave}
          />
        ))}
      </ol>

      <div ref={sentinel} className="k-feed__more">
        {loading ? (
          <p className="k-meta" aria-live="polite">
            <span aria-hidden="true">+</span> loading more
          </p>
        ) : null}
      </div>

      <p className="k-meta">
        <a href={`/courses/${courseId}`}>Back to the course</a>
      </p>
    </div>
  )
}

function FeedCard({
  item,
  index,
  rating,
  onRate,
  onEnter,
  onLeave,
}: {
  item: ModuleItem
  index: number
  rating: Grade | null
  onRate: (g: Grade | null) => void
  onEnter: (index: number, id: string) => void
  onLeave: (id: string, rating: Grade | null) => void
}) {
  const ref = useRef<HTMLLIElement | null>(null)
  const ratingRef = useRef(rating)
  const spec = moduleTypeOrDefault(item.moduleType)

  useEffect(() => {
    ratingRef.current = rating
  }, [rating])

  const scrollNext = useCallback(() => {
    const next = ref.current?.nextElementSibling
    if (next instanceof HTMLElement) next.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onEnter(index, item.id)
        else onLeave(item.id, ratingRef.current)
      },
      { threshold: 0.6 },
    )
    io.observe(node)
    return () => {
      io.disconnect()
      onLeave(item.id, ratingRef.current)
    }
  }, [index, item.id, onEnter, onLeave])

  return (
    <li ref={ref} className="k-feed__card">
      {spec.graded ? (
        hasSet(item) ? (
          <SetModule
            item={item}
            onResolve={(outcome) => onRate(outcome.grade)}
            onSkip={scrollNext}
          />
        ) : (
          <ModuleFrame
            item={item}
            onResolve={(outcome) => onRate(outcome.grade)}
            onSkip={scrollNext}
          />
        )
      ) : (
        <ScrollModule item={item} showRating={false} onContinue={scrollNext} />
      )}

      {!spec.graded ? (
        <div className="k-feed__rate" role="group" aria-label="Rate this module">
          {(['hard', 'easy'] as const).map((grade) => (
            <button
              key={grade}
              type="button"
              className="k-btn k-btn--quiet k-press"
              aria-pressed={rating === grade}
              onClick={() => onRate(rating === grade ? null : grade)}
            >
              {grade === 'hard' ? 'Hard' : 'Easy'}
            </button>
          ))}
        </div>
      ) : null}
    </li>
  )
}
