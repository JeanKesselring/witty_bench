import type { GradientConfig, GradientPreset } from './types'

/**
 * Palettes and framing derived from ShaderGradient's own shipped presets
 * (`import { presets } from '@shadergradient/react'`), retuned for these
 * layouts. Worth reading those before inventing values from scratch — they
 * encode a lot of non-obvious camera work.
 */
const base: GradientConfig = {
  type: 'waterPlane',
  uSpeed: 0.1,
  uStrength: 2.4,
  uDensity: 1.1,
  uFrequency: 5.5,
  uAmplitude: 0,
  color1: '#5606ff',
  color2: '#fe8989',
  color3: '#000000',
  cDistance: 3.9,
  cPolarAngle: 115,
  cAzimuthAngle: 180,
  cameraZoom: 1,
  positionX: -0.5,
  positionY: 0.1,
  positionZ: 0,
  rotationX: 0,
  rotationY: 0,
  rotationZ: 235,
  // '3d' keeps everything local. 'env' fetches HDR maps from a remote CDN,
  // which is a real network dependency — opt into it deliberately.
  lightType: '3d',
  brightness: 1.1,
  envPreset: 'city',
  reflection: 0.1,
  // Off by default: the grain pass is a fullscreen post-effect and it reads as
  // harsh dither on flat colour fields. Turn it on per-surface, not globally.
  grain: 'off',
  wireframe: false,
}

export const preset = (over: Partial<GradientConfig>): GradientConfig => ({ ...base, ...over })

/**
 * Camera framing that makes a `sphere` actually fill its element.
 *
 * The trap: spheres want a *short* cDistance and a very high cameraZoom
 * (12–17), not the zoom-1 framing that works for planes. Leave cameraZoom at 1
 * and you get a small blob floating in the middle of the box.
 */
export const SPHERE_FRAMING: Partial<GradientConfig> = {
  type: 'sphere',
  uAmplitude: 7,
  uDensity: 0.8,
  uStrength: 0.4,
  uFrequency: 5.5,
  cDistance: 1.5,
  cPolarAngle: 140,
  cAzimuthAngle: 250,
  cameraZoom: 12.5,
  positionX: 0,
  positionY: 0,
  rotationZ: 140,
  reflection: 0.5,
  brightness: 1.5,
}

export const PRESETS: GradientPreset[] = [
  {
    id: 'aurora',
    label: 'Aurora',
    swatch: ['#5606ff', '#fe8989'],
    config: preset({}),
    swatchLight: ['#b9a6ff', '#ffd2e0'],
    configLight: preset({
      color1: '#b9a6ff',
      color2: '#ffd2e0',
      color3: '#ffffff',
      brightness: 1.25,
    }),
  },
  {
    id: 'halo',
    label: 'Halo',
    swatch: ['#ff5005', '#dbba95'],
    config: preset({
      type: 'plane',
      color1: '#ff5005',
      color2: '#dbba95',
      color3: '#d0bce1',
      uAmplitude: 1,
      uDensity: 1.3,
      uSpeed: 0.4,
      uStrength: 4,
      brightness: 1.2,
      cDistance: 3.6,
      cPolarAngle: 90,
      cAzimuthAngle: 180,
      positionX: -1.4,
      positionY: 0,
      rotationY: 10,
      rotationZ: 50,
    }),
    swatchLight: ['#ffb38a', '#ffe8d6'],
    configLight: preset({
      type: 'plane',
      color1: '#ffb38a',
      color2: '#ffe8d6',
      color3: '#efe4ff',
      uAmplitude: 1,
      uDensity: 1.3,
      uSpeed: 0.4,
      uStrength: 4,
      brightness: 1.3,
      cDistance: 3.6,
      cPolarAngle: 90,
      cAzimuthAngle: 180,
      positionX: -1.4,
      positionY: 0,
      rotationY: 10,
      rotationZ: 50,
    }),
  },
  {
    id: 'mint',
    label: 'Mint',
    swatch: ['#94ffd1', '#6bf5ff'],
    config: preset({
      color1: '#94ffd1',
      color2: '#6bf5ff',
      color3: '#ffffff',
      uDensity: 1.2,
      uSpeed: 0.2,
      uStrength: 3.4,
      uFrequency: 0,
      brightness: 1.2,
      cDistance: 4.4,
      cPolarAngle: 70,
      cAzimuthAngle: 170,
      positionX: 0,
      positionY: 0.9,
      positionZ: -0.3,
      rotationX: 45,
      rotationZ: 0,
    }),
    swatchLight: ['#b6ffe4', '#cdf4ff'],
    configLight: preset({
      color1: '#b6ffe4',
      color2: '#cdf4ff',
      color3: '#ffffff',
      uDensity: 1.2,
      uSpeed: 0.2,
      uStrength: 3.4,
      uFrequency: 0,
      brightness: 1.3,
      cDistance: 4.4,
      cPolarAngle: 70,
      cAzimuthAngle: 170,
      positionX: 0,
      positionY: 0.9,
      positionZ: -0.3,
      rotationX: 45,
      rotationZ: 0,
    }),
  },
  {
    id: 'ember',
    label: 'Ember',
    swatch: ['#ff6a1a', '#c73c00'],
    config: preset({
      color1: '#ff6a1a',
      color2: '#c73c00',
      color3: '#fd4912',
      uDensity: 1.8,
      uSpeed: 0.2,
      uStrength: 3,
      brightness: 1.2,
      cDistance: 2.4,
      cPolarAngle: 95,
      cAzimuthAngle: 180,
      positionX: 0,
      positionY: -2.1,
      rotationZ: 225,
    }),
    swatchLight: ['#ffb59a', '#ffd9c2'],
    configLight: preset({
      color1: '#ffb59a',
      color2: '#ffd9c2',
      color3: '#fff1e8',
      uDensity: 1.8,
      uSpeed: 0.2,
      uStrength: 3,
      brightness: 1.3,
      cDistance: 2.4,
      cPolarAngle: 95,
      cAzimuthAngle: 180,
      positionX: 0,
      positionY: -2.1,
      rotationZ: 225,
    }),
  },
  {
    id: 'ink',
    label: 'Ink',
    swatch: ['#8d7dca', '#212121'],
    config: preset({
      color1: '#606080',
      color2: '#8d7dca',
      color3: '#212121',
      uDensity: 1.5,
      uSpeed: 0.3,
      uStrength: 1.5,
      uFrequency: 0,
      brightness: 1,
      cDistance: 2.8,
      cPolarAngle: 80,
      cAzimuthAngle: 180,
      cameraZoom: 9.1,
      positionX: 0,
      positionY: 0,
      rotationX: 50,
      rotationZ: -60,
    }),
    swatchLight: ['#c3ccff', '#eef1ff'],
    configLight: preset({
      color1: '#c3ccff',
      color2: '#eef1ff',
      color3: '#dfe4f5',
      uDensity: 1.5,
      uSpeed: 0.3,
      uStrength: 1.5,
      uFrequency: 0,
      brightness: 1.2,
      cDistance: 2.8,
      cPolarAngle: 80,
      cAzimuthAngle: 180,
      cameraZoom: 9.1,
      positionX: 0,
      positionY: 0,
      rotationX: 50,
      rotationZ: -60,
    }),
  },
]

export const presetById = (id: string): GradientPreset =>
  PRESETS.find((p) => p.id === id) ?? PRESETS[0]

export const configFor = (id: string, theme: 'light' | 'dark'): GradientConfig => {
  const p = presetById(id)
  return theme === 'light' ? p.configLight : p.config
}

export const swatchFor = (p: GradientPreset, theme: 'light' | 'dark'): [string, string] =>
  theme === 'light' ? p.swatchLight : p.swatch

/** CSS gradient used as the paint-before-WebGL fallback and as the swatch fill. */
export const fallbackCss = (c: GradientConfig): string =>
  `radial-gradient(120% 120% at 25% 15%, ${c.color2} 0%, ${c.color1} 45%, ${c.color3} 100%)`
