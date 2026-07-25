/**
 * One clock, read by every synced layer.
 *
 * ShaderGradient's own animation uses a `THREE.Clock` created *per material*
 * and started in an effect, so two canvases start counting at different
 * moments and sit permanently out of phase. For a mask/window effect that is
 * fatal: the wave has to line up across the mask edge or the illusion dies.
 *
 * Instead every layer reads this single module-level value. Both get the
 * bit-identical number within a frame, so they cannot drift — even if one
 * canvas renders before the other, they render the same instant.
 */
let seconds = 0
let running = false
let frame = 0
let start = 0

const tick = () => {
  seconds = (performance.now() - start) / 1000
  frame = requestAnimationFrame(tick)
}

/** Ref-counted so the loop only runs while synced layers are mounted. */
let subscribers = 0

export function subscribeSharedClock(): () => void {
  subscribers += 1
  if (!running) {
    running = true
    start = performance.now() - seconds * 1000
    frame = requestAnimationFrame(tick)
  }
  return () => {
    subscribers -= 1
    if (subscribers <= 0) {
      subscribers = 0
      running = false
      cancelAnimationFrame(frame)
    }
  }
}

export const getSharedTime = () => seconds
