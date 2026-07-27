'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { keys } from '@/lib/api/keys'
import { Surface } from '@/components/ui/Surface'
import { Loading, Empty } from '@/components/ui/ResourceState'
import { Mastery } from '@/components/ui/Mastery'

/* §11.5: the returning student's landing page, and the answer to "what
 * should I do right now?" What's due across ALL enrolled courses, because
 * a learner in four courses otherwise has four places to check. One primary
 * action, bottom-right per §2.5. */

export default function MePage() {
  const { data, isPending } = useQuery({
    queryKey: keys.meCourses(),
    queryFn: () => api.courses(),
  })

  const enrolled = (data ?? []).filter((c) => c.enrolled)
  const next = enrolled[0]

  return (
    <Surface
      title="What’s next"
      orientation="Everything you’re enrolled in, in one place."
    >
      {isPending ? (
        <Loading label="Loading your courses" />
      ) : enrolled.length === 0 ? (
        <Empty
          message="You aren’t enrolled in anything yet."
          action={{ label: 'Browse courses', href: '/courses' as Route }}
        />
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <div className="k-grid-cards">
            {enrolled.map((c) => (
              <Link key={c.id} href={`/courses/${c.id}` as Route} className="k-card k-press">
                <h2 className="k-h3">{c.title}</h2>
                <p className="k-body-sm" style={{ color: 'var(--ink-dim)' }}>
                  {c.educator} · {c.topicCount} topics
                </p>
                <Mastery state={c.mastery} />
                {c.lastStudied ? (
                  <p className="k-meta">Last studied {c.lastStudied}</p>
                ) : null}
              </Link>
            ))}
          </div>

          {/* §2.5: mass top-left, action bottom-right. One diagonal. */}
          {next ? (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Link
                className="k-btn k-btn--primary k-press"
                href={`/courses/${next.id}/start` as Route}
              >
                Start studying {next.title}
              </Link>
            </div>
          ) : null}
        </div>
      )}
    </Surface>
  )
}
