import Link from 'next/link'
import type { Route } from 'next'
import { api } from '@/lib/api/client'
import { Surface } from '@/components/ui/Surface'
import { Mastery } from '@/components/ui/Mastery'
import { NoteComposer } from '@/components/notes/NoteComposer'

/* §7.2 Topic detail. A topic is the same component here as in the graph
 * and the deck. Educators see an edit affordance in place; students see the
 * same layout without it — never a different layout. */

export default async function TopicPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [topic, notes] = await Promise.all([api.topic(id), api.topicNotes(id)])
  const educatorNotes = notes.filter((n) => n.kind === 'educator')

  return (
    <Surface title={topic.title} orientation={topic.blurb}>
      <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <Mastery state={topic.mastery} />
          <span className="k-body-sm" style={{ color: 'var(--ink-dim)' }}>
            {topic.moduleCount} modules
          </span>
        </div>

        {educatorNotes.length ? (
          <section>
            <h2 className="k-label" style={{ color: 'var(--ink-faint)' }}>
              From the educator
            </h2>
            {educatorNotes.map((n) => (
              <p
                key={n.id}
                lang={n.lang}
                className="k-prose"
                style={{
                  marginBlockStart: 'var(--space-2)',
                  borderInlineStart: '2px solid var(--accent-summary)',
                  paddingInlineStart: 'var(--space-2)',
                }}
              >
                {n.text}
              </p>
            ))}
          </section>
        ) : null}

        {/* §11.15: notes are written here, where the topic is being read. */}
        <NoteComposer topicId={topic.id} topicTitle={topic.title} courseId={topic.courseId} />

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Link
            className="k-btn k-btn--primary k-press"
            href={`/courses/${topic.courseId}/start` as Route}
          >
            Study this course
          </Link>
        </div>
      </div>
    </Surface>
  )
}
