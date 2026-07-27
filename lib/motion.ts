/* §10.2 Spring tokens. Declared with visualDuration + bounce rather than
 * stiffness/damping — the former is designable, the latter is guesswork.
 * bounce: 0 is critically damped: no overshoot, still physical. */

export const spring = {
  snap: { type: 'spring', visualDuration: 0.15, bounce: 0 },
  settle: { type: 'spring', visualDuration: 0.3, bounce: 0.15 },
  lift: { type: 'spring', visualDuration: 0.45, bounce: 0.25 },
  stage: { type: 'spring', visualDuration: 0.6, bounce: 0.1 },
  drag: { type: 'spring', visualDuration: 0.12, bounce: 0 },
  ambient: { type: 'spring', visualDuration: 0.8, bounce: 0 },
} as const

/** §10.2: every non-spatial transition. There is no third timing system. */
export const DUR_FLAT = 0.09
