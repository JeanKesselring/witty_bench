import { Surface } from '@/components/ui/Surface'

/* §8.3 Consistent help (SC 3.2.6): the help affordance sits in the same
 * position in the topbar on every surface, for every role. It is never
 * reordered and never hidden behind a role check. */

export default function HelpPage() {
  return (
    <Surface title="Help" orientation="How studying works here.">
      <div className="k-md">
        <h2>The study loop</h2>
        <p>
          You are shown one module at a time. Answer it, see whether you were
          right, and move on. Sessions have no length — stop whenever you like,
          and the summary reports what you actually did.
        </p>

        <h2>The three controls</h2>
        <ul>
          <li>
            <strong>Check</strong> judges your answer.
          </li>
          <li>
            <strong>Reveal</strong> shows the answer. On a question you could
            have attempted, this counts as <em>Again</em> — the item comes back
            soon.
          </li>
          <li>
            <strong>Skip</strong> is never graded. The module leaves this
            session and returns at its next due date.
          </li>
        </ul>

        <h2>Keyboard</h2>
        <ul>
          <li>
            <strong>Enter</strong> checks your answer, or reveals a flashcard.
          </li>
          <li>
            <strong>Space</strong> moves to the next module.
          </li>
          <li>
            <strong>1–4</strong> rate a revealed flashcard: Again, Hard, Good,
            Easy.
          </li>
          <li>
            <strong>Escape</strong> always steps back one level.
          </li>
        </ul>

        <h2>Notes</h2>
        <p>
          Notes attach to a topic and are listed under <em>Your notes</em>.
          Notes you write are private, permanently — educators never see them,
          not as text and not as counts.
        </p>
      </div>
    </Surface>
  )
}
