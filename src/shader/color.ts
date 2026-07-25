const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

const toRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '')
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h.padEnd(6, '0').slice(0, 6)
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const toHex = (r: number, g: number, b: number) =>
  '#' +
  [r, g, b]
    .map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0'))
    .join('')

/**
 * Rotate a hex colour's hue by `deg`.
 *
 * Used to derive a family of per-card gradients from one palette, so a grid
 * reads as variations on a theme rather than five unrelated colour choices.
 */
export function shiftHue(hex: string, deg: number): string {
  const [r, g, b] = toRgb(hex).map((v) => v / 255) as [number, number, number]
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min

  if (d === 0) return hex

  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h =
    max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  h = (((h / 6) * 360 + deg) % 360) / 360
  if (h < 0) h += 1

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const channel = (t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }

  return toHex(channel(h + 1 / 3) * 255, channel(h) * 255, channel(h - 1 / 3) * 255)
}
