import Link from 'next/link'
import type { Route } from 'next'
import { Surface } from '@/components/ui/Surface'
import { MODULE_TYPES } from '@/lib/modules/registry'

/* A REVIEW INDEX, not a product surface.
 *
 * Nothing a learner would ever see: it is one page that reaches every surface
 * built against complete_modules.md, so the whole thing can be walked through
 * without guessing URLs. It exists because the topbar carries six items by
 * design (§8.1) and there are now fourteen places to look at.
 *
 * Delete it when the review is over — or keep it as the dev entry point, but
 * do not link it from the product nav.
 */

export const metadata = { title: 'Everything — Common Sage' }

const PART_ONE: Array<{ href: Route; title: string; note: string }> = [
  {
    href: '/japanese/lesson',
    title: 'Today’s lesson',
    note: 'Six stages. Set the plan, then Start — Review, Learn, Context and Check serve real drill cards through the ordinary frame.',
  },
  {
    href: '/courses/probability/feed' as Route,
    title: 'Adaptive study feed',
    note: 'Infinite scroll, four filters, position counter, per-card Hard/Easy. Scroll to the bottom to see it fetch more.',
  },
  {
    href: '/japanese/explorer',
    title: 'Concept explorer',
    note: 'List and graph over one filtered set. Try Mastery overlay, then switch to Graph.',
  },
  {
    href: '/japanese/read',
    title: 'Reading lab',
    note: 'Tap any word for reading, rōmaji, gloss and grammar. Furigana auto / all / off.',
  },
  {
    href: '/japanese/listen',
    title: 'Listening lab',
    note: 'Text starts hidden. Play all, or one sentence; four speeds; questions at the end.',
  },
  {
    href: '/japanese/karaoke',
    title: 'Read aloud',
    note: 'Speech recognition — Chrome or Edge. Skip word walks it through without a microphone.',
  },
  {
    href: '/chat',
    title: 'Tutor',
    note: 'Ask Sage streams (scripted without GEMINI_API_KEY, and it says so). “Make me some cards” produces real modules. Japanese mode has the analysis.',
  },
  {
    href: '/japanese/placement',
    title: 'Placement',
    note: 'Adaptive, conservative. The bars show uncertainty narrowing, not a score.',
  },
]

const OTHER: Array<{ href: Route; title: string; note: string }> = [
  {
    href: '/modules',
    title: 'Module type harness',
    note: 'All 39 types, live, one at a time. Answer them — this is where the geometry promise is visible.',
  },
  {
    href: '/courses',
    title: 'Courses',
    note: 'Reads the live Common Sage backend on :8000.',
  },
  {
    href: '/courses/probability/start' as Route,
    title: 'The deck',
    note: 'Needs a real course and a session — it shows its error state against fixture ids.',
  },
]

export default function TryPage() {
  const graded = MODULE_TYPES.filter((m) => m.graded).length

  return (
    <Surface
      title="Everything"
      orientation="A review index, not a product surface — every page built against the module catalogue, in one list."
    >
      <div className="k-try">
        <section>
          <h2 className="k-h2">Full-page functions</h2>
          <p className="k-meta">
            All eight, on fixtures shaped to the Japanese service’s responses. That service is
            not wired yet.
          </p>
          <ul className="k-try__list">
            {PART_ONE.map((p) => (
              <li key={p.href}>
                <Link href={p.href} className="k-btn k-btn--quiet k-press">
                  <span className="k-h3">{p.title}</span>
                  <small className="k-meta">{p.note}</small>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="k-h2">Cards</h2>
          <p className="k-meta">
            {MODULE_TYPES.length} types — {graded} graded through the fixed frame,{' '}
            {MODULE_TYPES.length - graded} ungraded through the scroll shell.
          </p>
          <ul className="k-try__list">
            {OTHER.map((p) => (
              <li key={p.href}>
                <Link href={p.href} className="k-btn k-btn--quiet k-press">
                  <span className="k-h3">{p.title}</span>
                  <small className="k-meta">{p.note}</small>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="k-h2">Worth trying specifically</h2>
          <ul className="k-try__notes">
            <li>
              On <Link href={'/modules' as Route}>the harness</Link>, answer a card and watch the
              control band: it does not move, and the card does not resize. That is the whole
              constraint, and it holds on all {graded} graded types.
            </li>
            <li>
              <strong>map click quiz</strong> — click the map, then Check. It draws your error to
              the target and grades by distance. The list below the map scores identically.
            </li>
            <li>
              <strong>model 3d</strong> — press “Turn the model”, then drag it. Arrow keys turn it
              too, and the orientation is announced.
            </li>
            <li>
              <strong>grammar production</strong> — the prose answer gets a real textarea now, not
              a one-line input.
            </li>
            <li>
              <strong>flashcard set</strong> and <strong>mcq</strong> carry several cards: dots in
              the prompt band, results and Try again at the end.
            </li>
            <li>
              Switch to <strong>light</strong> in the topbar. Legibility on the pale gradient is
              where this fell over last time.
            </li>
          </ul>
        </section>
      </div>
    </Surface>
  )
}
