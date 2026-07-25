import { ShaderGradient, ShaderGradientCanvas } from '@shadergradient/react'

import type { GradientConfig } from './types'

export type GradientCanvasProps = {
  config: GradientConfig
  animate: 'on' | 'off'
  pixelDensity: number
  lazy: boolean
}

/**
 * The heavy half of a gradient surface, isolated in its own module.
 *
 * three.js + @react-three/fiber + the shader bundle is ~1.1MB. Keeping it
 * behind a `React.lazy` boundary (see GradientSurface) means it becomes its own
 * chunk fetched after first paint, instead of blocking the page's first render
 * on a decorative background.
 */
export default function GradientCanvas({
  config,
  animate,
  pixelDensity,
  lazy,
}: GradientCanvasProps) {
  return (
    <ShaderGradientCanvas
      style={{ width: '100%', height: '100%' }}
      pixelDensity={pixelDensity}
      pointerEvents="none"
      lazyLoad={lazy}
      rootMargin="200px"
      powerPreference="high-performance"
      fov={45}
    >
      <ShaderGradient control="props" {...config} animate={animate} />
    </ShaderGradientCanvas>
  )
}
