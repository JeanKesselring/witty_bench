'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { keys } from '@/lib/api/keys'
import { Surface } from '@/components/ui/Surface'
import { Inspector } from '@/components/ui/Inspector'
import { Loading } from '@/components/ui/ResourceState'
import { Mastery } from '@/components/ui/Mastery'
import type { Course } from '@/lib/api/types'

/* §7.2 Course catalogue. Cards show title, educator, topic count and the
 * learner's standing; one primary action per card. Filters live above the
 * grid and write to the URL (§11.14).
 *
 * §2.7: Select fills the inspector — non-destructive preview, no
 * navigation, so a learner can compare three courses without leaving. */


export default function CataloguePage() {
  const { data, isPending } = useQuery({
    queryKey: keys.courses(),
    queryFn: () => api.courses(),
  })
  const [selected, setSelected] = useState<Course | null>(null)

  /* §7.2: no filters on any learner surface. Enrolled courses sort first
   * because that is what a returning learner came for; the rest follow. */
  const courses = [...(data ?? [])].sort(
    (a, b) => Number(b.enrolled) - Number(a.enrolled),
  )

  return (
    <Surface
      title="Courses"
      orientation="Everything published, plus the courses you own."
      inspector={
        <Inspector
          subject={selected?.title}
          empty="Select a course to preview it."
          rows={
            selected
              ? [
                  ['Educator', selected.educator],
                  ['Topics', selected.topicCount],
                  ['Access', selected.access === 'open' ? 'Open' : 'Join code required'],
                  ['Last studied', selected.lastStudied ?? 'Never'],
                ]
              : undefined
          }
        >
          {selected ? (
            <Link
              className="k-btn k-btn--primary k-press"
              href={`/courses/${selected.id}` as Route}
              style={{ marginBlockStart: 'var(--space-2)' }}
            >
              Open course
            </Link>
          ) : null}
        </Inspector>
      }
    >
      {isPending ? (
        <Loading label="Loading courses" />
      ) : (
        <div className="k-grid-cards">
          {courses.map((c) => (
            <article
              key={c.id}
              className={
                selected?.id === c.id ? 'k-card k-card--selected k-press' : 'k-card k-press'
              }
            >
              <button
                type="button"
                onClick={() => setSelected(c)}
                aria-pressed={selected?.id === c.id}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  display: 'grid',
                  gap: 'var(--space-1)',
                }}
              >
                <h2 className="k-h3">{c.title}</h2>
                <p className="k-body-sm" style={{ color: 'var(--ink-dim)' }}>
                  {c.educator} · {c.topicCount} topics
                </p>
                <Mastery state={c.mastery} />
                {/* §2.7: mark the exception, never the norm. Draft is
                    marked; published says nothing at all. */}
                {c.state === 'draft' ? (
                  <span
                    className="k-meta"
                    style={{
                      color: 'var(--warn)',
                      borderInlineStart: '2px dashed var(--warn)',
                      paddingInlineStart: 'var(--optical)',
                    }}
                  >
                    Draft
                  </span>
                ) : null}
              </button>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Link
                  className="k-btn k-btn--secondary k-press"
                  href={`/courses/${c.id}/start` as Route}
                >
                  {c.enrolled ? 'Continue' : 'Start'}
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </Surface>
  )
}
