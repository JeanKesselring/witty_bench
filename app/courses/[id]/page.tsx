import Link from 'next/link'
import type { Route } from 'next'
import { api } from '@/lib/api/server'
import { Surface } from '@/components/ui/Surface'
import { Mastery } from '@/components/ui/Mastery'

export default async function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [course, topics, lectures] = await Promise.all([
    api.course(id),
    api.courseTopics(id),
    api.courseLectures(id),
  ])

  return (
    <Surface
      title={course.title}
      orientation={`${course.educator} · ${course.topicCount} topics`}
      context={
        <>
          <Link className="k-chip k-press" href={`/courses/${id}/start` as Route}>
            Study
          </Link>
          <Link className="k-chip k-press" href={`/courses/${id}/graph` as Route}>
            Knowledge graph
          </Link>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
        {/* §11.10: students are told, at enrolment and on the course
            overview — disclosed plainly, not buried in terms (§11.16). */}
        <p className="k-body-sm k-prose" style={{ color: 'var(--ink-dim)' }}>
          The educator of this course can see your individual progress within
          it. They cannot see your activity in any other course, and never
          your private notes.
        </p>

        <section>
          <h2 className="k-label" style={{ color: 'var(--ink-faint)' }}>
            Lectures
          </h2>
          <div style={{ display: 'grid', gap: 'var(--space-1)', marginBlockStart: 'var(--space-2)' }}>
            {lectures.map((l) => (
              <div key={l.id} className="k-panel">
                <h3 className="k-h3">{l.title}</h3>
                <p className="k-body-sm" style={{ color: 'var(--ink-dim)' }}>
                  {l.topicIds.length} topics
                </p>
                {l.state === 'draft' ? (
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
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="k-label" style={{ color: 'var(--ink-faint)' }}>
            Topics
          </h2>
          <div className="k-grid-cards" style={{ marginBlockStart: 'var(--space-2)' }}>
            {topics.map((t) => (
              <Link key={t.id} href={`/topics/${t.id}` as Route} className="k-card k-press">
                <h3 className="k-h3">{t.title}</h3>
                <p className="k-body-sm" style={{ color: 'var(--ink-dim)' }}>
                  {t.blurb}
                </p>
                <Mastery state={t.mastery} />
              </Link>
            ))}
          </div>
        </section>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Link className="k-btn k-btn--primary k-press" href={`/courses/${id}/start` as Route}>
            Start studying
          </Link>
        </div>
      </div>
    </Surface>
  )
}
