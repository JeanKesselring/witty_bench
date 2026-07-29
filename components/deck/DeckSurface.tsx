'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { keys } from '@/lib/api/keys'
import { Surface } from '@/components/ui/Surface'
import { Inspector } from '@/components/ui/Inspector'
import { Deck } from './Deck'

/* §7.2: the inspector rail stays quiet while the learner is answering —
 * §2.4 makes the card the sole focal object — and fills after judgement
 * with the item's topic and the learner's notes on it. This is where a
 * withheld topic name reappears (§6.10): nothing is hidden, only deferred
 * past the moment it would have cued the answer. */

export function DeckSurface({ courseId }: { courseId: string }) {
  const [subject, setSubject] = useState<string | null>(null)
  const { data: course } = useQuery({
    queryKey: keys.course(courseId),
    queryFn: () => api.course(courseId),
  })
  const { data: notes } = useQuery({
    queryKey: keys.meNotes(),
    queryFn: () => api.notes(),
  })

  const related = (notes ?? []).filter((n) => n.topicTitle === subject && n.kind === 'learner')

  return (
    <Surface
      title={course?.title ?? 'Studying'}
      orientation="Answer, judge, advance. Stop whenever you like — there is no target."
      inspector={
        <Inspector
          subject={subject ?? undefined}
          empty="The topic appears here once you have answered."
          rows={subject ? [['Topic', subject]] : undefined}
        >
          {related.length ? (
            <div style={{ marginBlockStart: 'var(--space-2)' }}>
              <p className="k-label" style={{ color: 'var(--ink-faint)' }}>
                Your notes
              </p>
              {related.map((n) => (
                <p key={n.id} className="k-body-sm" lang={n.lang}>
                  {n.text}
                </p>
              ))}
            </div>
          ) : null}
        </Inspector>
      }
    >
      <Deck courseId={courseId} onInspect={setSubject} />
    </Surface>
  )
}
