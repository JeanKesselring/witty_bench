'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { keys } from '@/lib/api/keys'
import { Surface } from '@/components/ui/Surface'
import { Loading, Empty } from '@/components/ui/ResourceState'

/* §11.15 /me/notes. Every note the learner has written, grouped by course
 * then topic, each linking back to the topic it annotates.
 *
 * Without this surface the feature is write-only: a note left on a lattice
 * arrangement that no longer exists is unreachable. The index is what makes
 * anchoring to a topic pay off — the topic is a durable address.
 *
 * The two kinds are visually distinct, because publishing something you
 * meant to keep is the one unrecoverable mistake this feature can make. */

export default function NotesPage() {
  const { data, isPending } = useQuery({
    queryKey: keys.meNotes(),
    queryFn: () => api.notes(),
  })

  const notes = data ?? []
  const byCourse = new Map<string, typeof notes>()
  for (const n of notes) {
    byCourse.set(n.courseTitle, [...(byCourse.get(n.courseTitle) ?? []), n])
  }

  return (
    <Surface
      title="Your notes"
      orientation="Everything you’ve written, by course and topic. Learner notes are private, always."
    >
      {isPending ? (
        <Loading label="Loading notes" />
      ) : notes.length === 0 ? (
        <Empty
          message="You haven’t written any notes yet. Notes attach to a topic while you’re reading it."
          action={{ label: 'Browse courses', href: '/courses' as Route }}
        />
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          {Array.from(byCourse.entries()).map(([course, items]) => (
            <section key={course}>
              <h2 className="k-label" style={{ color: 'var(--ink-faint)' }}>
                {course}
              </h2>
              <div style={{ display: 'grid', gap: 'var(--space-1)', marginBlockStart: 'var(--space-2)' }}>
                {items.map((n) => (
                  <article
                    key={n.id}
                    className="k-panel"
                    style={
                      n.kind === 'educator'
                        ? { borderInlineStart: '2px solid var(--accent-summary)' }
                        : undefined
                    }
                  >
                    <p className="k-meta">
                      {n.kind === 'educator' ? 'Educator note — course content' : 'Private'}
                    </p>
                    <p lang={n.lang} style={{ marginBlock: 'var(--space-1)' }}>
                      {n.text}
                    </p>
                    <Link className="k-link k-body-sm" href={`/topics/${n.topicId}` as Route}>
                      {n.topicTitle}
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </Surface>
  )
}
