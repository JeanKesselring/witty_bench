'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { motion } from 'motion/react'
import { spring } from '@/lib/motion'
import type { SessionSummary } from '@/lib/api/types'

/* §11.8: what the stop summary contains. Time, counts with no denominator,
 * what moved, and what was weaker — the one interpretive element, which
 * earns its place by being the only thing here a learner can act on
 * tomorrow. Never shame a short session: four modules reports four modules,
 * not 4/20.
 *
 * §10.4F full form: sections assemble on a stagger, numbers land in
 * tabular-nums so nothing jitters. Stagger is hard-capped (§10.5). */

export function StopSummary({ summary, courseId }: { summary: SessionSummary; courseId: string }) {
  const sections: Array<[string, React.ReactNode]> = [
    [
      'This session',
      <p key="counts" className="k-h2 k-num">
        {summary.minutes} min · {summary.modules} modules · {summary.topics} topics
      </p>,
    ],
  ]

  if (summary.mastered.length) {
    sections.push([
      'Mastered',
      <ul key="mastered">
        {summary.mastered.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>,
    ])
  }

  if (summary.weaker.length) {
    sections.push([
      'Weaker this session',
      <ul key="weaker">
        {summary.weaker.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>,
    ])
  }

  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)', maxInlineSize: 'var(--measure)' }}>
      {sections.map(([title, body], i) => (
        <motion.section
          key={title}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          // §10.5: first 6 items at 40ms; everything after arrives with the 6th.
          transition={{ ...spring.lift, delay: Math.min(i, 5) * 0.04 }}
        >
          <h2 className="k-label" style={{ color: 'var(--ink-faint)' }}>
            {title}
          </h2>
          <div style={{ marginBlockStart: 'var(--space-1)' }}>{body}</div>
        </motion.section>
      ))}

      <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
        <Link className="k-btn k-btn--secondary k-press" href={'/me' as Route}>
          Done
        </Link>
        {/* Offered once, plainly, and never argued for (§11.8). */}
        <Link className="k-btn k-btn--primary k-press" href={`/courses/${courseId}/start` as Route}>
          Keep going
        </Link>
      </div>
    </div>
  )
}
