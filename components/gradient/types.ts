import type { GradientT } from '@shadergradient/react'

/**
 * The subset of ShaderGradient props the demos actually drive.
 *
 * ShaderGradient exposes ~40 props; exposing all of them in a design tool is
 * noise. These are the ones that change how a gradient reads as a *page
 * element* — motion, palette, and framing.
 */
export type GradientConfig = Required<
  Pick<
    GradientT,
    | 'type'
    | 'uSpeed'
    | 'uStrength'
    | 'uDensity'
    | 'uFrequency'
    | 'uAmplitude'
    | 'color1'
    | 'color2'
    | 'color3'
    | 'cDistance'
    | 'cPolarAngle'
    | 'cAzimuthAngle'
    | 'cameraZoom'
    | 'positionX'
    | 'positionY'
    | 'positionZ'
    | 'rotationX'
    | 'rotationY'
    | 'rotationZ'
    | 'lightType'
    | 'brightness'
    | 'envPreset'
    | 'reflection'
    | 'grain'
    | 'wireframe'
  >
>

/**
 * A named starting point, in both themes.
 *
 * Light is a separate palette rather than a lightened dark one. The deep stops
 * that give a dark page its depth turn to mud on white, and `color3` is doing
 * height-shading work (see the fragment shader), so it has to stay close in
 * value to the other two or the wave punches holes in a light layout.
 */
export type GradientPreset = {
  id: string
  label: string
  /** Two hex stops used for the CSS fallback + swatch, so the UI never waits on WebGL. */
  swatch: [string, string]
  config: GradientConfig
  swatchLight: [string, string]
  configLight: GradientConfig
}

/**
 * Framing overrides applied at narrow viewports.
 *
 * This is the part that is easy to miss: a gradient tuned on a 16:9 desktop
 * canvas gets cropped into mush on a 9:19 phone. Pulling the camera back and
 * lowering the polar angle re-frames the same mesh for portrait.
 */
export type ResponsiveFraming = Partial<
  Pick<GradientConfig, 'cDistance' | 'cPolarAngle' | 'cAzimuthAngle' | 'cameraZoom' | 'positionY'>
>
