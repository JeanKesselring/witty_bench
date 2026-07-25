# ShaderGradient for web design

Six demos of [`@shadergradient/react`](https://github.com/ruucm/shadergradient) used as a real
web-design material, in light and dark themes, plus a live control panel that retunes every surface
at once and exports the result as JSX.

```bash
npm install
npm run dev
```

## The demos

| # | Pattern | What it shows |
|---|---------|---------------|
| 1 | **Full-bleed hero** ([HeroDemo.tsx](src/demos/HeroDemo.tsx)) | The gradient replacing a hero image. Camera re-framed per breakpoint, layered scrim for text contrast, `clamp()` type. |
| 2 | **Gradient as a component** ([CardsDemo.tsx](src/demos/CardsDemo.tsx)) | A pricing grid where each card owns a clipped sphere derived from one shared palette. Lazy mounting, a per-breakpoint GPU budget, hover-driven speed. |
| 3 | **Scroll-reactive editorial** ([EditorialDemo.tsx](src/demos/EditorialDemo.tsx)) | A pinned gradient whose *camera* tracks scroll progress while the shader clock runs at its own rate. |
| 4 | **Masked window layers** ([WindowDemo.tsx](src/demos/WindowDemo.tsx)) | Two fully opaque, phase-locked renders of the same wave; the front one is brighter and higher-amplitude, masked to two squares. |
| 5 | **Frosted grid** ([FrostGridDemo.tsx](src/demos/FrostGridDemo.tsx)) | A 5vw × 5vh grid of click-toggleable frosted tiles over one gradient, with a lit rim that samples its colour from the backdrop. |
| 6 | **Frost trail** ([FrostTrailDemo.tsx](src/demos/FrostTrailDemo.tsx)) | 40px cells the pointer wipes clear; each re-frosts over 2.6s, so the trail fades from clear to blurred. |

They all read from one shared config ([GradientStore.tsx](src/shader/GradientStore.tsx)), so the
control panel is a design tool for the whole page rather than a per-demo toy.

## Themes

Light and dark, following `prefers-color-scheme` with a toggle in the topbar (double-click it to go
back to following the OS). Light is a **separate gradient palette**, not a lightened dark one — the
deep stops that give a dark page its depth turn to mud on white, and `color3` is doing height-shading
work in the shader, so it has to stay close in value to the other two.

## Controls

The **Controls** button (bottom right) opens a docked rail on desktop and a bottom sheet on mobile.

- **Preset** — five starting points derived from ShaderGradient's own shipped presets.
- **Motion** — a global animate switch plus `uSpeed` / `uStrength` / `uDensity` / `uFrequency`.
- **Palette** — the three colour stops. Demo 2 hue-shifts these into a per-card family.
- **Area & framing** — camera distance, zoom, polar/azimuth angle, offset and rotation. This is the
  group that decides how much of the mesh fills the element, and it is what actually needs tuning
  when one gradient has to work at 390px and at 2560px.
- **Surface** — mesh type, lighting, brightness, reflection, grain, wireframe.
- **Copy JSX** — writes the current config to the clipboard as a paste-ready snippet.

## Things worth stealing

Most of the value is in [`GradientSurface`](src/shader/GradientSurface.tsx), a wrapper that fixes the
five ways a raw `<ShaderGradientCanvas>` misbehaves inside a real layout:

1. **It drags ~1.1MB of three.js into the initial bundle.** The canvas lives behind a `React.lazy`
   boundary, so it becomes its own chunk fetched after first paint. Here that is the difference
   between a 1.33MB and a 212KB entry bundle.
2. **It renders at full `devicePixelRatio`.** `useRenderScale` caps at 1× on phones and 1.25× on
   tablets — a gradient has no fine detail to alias, so the extra pixels are pure heat.
3. **Camera framing tuned in landscape gets cropped to mush in portrait.** `compact` / `phone` /
   `portrait` props layer framing overrides on top of the shared config. This is the responsive
   problem CSS cannot solve for you.
4. **It animates straight through `prefers-reduced-motion: reduce`.** The surface pins `animate="off"`
   instead, which leaves a still frame rather than a blank box.
5. **It paints nothing before WebGL is up, and nothing at all without WebGL.** A CSS gradient
   underlay derived from the same palette covers both, and doubles as the Suspense fallback.

Two more, found the hard way:

- **Spheres need a short `cDistance` and a very high `cameraZoom` (12–17), not zoom 1.** Plane
  framing does not transfer; leave `cameraZoom` at 1 and you get a small blob in a big box. See
  `SPHERE_FRAMING` in [presets.ts](src/shader/presets.ts).
- **Two canvases cannot be phase-locked with `animate="on"`.** Each material builds its own
  `THREE.Clock` and starts it in an effect, so two layers sit permanently out of phase. Demo 4 sets
  `animate="off"` and writes `material.userData.uTime.value` from one shared clock
  ([sharedClock.ts](src/shader/sharedClock.ts)). Note `userData`, not the `material.uTime` alias —
  that alias reads `material.uniforms`, which does not exist on a MeshPhysicalMaterial and throws.
- **Raising `uStrength` changes colour, not just relief.** The base colour is
  `mix(..., color3, vPos.z)` with `vPos.z` the raw unclamped wave height, so past ~1.5× the mix
  extrapolates out of range: crests invert to black, troughs blow out to white.
- **`backdrop-filter` costs per element, not per pixel of blur.** ~130 individually frosted cells
  measured 8ms/frame slower than one blurred element masked by an SVG — and blur radius made no
  measurable difference at all, from `blur(0)` to `blur(64px)`.
- **Mask alpha doubles as a frost amount.** Demo 6 needs each cell *partly* frosted, which would
  otherwise mean a different blur per cell. Because the frost is one blurred layer revealed by a
  mask, a fractional mask alpha gives a fractional frost for free — 828 cells, rebuilt every frame,
  still holds 60fps. The decay writes `style.maskImage` straight to the DOM; routing per-frame
  values through React state would re-render the tree 120 times a second.
- **A reflective edge has to sample the backdrop, not name a colour.** A painted bevel is inert — it
  cannot respond to what is behind it, so it sits still while the gradient moves. Demo 5's rim is its
  own `backdrop-filter` layer applying only a *gain*, so it comes out hot over a bright crest and dim
  over a dark trough, and shifts as the wave travels. Direction survives in the mask's alpha.
- **A repeating CSS gradient cannot outline a shape.** It draws every cell boundary and knows nothing
  about neighbours, so touching tiles showed seams. The rim is generated per pattern from a
  neighbour test instead, with `vector-effect="non-scaling-stroke"` to survive
  `preserveAspectRatio="none"` — 5vw and 5vh are only equal at one aspect ratio.
- **A blur over a smooth gradient is nearly invisible.** There are no high frequencies to remove, so
  frosted glass only reads if you give it texture to lose. Demo 5 adds a soft-light noise layer for
  exactly that. The library's `grain` would work too, but it is a hardcoded halftone — PostProcessing
  is mounted with no props, so `grainBlending` is ignored.
- **`grain` is a fullscreen post-pass.** It reads as harsh dither over flat colour fields and it is
  the most expensive thing on the surface, so it is off by default and force-disabled on phones.

## Notes

- `lightType: 'env'` fetches HDR maps from the ShaderGradient CDN — a real network dependency. The
  presets default to `'3d'`, which stays local. The Surface group lets you switch and see the cost.
- Scroll progress is quantised to ~120 buckets before it reaches any shader prop
  ([useScrollProgress.ts](src/shader/useScrollProgress.ts)); feeding raw float progress in
  re-renders the React tree on every pixel of scroll for no visible gain.
- React 19 + `@react-three/fiber` v9. On Next.js 15 App Router that pairing is required, not optional.
