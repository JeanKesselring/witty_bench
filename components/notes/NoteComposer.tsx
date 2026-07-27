'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { keys } from '@/lib/api/keys'
import { useToast } from '@/components/ui/Toast'

/* §11.15: a note is text on the edge between a person and a topic — not an
 * object at a page coordinate. Learner notes are private, permanently:
 * never read, aggregated or counted for educators. That is what makes the
 * feature work — a learner who suspects an educator is reading writes for
 * the educator, and the most useful thing they could write stops being
 * written. Saved on blur. */

export function NoteComposer({
  topicId,
  topicTitle,
  courseId,
}: {
  topicId: string
  topicTitle: string
  courseId: string
}) {
  const qc = useQueryClient()
  const toast = useToast()
  const [text, setText] = useState('')
  const { data } = useQuery({
    queryKey: keys.topicNotes(topicId),
    queryFn: () => api.topicNotes(topicId),
  })

  const mine = (data ?? []).filter((n) => n.kind === 'learner')

  async function save() {
    const trimmed = text.trim()
    if (!trimmed) return
    setText('')
    try {
      await api.createNote({
        topicId,
        topicTitle,
        courseId,
        courseTitle: '',
        text: trimmed,
        // §4.3: the note stores the language it was written in and renders
        // with lang set, so Han variants resolve correctly.
        lang: /[぀-ヿ一-龯]/.test(trimmed) ? 'ja' : 'en',
        kind: 'learner',
        state: 'published',
      })
      qc.invalidateQueries({ queryKey: keys.topicNotes(topicId) })
      qc.invalidateQueries({ queryKey: keys.meNotes() })
    } catch {
      toast.push({ tone: 'error', message: 'That note wasn’t saved.' })
    }
  }

  return (
    <section>
      <h2 className="k-label" style={{ color: 'var(--ink-faint)' }}>
        Your notes on this topic
      </h2>

      {mine.map((n) => (
        <p key={n.id} lang={n.lang} className="k-prose" style={{ marginBlockStart: 'var(--space-2)' }}>
          {n.text}
        </p>
      ))}

      <div className="k-field" style={{ marginBlockStart: 'var(--space-2)', maxInlineSize: 'var(--measure)' }}>
        <label className="k-field__label" htmlFor="note">
          Add a note
        </label>
        <textarea
          id="note"
          className="k-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={save}
          aria-describedby="note-privacy"
        />
        <p id="note-privacy" className="k-field__hint">
          Only you can read this. Educators never see learner notes.
        </p>
      </div>
    </section>
  )
}
