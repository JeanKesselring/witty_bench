/* The judgement reactions the shader substrate plays.
 *
 * Two impulses, `wrong` and `right`, each a number that swells to 1 and falls
 * back to 0. The substrate reads them per frame: `wrong` reddens the field and
 * quickens the wave, `right` greens it and flattens the wave down. This lives
 * outside React because every consumer is a per-frame writer — two CSS custom
 * properties and two live three.js uniforms — and none of them wants a
 * re-render (see WaveCanvas for why a re-render here is genuinely expensive).
 *
 * Each impulse is advanced as a *linear* position and shaped on read, so the
 * knobs below are wall-clock durations and the curves are pure shape. The two
 * outcomes carry their own `Impulse`, so they can be tuned independently and
 * nothing else in this file needs touching to retune either.
 *
 * The colours are NOT here: the washes are pseudo-elements in kite.css, which
 * owns both the hue tokens and the per-theme peak strengths. This file only
 * produces the two numbers they multiply.
 */

/**
 * How one outcome behaves over time. Durations in wall-clock ms; the curves are
 * pure shape, mapping linear time 0→1 to level 0→1.
 *
 * An impulse is asymmetric, which is why attack and release are separate curves
 * rather than one ease played forwards and backwards. A smoothstep both ways
 * (what this was) leaves the release *flat at the top*: the wash sits at full
 * for a beat before it moves, and reads as a lingering swell however short
 * `fallMs` gets.
 *
 * Any monotonic curve through (0,0) and (1,1) works — nothing here needs to
 * know its algebra, because the retrigger inversion is numeric (see
 * `positionOf`). `p * p * p` gives a harder crack with a longer tail;
 * `p * p * (3 - 2 * p)` gives back the old swell.
 */
type Impulse = {
  /** How long to reach full. Short enough to read as a hit, not a swell. */
  riseMs: number
  /** How long to fall back to nothing. */
  fallMs: number
  /** Shape of the climb to full. */
  attack: (p: number) => number
  /** Shape of the fall back, read as position runs 1→0. */
  release: (p: number) => number
}

/** Off the mark immediately, softening into the peak. */
const easeOut = (p: number) => 1 - (1 - p) * (1 - p)
/** Drops fast, then tapers out. */
const dropOff = (p: number) => p * p
/** Eased at both ends — no corner at either the start or the finish. */
const easeInOut = (p: number) => p * p * (3 - 2 * p)

/** Wrong: a hit. This is the one to lengthen if the red should hang around. */
const WRONG_IMPULSE: Impulse = {
  riseMs: 400,
  fallMs: 2000,
  attack: easeOut,
  release: dropOff,
}

/** Right: not a hit but a breath — eased at both ends, so it swells in and
 *  settles out with no corner at either edge. */
const RIGHT_IMPULSE: Impulse = {
  riseMs: 1000,
  fallMs: 1500,
  attack: easeInOut,
  release: easeInOut,
}

/**
 * Where on a curve does a given level sit? Bisection, because the curves are
 * now a knob rather than fixed algebra, and a hand-written inverse would be one
 * more thing to keep in sync with them.
 *
 * This is what keeps a retrigger continuous: a second signal arriving mid-
 * release re-enters the *attack* curve at the level already on screen. Feeding
 * it the shared position instead would snap the wash, since at position 0.5 the
 * release reads 0.25 while the attack reads 0.75. Runs once per signal, never
 * per frame, so twenty iterations of a lambda costs nothing.
 */
const positionOf = (curve: (p: number) => number, level: number): number => {
  let lo = 0
  let hi = 1
  for (let i = 0; i < 20; i += 1) {
    const mid = (lo + hi) / 2
    if (curve(mid) < level) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

type Channel = {
  /** Shaped, 0→1→0. What consumers read. */
  level: number
  /** Linear position in the envelope, 0–1. `level` is this, shaped. */
  position: number
  rising: boolean
  shape: Impulse
}

const wrong: Channel = { level: 0, position: 0, rising: false, shape: WRONG_IMPULSE }
const right: Channel = { level: 0, position: 0, rising: false, shape: RIGHT_IMPULSE }
const channels = [wrong, right]

export type ReactionLevels = { wrong: number; right: number }

let lastTick = 0
let frame = 0

const listeners = new Set<(levels: ReactionLevels) => void>()

const advance = (channel: Channel, elapsed: number) => {
  if (!channel.rising && channel.position <= 0) return
  const { riseMs, fallMs, attack, release } = channel.shape
  channel.position += channel.rising ? elapsed / riseMs : -elapsed / fallMs
  if (channel.position >= 1) {
    channel.position = 1
    channel.rising = false
  }
  if (channel.position <= 0) channel.position = 0
  // At the top the direction has just flipped, and both curves read 1 there, so
  // the handover into the release is seamless.
  channel.level = channel.rising ? attack(channel.position) : release(channel.position)
}

const busy = () => channels.some((channel) => channel.rising || channel.position > 0)

/**
 * Advance every channel to `now`, once.
 *
 * This is the whole sync mechanism, and it exists because there are two frame
 * loops in play: this module's rAF, which writes the CSS custom properties the
 * washes read, and R3F's, which writes the shader uniforms. Whichever runs
 * second used to read a level the other had already moved past — measured at up
 * to **0.71** apart on the wrong-answer attack, i.e. the colour visibly leading
 * the wave.
 *
 * Keying on the timestamp rather than on call order fixes it: the envelope is a
 * function of wall-clock time, every reader gets the value for the instant it
 * asks about, and a second call in the same millisecond is a no-op rather than a
 * second advance. `lastTick` is shared with the rAF loop deliberately — that is
 * what makes the two loops one clock.
 */
const syncTo = (now: number) => {
  /* Both clamps are load-bearing.
   *
   * The ceiling: a backgrounded tab stops firing frames, and clamping keeps the
   * envelope from teleporting through its own peak on the frame the tab comes
   * back.
   *
   * The floor: rAF is passed the time the *frame* began, which can be earlier
   * than the click that armed this loop — input for a frame is dispatched
   * inside it. Left signed, that first negative step drove the envelope below
   * zero and the loop cancelled itself on its opening tick, so a judgement lit
   * nothing at all. It presented as flakiness, since whether the step is
   * negative depends on where in the frame the click landed. */
  const elapsed = Math.min(Math.max(now - lastTick, 0), 100)
  if (elapsed === 0) return
  lastTick = now
  channels.forEach((channel) => advance(channel, elapsed))
}

const tick = (now: number) => {
  syncTo(now)
  const levels = { wrong: wrong.level, right: right.level }
  listeners.forEach((notify) => notify(levels))

  // `rising` matters as much as the position: on the opening tick an envelope
  // has not left zero yet, and a position-only test would end it there.
  frame = busy() ? requestAnimationFrame(tick) : 0
}

const fire = (channel: Channel, other: Channel) => {
  if (typeof requestAnimationFrame !== 'function') return
  // Coming out of a release, re-enter the attack curve at the level already on
  // screen rather than at the shared position — see `attackAt`.
  if (!channel.rising) channel.position = positionOf(channel.shape.attack, channel.level)
  channel.rising = true
  // The field cannot say "wrong" and "right" at once, so the other channel
  // starts letting go immediately instead of finishing its own release.
  other.rising = false
  if (frame) return
  lastTick = performance.now()
  frame = requestAnimationFrame(tick)
}

/** Answered incorrectly: the field reddens and the wave quickens. */
export const signalWrongAnswer = () => fire(wrong, right)

/** Answered correctly: the field greens and the wave settles flatter. */
export const signalCorrectAnswer = () => fire(right, wrong)

/**
 * Levels for *this instant*, not for whenever the envelope last stepped.
 *
 * The sync-to-now is the point: the shader reads this from R3F's frame loop,
 * which is a different loop from the one driving the washes, and reading a
 * stale level is precisely how the wave falls behind the colour. Cheap enough
 * to call per frame — idle channels return immediately.
 */
export const reactionLevels = (): ReactionLevels => {
  if (typeof performance !== 'undefined') syncTo(performance.now())
  return { wrong: wrong.level, right: right.level }
}

export function subscribeReactions(onLevels: (levels: ReactionLevels) => void): () => void {
  listeners.add(onLevels)
  // A backdrop that mounts mid-reaction should not start from zero.
  onLevels(reactionLevels())
  return () => {
    listeners.delete(onLevels)
  }
}
