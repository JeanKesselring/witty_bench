'use client'

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import styles from './filters.module.css'

type Mode =
  | 'pixel-grid'
  | 'dot-field'
  | 'cross-weave'
  | 'bayer-four'
  | 'bayer-eight'
  | 'floyd'
  | 'atkinson'
  | 'line-screen'
  | 'cmyk'
  | 'glyphs'
  | 'live-threshold'
  | 'focus-density'
  | 'repel'
  | 'split-process'
  | 'wave-field'
  | 'spectral-lens'
  | 'magnetic'
  | 'rgb-drift'
  | 'time-scan'
  | 'erosion'
  | 'riso-print'
  | 'edge-pixels-threshold'
  | 'edge-pixels-perceptual'
  | 'edge-dots-perceptual'
  | 'edge-pixels-kernel'

type Palette = {
  paper: string
  ink: string
  accent?: string
  accentTwo?: string
}

type FilterSpec = {
  number: string
  name: string
  mode: Mode
  process: string
  palette: Palette
  interactive?: boolean
  control?: 'threshold' | 'perceptual' | 'kernel'
}

const FILTERS: FilterSpec[] = [
  {
    number: '01',
    name: 'Cell / square field',
    mode: 'pixel-grid',
    process: 'Density-mapped square raster',
    palette: { paper: '#f6d6e2', ink: '#20103d', accent: '#7772c8' },
  },
  {
    number: '02',
    name: 'Tissue market',
    mode: 'dot-field',
    process: 'Amplitude-modulated dot screen',
    palette: { paper: '#f1efe7', ink: '#153cad', accent: '#e33d2e' },
  },
  {
    number: '03',
    name: 'Cytoplasm weave',
    mode: 'cross-weave',
    process: 'Orthogonal micrographic weave',
    palette: { paper: '#f4f0e6', ink: '#181116', accent: '#ff5b45' },
  },
  {
    number: '04',
    name: 'Ordered organelle',
    mode: 'bayer-four',
    process: 'Bayer 4 × 4 threshold matrix',
    palette: { paper: '#d9f0e3', ink: '#102d27', accent: '#ff684d' },
  },
  {
    number: '05',
    name: 'Blue chromosome',
    mode: 'bayer-eight',
    process: 'Bayer 8 × 8 threshold matrix',
    palette: { paper: '#efecdf', ink: '#1940bc', accent: '#ff4d3d' },
  },
  {
    number: '06',
    name: 'Error diffusion I',
    mode: 'floyd',
    process: 'Floyd–Steinberg diffusion',
    palette: { paper: '#f3e8d5', ink: '#341b51', accent: '#ee624f' },
  },
  {
    number: '07',
    name: 'Error diffusion II',
    mode: 'atkinson',
    process: 'Atkinson diffusion',
    palette: { paper: '#e8f0d4', ink: '#163832', accent: '#fb5b43' },
  },
  {
    number: '08',
    name: 'Membrane score',
    mode: 'line-screen',
    process: 'Variable-length line screen',
    palette: { paper: '#f3d9cf', ink: '#30379d', accent: '#ee4e39' },
  },
  {
    number: '09',
    name: 'Three-ink cell',
    mode: 'cmyk',
    process: 'Misregistered three-ink rosette',
    palette: {
      paper: '#f5f0df',
      ink: '#19143a',
      accent: '#ef335f',
      accentTwo: '#1eb6b1',
    },
  },
  {
    number: '10',
    name: 'Micrographic anatomy',
    mode: 'glyphs',
    process: 'Tone-selected glyph field',
    palette: { paper: '#efe9dc', ink: '#17120f', accent: '#2857bd' },
  },
  {
    number: '11',
    name: 'Threshold instrument',
    mode: 'live-threshold',
    process: 'Horizontal threshold control',
    palette: { paper: '#ffd9e5', ink: '#24113f', accent: '#f3435f' },
    interactive: true,
  },
  {
    number: '12',
    name: 'Resolution lens',
    mode: 'focus-density',
    process: 'Distance-adaptive micrographic sampling',
    palette: { paper: '#edf0df', ink: '#123e49', accent: '#ff5f42' },
    interactive: true,
  },
  {
    number: '13',
    name: 'Repulsion field',
    mode: 'repel',
    process: 'Cursor-repelled stipple system',
    palette: { paper: '#f1dfd7', ink: '#32339c', accent: '#e54739' },
    interactive: true,
  },
  {
    number: '14',
    name: 'Process boundary',
    mode: 'split-process',
    process: 'Live Bayer / dot division',
    palette: { paper: '#eee9dd', ink: '#17120f', accent: '#2a54ba' },
    interactive: true,
  },
  {
    number: '15',
    name: 'Wave specimen',
    mode: 'wave-field',
    process: 'Pointer-phased raster wave',
    palette: { paper: '#dff2e6', ink: '#143a30', accent: '#fc5f46' },
    interactive: true,
  },
  {
    number: '16',
    name: 'Spectral loupe',
    mode: 'spectral-lens',
    process: 'Local three-color analysis',
    palette: {
      paper: '#f5e6dc',
      ink: '#20173e',
      accent: '#f03964',
      accentTwo: '#00a6a6',
    },
    interactive: true,
  },
  {
    number: '17',
    name: 'Magnetic points',
    mode: 'magnetic',
    process: 'Attracted microdot field',
    palette: { paper: '#f4f0dc', ink: '#183d91', accent: '#ef513d' },
    interactive: true,
  },
  {
    number: '18',
    name: 'Chromatic drift',
    mode: 'rgb-drift',
    process: 'Pointer-separated ink channels',
    palette: {
      paper: '#f2e8d9',
      ink: '#16132d',
      accent: '#ec3264',
      accentTwo: '#00a8b2',
    },
    interactive: true,
  },
  {
    number: '19',
    name: 'Temporal section',
    mode: 'time-scan',
    process: 'Variable-resolution scan band',
    palette: { paper: '#e7efd9', ink: '#1e3031', accent: '#f2543d' },
    interactive: true,
  },
  {
    number: '20',
    name: 'Cell erosion',
    mode: 'erosion',
    process: 'Radial stochastic threshold',
    palette: { paper: '#f8dce5', ink: '#2a1644', accent: '#6c6cc3' },
    interactive: true,
  },
  {
    number: '21',
    name: 'Riso cell',
    mode: 'riso-print',
    process: 'Misregistered two-ink Risograph',
    palette: {
      paper: '#f3eddd',
      ink: '#17378f',
      accent: '#f04a63',
      accentTwo: '#17378f',
    },
  },
  {
    number: '22',
    name: 'Adaptive pixels / threshold',
    mode: 'edge-pixels-threshold',
    process: 'Recursive grid · adjustable edge threshold',
    palette: {
      paper: '#07080d',
      ink: '#f2f4ff',
    },
    interactive: true,
    control: 'threshold',
  },
  {
    number: '23',
    name: 'Adaptive pixels / perceptual',
    mode: 'edge-pixels-perceptual',
    process: 'Balanced perceptual quadtree · multi-scale',
    palette: {
      paper: '#07080d',
      ink: '#f2f4ff',
    },
    interactive: true,
    control: 'perceptual',
  },
  {
    number: '24',
    name: 'Adaptive pixels / kernel',
    mode: 'edge-pixels-kernel',
    process: 'Recursive grid · adjustable detector size',
    palette: {
      paper: '#07080d',
      ink: '#f2f4ff',
    },
    interactive: true,
    control: 'kernel',
  },
  {
    number: '25',
    name: 'Adaptive dots / perceptual',
    mode: 'edge-dots-perceptual',
    process: 'Dominant-color ground · adaptive dot quadtree',
    palette: {
      paper: '#07080d',
      ink: '#f2f4ff',
    },
    interactive: true,
    control: 'perceptual',
  },
]

const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]

const BAYER_8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
]

type Pointer = { x: number; y: number; active: boolean }

type Samples = {
  density: Float32Array
  red: Uint8ClampedArray
  green: Uint8ClampedArray
  blue: Uint8ClampedArray
  cols: number
  rows: number
  step: number
}

function pseudoRandom(x: number, y: number, seed = 1) {
  const value = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453
  return value - Math.floor(value)
}

function makeSamples(
  image: HTMLImageElement,
  width: number,
  height: number,
  step: number,
): Samples {
  const cols = Math.ceil(width / step)
  const rows = Math.ceil(height / step)
  const source = document.createElement('canvas')
  source.width = cols
  source.height = rows
  const context = source.getContext('2d', { willReadFrequently: true })

  if (!context) {
    return {
      density: new Float32Array(cols * rows),
      red: new Uint8ClampedArray(cols * rows),
      green: new Uint8ClampedArray(cols * rows),
      blue: new Uint8ClampedArray(cols * rows),
      cols,
      rows,
      step,
    }
  }

  context.fillStyle = '#000'
  context.fillRect(0, 0, cols, rows)

  const maxWidth = cols * 0.84
  const maxHeight = rows * 0.7
  const ratio = image.naturalWidth / image.naturalHeight
  const drawWidth = Math.min(maxWidth, maxHeight * ratio)
  const drawHeight = drawWidth / ratio
  const x = (cols - drawWidth) / 2
  const y = rows * 0.2
  context.drawImage(image, x, y, drawWidth, drawHeight)

  const pixels = context.getImageData(0, 0, cols, rows).data
  const density = new Float32Array(cols * rows)
  const red = new Uint8ClampedArray(cols * rows)
  const green = new Uint8ClampedArray(cols * rows)
  const blue = new Uint8ClampedArray(cols * rows)

  for (let index = 0; index < density.length; index += 1) {
    const offset = index * 4
    const r = pixels[offset] ?? 0
    const g = pixels[offset + 1] ?? 0
    const b = pixels[offset + 2] ?? 0
    red[index] = r
    green[index] = g
    blue[index] = b
    density[index] = Math.pow(Math.max(r, g, b) / 255, 0.72)
  }

  return { density, red, green, blue, cols, rows, step }
}

function diffuse(
  values: Float32Array,
  cols: number,
  rows: number,
  algorithm: 'floyd' | 'atkinson',
) {
  const work = Float32Array.from(values, (density) => 1 - density)
  const result = new Uint8Array(values.length)

  const add = (x: number, y: number, amount: number) => {
    if (x < 0 || x >= cols || y < 0 || y >= rows) return
    const index = y * cols + x
    work[index] = (work[index] ?? 0) + amount
  }

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const index = y * cols + x
      const oldValue = work[index] ?? 1
      const newValue = oldValue < 0.5 ? 0 : 1
      result[index] = newValue === 0 ? 1 : 0
      const error = oldValue - newValue

      if (algorithm === 'floyd') {
        add(x + 1, y, error * (7 / 16))
        add(x - 1, y + 1, error * (3 / 16))
        add(x, y + 1, error * (5 / 16))
        add(x + 1, y + 1, error * (1 / 16))
      } else {
        const portion = error / 8
        add(x + 1, y, portion)
        add(x + 2, y, portion)
        add(x - 1, y + 1, portion)
        add(x, y + 1, portion)
        add(x + 1, y + 1, portion)
        add(x, y + 2, portion)
      }
    }
  }

  return result
}

type PerceptualAnalysis = {
  fine: Samples
  information: Float32Array
  labLightness: Float32Array
  labA: Float32Array
  labB: Float32Array
  sortedInformation: number[]
  dominantColor: {
    red: number
    green: number
    blue: number
  }
}

const perceptualAnalysisCache = new Map<string, PerceptualAnalysis>()

function linearizeSrgb(value: number) {
  return value <= 0.04045
    ? value / 12.92
    : Math.pow((value + 0.055) / 1.055, 2.4)
}

function toOklab(red: number, green: number, blue: number) {
  const r = linearizeSrgb(red)
  const g = linearizeSrgb(green)
  const b = linearizeSrgb(blue)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)

  return {
    lightness: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  }
}

function getPerceptualAnalysis(
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  const cacheKey = `${image.src}:${width}x${height}`
  const cached = perceptualAnalysisCache.get(cacheKey)
  if (cached) return cached

  // The perceptual version must be able to resolve all the way to one
  // logical canvas pixel when Detail retention reaches 100%.
  const fineStep = 1
  const fine = makeSamples(image, width, height, fineStep)
  const count = fine.cols * fine.rows
  const labLightness = new Float32Array(count)
  const labA = new Float32Array(count)
  const labB = new Float32Array(count)
  const information = new Float32Array(count)
  const colorCounts = new Uint32Array(4096)
  const colorRed = new Float64Array(4096)
  const colorGreen = new Float64Array(4096)
  const colorBlue = new Float64Array(4096)

  for (let index = 0; index < count; index += 1) {
    const sourceRed = fine.red[index] ?? 0
    const sourceGreen = fine.green[index] ?? 0
    const sourceBlue = fine.blue[index] ?? 0
    const colorBin =
      (sourceRed >> 4) * 256 + (sourceGreen >> 4) * 16 + (sourceBlue >> 4)
    colorCounts[colorBin] += 1
    colorRed[colorBin] += sourceRed
    colorGreen[colorBin] += sourceGreen
    colorBlue[colorBin] += sourceBlue

    const lab = toOklab(
      sourceRed / 255,
      sourceGreen / 255,
      sourceBlue / 255,
    )
    labLightness[index] = lab.lightness
    labA[index] = lab.a
    labB[index] = lab.b
  }

  const at = (values: Float32Array, x: number, y: number) => {
    const clampedX = Math.max(0, Math.min(fine.cols - 1, x))
    const clampedY = Math.max(0, Math.min(fine.rows - 1, y))
    return values[clampedY * fine.cols + clampedX] ?? 0
  }

  for (let y = 0; y < fine.rows; y += 1) {
    for (let x = 0; x < fine.cols; x += 1) {
      let multiScaleEdge = 0

      for (const radius of [1, 2, 4]) {
        const leftL = at(labLightness, x - radius, y)
        const rightL = at(labLightness, x + radius, y)
        const topL = at(labLightness, x, y - radius)
        const bottomL = at(labLightness, x, y + radius)
        const lumaGradient =
          Math.hypot(rightL - leftL, bottomL - topL) /
          Math.sqrt(radius)

        const horizontalColor = Math.hypot(
          rightL - leftL,
          at(labA, x + radius, y) - at(labA, x - radius, y),
          at(labB, x + radius, y) - at(labB, x - radius, y),
        )
        const verticalColor = Math.hypot(
          bottomL - topL,
          at(labA, x, y + radius) - at(labA, x, y - radius),
          at(labB, x, y + radius) - at(labB, x, y - radius),
        )
        const colorGradient =
          Math.hypot(horizontalColor, verticalColor) /
          Math.sqrt(radius)
        multiScaleEdge = Math.max(
          multiScaleEdge,
          lumaGradient * 1.45 + colorGradient * 0.8,
        )
      }

      const histogram = new Uint8Array(8)
      let neighborhoodCount = 0
      for (let offsetY = -2; offsetY <= 2; offsetY += 1) {
        for (let offsetX = -2; offsetX <= 2; offsetX += 1) {
          const value = at(labLightness, x + offsetX, y + offsetY)
          const bin = Math.min(7, Math.floor(value * 8))
          histogram[bin] = (histogram[bin] ?? 0) + 1
          neighborhoodCount += 1
        }
      }

      let entropy = 0
      for (const binCount of histogram) {
        if (binCount === 0) continue
        const probability = binCount / neighborhoodCount
        entropy -= probability * Math.log2(probability)
      }
      entropy /= 3

      const index = y * fine.cols + x
      information[index] = Math.min(
        1,
        multiScaleEdge * 0.72 + entropy * 0.28,
      )
    }
  }

  const sortedInformation = Array.from(information)
    .filter((value, index) => value > 0 && (fine.density[index] ?? 0) > 0.006)
    .sort((a, b) => a - b)
  let dominantBin = 0
  for (let index = 1; index < colorCounts.length; index += 1) {
    if (colorCounts[index] > colorCounts[dominantBin]) dominantBin = index
  }
  const dominantCount = Math.max(1, colorCounts[dominantBin] ?? 0)
  const dominantColor = {
    red: (colorRed[dominantBin] ?? 0) / dominantCount,
    green: (colorGreen[dominantBin] ?? 0) / dominantCount,
    blue: (colorBlue[dominantBin] ?? 0) / dominantCount,
  }
  const analysis = {
    fine,
    information,
    labLightness,
    labA,
    labB,
    sortedInformation,
    dominantColor,
  }
  perceptualAnalysisCache.set(cacheKey, analysis)
  return analysis
}

function renderArtwork(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  filter: FilterSpec,
  pointer: Pointer,
  controlValue = 0,
) {
  const bounds = canvas.getBoundingClientRect()
  const width = Math.max(180, Math.round(bounds.width))
  const height = Math.max(220, Math.round(bounds.height))
  const purePixelMode =
    filter.mode === 'edge-pixels-threshold' ||
    filter.mode === 'edge-pixels-perceptual' ||
    filter.mode === 'edge-dots-perceptual' ||
    filter.mode === 'edge-pixels-kernel'
  // These two canvases deliberately render 1:1 and let CSS scale with
  // nearest-neighbour sampling. A fractional device-pixel transform would
  // reintroduce the soft edges this filter is explicitly meant to avoid.
  const dpr = purePixelMode ? 1 : Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)

  const context = canvas.getContext('2d')
  if (!context) return
  context.setTransform(dpr, 0, 0, dpr, 0, 0)
  context.fillStyle = filter.palette.paper
  context.fillRect(0, 0, width, height)

  const baseStep = Math.max(4, Math.round(width / 76))
  const samples = makeSamples(image, width, height, baseStep)
  const { density, red, green, blue, cols, rows, step } = samples
  const pointerX = pointer.x * width
  const pointerY = pointer.y * height
  const ink = filter.palette.ink
  const accent = filter.palette.accent ?? ink
  const accentTwo = filter.palette.accentTwo ?? accent

  const centerOf = (x: number, y: number) => ({
    px: x * step + step / 2,
    py: y * step + step / 2,
  })

  const drawDot = (
    px: number,
    py: number,
    size: number,
    color = ink,
    square = false,
  ) => {
    if (size <= 0.08) return
    context.fillStyle = color
    if (square) {
      context.fillRect(px - size, py - size, size * 2, size * 2)
    } else {
      context.beginPath()
      context.arc(px, py, size, 0, Math.PI * 2)
      context.fill()
    }
  }

  const drawOrdered = (matrix: number[][], matrixSize: number) => {
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const index = y * cols + x
        const value = density[index] ?? 0
        const threshold = ((matrix[y % matrixSize]?.[x % matrixSize] ?? 0) + 0.5) /
          (matrixSize * matrixSize)
        if (value > threshold) {
          const { px, py } = centerOf(x, y)
          drawDot(px, py, step * 0.43, ink, true)
        }
      }
    }
  }

  switch (filter.mode) {
    case 'pixel-grid': {
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const index = y * cols + x
          const value = density[index] ?? 0
          const threshold = ((BAYER_4[y % 4]?.[x % 4] ?? 0) + 0.5) / 16
          if (value > threshold * 0.92) {
            const { px, py } = centerOf(x, y)
            const color = value > 0.72 ? ink : accent
            drawDot(px, py, step * 0.34, color, true)
          }
        }
      }
      break
    }

    case 'dot-field': {
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const value = density[y * cols + x] ?? 0
          const { px, py } = centerOf(x, y)
          drawDot(px, py, Math.sqrt(value) * step * 0.54, ink)
        }
      }
      break
    }

    case 'cross-weave': {
      context.lineCap = 'square'
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const value = density[y * cols + x] ?? 0
          if (value < 0.08) continue
          const { px, py } = centerOf(x, y)
          const length = step * value * 0.9
          context.strokeStyle = value > 0.68 ? ink : accent
          context.lineWidth = Math.max(1, step * 0.18)
          context.beginPath()
          context.moveTo(px - length, py)
          context.lineTo(px + length, py)
          context.moveTo(px, py - length)
          context.lineTo(px, py + length)
          context.stroke()
        }
      }
      break
    }

    case 'bayer-four':
      drawOrdered(BAYER_4, 4)
      break

    case 'bayer-eight':
      drawOrdered(BAYER_8, 8)
      break

    case 'floyd':
    case 'atkinson': {
      const binary = diffuse(density, cols, rows, filter.mode)
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          if (!binary[y * cols + x]) continue
          const { px, py } = centerOf(x, y)
          drawDot(px, py, step * 0.39, ink, filter.mode === 'floyd')
        }
      }
      break
    }

    case 'line-screen': {
      context.strokeStyle = ink
      context.lineCap = 'round'
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const value = density[y * cols + x] ?? 0
          if (value < 0.04) continue
          const { px, py } = centerOf(x, y)
          context.lineWidth = Math.max(1, step * value * 0.35)
          context.beginPath()
          context.moveTo(px - step * value * 0.5, py)
          context.lineTo(px + step * value * 0.5, py)
          context.stroke()
        }
      }
      break
    }

    case 'cmyk': {
      context.globalCompositeOperation = 'multiply'
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const index = y * cols + x
          const value = density[index] ?? 0
          if (value < 0.04) continue
          const { px, py } = centerOf(x, y)
          const r = (red[index] ?? 0) / 255
          const g = (green[index] ?? 0) / 255
          const b = (blue[index] ?? 0) / 255
          drawDot(px - step * 0.2, py, step * 0.42 * Math.sqrt((g + b) / 2), accentTwo)
          drawDot(px + step * 0.2, py, step * 0.42 * Math.sqrt((r + b) / 2), accent)
          drawDot(px, py + step * 0.2, step * 0.34 * Math.sqrt((r + g) / 2), '#f2c834')
        }
      }
      context.globalCompositeOperation = 'source-over'
      break
    }

    case 'glyphs': {
      const marks = ['·', '·', ':', '+', '×', '#', '█']
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.font = `700 ${Math.max(6, step * 1.12)}px var(--font-mono), monospace`
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const value = density[y * cols + x] ?? 0
          if (value < 0.06) continue
          const mark = marks[Math.min(marks.length - 1, Math.floor(value * marks.length))]
          const { px, py } = centerOf(x, y)
          context.fillStyle = value > 0.66 ? ink : accent
          context.fillText(mark ?? '·', px, py)
        }
      }
      break
    }

    case 'live-threshold': {
      const threshold = 0.12 + pointer.x * 0.72
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const value = density[y * cols + x] ?? 0
          if (value < threshold) continue
          const { px, py } = centerOf(x, y)
          drawDot(px, py, step * 0.38, value > threshold + 0.22 ? ink : accent, true)
        }
      }
      break
    }

    case 'focus-density': {
      /*
       * Sample the source again at a much finer resolution. Distance from
       * the pointer determines the stride through that fine grid: at the
       * cursor every sample is drawn; farther away only every second,
       * third, or fourth sample survives and each surviving mark grows.
       * The result is real added image information, not a magnified crop.
       */
      const fineStep = Math.max(2.25, width / 148)
      const fine = makeSamples(image, width, height, fineStep)
      const detailRadius = width * 0.48

      for (let y = 0; y < fine.rows; y += 1) {
        for (let x = 0; x < fine.cols; x += 1) {
          const value = fine.density[y * fine.cols + x] ?? 0
          if (value < 0.045) continue

          const px = x * fine.step + fine.step / 2
          const py = y * fine.step + fine.step / 2
          const distance = Math.hypot(px - pointerX, py - pointerY)
          const proximity = Math.max(0, 1 - distance / detailRadius)
          const stride = Math.max(1, Math.ceil((1 - proximity) * 4))

          if (x % stride !== 0 || y % stride !== 0) continue

          const markSize = fine.step * stride * 0.34 * Math.sqrt(value)
          const color = proximity > 0.72 ? accent : ink
          drawDot(px, py, markSize, color, proximity < 0.34)
        }
      }

      context.strokeStyle = ink
      context.globalAlpha = 0.22
      context.lineWidth = 1
      context.beginPath()
      context.arc(pointerX, pointerY, detailRadius * 0.28, 0, Math.PI * 2)
      context.stroke()
      context.globalAlpha = 1
      break
    }

    case 'repel':
    case 'magnetic': {
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const value = density[y * cols + x] ?? 0
          if (value < 0.08) continue
          const { px, py } = centerOf(x, y)
          const vx = px - pointerX
          const vy = py - pointerY
          const distance = Math.max(10, Math.hypot(vx, vy))
          const influence = Math.max(0, 1 - distance / (width * 0.32))
          const direction = filter.mode === 'repel' ? 1 : -1
          const shift = influence * step * 4 * direction
          const movedX = px + (vx / distance) * shift
          const movedY = py + (vy / distance) * shift
          drawDot(
            movedX,
            movedY,
            step * 0.42 * Math.sqrt(value),
            influence > 0.35 ? accent : ink,
            filter.mode === 'magnetic',
          )
        }
      }
      break
    }

    case 'split-process': {
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const value = density[y * cols + x] ?? 0
          const { px, py } = centerOf(x, y)
          if (px < pointerX) {
            const threshold = ((BAYER_4[y % 4]?.[x % 4] ?? 0) + 0.5) / 16
            if (value > threshold) drawDot(px, py, step * 0.4, ink, true)
          } else {
            drawDot(px, py, step * 0.5 * Math.sqrt(value), accent)
          }
        }
      }
      context.fillStyle = ink
      context.fillRect(pointerX - 0.5, 0, 1, height)
      break
    }

    case 'wave-field': {
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const value = density[y * cols + x] ?? 0
          if (value < 0.06) continue
          const { px, py } = centerOf(x, y)
          const wave = Math.sin(y * 0.55 + pointer.x * Math.PI * 4) * pointer.y * step * 2.5
          drawDot(px + wave, py, step * 0.4 * Math.sqrt(value), value > 0.64 ? ink : accent)
        }
      }
      break
    }

    case 'spectral-lens': {
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const index = y * cols + x
          const value = density[index] ?? 0
          const { px, py } = centerOf(x, y)
          const inside = Math.hypot(px - pointerX, py - pointerY) < width * 0.23
          if (!inside) {
            drawDot(px, py, step * 0.48 * Math.sqrt(value), ink)
            continue
          }
          const r = (red[index] ?? 0) / 255
          const b = (blue[index] ?? 0) / 255
          drawDot(px - step * 0.18, py, step * 0.42 * Math.sqrt(r), accent)
          drawDot(px + step * 0.18, py, step * 0.42 * Math.sqrt(b), accentTwo)
        }
      }
      context.strokeStyle = ink
      context.lineWidth = 1
      context.beginPath()
      context.arc(pointerX, pointerY, width * 0.23, 0, Math.PI * 2)
      context.stroke()
      break
    }

    case 'rgb-drift': {
      context.globalCompositeOperation = 'multiply'
      const offsetX = (pointer.x - 0.5) * step * 4
      const offsetY = (pointer.y - 0.5) * step * 3
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const index = y * cols + x
          const value = density[index] ?? 0
          if (value < 0.06) continue
          const { px, py } = centerOf(x, y)
          drawDot(px + offsetX, py + offsetY, step * 0.43 * Math.sqrt(value), accent)
          drawDot(px - offsetX, py - offsetY, step * 0.43 * Math.sqrt(value), accentTwo)
        }
      }
      context.globalCompositeOperation = 'source-over'
      break
    }

    case 'time-scan': {
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const value = density[y * cols + x] ?? 0
          const { px, py } = centerOf(x, y)
          const inBand = Math.abs(py - pointerY) < height * 0.1
          if (!inBand && (x + y) % 3 !== 0) continue
          drawDot(
            px,
            py,
            step * Math.sqrt(value) * (inBand ? 0.3 : 0.62),
            inBand ? accent : ink,
            !inBand,
          )
        }
      }
      break
    }

    case 'erosion': {
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const value = density[y * cols + x] ?? 0
          const { px, py } = centerOf(x, y)
          const distance = Math.hypot(px - pointerX, py - pointerY)
          const radius = width * (0.08 + pointer.x * 0.28)
          const edgeNoise = pseudoRandom(x, y, 20) * step * 8
          if (distance > radius + edgeNoise || value < 0.06) continue
          const color = distance < radius * 0.68 ? ink : accent
          drawDot(px, py, step * 0.4 * Math.sqrt(value), color, true)
        }
      }
      break
    }

    case 'riso-print': {
      /*
       * Two independently screened spot-color plates. The blue plate holds
       * the dense structure; fluorescent red carries midtones. Their row-
       * dependent offsets and tiny deterministic wobble emulate mechanical
       * registration drift without making the source unreadable.
       */
      context.globalCompositeOperation = 'multiply'

      for (let y = 0; y < rows; y += 1) {
        const rowDrift = Math.sin(y * 0.21) * step * 0.28

        for (let x = 0; x < cols; x += 1) {
          const index = y * cols + x
          const value = density[index] ?? 0
          if (value < 0.035) continue

          const { px, py } = centerOf(x, y)
          const wobbleX = (pseudoRandom(x, y, 21) - 0.5) * step * 0.36
          const wobbleY = (pseudoRandom(x, y, 22) - 0.5) * step * 0.24
          const blueThreshold = ((BAYER_8[y % 8]?.[x % 8] ?? 0) + 0.5) / 64
          const redThreshold =
            ((BAYER_8[(y + 3) % 8]?.[(x + 5) % 8] ?? 0) + 0.5) / 64

          if (value * 1.08 > blueThreshold) {
            drawDot(
              px - step * 0.25 + rowDrift + wobbleX,
              py + wobbleY,
              step * 0.39,
              accentTwo,
            )
          }

          const redAmount = Math.max(0, Math.min(1, value * 1.32 - 0.08))
          if (redAmount > redThreshold) {
            drawDot(
              px + step * 0.32 - rowDrift + wobbleX,
              py - step * 0.12 + wobbleY,
              step * 0.34,
              accent,
              (x + y) % 3 === 0,
            )
          }
        }
      }

      context.globalCompositeOperation = 'source-over'
      context.globalAlpha = 0.16
      context.fillStyle = ink

      for (let y = 0; y < height; y += 7) {
        for (let x = 0; x < width; x += 7) {
          if (pseudoRandom(x, y, 23) > 0.82) {
            context.fillRect(
              x + pseudoRandom(x, y, 24) * 3,
              y + pseudoRandom(x, y, 25) * 3,
              0.7,
              0.7,
            )
          }
        }
      }

      context.globalAlpha = 1
      break
    }

    case 'edge-pixels-perceptual':
    case 'edge-dots-perceptual': {
      const analysis = getPerceptualAnalysis(image, width, height)
      const {
        fine,
        information,
        labLightness,
        labA,
        labB,
        sortedInformation,
        dominantColor,
      } = analysis
      const dotMode = filter.mode === 'edge-dots-perceptual'
      const retention = Math.max(0.01, Math.min(1, controlValue / 100))
      const forceFullResolution = controlValue >= 100
      const quantile = 0.985 - Math.pow(retention, 1.65) * 0.94
      const thresholdIndex = Math.max(
        0,
        Math.min(
          sortedInformation.length - 1,
          Math.floor(quantile * Math.max(0, sortedInformation.length - 1)),
        ),
      )
      const globalThreshold = sortedInformation[thresholdIndex] ?? 0.08

      if (dotMode) {
        context.fillStyle = `rgb(${Math.round(
          dominantColor.red,
        )} ${Math.round(dominantColor.green)} ${Math.round(
          dominantColor.blue,
        )})`
        context.fillRect(0, 0, width, height)
      }

      type PerceptualLeaf = {
        x: number
        y: number
        size: number
        red: number
        green: number
        blue: number
        brightness: number
        score: number
      }

      const evaluateLeaf = (x: number, y: number, size: number) => {
        const right = Math.min(fine.cols, x + size)
        const bottom = Math.min(fine.rows, y + size)
        const scores: number[] = []
        let lightnessSum = 0
        let aSum = 0
        let bSum = 0
        let sampleCount = 0

        for (let sampleY = y; sampleY < bottom; sampleY += 1) {
          for (let sampleX = x; sampleX < right; sampleX += 1) {
            const index = sampleY * fine.cols + sampleX
            scores.push(information[index] ?? 0)
            lightnessSum += labLightness[index] ?? 0
            aSum += labA[index] ?? 0
            bSum += labB[index] ?? 0
            sampleCount += 1
          }
        }

        scores.sort((a, b) => a - b)
        const highPercentile =
          scores[Math.floor(Math.max(0, scores.length - 1) * 0.9)] ?? 0
        const averageLightness = lightnessSum / Math.max(1, sampleCount)
        const averageA = aSum / Math.max(1, sampleCount)
        const averageB = bSum / Math.max(1, sampleCount)
        let perceptualVariance = 0
        let redSum = 0
        let greenSum = 0
        let blueSum = 0
        let colorWeight = 0

        for (let sampleY = y; sampleY < bottom; sampleY += 1) {
          for (let sampleX = x; sampleX < right; sampleX += 1) {
            const index = sampleY * fine.cols + sampleX
            const deltaLightness =
              (labLightness[index] ?? 0) - averageLightness
            const deltaA = (labA[index] ?? 0) - averageA
            const deltaB = (labB[index] ?? 0) - averageB
            perceptualVariance +=
              deltaLightness * deltaLightness +
              deltaA * deltaA +
              deltaB * deltaB

            // Information and source brightness bias the representative
            // color toward the structure rather than averaging an edge
            // into its black neighbor.
            const weight =
              0.08 +
              (fine.density[index] ?? 0) * 0.72 +
              (information[index] ?? 0) * 1.6
            redSum += ((fine.red[index] ?? 0) / 255) * weight
            greenSum += ((fine.green[index] ?? 0) / 255) * weight
            blueSum += ((fine.blue[index] ?? 0) / 255) * weight
            colorWeight += weight
          }
        }

        const variance = Math.sqrt(
          perceptualVariance / Math.max(1, sampleCount),
        )
        const score = highPercentile * 0.78 + Math.min(1, variance * 2.2) * 0.22
        const red = redSum / Math.max(0.0001, colorWeight)
        const green = greenSum / Math.max(0.0001, colorWeight)
        const blue = blueSum / Math.max(0.0001, colorWeight)

        return {
          x,
          y,
          size,
          red,
          green,
          blue,
          brightness: Math.max(red, green, blue),
          score,
        } satisfies PerceptualLeaf
      }

      let leaves: PerceptualLeaf[] = []
      const subdivide = (x: number, y: number, size: number) => {
        if (x >= fine.cols || y >= fine.rows) return
        const leaf = evaluateLeaf(x, y, size)
        const scaleMultiplier =
          size >= 32
            ? 0.46
            : size >= 16
              ? 0.62
              : size >= 8
                ? 0.82
                : size >= 4
                  ? 1.04
                  : size >= 2
                    ? 1.34
                    : Number.POSITIVE_INFINITY
        const shouldSplit =
          size > 1 &&
          (forceFullResolution ||
            // Even a flat black region remains visibly pixelated instead of
            // disappearing into one apparently empty root tile.
            size > 16 ||
            (leaf.brightness > 0.006 &&
              leaf.score > globalThreshold * scaleMultiplier))

        if (!shouldSplit) {
          leaves.push(leaf)
          return
        }

        const half = size / 2
        subdivide(x, y, half)
        subdivide(x + half, y, half)
        subdivide(x, y + half, half)
        subdivide(x + half, y + half, half)
      }

      const rootSize = 32
      for (let y = 0; y < fine.rows; y += rootSize) {
        for (let x = 0; x < fine.cols; x += rootSize) {
          subdivide(x, y, rootSize)
        }
      }

      // Balance the tree so touching cells differ by at most one level.
      for (let pass = 0; pass < 6; pass += 1) {
        const occupancy = new Uint16Array(fine.cols * fine.rows)
        for (const leaf of leaves) {
          const right = Math.min(fine.cols, leaf.x + leaf.size)
          const bottom = Math.min(fine.rows, leaf.y + leaf.size)
          for (let y = leaf.y; y < bottom; y += 1) {
            for (let x = leaf.x; x < right; x += 1) {
              occupancy[y * fine.cols + x] = leaf.size
            }
          }
        }

        const needsSplit = new Set<PerceptualLeaf>()
        const neighborSize = (x: number, y: number) =>
          x < 0 || y < 0 || x >= fine.cols || y >= fine.rows
            ? 0
            : (occupancy[y * fine.cols + x] ?? 0)

        for (const leaf of leaves) {
          if (leaf.size <= 1) continue
          const right = Math.min(fine.cols, leaf.x + leaf.size)
          const bottom = Math.min(fine.rows, leaf.y + leaf.size)

          for (let x = leaf.x; x < right; x += 1) {
            const topNeighbor = neighborSize(x, leaf.y - 1)
            const bottomNeighbor = neighborSize(x, bottom)
            if (
              (topNeighbor > 0 && leaf.size > topNeighbor * 2) ||
              (bottomNeighbor > 0 && leaf.size > bottomNeighbor * 2)
            ) {
              needsSplit.add(leaf)
              break
            }
          }

          for (let y = leaf.y; y < bottom && !needsSplit.has(leaf); y += 1) {
            const leftNeighbor = neighborSize(leaf.x - 1, y)
            const rightNeighbor = neighborSize(right, y)
            if (
              (leftNeighbor > 0 && leaf.size > leftNeighbor * 2) ||
              (rightNeighbor > 0 && leaf.size > rightNeighbor * 2)
            ) {
              needsSplit.add(leaf)
            }
          }
        }

        if (needsSplit.size === 0) break
        const balanced: PerceptualLeaf[] = []
        for (const leaf of leaves) {
          if (!needsSplit.has(leaf)) {
            balanced.push(leaf)
            continue
          }
          const half = leaf.size / 2
          for (const [offsetX, offsetY] of [
            [0, 0],
            [half, 0],
            [0, half],
            [half, half],
          ]) {
            if (leaf.x + offsetX < fine.cols && leaf.y + offsetY < fine.rows) {
              balanced.push(
                evaluateLeaf(leaf.x + offsetX, leaf.y + offsetY, half),
              )
            }
          }
        }
        leaves = balanced
      }

      context.globalCompositeOperation = 'source-over'
      context.globalAlpha = 1
      context.imageSmoothingEnabled = false
      for (const leaf of leaves) {
        const x = Math.round(leaf.x * fine.step)
        const y = Math.round(leaf.y * fine.step)
        const right = Math.round(
          Math.min(fine.cols, leaf.x + leaf.size) * fine.step,
        )
        const bottom = Math.round(
          Math.min(fine.rows, leaf.y + leaf.size) * fine.step,
        )
        context.fillStyle = `rgb(${Math.round(leaf.red * 255)} ${Math.round(
          leaf.green * 255,
        )} ${Math.round(leaf.blue * 255)})`
        if (dotMode) {
          const dotWidth = Math.max(1, right - x)
          const dotHeight = Math.max(1, bottom - y)
          const radius = Math.max(0.42, Math.min(dotWidth, dotHeight) * 0.45)
          context.beginPath()
          context.arc(
            x + dotWidth / 2,
            y + dotHeight / 2,
            radius,
            0,
            Math.PI * 2,
          )
          context.fill()
        } else {
          context.fillRect(
            x,
            y,
            Math.max(1, right - x),
            Math.max(1, bottom - y),
          )
        }
      }

      if (!dotMode) {
        // Unique boundaries: top and left belong to each leaf; only exterior
        // leaves add right and bottom. Shared edges and T-junctions draw once.
        context.strokeStyle = 'rgba(255, 255, 255, 0.92)'
        // Each boundary is drawn exactly once, keeping the grid at a very fine
        // hairline without doubled shared edges.
        context.lineWidth = 0.1
        context.beginPath()
        for (const leaf of leaves) {
          const x = Math.round(leaf.x * fine.step) + 0.05
          const y = Math.round(leaf.y * fine.step) + 0.05
          const right =
            Math.round(Math.min(fine.cols, leaf.x + leaf.size) * fine.step) -
            0.05
          const bottom =
            Math.round(Math.min(fine.rows, leaf.y + leaf.size) * fine.step) -
            0.05
          context.moveTo(x, y)
          context.lineTo(right, y)
          context.moveTo(x, y)
          context.lineTo(x, bottom)
          if (leaf.x + leaf.size >= fine.cols) {
            context.moveTo(right, y)
            context.lineTo(right, bottom)
          }
          if (leaf.y + leaf.size >= fine.rows) {
            context.moveTo(x, bottom)
            context.lineTo(right, bottom)
          }
        }
        context.stroke()
      }
      break
    }

    case 'edge-pixels-threshold':
    case 'edge-pixels-kernel': {
      /*
       * Pure quadtree pixels. Every leaf is an opaque, integer-aligned
       * average of its source region. No alpha, offsets, grain, or antialias.
       */
      // Two device pixels is the minimum leaf: one for image color and one
      // available to the border pass without erasing the pixel entirely.
      const fineStep = Math.max(2, Math.round(width / 240))
      const fine = makeSamples(image, width, height, fineStep)
      const sampleCount = fine.cols * fine.rows
      const normalizedRed = new Float32Array(sampleCount)
      const normalizedGreen = new Float32Array(sampleCount)
      const normalizedBlue = new Float32Array(sampleCount)
      const luminance = new Float32Array(sampleCount)
      const localChange = new Float32Array(sampleCount)

      const detectorRadius =
        filter.mode === 'edge-pixels-kernel'
          ? Math.max(1, Math.round(controlValue))
          : 1

      for (let y = 0; y < fine.rows; y += 1) {
        for (let x = 0; x < fine.cols; x += 1) {
          const index = y * fine.cols + x
          const r = (fine.red[index] ?? 0) / 255
          const g = (fine.green[index] ?? 0) / 255
          const b = (fine.blue[index] ?? 0) / 255
          normalizedRed[index] = r
          normalizedGreen[index] = g
          normalizedBlue[index] = b
          luminance[index] = r * 0.2126 + g * 0.7152 + b * 0.0722
        }
      }

      const valueAt = (values: Float32Array, x: number, y: number) => {
        const clampedX = Math.max(0, Math.min(fine.cols - 1, x))
        const clampedY = Math.max(0, Math.min(fine.rows - 1, y))
        return values[clampedY * fine.cols + clampedX] ?? 0
      }

      for (let y = 0; y < fine.rows; y += 1) {
        for (let x = 0; x < fine.cols; x += 1) {
          const index = y * fine.cols + x
          const centerR = valueAt(normalizedRed, x, y)
          const centerG = valueAt(normalizedGreen, x, y)
          const centerB = valueAt(normalizedBlue, x, y)
          const colorChange =
            Math.abs(centerR - valueAt(normalizedRed, x + detectorRadius, y)) +
            Math.abs(centerG - valueAt(normalizedGreen, x + detectorRadius, y)) +
            Math.abs(centerB - valueAt(normalizedBlue, x + detectorRadius, y)) +
            Math.abs(centerR - valueAt(normalizedRed, x, y + detectorRadius)) +
            Math.abs(centerG - valueAt(normalizedGreen, x, y + detectorRadius)) +
            Math.abs(centerB - valueAt(normalizedBlue, x, y + detectorRadius))
          const horizontal =
            valueAt(luminance, x + detectorRadius, y) -
            valueAt(luminance, x - detectorRadius, y)
          const vertical =
            valueAt(luminance, x, y + detectorRadius) -
            valueAt(luminance, x, y - detectorRadius)
          localChange[index] = Math.min(
            1,
            colorChange * 0.38 + Math.hypot(horizontal, vertical) * 0.72,
          )
        }
      }

      const integralWidth = fine.cols + 1
      const makeIntegral = (values: Float32Array, square = false) => {
        const integral = new Float64Array((fine.cols + 1) * (fine.rows + 1))

        for (let y = 0; y < fine.rows; y += 1) {
          let rowSum = 0
          for (let x = 0; x < fine.cols; x += 1) {
            const source = values[y * fine.cols + x] ?? 0
            rowSum += square ? source * source : source
            const target = (y + 1) * integralWidth + x + 1
            integral[target] = (integral[y * integralWidth + x + 1] ?? 0) + rowSum
          }
        }

        return integral
      }

      const redIntegral = makeIntegral(normalizedRed)
      const greenIntegral = makeIntegral(normalizedGreen)
      const blueIntegral = makeIntegral(normalizedBlue)
      const lumaIntegral = makeIntegral(luminance)
      const lumaSquaredIntegral = makeIntegral(luminance, true)
      const changeIntegral = makeIntegral(localChange)

      const average = (
        integral: Float64Array,
        x: number,
        y: number,
        size: number,
      ) => {
        const right = Math.min(fine.cols, x + size)
        const bottom = Math.min(fine.rows, y + size)
        const area = Math.max(1, (right - x) * (bottom - y))
        const sum =
          (integral[bottom * integralWidth + right] ?? 0) -
          (integral[y * integralWidth + right] ?? 0) -
          (integral[bottom * integralWidth + x] ?? 0) +
          (integral[y * integralWidth + x] ?? 0)
        return sum / area
      }

      type PixelLeaf = {
        x: number
        y: number
        size: number
        red: number
        green: number
        blue: number
      }

      const leaves: PixelLeaf[] = []

      const subdivide = (x: number, y: number, size: number) => {
        if (x >= fine.cols || y >= fine.rows) return

        const redAverage = average(redIntegral, x, y, size)
        const greenAverage = average(greenIntegral, x, y, size)
        const blueAverage = average(blueIntegral, x, y, size)
        const lumaAverage = average(lumaIntegral, x, y, size)
        const lumaSquaredAverage = average(lumaSquaredIntegral, x, y, size)
        const variance = Math.max(
          0,
          lumaSquaredAverage - lumaAverage * lumaAverage,
        )
        const edgeChange = average(changeIntegral, x, y, size)
        const information = Math.sqrt(variance) * 1.7 + edgeChange * 1.35
        const brightness = Math.max(redAverage, greenAverage, blueAverage)
        const userThreshold =
          filter.mode === 'edge-pixels-threshold'
            ? Math.max(0.01, controlValue / 100)
            : 0.065
        const scaleMultiplier =
          size >= 32
            ? 0.34
            : size >= 16
              ? 0.56
              : size >= 8
                ? 0.82
                : size >= 4
                  ? 1.18
                  : size >= 2
                    ? 1.72
                    : Number.POSITIVE_INFINITY
        const splitThreshold = userThreshold * scaleMultiplier
        const shouldSplit =
          size > 1 &&
          brightness > 0.012 &&
          (information > splitThreshold ||
            (size >= 32 && brightness > userThreshold * 0.4))

        if (shouldSplit) {
          const half = Math.max(1, Math.floor(size / 2))
          subdivide(x, y, half)
          subdivide(x + half, y, size - half)
          subdivide(x, y + half, size - half)
          subdivide(x + half, y + half, size - half)
          return
        }

        if (brightness > 0.018) {
          leaves.push({
            x,
            y,
            size,
            red: redAverage,
            green: greenAverage,
            blue: blueAverage,
          })
        }
      }

      const rootSize = 32
      for (let y = 0; y < fine.rows; y += rootSize) {
        for (let x = 0; x < fine.cols; x += rootSize) {
          subdivide(x, y, rootSize)
        }
      }

      context.globalCompositeOperation = 'source-over'
      context.globalAlpha = 1
      context.imageSmoothingEnabled = false

      for (const leaf of leaves) {
        const x = Math.round(leaf.x * fine.step)
        const y = Math.round(leaf.y * fine.step)
        const right = Math.round(
          Math.min(fine.cols, leaf.x + leaf.size) * fine.step,
        )
        const bottom = Math.round(
          Math.min(fine.rows, leaf.y + leaf.size) * fine.step,
        )
        context.fillStyle = `rgb(${Math.round(leaf.red * 255)} ${Math.round(
          leaf.green * 255,
        )} ${Math.round(leaf.blue * 255)})`
        context.fillRect(x, y, Math.max(1, right - x), Math.max(1, bottom - y))
      }

      // Draw borders after every fill so no later pixel can cover a shared
      // edge. This intentionally stays at a tenth of a device pixel: enough
      // to disclose the quadtree without turning it into a white grid.
      context.strokeStyle = 'rgba(255, 255, 255, 0.9)'
      context.lineWidth = 0.1
      for (const leaf of leaves) {
        const x = Math.round(leaf.x * fine.step)
        const y = Math.round(leaf.y * fine.step)
        const right = Math.round(
          Math.min(fine.cols, leaf.x + leaf.size) * fine.step,
        )
        const bottom = Math.round(
          Math.min(fine.rows, leaf.y + leaf.size) * fine.step,
        )
        const pixelWidth = Math.max(1, right - x)
        const pixelHeight = Math.max(1, bottom - y)
        context.strokeRect(
          x + 0.05,
          y + 0.05,
          Math.max(0, pixelWidth - 0.1),
          Math.max(0, pixelHeight - 0.1),
        )
      }

      break
    }
  }
}

function RasterArtwork({ filter }: { filter: FilterSpec }) {
  const initialControl =
    filter.control === 'threshold'
      ? 6
      : filter.control === 'perceptual'
        ? 55
        : filter.control === 'kernel'
          ? 3
          : 0
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const pointerRef = useRef<Pointer>({ x: 0.5, y: 0.52, active: false })
  const controlRef = useRef(initialControl)
  const scheduleRef = useRef<() => void>(() => undefined)
  const [controlValue, setControlValue] = useState(initialControl)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let frame = 0
    let disposed = false
    const image = new Image()
    image.src = '/cell-micrograph.png'

    const draw = () => {
      if (disposed || !canvas || !imageRef.current) return
      renderArtwork(
        canvas,
        imageRef.current,
        filter,
        pointerRef.current,
        controlRef.current,
      )
    }

    const schedule = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(draw)
    }

    scheduleRef.current = schedule
    image.onload = () => {
      imageRef.current = image
      schedule()
    }

    const observer = new ResizeObserver(schedule)
    observer.observe(canvas)

    return () => {
      disposed = true
      observer.disconnect()
      window.cancelAnimationFrame(frame)
    }
  }, [filter])

  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!filter.interactive || filter.control) return
    const bounds = event.currentTarget.getBoundingClientRect()
    pointerRef.current = {
      x: Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)),
      y: Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)),
      active: true,
    }
    scheduleRef.current()
  }

  const focus = (_event: FocusEvent<HTMLDivElement>) => {
    if (!filter.interactive || filter.control) return
    pointerRef.current = { x: 0.5, y: 0.52, active: true }
    scheduleRef.current()
  }

  const leave = () => {
    if (!filter.interactive || filter.control) return
    pointerRef.current = { x: 0.5, y: 0.52, active: false }
    scheduleRef.current()
  }

  return (
    <div
      className={
        filter.control
          ? `${styles.art} ${styles.controlArt}`
          : filter.interactive
            ? `${styles.art} ${styles.liveArt}`
            : styles.art
      }
      onPointerMove={move}
      onPointerLeave={leave}
      onFocus={focus}
      onBlur={leave}
      tabIndex={filter.interactive && !filter.control ? 0 : undefined}
      style={
        {
          '--paper': filter.palette.paper,
          '--ink': filter.palette.ink,
        } as CSSProperties
      }
    >
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        role="img"
        aria-label={`${filter.name}: ${filter.process}${
          filter.control
            ? '. Use the slider below to change the filter.'
            : filter.interactive
              ? '. Move the pointer across the artwork to change it.'
              : ''
        }`}
      />
      {filter.control ? (
        <label className={styles.control}>
          <span>
            {filter.control === 'threshold'
              ? 'Edge threshold'
              : filter.control === 'perceptual'
                ? 'Detail retention'
                : 'Detector size'}
          </span>
          <input
            type="range"
            min={filter.control === 'threshold' ? 0.25 : 1}
            max={
              filter.control === 'threshold'
                ? 60
                : filter.control === 'perceptual'
                  ? 100
                  : 32
            }
            step={filter.control === 'threshold' ? 0.25 : 1}
            value={controlValue}
            onChange={(event) => {
              const next = Number(event.currentTarget.value)
              controlRef.current = next
              setControlValue(next)
              scheduleRef.current()
            }}
          />
          <output>
            {filter.control === 'threshold'
              ? `${controlValue}%`
              : filter.control === 'perceptual'
                ? `${controlValue}%`
                : `${controlValue * 2 + 1} × ${controlValue * 2 + 1}`}
          </output>
        </label>
      ) : filter.interactive ? (
        <span className={styles.moveLabel} aria-hidden="true">
          Move
        </span>
      ) : null}
    </div>
  )
}

export function ImageFilterGallery() {
  return (
    <main id="k-main" tabIndex={-1} className={`k-main ${styles.main}`}>
      <header className={styles.hero}>
        <p className={styles.issue}>Raster studies · Issue 01</p>
        <h1>
          Micro
          <span>graphics</span>
        </h1>
        <div className={styles.heroFoot}>
          <p>
            Twenty-five image systems drawn from one cell, one sample at a time.
          </p>
          <p>11 fixed / 14 responsive</p>
        </div>
      </header>

      <section className={styles.gallery} aria-label="Micrographic cell studies">
        {FILTERS.map((filter) => (
          <article className={styles.card} key={filter.number}>
            <RasterArtwork filter={filter} />
            <footer className={styles.caption}>
              <span>{filter.number}</span>
              <div>
                <h2>{filter.name}</h2>
                <p>{filter.process}</p>
              </div>
              {filter.interactive ? <i>Live</i> : null}
            </footer>
          </article>
        ))}
      </section>

      <footer className={styles.colophon}>
        <span>Cellular raster laboratory</span>
        <span>25 studies / 01 source</span>
      </footer>
    </main>
  )
}
