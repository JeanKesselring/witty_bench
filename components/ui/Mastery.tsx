import type { Mastery as MasteryState } from '@/lib/api/types'

/* §11.7: mastery is encoded by fill weight AND a text label — never colour
 * alone (§3.3). Three states, not a percentage: a percentage invites
 * optimising the number. */

const LABEL: Record<MasteryState, string> = {
  unstarted: 'Not started',
  in_progress: 'In progress',
  mastered: 'Mastered',
}

export function Mastery({ state }: { state: MasteryState }) {
  return (
    <span className={`k-mastery k-mastery--${state.replace('_', '')}`}>
      <span className="k-mastery__mark" aria-hidden="true" />
      {LABEL[state]}
    </span>
  )
}
