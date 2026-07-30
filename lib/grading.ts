/* Grading — design_system.md §6.10, §6.12, §6.14.
 *
 * Tolerance rule: exact where the written form IS the objective, tolerant
 * where the answer is meaning in prose. Evaluated on the resolved text,
 * never the keystrokes — `toshokan` and `tosyokan` both produce としょかん
 * and are both right (§4.3). */

import type { Judgement } from './api/types'
import type { Tolerance } from './modules/registry'

function normalise(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Damerau–Levenshtein, capped — we only care whether it is ≤ 1.
 *
 * Transposition has to count as one edit, not two: `recieve` for `receive`
 * is the single most common typo there is, and treating it as distance 2
 * would mark a learner wrong for the exact failure §6.12 says tolerance
 * exists to forgive. Strings here are one answer long, so the full table
 * is cheaper than being clever. */
function within1(a: string, b: string): boolean {
  if (a === b) return true
  if (Math.abs(a.length - b.length) > 1) return false

  const rows = a.length + 1
  const cols = b.length + 1
  const d: number[][] = Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost,
      )
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
      }
    }
  }

  return d[a.length][b.length] <= 1
}

export function judgeText(
  given: string,
  expected: string,
  tolerance: Tolerance,
  acceptedAnswers: string[] = [],
): Judgement {
  const g = normalise(given)
  const accepted = [expected, ...acceptedAnswers].map(normalise)

  if (accepted.includes(g)) return { outcome: 'correct', answer: expected }

  if (tolerance === 'tolerant' && accepted.some((answer) => within1(g, answer))) {
    // §3.3's partial state: accepted for scheduling, difference shown, so
    // the spelling still registers without the learner being marked wrong.
    return {
      outcome: 'partial',
      answer: expected,
      note: 'Close — check the spelling.',
    }
  }

  return { outcome: 'incorrect', answer: expected }
}

export function judgeChoice(given: string, expected: string): Judgement {
  return given === expected
    ? { outcome: 'correct', answer: expected }
    : { outcome: 'incorrect', answer: expected }
}

export function judgeOrder(given: string[], expected: string[]): Judgement {
  const same =
    given.length === expected.length &&
    given.every((t, i) => t === expected[i])
  return same
    ? { outcome: 'correct', answer: expected.join(' ') }
    : { outcome: 'incorrect', answer: expected.join(' ') }
}
