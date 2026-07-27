'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { keys } from '@/lib/api/keys'
import { Surface } from '@/components/ui/Surface'
import { Loading } from '@/components/ui/ResourceState'
import { Mastery } from '@/components/ui/Mastery'

/* §11.7 /me/progress — the full picture across courses, including the
 * pillar breakdown, which is the most actionable thing the system knows
 * about a learner and currently renders nowhere.
 *
 * Caveat carried from the backend: a pillar with zero reviews is NOT
 * begun, not a weakness. It must never be shown as a deficit, or the
 * interface steers learners away from new material. */

export default function ProgressPage() {
  const courses = useQuery({ queryKey: keys.meCourses(), queryFn: () => api.courses() })
  const pillars = useQuery({
    queryKey: keys.coursePillars('probability'),
    queryFn: () => api.coursePillars('probability'),
  })

  return (
    <Surface title="Your progress" orientation="Where you are across every course.">
      {courses.isPending ? (
        <Loading label="Loading progress" />
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
          <section>
            <h2 className="k-label" style={{ color: 'var(--ink-faint)' }}>
              Courses
            </h2>
            <div style={{ display: 'grid', gap: 'var(--space-1)', marginBlockStart: 'var(--space-2)' }}>
              {(courses.data ?? [])
                .filter((c) => c.enrolled)
                .map((c) => (
                  <div
                    key={c.id}
                    className="k-panel"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <span>{c.title}</span>
                    <Mastery state={c.mastery} />
                  </div>
                ))}
            </div>
          </section>

          <section>
            <h2 className="k-label" style={{ color: 'var(--ink-faint)' }}>
              Pillars
            </h2>
            {/* §11.10: tables first. A bar appears only where shape beats
                digits, and the table stays available. */}
            <table className="k-table" style={{ marginBlockStart: 'var(--space-2)' }}>
              <caption className="k-visually-hidden">
                Proficiency by pillar. Pillars with no reviews are not begun,
                not weaknesses.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Pillar</th>
                  <th scope="col">Standing</th>
                </tr>
              </thead>
              <tbody>
                {(pillars.data ?? []).map((p) => (
                  <tr key={p.pillar}>
                    <th scope="row" data-label="Pillar">
                      {p.pillar}
                    </th>
                    <td data-label="Standing">
                      {p.score === null ? (
                        <span style={{ color: 'var(--ink-faint)' }}>Not begun</span>
                      ) : (
                        <span
                          style={{ display: 'inline-flex', gap: 'var(--space-1)', alignItems: 'center' }}
                        >
                          <span
                            aria-hidden="true"
                            style={{
                              display: 'inline-block',
                              blockSize: 'var(--space-1)',
                              inlineSize: `${Math.round(p.score * 96)}px`,
                              background: 'var(--ink)',
                            }}
                          />
                          <span className="k-num">{Math.round(p.score * 100)}%</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </Surface>
  )
}
