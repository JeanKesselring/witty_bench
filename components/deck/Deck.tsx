'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { keys } from '@/lib/api/keys'
import { moduleTypeOrDefault } from '@/lib/modules/registry'
import type { Grade, SessionSummary } from '@/lib/api/types'
import { spring } from '@/lib/motion'
import { useToast } from '@/components/ui/Toast'
import { ModuleFrame, type Outcome } from './ModuleFrame'
import { SetModule, hasSet } from './SetModule'
import { ScrollModule } from './ScrollModule'
import { Loading, Empty, ErrorState } from '@/components/ui/ResourceState'
import { StopSummary } from './StopSummary'

/* §7.2 Learner deck. The current module is centred without decorative cards
 * behind it. Judgement is immediate and optimistic (§7.4). Advancing is
 * explicit; nothing auto-advances. Sessions are open-ended — no denominator
 * anywhere. */

export function Deck({
  courseId,
  onInspect,
}: {
  courseId: string
  onInspect: (subject: string | null) => void
}) {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: keys.courseQueue(courseId),
    queryFn: () => api.courseQueue(courseId),
  })

  const toast = useToast()
  const [index, setIndex] = useState(0)
  const [stopped, setStopped] = useState(false)
  const [log, setLog] = useState<Array<{ topic: string; grade: Grade | null }>>([])
  const [startedAt] = useState(() => Date.now())

  /* §7.2: the deck serves what the engine chose. There is no filtering on
   * any learner surface — curation is the scheduler's job, and a learner
   * steering their own queue is a learner avoiding what they find hard. */
  const queue = data ?? []

  /* Must run before the early returns below — hooks are unconditional. It
   * no-ops on an empty queue, which is what every one of those returns has. */
  if (isPending) return <Loading label="Loading your session" rows={1} />
  if (isError)
    return (
      <ErrorState
        message="The session could not be loaded. Nothing you did was lost."
        onRetry={() => refetch()}
      />
    )

  // §11.13: the interface must distinguish nothing-is-due from
  // nothing-exists, and never conflate them.
  if ((data ?? []).length === 0)
    return (
      <Empty
        message="This course has no modules yet. Nothing exists to study — this is not the same as nothing being due."
        action={{ label: 'Back to the course', href: `/courses/${courseId}` as never }}
      />
    )

  if (stopped) {
    const summary: SessionSummary = {
      minutes: Math.max(1, Math.round((Date.now() - startedAt) / 60000)),
      modules: log.length,
      topics: new Set(log.map((l) => l.topic)).size,
      mastered: [],
      weaker: Array.from(new Set(log.filter((l) => l.grade === 'again').map((l) => l.topic))),
    }
    return <StopSummary summary={summary} courseId={courseId} />
  }

  const item = queue[index % queue.length]
  const spec = moduleTypeOrDefault(item.moduleType)

  function next() {
    onInspect(null)
    setIndex((i) => i + 1)
  }

  async function resolve(o: Outcome) {
    // §7.4: commits to the UI immediately and reconciles when the server
    // answers. `pending` is visually identical to committed.
    setLog((l) => [...l, { topic: item.topicTitle, grade: o.grade }])
    onInspect(item.topicTitle)
    next()
    try {
      await api.submitGrade(item.id, o.grade, o.assisted)
    } catch {
      // A silent rollback is worse than a spinner — the user must see it.
      toast.push({
        tone: 'error',
        message: `Your answer to ${item.topicTitle} wasn’t saved.`,
        action: { label: 'Retry', onAction: () => api.submitGrade(item.id, o.grade, o.assisted) },
      })
    }
  }

  async function engaged(wasEngaged: boolean, dwellMs: number, rating: Grade | null) {
    // An ungraded card's Hard/Easy is a preference signal, not a recall one —
    // it is logged as the learner gave it and never turned into a grade.
    setLog((l) => [...l, { topic: item.topicTitle, grade: rating }])
    next()
    if (wasEngaged) {
      try {
        await api.submitEngagement(item.id, dwellMs)
      } catch {
        // Engagement is an absence-of-a-positive signal; failing to record
        // it costs the learner nothing, so it never interrupts them.
      }
    }
  }

  function skip() {
    // §6.10: Skip is never graded and the item leaves the session entirely.
    next()
  }

  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <div className="k-stack">
        {/* The module enters and leaves along the lattice. Movement remains
            transform-only so text and controls stay crisp during the change. */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={item.id}
            initial={{ y: 16 }}
            animate={{ y: 0 }}
            exit={{ y: -24, rotate: -1 }}
            transition={spring.lift}
            style={{
              position: 'relative',
              inlineSize: '100%',
              display: 'grid',
              justifyItems: 'center',
            }}
          >
            {spec.graded ? (
              hasSet(item) ? (
                <SetModule item={item} onResolve={resolve} onSkip={skip} />
              ) : (
                <ModuleFrame item={item} onResolve={resolve} onSkip={skip} />
              )
            ) : (
              <ScrollModule item={item} onContinue={engaged} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* §11.6: stop whenever the learner chooses. No target to fall short of. */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="k-btn k-btn--secondary k-press"
          onClick={() => setStopped(true)}
        >
          Stop for now
        </button>
      </div>
    </div>
  )
}
