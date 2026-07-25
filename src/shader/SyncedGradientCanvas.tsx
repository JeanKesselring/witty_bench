import { ShaderGradient, ShaderGradientCanvas } from '@shadergradient/react'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'

import { getSharedTime, subscribeSharedClock } from './sharedClock'
import type { GradientConfig } from './types'

/**
 * The live uniform bag.
 *
 * The material also defines a `material.uTime` alias, but its getter/setter
 * reads `material.uniforms`, which does not exist on a MeshPhysicalMaterial —
 * touching it throws. The library's own animation loop writes
 * `userData.uTime.value`, so that is the path that actually works.
 */
type GradientMaterial = { userData?: { uTime?: { value: number } } }

/**
 * Writes the shared clock into this canvas's gradient material every frame.
 *
 * Must live *inside* the Canvas to get `useFrame`. Writing the uniform
 * directly is deliberate: `uTime` is also a React prop, but the material is
 * `useMemo`'d on the uniforms object, so passing a new one each frame would
 * rebuild the MeshPhysicalMaterial 60×/second.
 */
function TimeSync({ frozenAt }: { frozenAt?: number }) {
  const scene = useThree((s) => s.scene)
  const material = useRef<GradientMaterial | null>(null)

  useEffect(() => subscribeSharedClock(), [])

  useFrame(() => {
    if (!material.current) {
      const mesh = scene.getObjectByName('shadergradient-mesh') as
        | { material?: GradientMaterial }
        | undefined
      // userData.uTime only exists once the material has been built.
      if (!mesh?.material?.userData?.uTime) return
      material.current = mesh.material
    }
    material.current.userData!.uTime!.value = frozenAt ?? getSharedTime()
  })

  return null
}

export type SyncedGradientCanvasProps = {
  config: GradientConfig
  pixelDensity: number
  /** Pin to a fixed instant instead of following the clock (reduced motion). */
  frozenAt?: number
}

export default function SyncedGradientCanvas({
  config,
  pixelDensity,
  frozenAt,
}: SyncedGradientCanvasProps) {
  return (
    <ShaderGradientCanvas
      style={{ width: '100%', height: '100%' }}
      pixelDensity={pixelDensity}
      pointerEvents="none"
      lazyLoad={false}
      powerPreference="high-performance"
      fov={45}
    >
      {/* animate="off" hands uTime over to us — the library's per-material
          clock would otherwise fight the shared one. */}
      <ShaderGradient control="props" {...config} animate="off" />
      <TimeSync frozenAt={frozenAt} />
    </ShaderGradientCanvas>
  )
}
