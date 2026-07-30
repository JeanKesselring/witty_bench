'use client'

import { ShaderGradient, ShaderGradientCanvas } from '@shadergradient/react'
import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'

import { reactionLevels } from './reactions'
import type { GradientConfig } from './types'

/* The WebGL half of the substrate, behind its own lazy boundary — importing
 * @react-three/fiber here is what keeps three.js out of the initial bundle
 * (§10.7), so nothing in this file may be imported eagerly.
 */

/**
 * The live uniform bag.
 *
 * The material also defines a `material.uTime` alias, but its getter reads
 * `material.uniforms`, which does not exist on a MeshPhysicalMaterial —
 * touching it throws. The library's own loop writes `userData.uTime.value`,
 * so that is the path that works.
 */
type GradientMaterial = {
  userData?: {
    uTime?: { value: number }
    /** `uStrength` in the preset: how far the plane displaces, i.e. wave height. */
    uNoiseStrength?: { value: number }
  }
}

/**
 * Peak multiplier on wave speed while the wrong-answer impulse is at full.
 *
 * Measured, not guessed, because the useful range is narrow at both ends. The
 * resting field advances 1 phase unit per second, and it takes about **40**
 * units for the wave to become unrecognisable. Four units is where the change
 * starts to register; twelve is plainly the same wave, moved.
 *
 * Below ~4× nothing is visible: at `uSpeed: 0.012` the resting drift is barely
 * perceptible, and 2× of imperceptible is imperceptible. Far above ~40× nothing
 * is visible either, for the opposite reason — each frame lands a full field
 * width from the last, so the wave stops travelling and starts boiling. Both
 * ends look identical from outside: "the speed-up isn't working".
 *
 * This is **coupled to the wrong-answer impulse's duration** in reactions.ts,
 * because what the eye reads is total phase advanced, not peak rate. Over the
 * current 100ms/2s impulse this spends ~16 units — a clear surge, still short of
 * the ~40 that decorrelates the field. Shorten the impulse and this has to rise
 * to hold the same read; lengthen it much further and it should come down.
 */
const WRONG_SPEED = 20

/**
 * How much wave height survives at the peak of the correct-answer impulse.
 *
 * The counterpart to speed: `uStrength` is the plane's displacement, so scaling
 * it down settles the field flat and calm rather than exciting it. Height reads
 * at a glance in a way speed does not, which is why this needs no multiple of
 * the resting value — 0.45 is plainly a flatter sea, and 0 is a dead one.
 */
const RIGHT_HEIGHT = 0.8

/**
 * Owns the wave's clock and its height, so a judgement can act on both.
 *
 * Why not just raise `uSpeed`? The shader computes `time = uTime * uSpeed`, so
 * doubling the speed of an already-running wave multiplies its *phase* too —
 * after five minutes on the page that is a jump of several wavelengths, read
 * as a teleport rather than an acceleration. Accumulating our own phase at a
 * variable rate speeds the wave up from wherever it happens to be.
 *
 * Writing the uniform directly (rather than passing `uTime`/`uSpeed` as props)
 * is also the only affordable path: the library memoises the material on the
 * uniforms object it builds fresh each render, so a prop change per frame
 * rebuilds the MeshPhysicalMaterial — and disposing the old one drops its
 * compiled program, so every frame would pay a shader recompile.
 */
function WaveClock() {
  const scene = useThree((state) => state.scene)
  const mesh = useRef<{ material?: GradientMaterial } | null>(null)
  const material = useRef<GradientMaterial | null>(null)
  const phase = useRef(0)
  /** The preset's own wave height, read before we start scaling it. */
  const restingHeight = useRef(0)

  useFrame((_, delta) => {
    if (!mesh.current) {
      mesh.current =
        (scene.getObjectByName('shadergradient-mesh') as
          { material?: GradientMaterial } | undefined) ?? null
      if (!mesh.current) return
    }

    /* Re-resolve whenever the material identity changes, which it does on every
     * theme switch: the config prop changes, the library rebuilds the material,
     * and a cached reference is then pointing at a disposed one. Holding that
     * stale reference froze the wave after a theme toggle — we owned uTime and
     * were writing it somewhere nothing reads. */
    const live = mesh.current.material
    // The uniforms only exist once the material has been built.
    if (!live?.userData?.uTime || !live.userData.uNoiseStrength) return
    if (live !== material.current) {
      material.current = live
      restingHeight.current = live.userData.uNoiseStrength.value
    }

    const { wrong, right } = reactionLevels()

    // Clamped for the same reason the envelopes clamp: a tab returning from the
    // background reports one enormous delta.
    phase.current += Math.min(delta, 0.1) * (1 + wrong * (WRONG_SPEED - 1))
    live.userData.uTime.value = phase.current
    live.userData.uNoiseStrength.value = restingHeight.current * (1 - right * (1 - RIGHT_HEIGHT))
  })

  return null
}

export default function WaveCanvas({
  config,
  pixelDensity,
  frozen,
}: {
  config: GradientConfig
  pixelDensity: number
  /** Reduced motion: hold a still frame rather than blanking the box (§9.3A). */
  frozen: boolean
}) {
  return (
    <ShaderGradientCanvas
      style={{ width: '100%', height: '100%' }}
      pixelDensity={pixelDensity}
      pointerEvents="none"
      lazyLoad={false}
      powerPreference="high-performance"
      fov={45}
    >
      {/* animate="off" throughout: it hands uTime to WaveClock, whose whole
          job is to hold the phase the library's per-material clock would
          otherwise own. With no WaveClock mounted, uTime stays at 0 and the
          wave is the still frame reduced motion asks for. */}
      <ShaderGradient control="props" {...config} animate="off" />
      {frozen ? null : <WaveClock />}
    </ShaderGradientCanvas>
  )
}
