# Kite Design System

A new interface for **Common Sage** — the educator-authored, knowledge-graph-backed learning platform at `/Users/jean/coding/commonsage`.

**Status:** target specification. This describes the system as it should be, not as either repo is today. Where existing code contradicts it, the code is superseded.

**Delivery:** a **parallel frontend**, not an in-place refactor of `common_sage_frontend`. This repo grows into the real client and talks to the same FastAPI backend. Route and capability parity is tracked in [§12](#12-parity-with-common-sage).

**Surface scope:** all four roles — student, educator, admin, and the service account's visible artefacts. Learner deck, course catalogue, knowledge graph, topic and lecture views, the authoring wizard, and the admin tables.

**Brand:** a full break from the current Common Sage _visual_ identity — Miriam Libre, Geologica, and the cyan/ice palette are retired ([§12.3](#123-what-we-deliberately-break)). The break is visual, not nominal: **Common Sage remains the product name and the wordmark** (§13.5). Kite is the name of this system, not of the product.

**Accessibility:** WCAG 2.2 Level AA, binding. The WebGL gradient, the raster map, and the 3D model carry named exceptions with mandatory mitigations ([§9.3](#93-canvas-carve-outs)).

**Explicit non-goals for v1** — deferred to a follow-up document, deliberately, not by oversight:

- The streaming AI chat surface (`ChatBubble`, `ChatPanel`, inline module rendering)
- Long-running generation job UX (queued → worker → published, failure and dead-letter states)
- Notifications of any kind — in-app, email, or push. There is no due-work indicator and no reminder in v1, and `/me/settings` accordingly carries no notification preferences (§11.12)
- Recall scheduling mechanics — intervals, due-queue composition, how a grade maps to a next-review date — an engine concern. **The rating _input_ is not deferred**: for a self-graded module the engine cannot know how it went, so collecting the grade is an interface act and is specified in §6.10.

---

## 1. Principles

Kite is a study instrument, not a website. Four laws.

**1. The lattice is the layout.** Everything sits on a square cell. Nothing floats, nothing is centred by eye, nothing has a radius. Position is meaning. When a decision is ambiguous, snap to the cell.

**2. Ink on paper, over light.** The interface is opaque paper with hairline rules, held above a slow gradient. The gradient is atmosphere and never information. Anything a learner must read or click sits on paper, not on light.

**3. Rigid surface, physical behaviour.** The visual language is square, hairline, and zero-radius; the motion is sprung, weighted, and interruptible. The interface _looks_ like a precision instrument and _moves_ like an object. Every animation still answers "what just changed?" — if it would look fine not happening at all, delete it — but the answer is delivered with mass, not with a fade.

**4. The same object looks the same everywhere.** A topic is one component whether it appears in the graph, the deck, a lecture, or an admin table. Three roles share one vocabulary; only permissions and **disclosure** change — and disclosure is governed by how often a surface is encountered, not by who is looking at it ([§2.7](#27-disclosure)).

**Corollary — study before craft.** When a visual decision and a learning decision conflict, the learning decision wins: legibility over drama, unambiguous judgement over gentle ambiguity, a fast next-item path over a satisfying transition.

---

## 2. Layout

### 2.1 The lattice

| Token     | Value                 | Role                                          |
| --------- | --------------------- | --------------------------------------------- |
| `--u`     | `8px`                 | Base unit. Every spacing value is a multiple. |
| `--cell`  | `64px` (`8u`)         | The square. Structural module of the product. |
| `--shell` | `1152px` (`18 cells`) | Max content width.                            |
| `--bar`   | `64px` (`1 cell`)     | Topbar height.                                |

All spacing is **px, never `em`**. This is not a style preference — see [§12.3](#123-what-we-deliberately-break) for the shipped bug that `em` padding caused in Common Sage.

The cell contracts with viewport:

| Breakpoint | Range     | `--cell` | Shell columns | Gutter                                  |
| ---------- | --------- | -------- | ------------- | --------------------------------------- |
| `sm`       | 0–599     | 48px     | 6             | 16px                                    |
| `md`       | 600–1023  | 56px     | 12            | 24px                                    |
| `lg`       | 1024–1439 | 64px     | 18            | 32px                                    |
| `xl`       | 1440+     | 64px     | 18            | `max(32px, (100vw - var(--shell)) / 2)` |

These four are the only breakpoints. A component needing a fifth should reflow fluidly instead.

**Each of the four is composed individually** — this is not one layout stretched. What changes, and where:

|                   | `sm`                     | `md`                     | `lg`                | `xl`                |
| ----------------- | ------------------------ | ------------------------ | ------------------- | ------------------- |
| Inspector rail    | Block, after work region | Block, after work region | Right rail, 5 cells | Right rail, 5 cells |
| Asymmetric splits | Stacked                  | Stacked                  | Side by side        | Side by side        |
| Display scale     | Two steps down           | One step down            | Full                | Full                |
| Topbar            | Brand + menu             | Brand + nav + tools      | Full                | Full                |
| Primary nav       | In menu sheet            | Inline, condensed        | Inline              | Inline              |
| Deck card         | Full width less gutter   | Fixed geometry           | Fixed geometry      | Fixed geometry      |
| Admin table       | Stacked definition rows  | Stacked definition rows  | Table               | Table               |

The cost of designing four is four times the QA surface. The mitigation is that only these seven things change — everything else is the same composition at a different cell size, and any component introducing an eighth variation needs justifying.

### 2.2 Space scale

**Total cell discipline: every dimension in the system is a multiple of `--u` (8px), and every component's outer box is a multiple of `--cell` (64px).** Padding, gaps, control heights, row heights, column widths, section spacing — all of it. There are no arbitrary values.

`--space-1: 8px` · `-2: 16px` · `-3: 24px` · `-4: 32px` · `-6: 48px` · `-8: 64px` · `-12: 96px` · `-16: 128px`

Nothing between these exists. Values like `28px 15px 13px` and `7px 9px` — both present in the current prototypes — are the exact thing this rule forbids.

**Card inset is directional, not symmetric.** Reading surfaces use `32px` block padding and `48px` inline padding: more room at the sides protects the reading measure, while the smaller top/bottom inset keeps adjacent regions connected. These are the shared `--card-pad-block` and `--card-pad-inline` tokens. A card may reduce them only at a narrow viewport; it may not invent local padding.

**One exception, narrowly drawn.** `--optical: 4px` exists for optical corrections only: icon-to-label gaps, rule offsets, focus-ring insets. It is not a spacing value and never appears in `margin` or `gap` between components. If you reach for it to make a layout fit, the layout is wrong.

Type is the one thing not forced onto the grid: **there is no baseline grid.** Line-height is set by the typographic scale (§4.2) and by CJK requirements (§4.3), and text sits wherever that puts it inside its 8px-quantised box. Locking body text to a baseline is unworkable against a system font stack that renders differently per platform, and against a 1.75 CJK line-height that would need a second grid.

### 2.3 Page skeleton

Every surface, every role, same four regions in the same DOM order:

```
┌─ header.k-topbar ──────── sticky, 1 cell, hairline bottom ──────┐
│  brand      primary nav      context · theme · account          │
├─ main#k-main ───────────────────────────────────────────────────┤
│  section.k-head      title + one-sentence orientation           │
│  nav.k-context       breadcrumbs / tabs / filters (optional)    │
│  [work region]       the surface's instrument                   │
├─ aside.k-inspector ── optional right rail ≥lg, block below ─────┤
└─ footer.k-foot ─────────────────────────────────────────────────┘
```

- `main` carries `id="k-main"` and is the primary skip-link target.
- The topbar is sticky and exactly 1 cell tall in every state. `html { scroll-padding-top: var(--cell) }` plus `scroll-margin-top: var(--cell)` on every focusable target, so the sticky bar can never obscure focus (SC 2.4.11).
- The inspector rail is `320px` (5 cells at `lg`). Below `lg` it becomes a block after the work region — never a modal, never a drawer. It is the system's tier-2 surface (§2.7): it fills on **Select** and never navigates.
- Exactly one `<h1>` per surface, in `.k-head`.

### 2.4 Work-region grids

| Surface                 | Work region          | Grid                                                                                                                                                   |
| ----------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Course catalogue        | Course cards         | `repeat(auto-fill, minmax(5 cells, 1fr))`                                                                                                              |
| Learner deck (`/start`) | One module at a time | A single fixed-geometry card, horizontally centred as the sole focal object; its **interior** composition is left-weighted like everything else (§2.5) |
| Knowledge graph         | Topic field          | SVG; cell-snapped tile packing, 1×1 to 3×3                                                                                                             |
| Lecture / topic detail  | Content list         | Single column, module frames full width                                                                                                                |
| Authoring wizard        | Stepped form         | Single column, max `9 cells`, stepper in `.k-context`                                                                                                  |
| Admin                   | Data table           | Full shell width, horizontal scroll in its own container                                                                                               |

The faint background lattice is drawn at the current `--cell` on every surface, so all surfaces read as one continuous plane.

---

### 2.5 Composition

Layout says where things go. Composition says how they relate. This section is the part most likely to be violated by accident, because every rule in it is invisible until broken.

#### Quantised growth

Components size to their content — nothing truncates, which §4.4 forbids outright — but they grow **in whole increments**. Content determines _how many_ cells; the lattice determines that it is a whole number of them. A card whose content needs 143px of height is 192px tall (3 cells), not 143px.

This is what makes "content-first" and "everything is a cell multiple" compatible rather than contradictory. Growth is stepped, never continuous.

#### Fixed geometry on study surfaces

**Exception, and the most important rule in this section.** On the deck, inside any **graded** module frame, the container is a **fixed size that does not change during use**. A flashcard does not resize when it flips. A vocabulary prompt does not resize when the answer appears. A quiz does not grow when an explanation renders.

The reason is not aesthetic. A learner hits **Check** hundreds of times per session, at speed, often without looking directly at it. If the button moves because the content above it got taller, every one of those interactions costs a re-acquisition. Predictable control position is a performance requirement of the instrument.

**Which is exactly why it does not apply to ungraded modules.** The rule is bought by the speed loop, and an ungraded module has no speed loop — there is no Check, no judgement, and no rapid repetition to protect. Those types scroll instead (§6.10). Stating the rule's justification rather than the rule itself is what makes the carve-out principled: where the justification is absent, so is the rule.

How it works, for the graded types:

- Card geometry is chosen **per session, not per module type** — one card size for the whole deck, so the controls sit in the identical screen position on every graded card.
- The size comes from a small fixed set of cell-multiple geometries; the session picks the one that fits its content and holds it.
- **Controls sit outside the content region.** They are pinned to the frame, never pushed by content.
- Overflow of last resort is an internal scroll **inside the content region only**. The frame does not grow, and the controls do not move.

Everywhere else — catalogue, tables, topic detail, authoring, admin — quantised growth applies normally.

#### Stance: asymmetric, left-weighted

Content anchors to the left edge. Weight is distributed unevenly and the composition draws its energy from imbalance, not from balance. This applies to chrome as well as content: the topbar's `1fr auto 1fr` centring in the current prototypes is symmetric and goes.

**Focal order** is one diagonal, the same on every surface:

```
┌──────────────────────────────────────────────┐
│ ■ display heading, top-left, heaviest mass   │
│ │                                            │
│ ↓  content reads down the left edge          │
│                                              │
│                        primary action ─────▶ │
└──────────────────────────────────────────────┘
```

Mass top-left, action bottom-right. One diagonal, no competing centres, and the terminus is where a right-handed thumb reaches on a phone. Every surface uses it, so a learner never hunts for the next step.

#### Rule termination

**Horizontal rules run full-bleed, edge to edge across the viewport. Vertical rules stop at the content.** This is the move that establishes the field: horizontals declare an infinite plane, verticals contain the reading column within it. It is also what makes the shell's 1152px cap feel like a measure rather than a box.

#### Material map

**Content is opaque paper. Chrome is veiled glass.**

| Region                                           | Material                 |
| ------------------------------------------------ | ------------------------ |
| Deck card, module frame, table, form, card, tile | Opaque `--paper-*`       |
| Dialog, popover, menu, toast (§6.11)             | Opaque `--paper-0`       |
| Dialog scrim                                     | `--ink-0` at α 0.5, flat |
| Topbar, footer, inspector rail                   | Veiled glass at `--veil` |
| Background lattice, notes workspace              | Frost                    |
| Behind everything                                | Shader gradient          |

Everything a learner reads or acts on is opaque. This keeps the veil law (§3.5) applying to a small, auditable set of surfaces rather than to the whole product, and it means legibility never depends on what the gradient happens to be doing.

#### Proportion

**Cell-derived ratios only.** Because every box is a whole number of cells, ratios fall out as 1:1, 3:2, 2:1, 3:1 and so on. There is no separate ratio token set to maintain and no possibility of a ratio that doesn't tile. Media is the one place a specific ratio is enforced: video is 16:9 within its cell-multiple box, letterboxed on `--paper-2` if the source differs.

#### Alignment

**Mathematical, not optical.** Everything aligns to its box edge. Large display type will sit very slightly inset relative to body text beneath it — that is accepted, because the alternative requires a per-size side-bearing correction that is wrong the moment the system stack (§4.1) falls back from Helvetica to Arial to a platform default. Font-independent alignment is worth a pixel of imprecision.

### 2.6 Layer order

Nine layers, ordinal, one custom property each. **No literal `z-index` anywhere** — enforced by stylelint (§13.3), because ad-hoc `z-index: 9999` is how every layered interface eventually breaks.

| Layer | Token               | Contents                                                                                        |
| ----- | ------------------- | ----------------------------------------------------------------------------------------------- |
| 0     | `--layer-substrate` | The shader gradient. Fixed, `aria-hidden` (§3.5).                                               |
| 1     | `--layer-lattice`   | Background lattice, frost, the notes workspace (§11.15). Document flow.                         |
| 2     | `--layer-content`   | Everything on paper. The default; most components declare nothing.                              |
| 3     | `--layer-chrome`    | Sticky topbar, footer, inspector rail.                                                          |
| 4     | `--layer-popover`   | Popovers, menus, tooltips (§6.11).                                                              |
| 5     | `--layer-scrim`     | The dialog scrim.                                                                               |
| 6     | `--layer-dialog`    | Dialogs (§6.11).                                                                                |
| 7     | `--layer-toast`     | Toasts. Above dialogs, because a rollback error (§7.4) must be visible over whatever caused it. |
| 8     | `--layer-skip`      | Skip links when focused (§8.2). Above everything, so focus is never obscured (SC 2.4.11).       |

**`backdrop-filter` creates a stacking context and a containing block for fixed descendants.** The topbar and inspector rail are backdrop-filtered (§5), which means an overlay rendered as their DOM child is trapped inside them and cannot reach its layer. **Every overlay renders through a portal at the document root** — React Aria does this by default (§13.2), and hand-built overlays must match it.

Two consequences worth stating rather than rediscovering: a sticky element cannot escape a transformed ancestor either, so no work region may carry a `transform` on a container that holds sticky chrome; and the ordering above is the only ordering — a component that needs to sit between two layers is a component that has picked the wrong layer.

### 2.7 Disclosure

Layout says where things go. Composition says how they relate. Disclosure says **what is there at all** — and it is the decision most often made by accident, by putting a field on a card because the field happened to be in the response.

Note first what this section is _not_ about. Visual density is already settled by construction: total cell discipline (§2.2) and 48×48 targets (§6.2) mean a row cannot be compressed, a label cannot drop below 12px (§4.2), and there is no comfortable/compact toggle to offer. The only real variable is what appears, and where.

#### The threshold

Three tests, in order. **Importance is not one of them** — importance is a scale, and a scale produces argument rather than decisions.

**1. Action.** Would a user do something different if this value were different? A generation date fails: no learner behaves differently on the 14th of March than on the 1st of July. A draft marker passes.

**2. Trust.** Does it let someone judge whether to rely on what they are looking at? This is the only test that readmits something the action test rejected — and only in its bad state (below).

**3. Cost per encounter.** The cost of a field is paid every time the surface is met, and encounter counts vary by three orders of magnitude across this product. A row in an admin table is scanned once. The module frame header (§6.10) is read on **every card, hundreds of times a session** — and read _aloud, before the prompt_ for a screen-reader user, who cannot skip it the way a sighted reader skips it for free.

So the bar **scales with repetition, not with role**. The same field, at the same importance, is correct on the catalogue and wrong on the deck. This is what principle 4 means by disclosure rather than density: an admin table is dense because a row is met once, not because admins are experts.

When two tests disagree, drop one tier. Same instinct as §1's rule for animation: if it would be fine absent, it is absent.

#### Mark the exception, never the norm

A `Published` badge on every published object is noise that makes the one `Draft` badge harder to find. **Metadata earns its place by being anomalous, not by existing.**

| Never marked                    | Marked, and only then                         |
| ------------------------------- | --------------------------------------------- |
| Published                       | **Draft** (§3.3)                              |
| Reviewed accessibility metadata | **Unreviewed** (§13.6)                        |
| Current material                | **Stale** — educators only (§13.6)            |
| Saved                           | **Unsaved**, **failed** (§7.4)                |
| Enrolled, permitted             | **Blocked**, **expired**, **denied** (§11.13) |

The consequence is that **absence carries meaning, so absence must be reliable**. A surface that sometimes omits the draft marker is worse than one that never had it — it teaches learners that unmarked means nothing.

#### The four tiers

| Tier  | Lives on                    | Contents                                                                                                                                    | Reached by             |
| ----- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **0** | The object itself           | What it is, and the one action on it                                                                                                        | Present                |
| **1** | The object, conditionally   | The exception markers above                                                                                                                 | Present only when true |
| **2** | The inspector rail          | Provenance, relations, counts, position in the structure                                                                                    | **Select** (§7.1)      |
| **3** | The object's own surface    | The full record                                                                                                                             | **Open** (§7.1)        |
| **4** | Not in the interface at all | `module_type` (§3.2), the practice rung (§11.6), the dwell threshold and a learner's dwell time (§6.10), scheduling internals, database IDs | —                      |

**§7.1's verbs already are this ladder.** Select is defined as non-destructive preview that does not navigate — that is the tier-2 reveal. Open is the move to tier 3. Nothing else may promote information between tiers: no hover reveal (§7.3 forbids hover-only affordances outright), no expand-in-place, no "show more" that reflows the grid around it.

**Role changes tier assignment, never the component.** Provenance is tier 2 for a learner and tier 1 for an educator, because only the educator can act on it. Same card, same layout, different threshold — which is exactly what §11.1 means by one vocabulary plus an edit affordance.

#### The inspector rail is tier 2, on every surface

One consistent behaviour, so that Select means the same thing everywhere:

| Surface                | Select fills the rail with                                                       |
| ---------------------- | -------------------------------------------------------------------------------- |
| Course catalogue       | Educator, topic count, standing, when last studied                               |
| Knowledge graph        | Topic mastery, child count, parent chain, the learner's notes on it (§11.15)     |
| Topic / lecture detail | The selected module's content type, source, and — for educators — its provenance |
| Admin table            | The full row record, so a table stays scannable at tier 0                        |
| Deck                   | Quiet during answering; see §6.10                                                |

- It fills on Select and **never navigates**. Never a modal, never a drawer, never hover-triggered.
- Selecting a second object **replaces** the contents. It does not stack, and there is never a second rail.
- Empty state names what selecting would show — "Select a topic to preview it" — rather than sitting blank.
- Below `lg` it is a block after the work region (§2.3). Selecting does not scroll the page; the block updates in place and a polite live region announces the new subject (§9.4).
- The rail never holds the only copy of an action. Anything actionable there is also reachable from the object or its own surface.

#### Numbers

A visible number invites optimising the number — the reason §11.7 refuses a mastery percentage. Generalised: **a number is shown only where the user controls the input and the number is honest.** Where either fails, use named states instead. This is why mastery is three states rather than a percentage, and why the deck carries no session counter (§6.10) — counts belong to the stop summary (§11.8), where they report what happened instead of setting a target that was never agreed to.

---

## 3. Color

### 3.1 Foundations

Two ramps: **paper** (surfaces) and **ink** (marks).

```css
:root {
  /* light */
  --paper-0: #ffffff; /* lifted: active cards, inputs, popovers */
  --paper-1: #f9f6ed; /* default paper: tiles, frames, cards */
  --paper-2: #efeade; /* sunken: wells, disabled fills, table stripes */

  --ink-0: #171719; /* primary text, structural rules */
  --ink-1: #45444a; /* secondary text */
  --ink-2: #636269; /* tertiary / meta text */
}
:root[data-theme='dark'] {
  --paper-0: #0d0d10;
  --paper-1: #19181c;
  --paper-2: #232228;

  --ink-0: #f4f0e7;
  --ink-1: #b5b1a8;
  --ink-2: #96939d;
}
```

Measured contrast:

| Ink                  | on `paper-0`  | on `paper-1`  | on `paper-2`  |
| -------------------- | ------------- | ------------- | ------------- |
| `ink-0` light / dark | 17.90 / 17.06 | 16.57 / 15.53 | 14.91 / 13.87 |
| `ink-1` light / dark | 9.64 / 9.07   | 8.92 / 8.26   | 8.03 / 7.38   |
| `ink-2` light / dark | 6.03 / 6.43   | 5.58 / 5.85   | 5.02 / 5.23   |

Every ink passes AA body text on every paper in both themes. The ramp is closed: there is no illegal combination, which is the point.

Theme switching uses `data-theme` on `<html>` plus `color-scheme`, carried over from Common Sage — that part of the current implementation is correct and worth keeping.

**Four native surfaces escape the ramp unless claimed explicitly**, and each is a visible break in an otherwise closed system: `::selection` (set to `--ink-0` at 14% over unchanged text, never a colour inversion that breaks contrast), browser autofill (Chrome's yellow fill lands directly on `--paper-0`; override with `-webkit-autofill` and keep the ink), scrollbars (`scrollbar-color` from the ink ramp; the named, focusable scroll containers of §6.6 are the ones that matter), and `accent-color` (set to `--ink-0`, since checkboxes and radios are native per §6.1). `color-scheme` handles the rest of the UA defaults and is the reason it is set at all.

### 3.2 Content-type accents

Six hues, one per `ContentType`. **Identity, not decoration** — a learner should recognise the kind of material before reading the label.

| Content type | Light                                      | Dark      | Light, worst paper | Dark, worst paper |
| ------------ | ------------------------------------------ | --------- | ------------------ | ----------------- |
| `summary`    | `#354dad`                                  | `#5ba7ff` | 6.68               | 7.16              |
| `text`       | `#3d4d62`                                  | `#6b83e6` | 7.72               | 5.11              |
| `video`      | `color-mix(in srgb, #8b6ed4 80%, #070707)` | `#8d71d5` | 5.00               | 4.64              |
| `audio`      | `color-mix(in srgb, #3d8fcc 76%, #070707)` | `#3d8fcc` | 4.90               | 5.10              |
| `flashcard`  | `color-mix(in srgb, #6b83e6 76%, #070707)` | `#87d3ff` | 4.88               | 10.88             |
| `quiz`       | `color-mix(in srgb, #38b6fe 60%, #070707)` | `#d0acff` | 4.99               | 9.38              |

All six clear AA body text (4.5:1) on all four surfaces in both themes. "Worst paper" is the
lowest of `--bg`, `--bg-raised`, `--panel` and `--glass`, each composited through its alpha
before measuring — `--panel` is `rgb(var(--bg-rgb) / 0.85)`, not an opaque colour, and comparing
against the uncomposited value overstates every ratio in this table. The floor binds because
`.k-frame__type` paints the accent as 12px text (`--size-label`), which is not large text.

**Provenance of these values.** This table previously carried a teal/orange/magenta set that
appeared nowhere in the code; `tokens.css` had always shipped the Common Sage blue/violet
lineage. §13.3's governance makes that a bug in one of the two places, and it was resolved in
the code's favour — the shipped palette is the real one, and §12.3's claim that the lineage
"ends here" was aspirational rather than executed. Three values moved to clear the floor:
`video` dark `#8b6ed4 → #8d71d5` (was 4.49), `flashcard` light `80% → 76%` (was 4.46),
`audio` light `80% → 76%` (was 4.50). Everything else is unchanged from what shipped.

Filled chips invert to `--on-accent` (`#0a0a0a`).

Accents may tint a surface at `≤12%` alpha. Above that, treat as a filled chip and invert the text colour.

**The frontend colours by `ContentType`, which it already knows, and nothing else.** It does not colour by `module_type`, and it does not derive a pedagogical category of its own. That classification — practice mode, whether a module is graded — is backend-owned in `app/api/progress/module_registry.py`, and [contentDisplay.ts](../commonsage/common_sage_frontend/components/content/contentDisplay.ts) is explicit that the frontend must not duplicate it. An earlier draft of this document proposed a frontend `module_type → domain` map; that would have diverged silently the first time the worker generated a module type the map didn't know. Six content types, owned where they already live.

The three pairs are deliberately hue-adjacent by family — reading (`summary`/`text`), media (`video`/`audio`), practice (`flashcard`/`quiz`) — but hue is never the sole channel (§3.3), so the pairing is a convenience, not a load-bearing distinction.

### 3.3 Semantic colors

| Role     | Light     | Dark      | Use                                   |
| -------- | --------- | --------- | ------------------------------------- |
| `--ok`   | `#1a6b3c` | `#5fd18d` | Correct, published, verified, healthy |
| `--warn` | `#8a5a00` | `#e0b453` | Partial, draft, degraded, unverified  |
| `--err`  | `#b32020` | `#ff8a80` | Incorrect, failed, destructive        |

**Colour is never the sole channel** (SC 1.4.1). Every state carries a second:

| State             | Colour   | Glyph | Rule            | Text                     |
| ----------------- | -------- | ----- | --------------- | ------------------------ |
| Correct / success | `--ok`   | `✓`   | 2px left        | "Correct"                |
| Incorrect / error | `--err`  | `✕`   | 2px left        | "Not quite — <answer>"   |
| Partial / pending | `--warn` | `~`   | 2px dashed left | "Partly right" / "Draft" |

### 3.4 Rules and hairlines

Boundaries are rules, not shadows. Two tiers, chosen by whether the boundary carries meaning:

```css
--rule-structural: color-mix(in srgb, var(--ink-0) 55%, transparent); /* light */
--rule-decorative: color-mix(in srgb, var(--ink-0) 14%, transparent);
/* dark: 45% and 12% */
```

`--rule-structural` measures **3.34:1** (light) and **3.50:1** (dark) against `paper-1`, clearing the 3:1 non-text floor (SC 1.4.11). Legal for anything a user must perceive: control edges, tile boundaries, table separators, the topbar underline. Floors are 0.50 light / 0.40 dark.

`--rule-decorative` is for the background lattice only, exempt as decoration. It must never be the sole separator between two interactive regions.

All rules are `1px solid`, derived from `currentColor`. Dashed is reserved for provisional state: drag preview, partial credit, unsaved draft.

### 3.5 The shader substrate and the veil law

The animated gradient is a **material, not a surface**: `aria-hidden`, fixed to the viewport, behind every content layer.

> **Veil law.** Any text or control over the canvas sits on a paper layer of at least **α 0.66**. Default token `--veil: 0.72`.

Derivation, using the worst-case gradient stops in the shipped palettes with `ink-0` text: light theme needs α ≥ 0.44, dark theme needs α ≥ 0.60. `0.66` clears both; `0.72` is the default so hover and selection tints have room to move. Large text (≥24px, or ≥19px bold) may drop to α 0.50.

`backdrop-filter: blur()` contributes **nothing** to contrast. Blur removes high frequencies; a smooth gradient has none, so composite luminance barely moves. **Frost is texture, not contrast.** Opacity is the only lever that satisfies the veil law.

**The gradient is ambient, never reactive.** It drifts on its own clock and responds to exactly one thing: the active item's content-type accent (§3.2), morphed over `spring.ambient`. It never responds to correctness, streak, progress, depth, pointer, or hover. Because it is `aria-hidden`, anything it encoded would be information available to sighted users only — so it encodes nothing.

**Default field.** Common Sage uses one saturated blue family in both themes, not a warm/cool multicolour wash. Light runs from clear sky blue into pale blue-white; dark runs from vivid blue into blue-black. Presence comes from chroma and tonal range, while motion remains unusually slow (`uSpeed: 0.012`). Do not make the field feel more alive by making it move faster.

**Scroll behaviour.** The gradient layer is `position: fixed`, viewport-pinned. Content and the lattice scroll over it, so the page reads as frosted glass sliding across light — this is the one scroll effect the system keeps, and it costs nothing because nothing is animating on scroll. The **lattice and notes layer is in document flow**: it runs the full scroll length of the page rather than being pinned to the viewport, so a note stays beside the content it was written against. A note's _arrangement_ on that lattice is a session-only workspace; its durable anchor is a topic, not a coordinate (§11.15). Scroll progress may drive the shader camera, quantised to ~120 buckets before reaching React state. There is no parallax on content and no scroll-triggered entrance animation.

### 3.6 Elevation

No drop shadows. Elevation, in increasing order:

1. **Paper tier** — `paper-2` → `paper-1` → `paper-0`.
2. **Rule weight** — decorative → structural → structural + 2px accent edge.
3. **Offset** — an 8px hard offset (`box-shadow: 8px 8px 0 var(--ink-0)`) for exactly one thing per surface: what the user is currently manipulating.

Anything needing a fourth level is a modal. Make it a modal — §6.11 specifies what one is, and §2.6 says where it sits.

---

## 4. Typography

The system commits to **system faces only**. No webfonts, no `next/font`, no loading strategy, no layout shift, no licensing. Cross-platform rendering variance is accepted as the price.

### 4.1 Stacks

```css
--font-sans:
  Helvetica, 'Helvetica Neue', Arial, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN',
  'Yu Gothic Medium', 'Yu Gothic', 'Noto Sans JP', Meiryo, sans-serif;

--font-mono: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
```

One stack, **Latin first, CJK appended**. Latin codepoints resolve to Helvetica; kana and kanji fall through to the platform's Japanese face. Mixed sentences work without markup gymnastics.

### 4.2 Latin scale

| Role      | Size                         | Line | Tracking | Weight         |
| --------- | ---------------------------- | ---- | -------- | -------------- |
| `display` | `clamp(3.5rem, 7vw, 6.3rem)` | 0.82 | -0.075em | 500            |
| `h1`      | `clamp(2.25rem, 5vw, 4rem)`  | 0.88 | -0.055em | 500            |
| `h2`      | `1.75rem`                    | 1.05 | -0.03em  | 500            |
| `h3`      | `1.125rem`                   | 1.2  | -0.02em  | 600            |
| `body`    | `1rem`                       | 1.45 | 0        | 400            |
| `body-sm` | `0.875rem`                   | 1.45 | 0        | 400            |
| `label`   | `0.75rem` (12px)             | 1.2  | +0.07em  | 700, uppercase |
| `meta`    | `0.6875rem` (11px)           | 1.2  | +0.07em  | 700, uppercase |

**12px is the floor for any label a user must act on.** `meta` (11px) is permitted only for non-essential annotation duplicated in an accessible name. Nothing below 11px exists.

**Roles outside the scale.** Three sizes are used by exactly one component each and were
literals in `kite.css` until they were tokenised. They are named here rather than rounded to
the nearest step, because rounding is a design change and tokenising is a mechanical one:

| Token                                  | Value           | Sole consumer                                                                                 |
| -------------------------------------- | --------------- | --------------------------------------------------------------------------------------------- |
| `--size-prompt`                        | `1.25rem`       | §6.10's module-frame prompt, and the cloze run                                                |
| `--size-monogram`                      | `0.8rem`        | §13.5's brand monogram, inside its fixed 32px box                                             |
| `--size-fig-node` / `--size-fig-label` | `13px` / `12px` | SVG figure text, sized against the viewBox rather than the page — so not on this scale at all |

Note the `tokens.css` values for `h2` (`1.6rem`), `body-sm` (`0.9rem`) and the `display`/`h1`
clamps differ from the table above. That divergence is unresolved and is **not** what this
block fixes.

Rules: body line-height is 1.45 — study text is read, not scanned. Measure caps at `62ch` for prose, `48ch` inside module frames. Negative tracking applies to `display`/`h1`/`h2`/`h3` only. Timers, scores, counts, and intervals use `font-variant-numeric: tabular-nums`. Text survives 200% zoom and 320px width with no horizontal scroll (SC 1.4.4, 1.4.10) and the SC 1.4.12 spacing overrides.

### 4.3 Japanese and CJK

The language modules are the hardest typography in the product: a _Discrimination_ module exists specifically to test whether a learner can tell confusable glyphs apart. Type that blurs the distinction breaks the exercise. These rules are functional requirements, not taste.

**`lang` is mandatory on every Japanese string.** It is already applied correctly in [LanguageModules.tsx](src/components/modules/LanguageModules.tsx) — keep that discipline. `lang` does two things beyond font selection:

- It selects the correct **Han glyph variants**. Unified Han renders differently by locale — `直`, `骨`, `令`, `steps` in stroke form differ between `ja` and `zh`. Without `lang="ja"`, a browser may show a learner the Chinese stroke form of a kanji they are being taught to write. That is a correctness bug, not a polish issue.
- It drives speech synthesis (`utterance.lang = 'ja-JP'`) and screen-reader voice switching.

**Never synthesize bold or italic on CJK.** Faux-bold thickens strokes until counters close, which destroys exactly the distinction the Discrimination and Kanji modules test. Faux-italic is not a Japanese convention and degrades legibility. Emphasis on Japanese text uses colour, a rule, or size — never `font-weight` beyond a real available weight (400/700), never `font-style: italic`.

**Never apply negative tracking to CJK.** The `display`/`h1` styles carry up to `-0.075em`, which crushes kanji into each other. Reset under `:lang(ja)`:

```css
:lang(ja) {
  letter-spacing: 0;
  line-height: 1.75;
}
:lang(ja) h1,
:lang(ja) h2,
:lang(ja) h3 {
  letter-spacing: 0;
}
.language-glyph:lang(ja) {
  letter-spacing: 0.02em;
}
```

**Size floors** (below these, stroke-dense kanji become unreadable at typical viewing distance). These are accessibility floors rather than type choices, which is why they are absolute and sit outside §4.2's relative scale. Tokenised as `--size-glyph-inline`, `--size-glyph`, `--size-glyph-pair`, plus `--size-glyph-option` (`40px`) for a glyph on a choice tile, which sits between the inline and isolated cases:

| Context                                        | Minimum |
| ---------------------------------------------- | ------- |
| Running Japanese text                          | 16px    |
| Inline glyph inside an exercise sentence       | 20px    |
| Isolated prompt glyph (kana/kanji recognition) | 64px    |
| Discrimination module — confusable pair        | 96px    |

**Line breaking.** `line-break: strict; word-break: normal; overflow-wrap: normal;` for Japanese. Never `word-break: break-all` — it violates kinsoku shori and breaks lines mid-word in ways that change parsing. Latin fallback rules do not apply.

**Optical size.** At the same nominal size, CJK glyphs fill more of the em box than Helvetica and read as larger and heavier. In mixed runs, CJK-only spans render at `0.92×` the Latin size. Use an explicit multiplier class; `font-size-adjust` may supplement it but must never be the only mechanism.

**Furigana.** Reading aids use real `<ruby>` markup, not a sibling `<small>`:

```html
<ruby>図書館<rp>(</rp><rt>としょかん</rt><rp>)</rp></ruby>
```

`<rt>` at `0.5em`, `ruby-position: over`. Reserve line-box space so ruby never shifts the lines around it. Furigana is a **scaffold**: every module that contains optional reading data exposes a toggle, and the toggle state persists per learner. Kana recognition, discrimination, kana production, kanji reading, and transcription never expose it: there it is meaningless or reveals the answer. A toggle with no ruby data is also forbidden. The `<rp>` fallback parentheses matter — assistive technology and non-supporting renderers read them.

**Audio.** Speech is never the only channel. Every spoken prompt (Vocab guesser, Transcription) has a visible transcript toggle (SC 1.2.1) and a replay control, and the module is completable with audio muted.

**Vertical writing (`writing-mode: vertical-rl`)** is out of scope for v1. If it arrives, it needs its own layout pass — the cell lattice assumes horizontal flow.

#### Japanese input

Rendering Japanese is half the problem; six module types require the learner to _produce_ it, and how they type it is a design decision, not a platform detail.

**In-app romaji → kana conversion.** The response field accepts Latin keystrokes and converts to kana live: `t-o` → と, `s-h-o` → しょ. No OS-level IME, no platform setup, and it works identically on a school Chromebook and a phone — which matters, because requiring a beginner to install and switch a Japanese input method before their first card is a barrier at exactly the wrong moment.

- **Kana is the answer. Kanji is never required.** としょかん is correct for 図書館. This is what a vocabulary module tests, and it is the only rule compatible with romaji conversion, which cannot produce kanji at all. A learner who does have an IME and types 図書館 is also correct — accepting more costs nothing.
- **Grading applies to the converted kana, never the keystrokes.** `toshokan` and `tosyokan` both produce としょかん and are both right. Romanisation style is not the thing being taught, so per-type typo tolerance (§6.10) is evaluated after conversion.
- The raw Latin buffer is visible while composing and is replaced as it resolves, so the learner sees what they are producing. The field carries `lang="ja"` on its resolved content per §4.3.
- The converter handles small kana, `ん` disambiguation, gemination (`kk` → っ), and long vowels. These are the cases that make a naïve mapping feel broken.
- Katakana is reached by an explicit toggle on the field, not by guessing from context.

**Handwriting** (`kanji_writing`) is in scope, and is a canvas carve-out — §9.3D.

### 4.4 Interface localisation

The **interface** ships in German and English. (Learning _content_ is separately multilingual — §4.3.) There is no i18n layer in Common Sage today, so this is built rather than migrated.

German is the constraint that matters. Compound nouns run 30–40% longer than their English equivalents — _Wissensgraph_ is kind, _Lernfortschrittsübersicht_ is not — and long unbreakable words are exactly what a rigid lattice handles worst.

**Rules, all binding:**

- **No fixed widths on anything containing text.** Buttons, chips, tabs, table headers, and stepper labels size to content within a `min-width`/`max-width` range. A layout that only works at one string length is broken, it just hasn't met the other language yet.
- **No truncation of interactive labels.** A button whose label is cut off is a button whose purpose is hidden. Wrap to two lines and let the row grow — the cell lattice has vertical room, not horizontal.
- **No concatenated strings.** Never build a sentence from fragments plus a variable; German word order and case endings will not survive it. One translatable string per message, with named interpolations.
- **Logical properties throughout** — `margin-inline`, `padding-block`, `inset-inline-start`. Free to write, and the only thing that makes a future RTL locale tractable.
- **Reserve 40% headroom** when designing any fixed-position chrome against English strings.
- **Tracking is language-dependent.** The display scale's `-0.075em` is tuned to English word shapes; long German compounds at that tracking read as a single illegible mass. Cap negative tracking at `-0.04em` under `:lang(de)` for `display` and `h1`.
- **`lang` is set on `<html>` and switches with the locale**, so hyphenation (`hyphens: auto` — genuinely necessary for German), quotation marks, and date and number formats follow. German dates are `DD.MM.YYYY`; never hard-code a format.
- **`hyphens: auto` on prose under `:lang(de)`.** This is the single highest-value line in this section — without it, long compounds force horizontal overflow at 320px and break SC 1.4.10.

**Register is `du`, for every role.** The German interface addresses students, educators, and admins alike in the informal second person. An educator switching from teaching to studying does not switch register mid-product, and a single consistent `du` is better than a mixed system that reads as a bug the first time the two vocabularies meet on one screen. Consequences, because register leaks into more than pronouns:

- **Lowercase `du`, `dich`, `dein`** in running text, per current Duden guidance. Capitalised `Du` is defensible in direct address, but inconsistent capitalisation is worse than either choice, so the system picks one.
- **Buttons are bare imperatives** — _Prüfen_, _Überspringen_, _Aufdecken_ — never `Sie`-forms (_Prüfen Sie_), which are longer and formal in the one place §6.4 wants a short verb.
- **Never `Sie` in error or judgement copy.** Formality in a correction reads as institutional blame, which is the opposite of §11.6's "never shame a short session".
- Register is a **translation rule, not a runtime setting**. There is no formality toggle; adding one doubles the string set for no learning benefit.

RTL is not a v1 target, but the logical-properties rule means it does not become a rewrite later.

---

## 5. Material

| Material         | Composition                                          | Where                                             |
| ---------------- | ---------------------------------------------------- | ------------------------------------------------- |
| **Paper**        | Opaque `--paper-*` + `--rule-structural`             | All content: cards, frames, inputs, chips, tables |
| **Veiled paper** | `--paper-1` at `--veil` + 28px backdrop blur + grain | Topbar, inspector, anything over the canvas       |
| **Frost**        | Backdrop blur + fractional mask alpha + grain        | Decorative lattice only; never carries text       |
| **Light**        | The shader gradient                                  | Fixed backdrop, `aria-hidden`, always behind      |

Grain (`feTurbulence`, `soft-light`, α 0.58, 180px tile) is applied once per surface at the material layer, never per component. It exists so frost has something to blur — a blur over a smooth gradient is invisible without texture.

`backdrop-filter` costs per element, not per pixel of blur. One blurred layer revealed by a mask beats N blurred cells. Budget: **≤4 backdrop-filtered elements per surface**.

---

## 6. Components

### 6.1 Inventory

**Chrome** — topbar · brand · primary nav · role badge · theme toggle · account menu · skip links · footer
**Structure** — card · **module frame** (§6.10) · tile · inspector rail · breadcrumbs · tabs · wizard stepper · section head
**Controls** — button · chip · input · textarea · select · combobox · checkbox · radio · date input · search · slider · file dropzone
**Response controls** (§6.12) — single choice · text entry · cloze · ordering · map click · handwriting
**Data** — table · course card · topic card · user card · badge · progress meter · key-value list · markdown block · **note** (§11.15) · **media player** (§6.9)
**Overlays** (§6.11) — dialog · popover · menu · tooltip · toast
**Feedback** — judgement banner · resource state (loading / empty / error) · inline validation · confirmation dialog

### 6.2 Universal anatomy

```
[ 1px structural rule ] [ paper fill ] [ 32px block / 48px inline padding ] [ 0 radius ]
```

Minimum hit area **48×48px** (`6u`). This is set by the grid, not by the guideline — it happens to clear SC 2.5.8's 44px recommendation and its 24×24 floor comfortably, which is the convenient case where total cell discipline and accessibility agree. The visible box may be smaller than the hit area — extend with padding or a pseudo-element, never by shrinking the target.

Every control declares an explicit `font-size` from the scale. Never inherit the UA default. (Common Sage shipped a bug where `<button>` and `<a>` variants of the same component rendered at different sizes for exactly this reason.)

### 6.3 State model

Fixed system-wide:

| State           | Encoding                                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rest`          | `paper-1`, structural rule                                                                                                                        |
| `hover`         | `paper-0`, rule → `ink-0` at 70%                                                                                                                  |
| `focus-visible` | Focus ring ([§8.6](#86-focus-appearance)). Independent of hover.                                                                                  |
| `active`        | `paper-2`, 1px inset translate                                                                                                                    |
| `selected`      | 2px accent left rule + ≤12% accent fill + `aria-pressed`/`aria-selected`                                                                          |
| `current`       | Accent underline at 4px offset + `aria-current`                                                                                                   |
| `disabled`      | `paper-2`, `ink-2` text, decorative rule, `aria-disabled` — not the `disabled` attribute where the control must stay discoverable and explainable |
| `loading`       | Shimmer skeleton at `paper-2`, `aria-busy="true"`                                                                                                 |
| `invalid`       | `--err` 2px left rule + `✕` + message, `aria-invalid`, `aria-describedby`                                                                         |
| `pending`       | Committed locally, awaiting the server. **Looks exactly like committed** — no spinner, no dimming (§7.4)                                          |
| `reverted`      | Server rejected an optimistic commit. Springs back to the prior state + assertive toast naming the failure and offering retry                     |

Radius never changes with state. Size never changes with state. Only fill, rule, and offset — plus the shared press response in [§10.3](#103-the-shared-control-response).

### 6.4 Buttons

| Variant       | Fill        | Rule       | Text        | Use                                      |
| ------------- | ----------- | ---------- | ----------- | ---------------------------------------- |
| `primary`     | `--ink-0`   | none       | `--paper-0` | One per view. The next step.             |
| `secondary`   | `--paper-1` | structural | `--ink-0`   | Everything else.                         |
| `quiet`       | transparent | none       | `--ink-1`   | Tertiary, in-frame actions.              |
| `destructive` | `--paper-1` | `--err`    | `--err`     | Delete, reset, discard. Always confirms. |

Height `48px` (`6u`); `64px` (`1 cell`) for `primary` inside a study module, where it is hit under time pressure hundreds of times a session. Square. The label is a verb.

There is no `disabled` _variant_. Disabled is a state of any variant (§6.3).

### 6.5 Tabs

Both existing Common Sage implementations are defective, and **axe passes both** — a live demonstration of why automated testing is a floor, not a standard ([§9.6](#96-verification)):

- [`ui/Tabs.tsx`](../commonsage/common_sage_frontend/components/ui/Tabs.tsx) renders `<Link>` elements in a bare `<div>`: no `role="tablist"`, no `role="tab"`, no `aria-selected`, no `aria-controls`, no arrow-key navigation. It is a nav-link list wearing tab styling.
- [`content/ContentTypeTabs.tsx`](../commonsage/common_sage_frontend/components/content/ContentTypeTabs.tsx) has `role="tablist"` / `role="tab"` / `aria-selected` but no `tabpanel`, no `aria-controls`, and no roving tabindex.

**The correct pattern, and the decision rule for which to use:**

| If selecting a tab…                       | Use                     | Semantics                                                                                    |
| ----------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------- |
| changes the URL path / is a distinct page | **Nav links**, not tabs | `<nav>` + `<a>` + `aria-current="page"`. Style like tabs if you like; do not claim the role. |
| swaps content within one page             | **Real tabs**           | Full ARIA tabs pattern below                                                                 |

Real tabs contract:

```
<div role="tablist" aria-label="…">
  <button role="tab" id="tab-x" aria-selected="true"  aria-controls="panel-x" tabindex="0">
  <button role="tab" id="tab-y" aria-selected="false" aria-controls="panel-y" tabindex="-1">
<div role="tabpanel" id="panel-x" aria-labelledby="tab-x" tabindex="0">
```

- The tablist is **one tab stop**. Roving tabindex: the selected tab holds `tabindex="0"`, all others `-1`.
- `←` `→` move between tabs, `Home`/`End` jump to first/last. No wrapping.
- Activation is **automatic** (selection follows focus) because panel content is local and cheap. If a panel ever becomes expensive, switch that instance to manual activation with `Enter`/`Space` and say so.
- The panel is focusable (`tabindex="0"`) so keyboard users can reach its content directly after `Tab`.
- URL sync is fine and encouraged — but a tab whose state lives in the URL is still a tab, not a link, as long as it doesn't change the path.

The `ContentTypeTabs` case is a third thing again: a tablist living in the global navbar that controls content on a different route. That is neither tabs nor nav. In this system it becomes a **filter chip group** in `.k-context` on the deck surface itself, where the thing it filters actually lives.

### 6.6 Data tables (admin)

- `<table>` with real `<th scope="col">` / `<th scope="row">` and a `<caption>` (visually hidden if the heading above already says it).
- Sortable columns are `<button>` inside `<th>`, with `aria-sort="ascending|descending|none"` on the `<th>`.
- The scroll container carries `tabindex="0"` and an accessible name, so keyboard users can scroll it (this is the one real axe finding recorded against `/admin/users` — don't reintroduce it).
- Row actions are never hover-only. Destructive row actions confirm and name the object: "Delete _Probability Theory_?"
- Below `md`, tables become stacked definition rows — not a horizontally scrolling table of a dozen columns.
- Row selection uses real checkboxes with an accessible name per row, and a live region reporting "N selected".

### 6.7 Wizard and stepper

The authoring flow (course creation, source upload, review) is a stepper in `.k-context`.

- The stepper is an `<ol>` with `aria-current="step"` on the active step. Steps carry state: complete (`✓`), current, upcoming, blocked (`✕` + reason).
- Steps are buttons only where the step is legally reachable; unreachable steps are `aria-disabled` with a reason available, not silently inert.
- Each step is its own `<h2>` and its own form. Advancing moves focus to the new step's heading.
- Progress is saved per step. Leaving and returning restores position and announces that it did (SC 3.3.7 — never re-ask for what was already given).
- The final step summarises everything entered, with an edit affordance per section, before any irreversible action.

### 6.8 Forms and authentication

- Every field has a **visible persistent label**. Placeholder is never the label.
- **No titled field boxes.** A label never cuts through a border and a `fieldset` never renders as a rectangle with its `legend` embedded in the rule. Related compact options use a label beside a single-line control row; longer forms use ordinary stacked labels. Grouping remains semantic in the DOM without becoming a decorative box.
- Selector sets that control one list or graph sit in one horizontal toolbar above that display. A selector label and value stay on one line; the toolbar scrolls horizontally before an option such as “Vocabulary” is allowed to wrap.
- Required fields are marked in text (`Required`), not by asterisk alone.
- Errors: inline, adjacent, `aria-describedby`-linked, in plain language that says how to fix it (SC 3.3.1, 3.3.3). An error summary at the top of the form links to each failing field.
- Validation fires on blur and on submit, never on every keystroke.
- Character counters are `aria-live="polite"` and only announce near the limit.

**Authentication** (`/login`, `/register`, `/verify`) is bound by SC 3.3.8, _Accessible Authentication (Minimum)_ — AA in WCAG 2.2:

- **Paste must work** in every field, including password and verification code. Never block it.
- Password managers must work: correct `autocomplete` tokens (`username`, `current-password`, `new-password`, `one-time-code`), a real `<form>`, stable field names.
- **No cognitive function test** as the only path — no puzzle CAPTCHA, no "type the 3rd and 7th character of your password", no arithmetic.
- Email verification links must work when opened in a different browser than the one that requested them, and the verify screen states clearly what to do if the link expired.
- A show/hide password toggle is a real `<button>` with `aria-pressed` and an accessible name that changes with state.

---

### 6.9 Media player

`video` and `audio` are first-class content types. A custom player is built to the system rather than falling back to native controls, because native controls cannot be made to match the lattice and cannot carry the transcript affordance.

**Obligations (Level AA, non-negotiable):**

| Requirement                                       | SC                                  | Applies to                       |
| ------------------------------------------------- | ----------------------------------- | -------------------------------- |
| Captions, synchronised and accurate               | 1.2.2                               | All prerecorded video with audio |
| Audio description, or a full media alternative    | 1.2.5                               | All prerecorded video            |
| Transcript                                        | 1.2.1 (and best practice for audio) | All video and all audio          |
| Controls keyboard-operable and labelled           | 2.1.1, 4.1.2                        | All players                      |
| No audio auto-playing over 3s, or a pause control | 1.4.2                               | All players                      |

Captions are a **publishing gate**: an educator cannot publish a video without a caption track. Enforced in the authoring flow rather than audited afterwards, because retrofitting captions across a published course never happens.

**Anatomy.** Play/pause · scrubber · elapsed / total (`tabular-nums`) · volume · playback rate (0.75×–2×, essential for language content) · caption toggle · transcript toggle · fullscreen (video only).

- Every control is a real `<button>` at the §6.2 target size, with an accessible name that changes with state (`aria-pressed` on toggles).
- The scrubber is an `<input type="range">` with `aria-valuetext` in `m:ss`, not raw seconds. `←`/`→` seek 5s, `Shift`+arrow 1s, `Home`/`End` jump to the ends.
- The transcript renders below the player as selectable text, is **present in the DOM whether shown or not** so find-in-page works, and carries `lang="ja"` for Japanese content per §4.3.
- **Never autoplay.** Not on mount, not on card advance, not on scroll.
- Advancing the deck stops playback — the one case where a module may take an action the user didn't explicitly request.
- The player uses no spring motion. Scrubbing is 1:1 with the pointer; the only animation is the 90ms control colour change.

The language modules' audio (`vocab_guess`, `transcription`) uses this player in reduced form — play, replay, rate, transcript toggle — and every such module is completable with audio muted (§4.3).

**Replays are unlimited, and not counted.** A learner straining to hear must never run out of attempts, and a replay cap would ration a channel some learners already receive imperfectly — §4.3 already requires these modules to be completable with the audio off entirely, so capping replays would contradict it. Nor is replay count recorded as a difficulty signal: it would be a hidden metric penalising exactly the learners the rule protects (§2.7, tier 4).

### 6.10 Module frame

The single most repeated composition in the product, and the one specified most tightly, because every millimetre of variation here is paid for hundreds of times per session.

**The frame applies to graded modules only.** The split is not a Kite invention — `graded` is already a field on every type in the backend's `module_registry.py`, meaning "answering this emits a recall signal that advances scheduling." The frontend reads that flag and never re-derives it (§3.2).

|                           | Graded                                                                  | Ungraded                                                                                                                                                                                                                                                                             |
| ------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Registered academic types | **4** — `flashcard`, `quiz`, `timeline_drag_exercise`, `map_click_quiz` | **17** — `text`, `summary`, `topic_card`, `diagram_schematic`, `input_output_balance`, `stat_boxes`, `key_value_pairs`, `timeline`, `common_mistakes`, `comparison_vs_similar`, `conversion_calculator`, `formula_equation`, `hero_image`, `globe_pin`, `model_3d`, `audio`, `video` |
| Behaviour                 | This frame: fixed bands, fixed controls                                 | **Scrolls** — see below                                                                                                                                                                                                                                                              |
| Signal emitted            | A grade                                                                 | Engagement only                                                                                                                                                                                                                                                                      |

The frontend repertoire has **13 named language skill variants**. Japanese flashcards use canonical `flashcard`; kana recognition uses canonical `quiz`; `kana_production` is removed. Legacy stored IDs are accepted only at the data boundary and normalised before rendering. Pedagogical metadata may still say that a quiz tests kana, but that does not justify a duplicate interaction type.

`conversion_calculator` is **removed** from the vocabulary and needs deleting from both registries (§12.1).

**Fixed bands, fixed heights.** Four regions, each a reserved cell band whose height does not change between module types or between states:

```
┌─────────────────────────────────────┐
│ HEADER    1 cell     type · topic? ⋯│  fixed
├─────────────────────────────────────┤
│                                     │
│ PROMPT    n cells    the question   │  fixed per session
│                                     │
├─────────────────────────────────────┤
│                                     │
│ RESPONSE  n cells    the input      │  fixed per session
│                                     │
├─────────────────────────────────────┤
│ CONTROLS  1 cell     4 slots        │  fixed — never moves
└─────────────────────────────────────┘
```

- **Band heights are chosen once per session** and held for every card in it (§2.5). The Check button occupies the identical screen coordinates on card 1 and card 90.
- **Revealing an answer never resizes anything.** The response band already reserved the space; the answer fills it. This is why the bands are fixed rather than fluid — the reveal is the moment a fluid layout would jump, and it is also the moment the learner is looking hardest.
- **The judgement banner renders inside the response band**, not appended below it. It cannot push the controls.
- Overflow inside `PROMPT` or `RESPONSE` scrolls internally, with the scroll container named and focusable (§6.6). The frame never grows.
- On `sm`, the frame is full width less gutter and the bands scale with `--cell`; the _proportions_ and the control position are unchanged.

**What the header band contains.** This is the most repeated square centimetre in the product, so it is settled here rather than per module. Run against §2.7's tests, most of it falls out:

| Element                                      | Verdict                                                                                                                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Content type** — accent, icon, label       | **Always.** Tier 0, and required regardless: it is §3.2's second channel, so it is an accessibility obligation and not a decoration.                                                 |
| **Topic name**                               | **Per module type** — see below.                                                                                                                                                     |
| **Overflow `⋯`**                             | **Always.** Report a problem, and the note control (§11.15).                                                                                                                         |
| Session counter                              | **Never.** Sessions are open-ended (§11.6), so there is no honest denominator, and a bare ascending count is a number to optimise (§2.7). Counts belong to the stop summary (§11.8). |
| Generation date                              | **Never** for a learner. Educators see staleness, and only when stale (§13.6).                                                                                                       |
| `module_type`, difficulty, the practice rung | **Never, for anyone.** Tier 4 (§3.2, §11.6).                                                                                                                                         |

**The topic name is decided per module type, and fixed for that type.** For a vocabulary card, "Chapter 3" is harmless orientation; for a quiz asking _which rule applies_, "Chain Rule" is the answer printed above the question. That is a learning decision, and §1's corollary says the learning decision wins — so each graded type declares, once, whether its topic is shown.

This is the one place a module type is permitted to vary its header, and it is bounded so it cannot erode §6.10's whole purpose:

- **The slot is always reserved**, whether or not the type fills it. Band height, control positions, and the `⋯` never move between types. Content varies; geometry does not.
- The declaration is **per type, not per card**. A learner never sees the topic on one card of a type and not the next.
- Where the topic is withheld, it is not withheld permanently — it appears with the judgement, and in the inspector rail (§2.7), so a learner who has just missed something always has an address to go and read.

**The cost is honest:** short modules reserve space they don't fill. That whitespace is the price of a control that never moves, and on a study instrument it is worth paying. Do not "fix" it by collapsing empty bands.

#### The control band: four slots, always

The band is **four slots wide and one cell tall**, on every graded module, in every state. Slot positions never move; only their contents change, and only once per card — at the moment the learner is already looking at the band.

```
BEFORE                          AFTER REVEAL (self-graded)
┌───────┬──────┬──────┬────────┐ ┌───────┬──────┬──────┬────────┐
│Reveal │ Skip │      │ Check  │ │ Again │ Hard │ Good │  Easy  │
└───────┴──────┴──────┴────────┘ └───────┴──────┴──────┴────────┘
                        primary      1       2      3       4
```

The fourth slot is the primary action and is always the rightmost, where §2.5's diagonal terminates. The empty third slot before reveal is deliberate: it holds the position that `Good` will occupy, so the most-pressed rating never lands where a different control used to be.

#### Grading

**Self-graded type** — `flashcard`, including a flashcard carrying a `cards` sequence and a Japanese flashcard. There is nothing to check, so **Reveal is the normal path, not a failure**: reveal, then rate. The grade is **Again / Hard / Good / Easy** and comes entirely from the learner.

**Objectively graded types** — `quiz`, `timeline_drag_exercise`, `map_click_quiz`, and the language production modules. Check marks the attempt and the machine assigns the scheduling grade; the only following action is **Continue**. Difficulty ratings never appear after an objective test. Here **Reveal means giving up, and counts as `Again`** — which the control states in plain language _before_ it is pressed.

**Skip is never graded, on any type.** It emits nothing and the item leaves the session entirely, returning at its next natural due date. It is the escape hatch for a broken video, a bad moment, or a card the learner isn't ready for, and it must stay cheap enough to use honestly — a Skip that costs something is a Skip nobody presses.

**Typo tolerance is declared per module type.** Vocabulary spelling may be the objective; a long-form concept answer is not. Each type declares its own rule, once, alongside its topic-name declaration. Where tolerance applies, a near miss uses §3.3's partial encoding — accepted for scheduling, with the difference shown, so the spelling still registers without the learner being marked wrong for a missing umlaut.

#### The keyboard loop

**`Enter` checks. `Space` advances.** Two keys, deliberately, so that a repeated `Enter` can never carry a learner past a judgement they haven't read — the moment §6.10 exists to protect.

- On a self-graded card, `Enter` reveals and **`1`–`4`** apply the rating. Module-scoped single-character shortcuts are permitted by §8.8 and are documented in the module's help text; every one has a visible control besides.
- `Space` collides with **Toggle** (§7.1), and the collision is resolved by focus: where focus is inside a control that consumes `Space` — a checkbox, a radio, an option in a choice grid — `Space` toggles it and nothing else. Advance is bound at the frame, and only fires when focus is not inside such a control.
- Nothing auto-advances, on any type, ever (§11.6).

#### Ungraded modules scroll

The 14 ungraded types get **no control band and no fixed frame**. They keep the header, and their content scrolls in the normal way with a single **Continue** at the end, positioned where the primary action always sits.

This is the honest shape. A dense `diagram_schematic`, a long `timeline`, or a rotatable `model_3d` is crushed by a frame sized for a flashcard, and the two controls a fixed band would offer it are both dead — `Check` has nothing to mark and `Reveal` has nothing to show. Fifteen dead controls per session teach a learner to stop reading that region on the cards where it matters.

The cost is that the deck alternates between two card behaviours, and it is a real cost — §2.5's fixed geometry is bought by the speed loop, and where there is no speed loop there is nothing to buy. The mitigation is that **the primary action stays in the same place in both**: bottom-right, always, whether it says `Check` or `Continue`.

**Engagement, not completion.** Nothing gates Continue — a learner may pass through any ungraded module at any speed, and there is no forced interaction. But a module that was scrolled past below a **dwell threshold, scaled to its content length**, contributes nothing to the topic's mastery state in the graph (§11.7).

Three constraints on that, because a hidden metric is easy to get wrong:

- It is **the absence of a positive, never a penalty.** Brushing past leaves mastery where it was; it never reduces it.
- The clock **pauses when the tab is hidden**, so it measures attention rather than an abandoned tab.
- The threshold, and the learner's dwell time, are **tier 4 (§2.7) — never displayed, to anyone**. A visible dwell target is a number to game, and gaming it would mean sitting still, which is the least useful behaviour it could reward. It is also the honest cost of this mechanism: a fast reader who genuinely absorbed the material in three seconds gets no credit for it, which is the price of not gating anything.

### 6.11 Overlays

Four kinds, one set of shared laws. §3.6 ends by saying that anything needing a fourth elevation level is a modal; this is what a modal is.

**Shared laws.** Overlays are **opaque paper**, never veiled — they carry text and controls, so §2.5's material map applies without exception. Zero radius, structural rule, the 8px hard offset from §3.6, no drop shadow. Geometry in cell multiples. Each renders at its §2.6 layer through a root portal. Each enters under `spring.settle` and exits faster (§10.5).

| Overlay            | Trigger                                                                                        | Dismiss                               | Focus                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------ |
| **Dialog**         | Destructive or irreversible action (§7.4), first-run steps (§11.4), re-authentication (§11.13) | `Escape`, cancel control, scrim click | Trapped; returns to the opener (§8.7)                        |
| **Popover / menu** | An explicit control, never hover                                                               | `Escape`, outside click, blur         | Moves inside; not trapped; returns to the trigger            |
| **Tooltip**        | Focus, or hover after 300ms                                                                    | Blur, pointer leave, `Escape`         | Never focusable, never the sole source of an accessible name |
| **Toast**          | A system event                                                                                 | Timeout, or an explicit close         | Never takes focus                                            |

**Dialog.**

- `role="dialog"`, `aria-modal="true"`, labelled by its own `<h2>`; the rest of the document is `inert`.
- Width `8 cells` (512px) for confirmations, `12 cells` (768px) for the publish review step (§13.6). Never full-screen above `sm`.
- On `sm` it is full width less gutter and **bottom-anchored**, so the primary action stays where §2.5's diagonal terminates rather than migrating to the top of the screen.
- **Scrim:** `--ink-0` at α 0.5, flat, **no blur**. Blur here would cost a `backdrop-filter` against the §5 budget and contribute nothing to legibility (§3.5). The scrim is the one place the shader is deliberately occluded.
- `Escape` always closes, and a dialog is never the only route to something a learner needs.
- **No nested dialogs.** A dialog that needs a dialog is a wizard (§6.7).
- Confirmations name their object — "Delete _Probability Theory_?" — and the destructive control is a `destructive` button (§6.4), never the primary.

**Popover and menu.** Positioned against the trigger, flipping to stay in the viewport, never repositioning while open. Arrow keys move within a menu, `Escape` closes and restores focus to the trigger. A popover never contains a form that can't be completed in a dialog instead.

**Tooltip.** Supplementary only. If the information is required to operate the control, it is not a tooltip — it is a visible label or a description linked by `aria-describedby`. **No tooltip on touch**: long-press to reveal is undiscoverable and unreachable by assistive technology, so the label is simply visible there.

**Toast.**

- **Bottom-left.** Bottom-right belongs to the primary action (§2.5); a toast must never sit over it.
- Maximum **3** stacked, growing upward; a fourth replaces the oldest.
- **6s** default, **10s** when it carries an action. A toast offering **retry after a rollback (§7.4) never auto-dismisses** — it persists until the learner acts on it or closes it.
- The timeout pauses on hover and while focus is inside (SC 2.2.1).
- A toast never carries the only copy of anything. It is a confirmation of something already visible elsewhere, or an error that also has a durable home.

### 6.12 Response controls

What lives in the module frame's RESPONSE band (§6.10). Enumerated against all 36 module types, the set collapses to **six**, plus the handwriting canvas — which is listed here for completeness but is a carve-out (§9.3D) rather than a standard control. The point of a closed set is that a new module type must reuse one of the six or argue for a seventh.

| Control                         | Types                                                                                                                             |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **None** — reveal and self-rate | `flashcard` (single, set, generic, or Japanese)                                                                                   |
| **Single choice**               | `quiz` (including kana recognition and legacy MCQ), `discrimination`, `vocab_recognition`, `grammar_recognition`, `kanji_meaning` |
| **Text entry**                  | `vocab_production`, `kanji_reading`, `conjugation`, `grammar_production`, `transcription`                                         |
| **Cloze**                       | `particle_cloze`                                                                                                                  |
| **Ordering**                    | `sentence_scramble`, `timeline_drag_exercise`                                                                                     |
| **Map click**                   | `map_click_quiz`                                                                                                                  |
| **Handwriting**                 | `kanji_writing` — canvas, §9.3D                                                                                                   |

`globe_pin` uses the same raster map and carries the same carve-out (§9.3B), but it is **ungraded** — it is a map to explore, not a question to answer, so it scrolls with the other ungraded types and has no response control at all.

**There is no multi-select.** No registered type needs "choose all that apply", and building it would force a partial-credit model nothing currently consumes. A future type that needs it brings its own spec.

#### Single choice

The most-used control in the product, so its cost is paid the most often.

- **Select, then Check.** Picking an option selects it; Check commits it. Selection is reversible until Check, and `Check` keeps meaning exactly what it means on every other type.
- **Double-tap accelerates**: activating an already-selected option commits it directly. This is an accelerator on the §7.3 model — never taught, never prompted, never required, and the two-step path is always there.
- Options are a §8.4 composite widget: one tab stop, arrows to move, `Enter` to select. `Space` toggles the focused option rather than advancing (§6.10).
- Option order is stable within a card and never reshuffles between reveal and judgement.
- Discrimination modules carry their glyphs at the §4.3 floor — 96px for a confusable pair — and the options are sized to the glyph, not the glyph to the option.

#### Text entry

One field, an explicit visible label, `--font-mono` never (it is prose, not code). Japanese input uses the romaji converter in §4.3. Typo tolerance is declared per module type and evaluated on the resolved text, not the keystrokes.

#### Cloze

A gap inside a sentence, **typed**, with a candidate bank available on request.

- The default is production: the learner types into the gap. The bank is a **hint**, reached by an explicit control, not shown by default.
- **Using the bank caps the grade at `Hard`** (§6.10). You got there, with help, so the item returns sooner than a clean success. The interface collects this as an _assisted_ flag alongside the grade — a new value the engine must accept (§12.1).
- The gap has a minimum width of `2 cells` and does not resize as the learner types, so the sentence around it never reflows mid-answer (§2.5).

#### Ordering

- **Drag is primary**, with §7.3's eased-follow feel and the dashed snap preview.
- **Tap-to-append is the equivalent path** and is always visible: tap a token to add it to the answer row, tap it again to return it. This is also the single-pointer path that satisfies SC 2.5.7, alongside §8.5's keyboard reorder.
- The answer row reserves its full height from the start; adding a token never grows it.

#### Map click

Map click is one direct spatial task: no labelled candidate list and no labels baked into the basemap. Pointer users click; keyboard users pan and zoom, then press `Enter` to place the answer at the map centre. The response is drawn on the map. An incorrect distance appears as a small toast over the map, so judgement never adds a row or changes the card size.

### 6.13 Markdown block

Every piece of generated prose renders through one component, so generated content cannot invent its own appearance. The full CommonMark set is styled — the worker will emit all of it whether or not this document acknowledges it, and an unstyled `<blockquote>` arriving in production is how a lattice gets broken.

| Element         | Treatment                                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Paragraph       | `body`, measure capped at `62ch` prose / `48ch` in a module frame (§4.2)                                                                                                                                            |
| Headings        | `h2`–`h4` from the scale; a markdown block never emits an `h1` (§9.2)                                                                                                                                               |
| **Links**       | `--ink-0`, **1px underline**, no colour change. The underline is the channel, so SC 1.4.1 is satisfied without a second one and forced colours (§9.5) change nothing. Underline thickens to 2px on hover and focus. |
| Lists           | Markers at `--ink-2`, items on the 8px grid, nesting capped at 3                                                                                                                                                    |
| Code            | `--font-mono` on `--paper-2`, no radius; blocks scroll horizontally in their own named container (§9.2)                                                                                                             |
| Blockquote      | 2px `--rule-structural` inline-start rule, `--ink-1` text, no italics — italic is never applied to CJK (§4.3)                                                                                                       |
| Table           | Real `<table>` with §6.6's semantics, including the focusable scroll container                                                                                                                                      |
| Image           | `alt` from the worker, reviewed at publish (§13.6); never a name-based fallback                                                                                                                                     |
| Horizontal rule | Full-bleed within the block's measure, `--rule-decorative`                                                                                                                                                          |

### 6.14 The type table

Every module type against the five things a builder needs to know. `graded` and `mode` are **read from the backend registry, never decided here** (§3.2); the last three columns are this document's.

Two rules generate almost all of it, which is the point — these are not 36 independent judgements:

> **Topic rule.** The topic name is hidden exactly where **the topic names the thing being recalled**. "Chain rule" above _which rule applies here?_ is the answer printed above the question; "Rivers of Europe" above _where is the Rhine?_ is not. Where hidden, it reappears with the judgement and in the inspector rail (§7.2).

> **Tolerance rule.** **Exact** wherever the written form _is_ the objective — readings and transcription. **Tolerant** wherever the answer is meaning expressed in prose, where a typo tests typing rather than the material. **n/a** for every non-text control.

Marked ⚠ where the call is genuinely arguable rather than generated by the rules.

#### Graded — academic (4)

| Type                     | Mode        | Topic  | Tolerance | Response             |
| ------------------------ | ----------- | ------ | --------- | -------------------- |
| `flashcard`              | recognition | hidden | n/a       | none — reveal + rate |
| `quiz`                   | recognition | hidden | n/a       | single choice        |
| `timeline_drag_exercise` | production  | shown  | n/a       | ordering             |
| `map_click_quiz`         | production  | shown  | n/a       | map click            |

#### Graded — language (13)

| Type                  | Mode        | Topic      | Tolerance | Response                           |
| --------------------- | ----------- | ---------- | --------- | ---------------------------------- |
| `discrimination`      | recognition | shown      | n/a       | single choice — 96px glyphs (§4.3) |
| `kanji_meaning`       | recognition | hidden ⚠   | n/a       | single choice                      |
| `kanji_reading`       | production  | hidden ⚠   | exact     | text entry                         |
| `vocab_recognition`   | recognition | shown      | n/a       | single choice                      |
| `vocab_production`    | production  | shown      | exact     | text entry                         |
| `vocab_guess`         | recognition | shown      | n/a       | single choice — audio prompt       |
| `conjugation`         | production  | **hidden** | exact     | text entry                         |
| `particle_cloze`      | in-context  | **hidden** | exact     | cloze                              |
| `sentence_scramble`   | in-context  | shown      | n/a       | ordering                           |
| `grammar_recognition` | recognition | **hidden** | n/a       | single choice                      |
| `grammar_production`  | production  | **hidden** | tolerant  | text entry                         |
| `transcription`       | in-context  | shown      | exact     | text entry                         |
| `kanji_writing`       | production  | hidden ⚠   | n/a       | handwriting (§9.3D)                |

The bolded rows are where the topic rule bites hardest: a `particle_cloze` under the topic _"The particle に"_ has already been answered, and the same is true of every grammar and conjugation type, whose topics are named after the exact form being tested. This is the single most common way a language deck leaks its answers.

#### Ungraded — academic (17)

`text` · `summary` · `topic_card` · `diagram_schematic` · `input_output_balance` · `stat_boxes` · `key_value_pairs` · `timeline` · `common_mistakes` · `comparison_vs_similar` · `formula_equation` · `hero_image` · `globe_pin` · `model_3d`

All `in_context`. All scroll rather than using the frame, all show the topic — nothing is being recalled, so nothing can be cued — and none has a response control or a tolerance rule (§6.10).

**36 types total.** `conversion_calculator` is removed; the 15 language types and `kanji_writing` need registry rows before any of the first two columns is real (§12.1).

## 7. Interaction outline

### 7.1 Interaction verbs

The whole product is five verbs. One pointer gesture and one keyboard equivalent each ([§8.5](#85-keyboard-equivalents-for-pointer-gestures)).

| Verb       | Pointer                                    | Keyboard                   | Result                                                                                                                         |
| ---------- | ------------------------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Select** | Click                                      | `Enter`                    | Focus + inspector preview — the tier-2 reveal (§2.7). Non-destructive, no navigation.                                          |
| **Open**   | Double-click, or the explicit open control | `Enter` on that control    | Navigates: descends the graph, opens a course, activates a module.                                                             |
| **Toggle** | Click                                      | `Space`                    | Flips a binary: filter, frost a cell, theme, furigana. Inside a module frame `Space` also advances — resolved by focus, §6.10. |
| **Place**  | Drag across empty cells                    | `Enter` → arrows → `Enter` | Creates an object sized to the drag rectangle.                                                                                 |
| **Move**   | Drag by handle                             | `Space` → arrows → `Space` | Repositions or reorders an existing object.                                                                                    |

Select and Open are deliberately distinct. In a knowledge graph, previewing must not cost a navigation — a learner exploring should never lose their place by looking.

**Place and Move operate on notes, and what they produce is deliberately ephemeral.** A note's text and its anchoring topic persist; where the learner arranged it on the lattice does not, and is discarded when they leave the surface (§11.15). The gesture is still fully specified and still owes its keyboard equivalent (§8.5) — SC 2.5.7 does not care that the result is a scratch workspace.

### 7.2 Surface contracts

**Course catalogue.** Cards show title, educator, topic count, and the learner's standing. One primary action per card ("Continue" / "Start"). Filters live above the grid and write to the URL.

**Learner deck (`/courses/[id]/start`).** A card stack: the current module centred, the next two visible behind it so session depth is tangible ([§10.4D](#104-signature-motions)). Every **graded** module exposes the same four-slot control band in the same position (§6.10), with swipe as an optional accelerator on touch (§7.3); ungraded modules scroll to a single **Continue** in that same primary position. The prompt stays visible while answering. Judgement is immediate, optimistic (§7.4), and unambiguous. The correct answer is _always_ shown after an incorrect response — never just "wrong". Advancing is explicit; nothing auto-advances, because auto-advance steals the reflection moment and breaks screen-reader pacing. The content-type filter (currently stranded in the global navbar) lives here, as chips in `.k-context`. The inspector rail stays quiet while the learner is answering — §2.4 makes the card the sole focal object — and fills **after judgement** with the item's topic and the learner's notes on it (§2.7, §11.15). This is where a withheld topic name reappears (§6.10), so nothing is hidden, only deferred past the moment it would have cued the answer.

**Knowledge graph.** Topics contain topics — **and the graph is also the progress map** (§11.7). Every tile carries its mastery state, so the surface answers "where am I weak?" alongside "what exists?" Hover or select previews in the inspector; only the explicit open control descends. Descent is a **spatial zoom** — the tile scales up until it becomes the field, its children resolving inside it ([§10.4B](#104-signature-motions)) — then the new field's first tile takes focus. The animation is the explanation: containment is asserted by the breadcrumb and demonstrated by the zoom. Breadcrumbs are the sole ascent path; every crumb is a button. Depth is announced. An atomic topic shows an empty-state tile rather than an empty grid. The graph is **SVG, not canvas** — it is fully accessible and is _not_ a carve-out.

**Topic / lecture detail.** A topic is the same component here as in the graph and the deck. Content lists group by `ContentType` (§3.2), with counts. Educators see an edit affordance in place; students see the same layout without it — never a different layout.

**Authoring.** Educators create and edit against the same object vocabulary students consume. Draft state is visible on every object (`--warn`, dashed rule, "Draft" text). Publishing is explicit and confirms.

**Admin.** Tables (§6.6). Every destructive action confirms and names its object. Role changes are logged and announced.

### 7.3 Pointer, gesture, and touch

- Left button only; right-click is never captured.
- Pointer capture on every drag; `pointercancel` reverts to pre-drag state.
- 4px activation threshold — below it the gesture is a click.
- Actions fire on `pointerup`, not `pointerdown`, and `Escape` mid-gesture cancels and restores (SC 2.5.2).
- No hover-only affordance anywhere. Everything reachable by hover is reachable by focus and by tap.

**Swipe is an accelerator, never a requirement.** In the deck, swipe left/right advances or rates. Every swipe has a visible button doing the same thing in the same place, and the button is the single-pointer path that satisfies SC 2.5.7 — the gesture is never the only way to do anything. Swipe and button converge on one exit animation (§10.4), so the two paths are indistinguishable once the action commits. Swipe is not taught, not prompted, and not required for discoverability.

**Drag feel: eased follow with settle.** While held, the object trails the pointer under `--spring-drag` — a small critically-damped lag, no overshoot. The _snap preview_ (dashed rule, §3.4) jumps hard cell to cell so the commitment stays unambiguous while the object itself moves smoothly. On release the object springs into the snapped cell under `--spring-lift`. A grabbed object carries the lift affordance: `rotate(-6deg) scale(1.08)` plus the 4px hard offset from §3.6.

**The background lattice stays click-only.** No hover response, no pointer trail. It is a small toy for whoever finds it; a learner who never notices loses nothing, and an interactive background must not compete with study content for attention.

**Haptics** (mobile, off by default, one setting):

| Event                 | Pattern              |
| --------------------- | -------------------- |
| Correct               | One short pulse      |
| Incorrect             | Two short pulses     |
| Drag snap / card exit | One very short pulse |

Delivered via the Vibration API; absent silently where unsupported. Never on scroll, never on hover-equivalent, never repeated within 200ms. Haptics are a **redundant** channel — never the only signal — but they are genuinely valuable under reduced motion, where they survive unchanged (§10.6).

### 7.4 Optimistic commit and rollback

Every action commits to the UI immediately and reconciles when the server answers. The learner loop runs at the speed of thought; a card advance never inherits network latency.

- `pending` is **visually identical to committed**. A pending state that looks different is just a slower spinner.
- On rejection, the object springs back under `--spring-settle` and an **assertive** toast names what failed and offers retry. A silent rollback is worse than a spinner — the user must see the reversal happen.
- Rollback restores focus context: if the user has moved on, the toast is the only interruption and focus does not jump backwards.
- **Carve-out:** destructive and irreversible actions (delete, publish, role change) stay pessimistic and confirm first. Optimism is for actions that can be undone; there is nothing to roll back to after a delete.
- **An expired session is not a rejection.** A `401` holds the queue rather than rolling it back, and re-authentication happens in place — §11.13. This is the one failure mode that can silently cost a learner real work, so it is specified as a state rather than left to the HTTP layer.

Every optimistic surface must have its rollback state designed and screenshotted before it ships. This is the half of the pattern that normally gets skipped.

---

## 8. Keyboard traversal and focus order

Normative. A component that fails this section does not ship.

### 8.1 Global tab order

DOM order equals visual order equals tab order, on every surface. **No positive `tabindex` anywhere in the codebase.**

```
1. Skip links (visible on focus)
2. Brand / home
3. Primary nav
4. Context status (not focusable — live region only)
5. Theme toggle
6. Account menu
7. main: head → context nav → work region → inspector
8. Footer
```

### 8.2 Skip links

Every surface provides, in order:

1. "Skip to main content" → `#k-main`
2. "Skip to <the instrument>" → the work region

Skip links are the first focusable elements, hidden by transform until focused, and land on an element with `tabindex="-1"` so focus actually moves.

### 8.3 Consistent help

Per SC 3.2.6, the help affordance sits in the same position in the topbar on every surface, for every role. It is never reordered, never hidden behind a role check.

### 8.4 Composite widgets and roving tabindex

Any grid of more than ~10 similar controls is **one tab stop**, navigated by arrows: the background lattice, the graph's topic field, filter chip groups, in-module option grids, tablists.

| Key                      | Behaviour                                                                   |
| ------------------------ | --------------------------------------------------------------------------- |
| `Tab` / `Shift+Tab`      | Enters at the last-focused (or first/selected) item; exits the whole widget |
| `←` `→`                  | Previous / next in row order                                                |
| `↑` `↓`                  | Same column, previous / next row (2D grids only)                            |
| `Home` / `End`           | First / last in row                                                         |
| `Ctrl+Home` / `Ctrl+End` | First / last in grid                                                        |
| `Enter`                  | Select (or Open where the grid has one action)                              |
| `Space`                  | Toggle                                                                      |
| `Escape`                 | Move focus to the widget container                                          |

Arrow navigation does **not** wrap. Wrapping in a spatial grid disorients; a hard stop teaches the boundary. The container carries `role="grid"` (or `role="group"` for non-tabular sets) and an `aria-label`.

### 8.5 Keyboard equivalents for pointer gestures

SC 2.5.7 _Dragging Movements_ is AA in WCAG 2.2 and applies to note placement, note moving, timeline ordering, sentence scramble, and map selection. Every drag has a single-pointer _and_ a keyboard path.

**Place** (drag-to-create):

1. Focus an empty cell → `Enter` enters placement mode
2. Arrows extend the rectangle from the anchor; the system snaps to the nearest legal size
3. `Enter` commits · `Escape` cancels and restores focus to the anchor
4. Announce: `"Note, 2 by 2 cells, column 5 row 3. Enter to place."`
5. Illegal placements announce `"Blocked by <what>"` and do not commit

**Move** (drag-by-handle):

1. Focus the handle → `Space` grabs. Announce `"Grabbed. Arrows to move, Space to drop, Escape to cancel."`
2. Arrows translate by one cell
3. `Space` drops · `Escape` reverts to the original position
4. Announce final coordinates on drop

**Reorder** (timeline drag, sentence scramble): focus an item, `Space` grabs, arrows reorder, `Space` drops, `Escape` reverts. Announce `"Moved to position 3 of 6."`

**Map square:** see [§9.3](#93-canvas-carve-outs) — arrows pan, `+`/`−` and the wheel zoom, and `Enter` places the map centre.

### 8.6 Focus appearance

```css
:focus-visible {
  outline: 2px solid var(--ink-0);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px var(--paper-0); /* outer ring, survives any backdrop */
  border-radius: 0;
}
```

The two-ring construction is required: a single ink ring vanishes over a dark gradient stop, a single paper ring vanishes over a light one. Together they survive every state the shader can produce.

We adopt SC 2.4.13 _Focus Appearance_ as an internal rule despite it being AAA: ≥2px thick, fully enclosing, ≥3:1 against both focused and unfocused states. Focus indication is never removed. `:focus-visible` spares pointer users rings they didn't ask for — but keyboard focus is always drawn.

SC 2.4.11 _Focus Not Obscured_ is satisfied structurally by the scroll-padding rule in §2.3. Any new sticky or overlay element must re-verify it.

### 8.7 Focus management on state change

| Event                   | Focus goes to                                    | Announcement                                             |
| ----------------------- | ------------------------------------------------ | -------------------------------------------------------- |
| Route change            | The new `<h1>` (`tabindex="-1"`)                 | Polite: page name; `document.title` updated              |
| Graph descend / ascend  | First tile of the new field                      | Polite: `"<Topic>, level N, M topics"`                   |
| Module activate         | The module's first control                       | Polite: `"<Module> open"`                                |
| Module close            | The module's header button                       | —                                                        |
| Wizard step change      | The step's `<h2>`                                | Polite: `"Step 2 of 5, <name>"`                          |
| Dialog open             | First focusable inside; trapped; `Escape` closes | `role="dialog"` + `aria-modal` + labelled                |
| Dialog close            | The element that opened it                       | —                                                        |
| Filter / search change  | Stays put                                        | Polite: `"N results"`, debounced 250ms                   |
| Judgement rendered      | Stays put                                        | Assertive: `"Correct"` / `"Not quite. The answer is X."` |
| Milestone reached       | Stays put — never interrupts input               | Polite: `"<Topic> mastered"`                             |
| First-run step advances | Into the new step's dialog                       | Step heading; `Escape` exits and restores prior focus    |
| Toast appears           | Stays put                                        | Polite; assertive only for errors                        |
| Item deleted            | Nearest sibling, else the container              | Polite: `"<Object> removed"`                             |

Focus is never moved on a keystroke the user didn't intend as navigation, and never trapped outside a dialog.

### 8.8 Shortcuts

Single-character shortcuts are avoided (SC 2.1.4). Where a study module benefits from one, it is active **only** while focus is inside that module, is documented in the module's help text, and every action has a visible control besides.

The system uses exactly one such set: **`1`–`4` apply Again / Hard / Good / Easy** on a self-graded card, after reveal and never before (§6.10). Each maps to a visible button in the control band, so the shortcut is an accelerator for a learner rating hundreds of cards and never the only path.

Global: `Escape` always retreats one level of engagement — cancel a gesture, close a module, exit a composite widget, close a dialog. That is the only global binding.

---

## 9. Accessibility standards

### 9.1 Commitment

WCAG 2.2 Level AA across all surfaces and all four roles. Common Sage today reports **0 axe violations against WCAG 2.0/2.1 A+AA** — a real baseline worth preserving. 2.2 adds obligations that baseline does not cover: **2.4.11** (focus not obscured), **2.5.7** (dragging), **2.5.8** (target size), **3.2.6** (consistent help), **3.3.7** (redundant entry), **3.3.8** (accessible authentication). Each is addressed above.

### 9.2 Rules that follow from the design

- **Contrast** — guaranteed by the closed ramp (§3.1) and the veil law (§3.5). Any pair not in this document is measured before use.
- **Non-text contrast (1.4.11)** — structural rules and focus rings ≥3:1. Meaningful boundaries never use `--rule-decorative`.
- **Colour alone (1.4.1)** — every state carries glyph + text + rule alongside hue (§3.3).
- **Target size (2.5.8)** — the grid sets 48×48 (§6.2), which clears the 44px recommendation and the 24×24 floor. Audit the small chrome anyway.
- **Zoom & reflow (1.4.4, 1.4.10)** — 320px and 200% with no horizontal page scroll. Wide artefacts scroll in their own named, focusable container.
- **Text spacing (1.4.12)** — no fixed heights on text containers.
- **Names and roles (4.1.2)** — every control's accessible name contains its visible label. Icon-only buttons carry `aria-label`; decorative SVG is `aria-hidden`.
- **Headings (1.3.1, 2.4.6)** — one `h1`, no skipped levels, module frames start at `h2`.
- **Language (3.1.1, 3.1.2)** — `lang` on `<html>`, switching with the interface locale (§4.4); `lang="ja"` on every Japanese string (§4.3).
- **Time-based media (1.2.1, 1.2.2, 1.2.5, 1.4.2)** — captions, transcripts, audio description, no autoplay (§6.9). Captions gate publishing.
- **Redundant entry (3.3.7)** — no step, session, or wizard re-asks for what was already given.
- **Consistent help (3.2.6)** — §8.3.
- **Error identification (3.3.1, 3.3.3)** — §6.8.
- **Authentication (3.3.8)** — §6.8.

### 9.3 Canvas carve-outs

Exactly three components cannot be made fully conformant as canvas alone. The knowledge graph is **not** among them — it is SVG and fully accessible; keep it that way.

**A. The shader gradient.**
_Exception:_ the WebGL canvas is not exposed to assistive technology.
_Mitigations, all required:_ `aria-hidden`, not focusable, not in tab order · carries **zero** information · a CSS-gradient underlay from the same palette renders before WebGL is up and instead of it when WebGL is absent · `prefers-reduced-motion` pins it to a still frame, not a blank box · everything above it obeys the veil law · a user-facing "reduce background motion" control exists independent of the OS setting.

**B. The raster map** (`map_click_quiz`, `globe_pin`).
_Exception:_ the Leaflet map is `role="application"` and its pan/zoom is not fully expressible in ARIA.
_Mitigations, all required:_ entering is explicit and `Escape` always exits to the container — no keyboard trap under any circumstance · arrows pan and zoom controls remain operable · `Enter` places the current map centre, giving keyboard users the same unlabelled spatial task rather than a multiple-choice substitute · the accessible name and hidden instruction state the interaction model · correct and selected points differ in weight and pattern, not only colour.

**C. The 3D model** (`model_3d`).
_Exception:_ the rotatable WebGL object is not describable in ARIA.
_Mitigations:_ a static representative image with real `alt`, a text description of what rotation reveals, and keyboard rotation with announced orientation. The learning objective must be satisfiable from the text alone.

**D. Handwriting** (`kanji_writing`).
_Exception:_ a drawing surface cannot be expressed in ARIA, and stroke capture has no keyboard equivalent — you cannot write a character with arrow keys in any meaningful sense.
_Mitigations, all required:_ the canvas is `aria-hidden` with the module's prompt and state carried in real text beside it · **the module type is optional and never blocking** — a learner turns handwriting off in `/me/settings` and those items are simply not served · undo per stroke, and clear, both as real buttons · the judgement states in words which of shape, order, or direction was wrong, never only by redrawing the character.

_How the discipline is met, honestly._ The other three carve-outs supply an equivalent path to the same item. This one does not — instead it relies on `kanji_writing` being **one practice rung on a concept that other types also cover**. The same kanji is served by `kanji_reading`, `kanji_meaning`, and `vocab_production`, so opting out makes no material unreachable and no topic unmasterable. The residual cost is real and stated rather than hidden: **a learner who opts out never practises writing.** That is a skill they have chosen not to train, not a barrier the interface imposed — which is the distinction that makes this acceptable where a blocking canvas would not be.

_Grading:_ shape **plus stroke order and direction**, which is the reason to build it at all — a learner who draws the right shape in the wrong order has learned the habit the exercise exists to prevent. "Right character, wrong stroke order" needs no new judgement state: it is §3.3's `--warn` partial case, with the dashed rule and "Partly right".

**Discipline:** this is the complete list. A fifth requires the same treatment — a written exception, either an equivalent non-canvas path or a demonstration that the objective is covered elsewhere, and proof no material becomes unreachable.

### 9.4 Live regions

| Region         | Politeness                    | Content                                  |
| -------------- | ----------------------------- | ---------------------------------------- |
| Context status | `polite`                      | Active module, step, session state       |
| Result counts  | `polite`                      | Filter/search totals, debounced          |
| Judgement      | `assertive`                   | Correct / incorrect + the correct answer |
| Gesture coach  | `polite`                      | Placement, move, reorder feedback (§8.5) |
| Toasts         | `polite` (errors `assertive`) | Transient confirmations                  |

One assertive region per surface, maximum.

### 9.5 User preference contracts

Three OS-level preferences change how this system renders. Each is a **contract with named substitutes**, never a kill switch — the same principle in all three cases: the preference removes a channel, so the information that channel carried moves to another one.

**Motion.** `prefers-reduced-motion: reduce` — [§10.6](#106-reduced-motion-contract). Every signature motion has a named substitute, not a deletion.

**Transparency.** `prefers-reduced-transparency: reduce`:

| Element              | Substitute                                                  |
| -------------------- | ----------------------------------------------------------- |
| Veiled paper (§5)    | `--veil` goes to `1.0`. Opaque `--paper-1`.                 |
| Frost                | Flat `--paper-1` fill; no `backdrop-filter`.                |
| Dialog scrim (§6.11) | Unchanged — it is already flat, and occlusion is the point. |
| Shader gradient      | Unchanged. It is behind everything and carries nothing.     |

Nothing is lost, because the veil never carried information — it was always atmosphere (§1, law 2). This preference makes the product _more_ legible, and it is the cheapest of the three to honour.

**Contrast.** `prefers-contrast: more`:

| Element                           | Substitute                                                  |
| --------------------------------- | ----------------------------------------------------------- |
| `--rule-structural`               | Floors rise to `0.75` light / `0.65` dark                   |
| `--rule-decorative`               | Background lattice hidden entirely                          |
| `--ink-2`                         | Resolves to `--ink-1` — the tertiary tier collapses         |
| Accent surface tints (≤12%, §3.2) | Drop to 0. Content type is carried by icon and label alone. |
| `--veil`                          | `1.0`, as with reduced transparency                         |

**Forced colours.** `forced-colors: active` (Windows High Contrast and equivalents) is the hardest case, because the system's entire visual vocabulary — a closed custom-property ramp, hairline rules, and a hard offset — is exactly what forced-colors overrides. The design survives it only if the following hold, and they are design constraints, not CSS afterthoughts:

- **Boundaries are real `border`s.** §3.4 already specifies `1px solid` from `currentColor` rather than `box-shadow` or a background sliver — borders map to `CanvasText` and survive; the alternatives vanish. Any component that draws an edge some other way is broken here.
- **The 8px hard offset disappears** (`box-shadow` is dropped). The "currently manipulating" state (§3.6, level 3) must therefore also carry a `Highlight` outline, which is its forced-colors substitute.
- **The six content-type accents collapse to one colour.** §3.2's identity channel is gone, and the icon and text label — already required as the second channel — become the _only_ channel. This is the concrete reason accents may never be the sole encoding.
- **`--ok` / `--warn` / `--err` collapse likewise.** The glyph, the rule, and the text from §3.3's table carry the state unaided.
- **Focus uses `outline`, which is preserved.** §8.6's two-ring construction relies on `box-shadow` for its outer ring; under forced colours the outline alone must satisfy the requirement, at `outline-color: Highlight`. Verify this specifically — a focus ring that exists only as a shadow is invisible here.
- `forced-color-adjust: none` is permitted in exactly one place: the shader gradient's CSS fallback, which is decorative. Nowhere else — opting out of forced colours to preserve a brand is the failure this mode exists to prevent.

Add a forced-colours pass to the §9.6 release list.

### 9.6 Verification

Automated tooling is a floor, never the standard. Common Sage's tabs pass axe with **zero** violations while having no arrow-key navigation, no `tabpanel`, and in one case no tab roles at all (§6.5). Per release, in order:

1. **Keyboard-only pass** of every surface plus five sampled modules: reach everything, activate everything, escape everything, never lose the ring.
2. **Screen reader pass** (VoiceOver + Safari, NVDA + Firefox) of one full learner session and one authoring flow, end to end — including the first-run guided pass, which must be skippable and escapable from step one.
3. **Japanese rendering pass** — verify `lang="ja"` coverage, no synthesized bold on CJK, ruby rendering, and size floors (§4.3).
4. **Contrast audit** of any colour pair added since the last release.
5. **Reflow** at 320×256 and 200% zoom, **in German** — the locale that actually breaks layouts (§4.4).
6. **Media pass** — captions present and synchronised, transcript in the DOM, controls keyboard-operable, nothing autoplays.
7. **Reduced-motion** pass with the OS setting on — verify every signature motion uses its §10.6 _substitute_, not a deletion.
8. **Forced-colours pass** (Windows High Contrast, and `prefers-contrast`/`prefers-reduced-transparency` alongside it) — every boundary still visible, focus ring drawn, and no state legible by colour alone (§9.5).
9. **Interruption pass** — reverse each signature motion mid-flight (flip back at 50%, swipe and release below threshold, descend then immediately ascend). Nothing may restart, jump, or queue.
10. **axe** last, as a regression net.

The existing `Refactor report/UX_report.md` (2026-07-23) is **not** a reliable input — four of its findings failed to reproduce under measurement, per `SESSION_FINDINGS.md`. Re-audit against current code before scheduling work from it.

---

## 10. Motion

### 10.1 Character

**Things in Kite have mass.** They accelerate, overshoot slightly, and settle. Nothing snaps to a stop and nothing eases mechanically into place. This is a deliberate counterweight to the square, hairline, zero-radius visual language: the surface is rigid and Swiss, the behaviour is physical and warm. The interface looks like a precision instrument and moves like an object.

Two consequences that govern everything below:

**Motion is interruptible, always.** A spring redirected mid-flight continues from its current position _and velocity_. An animation that restarts, jumps, or must finish before accepting new input is a bug, not a timing choice. This is the whole reason the system is spring-based rather than duration-based — a half-flipped card that reverses must reverse from where it is, at the speed it's moving.

**Springs govern space; durations govern colour.** Position, scale, and rotation are sprung. Colour, opacity, and border transitions are not — a colour has no momentum, and a sprung colour just looks like a slow colour. Non-spatial changes run at a flat **90ms**.

### 10.2 Spring tokens

`motion/react` is the animation runtime. Springs are declared with `visualDuration` + `bounce` rather than stiffness/damping — the former is designable, the latter is guesswork.

```ts
export const spring = {
  snap: { type: 'spring', visualDuration: 0.15, bounce: 0 }, // press, toggle, chip
  settle: { type: 'spring', visualDuration: 0.3, bounce: 0.15 }, // default: panels, tiles, arrival
  lift: { type: 'spring', visualDuration: 0.45, bounce: 0.25 }, // cards, drag release, deck advance
  stage: { type: 'spring', visualDuration: 0.6, bounce: 0.1 }, // route transitions, graph descent
  drag: { type: 'spring', visualDuration: 0.12, bounce: 0 }, // follow-lag while held
  ambient: { type: 'spring', visualDuration: 0.8, bounce: 0 }, // palette morph
} as const
```

`bounce: 0` is critically damped — no overshoot, still physical. Only `lift` and `settle` overshoot, and `lift` is the most expressive thing in the system.

`--dur-flat: 90ms` covers every non-spatial transition. There are exactly two timing systems and no third.

Set `<MotionConfig reducedMotion="user">` at the root so §10.6 is enforced by default rather than remembered per component.

### 10.3 The shared control response

Per the "one systematic response" rule, **every** interactive control — button, chip, checkbox, toggle, tab, tile, card — uses the same press behaviour. No per-control character.

```
press:   scale 0.98 + paper-2 fill     (spring.snap, colour at --dur-flat)
release: scale 1                       (spring.snap)
```

That is the entire micro-interaction vocabulary. A checkbox does not draw its mark, a toggle knob does not overshoot independently, a button does not depress differently from a chip. Motion character is spent on content and navigation, not on controls.

### 10.4 Signature motions

Six motions carry the product's character. Everything else uses `spring.settle` and needs no specification.

**A. Card lift-and-flip** — the flashcard reveal.

Not a flat spin. The card _lifts off the plane, turns, and settles back down_, the way a hand picks a card up to look at it.

| Axis         | From → to     | Spring             | Notes                              |
| ------------ | ------------- | ------------------ | ---------------------------------- |
| `rotateY`    | 0 → 180deg    | `lift`             | The turn                           |
| `translateY` | 0 → -24px → 0 | `lift`, ~40ms lead | Begins _before_ the rotation       |
| `scale`      | 1 → 1.04 → 1  | `settle`           | Tracks the lift; suggests approach |

The axes run on **separate springs with different damping**, so they do not move in lockstep. That desynchronisation is the entire physical tell — matched axes read as a mechanical rotation, offset axes read as a hand.

Container gets `perspective: 1200px`; faces get `backface-visibility: hidden` inside `transform-style: preserve-3d`. Flipping back mid-flight redirects from current velocity — it never restarts and never queues.

**B. Graph spatial zoom** — descent enacts containment.

The selected tile scales from its measured cell rect until it fills the field; its children resolve inside it; siblings fade and drop away. `spring.stage`, driven by a FLIP measurement of the tile's rect. Ascent is the exact inverse — the field contracts back into its tile in the parent.

This is the only place where the animation _is_ the explanation. "Topics contain topics" is asserted by the breadcrumb and demonstrated by the zoom. Focus moves to the first child tile after settle (§8.7).

**C. Directional route transitions.**

Movement encodes hierarchy. Forward/descend enters from `+X`; back/ascend from `-X`; going a level deeper adds a slight scale-up. `spring.stage`.

**The topbar and the lattice never transition.** They persist across every route change, which is what makes the whole product feel like one continuous plane rather than a set of pages.

**D. Card-stack deck advance.**

The next two items sit visibly behind the current one, offset `8px` on Y at scale `0.98` and `0.96`. The answered card exits under `spring.lift` with a slight rotation; the stack promotes, each card springing up one position.

Swipe drags the top card 1:1 horizontally. Past the commit threshold it exits in that direction; below it, it springs back. **The buttons trigger the identical exit**, so gesture and button are indistinguishable once committed.

**E. Judgement — restrained but felt.**

| Outcome   | Motion                                                                                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Correct   | A brief accent wash across the module frame + the 2px rule drawing in. `spring.settle`. No scale, no bounce, no celebration.                                 |
| Incorrect | A **brief shake**: damped oscillation on X, 3 cycles, ±6px, ~320ms, high bounce decaying fast. Then the correction springs in beneath under `spring.settle`. |

The shake fires **once per item, never repeated**, and only on the module frame — never the page. Correct is quieter than incorrect on purpose: momentum through what's known, attention on what isn't.

**F. Milestone and stopping — the two expressive moments.**

Sessions are open-ended (§11.6), so there is no queue exhaustion to celebrate. Expressiveness attaches to two events of deliberately unequal weight.

_Milestone — short form._ A topic reaches mastery:

- A brief settle on the card, the mastery mark drawing in under `spring.lift`
- Resolves inside `spring.settle`; **never blocks or delays the next card**
- Polite announcement — the learner did not ask a question
- **At most one per session** (§11.8). Later milestones are recorded and reported at stopping, not celebrated in place.

_Stopping — full form._ The learner ends the session:

- The deck's motion stops entirely — the register change is itself the signal
- Summary sections assemble on a stagger under `spring.lift`
- Numbers count up (`tabular-nums`, so nothing jitters)
- The gradient resolves to a settled palette

The full form is the sole exemption from "one thing moves at a time" in §10.5. The short form is not — a milestone never fires while anything else is moving.

Neither form scales with quantity. Four cards and forty cards get the same summary treatment; only the numbers differ (§11.6).

### 10.5 Choreography

- **Stagger is hard-capped.** First 6 items at 40ms increments; everything after arrives with the 6th. Thirty staggered items is over a second of nothing. Never stagger exits, and never trigger entrance on scroll — content must exist before it is scrolled to, or find-in-page and screen-reader scanning break.
- **Exits are faster than entrances.** Users wait for arrivals, not departures.
- **One thing moves at a time**, except session completion.
- **Never animate the answer.** A judgement resolves within `spring.settle`. Nothing about revealing a correct answer is slow or coy.
- **Skeleton shimmer** sweeps at 1.6s linear, low contrast, over a `paper-2` skeleton at final dimensions. After **10 seconds** the skeleton is replaced by an explanatory state — a shimmer that never resolves is a lie about progress.
- **Idle attention direction.** After 45s of no input inside an active module, the primary control breathes (`scale 1 → 1.02 → 1`, `spring.settle`), once every 12s, **maximum 3 times, then it stops**. Never on a resting surface, never in authoring or admin, never moves focus, never announces. A nudge that repeats forever is nagging.

### 10.6 Reduced-motion contract

`prefers-reduced-motion: reduce` is a contract, not a kill switch. `<MotionConfig reducedMotion="user">` enforces the spatial half automatically; the substitutions below are deliberate and must be written per component.

| Signature motion                                  | Reduced-motion substitute                                                       |
| ------------------------------------------------- | ------------------------------------------------------------------------------- |
| Card lift-and-flip                                | Cross-fade between faces. No rotation, no lift.                                 |
| Graph spatial zoom                                | Cross-dissolve between fields.                                                  |
| Directional route transition                      | Instant swap.                                                                   |
| Card-stack advance                                | Replace in place.                                                               |
| Incorrect shake                                   | **Hold and settle** — the frame settles firmly, the correction appears beneath. |
| Milestone (short form)                            | Mastery mark appears at full opacity; no settle. Announcement unchanged.        |
| Stopping summary (full form)                      | Everything arrives at once; numbers land final.                                 |
| Skeleton shimmer                                  | Static skeleton.                                                                |
| Idle breathe                                      | Suppressed entirely.                                                            |
| Shader drift, palette morph, frost decay, stagger | Stopped; still frame, instant swap.                                             |

**Survives unchanged** — focus ring rendering · the 90ms colour feedback on press and toggle · judgement appearance as an opacity fade · progress and counter updates · toast appearance · **haptics**.

Haptics deserve emphasis: under reduced motion they become _more_ valuable, not less, because they replace a channel the user has switched off. They are not motion.

A blanket `animation: none !important` removes the feedback that tells a learner their answer registered. Reduced motion means _less movement_, not _less information_.

The transparency, contrast, and forced-colours contracts are the same principle applied to the other three preferences — §9.5.

### 10.7 Performance budget

- 60fps during any interaction. Per-frame values are written to `style` directly; routing them through React state re-renders the tree at frame rate.
- Springs animate `transform` and `opacity` only. `filter`, `backdrop-filter`, and layout-triggering properties are never sprung — module open/close is the single exception and is the slowest thing in the system.
- ≤4 `backdrop-filter` elements per surface.
- Render scale capped at 1× on phones, 1.25× on tablets.
- The WebGL bundle stays behind a lazy boundary and never enters the initial chunk.
- Scroll-linked values quantised (~120 buckets) before reaching React state.
- The card stack renders at most 3 cards; the rest of the queue is not mounted.

---

## 11. UX flow

### 11.1 Roles

| Role         | Home          | Can                                                                                     |
| ------------ | ------------- | --------------------------------------------------------------------------------------- |
| **Student**  | `/me`         | Study, explore the graph, read topics, see their own progress                           |
| **Educator** | Owned courses | Everything a student can, plus author courses, lectures, topics; publish; see analytics |
| **Admin**    | Admin tables  | Manage courses, lectures, users, roles                                                  |
| **Service**  | _(no UI)_     | Writes generated content; its output appears as authored objects                        |

One vocabulary across all three human roles. An educator viewing a topic sees the _same_ topic component a student sees, plus an edit affordance — never a different layout.

### 11.2 Route map

```
/login  /register  /verify              auth
/forgot  /reset                         password recovery
/                                       role-aware landing → /me for students
/me                                     personal home: what's due, recent, next action
/me/progress                            mastery across all courses
/me/notes                               every note this learner has written (§11.15)
/me/settings                            preferences
/courses                                catalogue (enrolled | owned | all, by role)
/join/[code]                            join-code redemption, survives the auth detour (§11.16)
/courses/new  ·  /courses/new/[id]      authoring wizard
/courses/[id]                           course overview
/courses/[id]/start                     the deck  ← the core surface
/courses/[id]/graph                     knowledge graph + progress map
/courses/[id]/progress                  educator analytics (course / topic / student)
/courses/[id]/edit                      course authoring
/lectures/[id]  ·  /lectures/[id]/edit  lecture
/topics/[id]                            topic detail
/admin/courses · /admin/lectures · /admin/users
```

Everything under `/me` and `/courses/[id]/progress` is backed by endpoints that **already exist** — `/me/courses`, `/me/lectures`, `/me/topics-progress`, `/courses/{id}/topics-progress`, `/courses/{id}/pillar-proficiency`, `/courses/{id}/users`. Unlike notes (§12.1), this is capability with no interface rather than interface with no capability.

### 11.3 Auth flow

```
register → verify email → login → role-aware landing
                            ↑
              forgot → reset link → new password
```

Bound by §6.8. The verify screen handles the three real cases explicitly: link valid, link expired (with a resend action), and link opened in a different browser — which must still work. No cognitive function test anywhere in the path.

**Password recovery** (`/forgot`, `/reset`) is the same flow with sharper obligations:

- `/forgot` **reports the same message whether or not the address exists.** "If an account exists for that address, a reset link is on its way." Account enumeration through differential responses is the standard failure here, and it is a design decision as much as a backend one, because the copy is what leaks.
- The message states **how long the link is valid**, in words, before the learner goes looking for it.
- The reset link works **in a different browser** than the one that requested it — same rule as verification, same reason.
- `/reset` uses `autocomplete="new-password"`, permits paste (SC 3.3.8), and carries the §6.8 show/hide toggle. Password requirements are stated **before** the field, not revealed by failing validation.
- An expired or already-used link lands on a screen that says which of the two it was and offers a single control to request another. Never a bare error.
- Completing a reset **signs out other sessions and says so**, in one sentence, on the screen that follows.

### 11.4 First run

A **guided pass** on first entry to each of the three non-obvious surfaces — the deck, the graph, and the notes lattice. The catalogue and topic views are self-evident and get nothing.

Rules, because guided passes are usually done badly:

- **Skippable from the first step**, with the skip control focusable first, not last.
- **Re-runnable** from the help affordance, so skipping costs nothing.
- **Never a keyboard trap.** `Escape` exits at any point and returns focus to where the learner was.
- Each step is a `role="dialog"` with a real heading, focus moved into it, focus returned on exit.
- **Maximum three steps per surface.** A fourth means the surface needs redesigning, not more explaining.
- Shown once per surface per account, tracked server-side — not in `localStorage`, or it re-fires on every new device.
- The pass explains _what the surface is for_, not _which button does what_. If a control needs explaining, §6 has failed.

Swipe (§7.3) is deliberately **not** taught. It is an accelerator; discovering it is a bonus, and prompting for it would imply the buttons are the slow path.

### 11.5 The `/me` home

The returning student's landing page, and the answer to "what should I do right now?"

- **What's due**, across all enrolled courses — not per-course, because a learner in four courses otherwise has four places to check.
- **One primary action**, bottom-right per §2.5: start studying whatever is most due.
- Recent activity, and a link into `/me/progress`.
- Empty state for a learner enrolled in nothing points at the catalogue.

### 11.6 The learner loop

Sessions are **open-ended**. There is no system-imposed length and no queue exhaustion the learner is expected to reach.

```
Arrive → Orient → [ prompt → respond → judge → grade → advance ] → stop when done
                            ↑                                │
                            └────────── next item ───────────┘
                                             │
                                      milestone (occasional)
```

1. **Arrive** — the deck renders at rest. Nothing auto-plays.
2. **Orient** — the context status states the current state in words.
3. **Respond** — prompt visible, response control focused, four fixed slots in fixed positions (§6.10). On an ungraded module this step is reading or manipulating rather than answering, and the loop skips straight to advance.
4. **Judge** — immediate, optimistic (§7.4), unambiguous. The correct answer is _always_ shown after an incorrect response. Assertive announcement.
5. **Grade** — the step that used not to be here. On an objectively graded module the system supplies it and the learner does nothing; on a self-graded one the learner supplies it as **Again / Hard / Good / Easy**, and it is the same keystroke that advances (§6.10). The engine consumes the grade; how it turns into an interval is out of scope (§0).
6. **Advance** — explicit, never automatic.
7. **Stop** — whenever the learner chooses. The summary reflects whatever was actually done, without implying a target was missed.

**Never shame a short session.** A learner who does four cards gets a summary that reports four cards, not a progress bar showing 4/20. There is no target to fall short of.

**The practice ladder is invisible.** The backend rotates practice mode — recognition → production → in-context — as stability grows (`laddering.py`), which is why the richer visual modules appear when they do. The learner experiences this as the work changing character over time. **The frontend must not surface, name, or visualise the rung.** No "level 2 of 3", no ladder indicator, no explanation. Do not build a UI for it; that it is felt rather than shown is the design.

### 11.7 Progress and mastery

Two surfaces, deliberately different in kind.

**The graph is the progress map.** Each topic tile carries its mastery state, so the graph answers "where am I weak?" as well as "what exists?" This is the higher-value of the two: a learner steering their own effort wants to see weakness in the structure of the subject, not in a list.

- Mastery is encoded on the tile by fill weight **and** a text label — never colour alone (§3.3).
- Unstarted, in progress, and mastered are three states, not a percentage. A percentage invites optimising the number.
- **Ungraded modules move a topic to _in progress_, never to _mastered_** — and only when actually engaged with, per §6.10's dwell threshold. Reading a diagram is real study and should show; it is not evidence of recall, which only a graded module can supply. A topic whose material is entirely ungraded therefore tops out at _in progress_, which is honest rather than a gap to fix.
- An educator sees the same graph with an aggregate overlay (§11.10), never a student's individual state by default.

**`/me/progress` is the full picture** across courses: topic mastery, and the pillar breakdown from `/courses/{id}/pillar-proficiency` — "strong on Facts, weak on Processes." That breakdown is the most actionable thing the system knows about a learner and currently renders nowhere.

One caveat carried from the backend: a pillar with zero reviews is **not begun**, not a weakness. It must never be shown as a deficit, or the interface steers learners away from new material — the exact failure `weakest_subtype` already guards against.

### 11.8 Milestones and stopping

Two registers, deliberately unequal.

|           | Milestone                    | Stopping                 |
| --------- | ---------------------------- | ------------------------ |
| Trigger   | A topic reaches mastery      | Learner ends the session |
| Register  | Brief, in-place, on the card | Full summary surface     |
| Motion    | §10.4F, short form           | §10.4F, full form        |
| Frequency | Rare by nature               | Every session            |

**The guardrail matters more than the celebration.** Two reward registers is the configuration that becomes a slot machine if unbounded, so:

- **At most one milestone celebration per session.** Subsequent milestones are recorded and reported in the stop summary, not celebrated in place.
- A milestone never interrupts input. It resolves within `spring.settle` and never blocks or delays the next card.
- Milestones announce politely, never assertively — the learner did not ask a question.
- No streaks, no points, no badges, no daily-goal ring. The milestone is "you now know this," which is true and worth saying. Nothing else is.

**What the stop summary contains** — the last thing a learner sees every session, so it is specified rather than assembled from whatever was handy:

1. **Time studied**, and **modules answered · topics touched**. Counts with no denominator (§2.7).
2. **What moved** — any topic that reached mastery this session, including milestones held back from in-place celebration (one per session, above).
3. **What was weaker** — the topics that went badly, named. This is the one interpretive element, and it earns its place by being the only thing here a learner can act on tomorrow.
4. One control to finish, one to continue.

The register stays factual. "You studied for 14 minutes · 34 modules · 6 topics" reports what happened; it never compares the session to a target, to another session, or to anyone else. And the summary appears **because the learner chose to stop** — so the continue control is offered once, plainly, and never argued for.

### 11.9 The authoring loop

```
New course → source upload → review generated structure → edit → publish
```

The wizard (§6.7) carries the flow. Draft state is visible on every object. Publishing is explicit, confirms, states what becomes visible to whom, and **is gated on captions for any video content** (§6.9).

Generation pipeline states — queued, running, failed, dead-lettered — are out of scope for v1 (§0). What v1 commits to: a generation in progress never blocks the interface, and its status is reachable from the course it belongs to.

### 11.10 Educator analytics

Three levels, at `/courses/[id]/progress`:

| Level       | Answers                                                                       |
| ----------- | ----------------------------------------------------------------------------- |
| **Course**  | Is this course working? Enrolled count, average completion, distribution      |
| **Topic**   | Which material is failing? Weakest topics, pillar breakdown across the cohort |
| **Student** | Who needs help? Per-learner progress within this course                       |

**Tables first.** Analytics render as real tables (§6.6) by default — sortable, scannable, screen-reader native, and copyable into whatever an educator actually plans lessons in. A chart appears only where shape genuinely beats digits: a cohort distribution, or a weakest-topics ranking where the gaps between bars carry the point. Where a chart appears it is a **horizontal bar or a dot plot on the cell grid**, hairline and zero-radius like everything else, and the table it replaces remains available. No pie, no donut, no area, and no line without real time on the x-axis.

This is the one surface where §2.7's cost test points the other way: an analytics page is met deliberately and read slowly, so density is a virtue rather than a tax.

Student-level detail is genuinely useful for teaching and creates a real obligation:

- **Students are told.** The course overview states plainly that the educator can see individual progress in this course. Disclosed at enrolment, not buried in terms.
- Educators see progress **within their own course only** — never a learner's activity elsewhere, never `/me/progress`.
- Analytics count **enrolled** learners only, matching the backend's existing behaviour.
- No leaderboards, no cross-student ranking, no comparative display to students. An educator seeing a distribution is teaching; a student seeing their rank is not learning.

### 11.11 The admin loop

Tables (§6.6) over courses, lectures, and users. Every destructive action confirms and names its object. Role changes announce. Bulk operations report per-item outcomes, never a bare "done".

### 11.12 Settings

Split, so preferences are adjusted where they are felt:

| Where               | Preference                                                                           |
| ------------------- | ------------------------------------------------------------------------------------ |
| `/me/settings`      | Locale (§4.4), theme, reduced background motion, haptics, handwriting on/off (§9.3D) |
| In place, persisted | Furigana visibility, captions, playback rate, transcript visibility                  |

An in-place toggle writes the same stored preference a settings page would, and `/me/settings` lists every in-place preference read-only with a pointer to where it lives — so nothing set once becomes unfindable.

### 11.13 Cross-cutting states

Every surface specifies all of these. None is an afterthought.

| State                                | Treatment                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Loading**                          | `paper-2` skeletons at final dimensions — no layout shift — with a slow 1.6s shimmer, plus `aria-busy`. Never a spinner over content. Resolves to an explanatory state after 10s (§10.5).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Empty**                            | A sentence naming what would be here, **plus the action that creates it**. Common Sage's current `ResourceState` empty case ends at "No X found."; that is the half of the pattern to fix.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **No content in a populated course** | A real failure mode already seen in production: the recommender narrowed to topics that had no modules and reported "No content available" in a course with material. The interface must distinguish _nothing is due_ from _nothing exists_ and never conflate them.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **No results**                       | Restates the query, offers one-click clear.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Error**                            | What failed, whether work was lost, one retry action. Plain language, no codes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Permission denied**                | Says which role is required and who to ask. Never a blank page or a silent redirect.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **No WebGL / slow GPU**              | CSS-gradient fallback from the same palette. Fully usable; only the atmosphere is missing.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Offline**                          | Optimistic commits (§7.4) queue locally behind a persistent banner and reconcile on reconnect. Conflicts surface explicitly — never last-write-wins in silence.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Session expired**                  | The one state where the optimistic loop can lose a learner's work, and therefore specified rather than left to the HTTP layer. On the first `401`, queued and in-flight commits are **held, not dropped**; a persistent banner states that the session ended; and re-authentication happens **in place, in a dialog** (§6.11) over the current surface. **Never a redirect to `/login`** — a redirect discards the card the learner is mid-way through and re-entry lands them somewhere else. On success the queue replays and the banner clears. On failure or cancel, the learner is told **by name** exactly what was not saved ("Your answer to _Chain rule, card 12_ wasn't saved") and given one retry. Resumption (§11.14) covers the rest. |

### 11.14 URL, persistence, and resumption

Filters, tabs, search, graph position, and content-type selection live in the URL, so any view is shareable and the back button works.

**Search is course-scoped, and exists only inside a course.** The field appears in the topbar on `/courses/[id]/*`, `/topics/[id]` and `/lectures/[id]`, searching that course's topics, lectures, modules and the learner's own notes on them. **It is absent everywhere else** — on `/me`, the catalogue, and admin there is no search field at all, because a scope that changes silently with the route is worse than no search. Those surfaces filter instead: the catalogue filters courses, `/me/notes` searches notes, admin tables filter rows, and each writes to the URL.

There is no cross-course search. It would need a ranking model over four object kinds and a backend endpoint that does not exist (§12.1).

**Resumption is a first-class case.** A learner who closes the tab mid-card returns to that card, not to the top of the deck. Session state persists server-side, and if state was restored the interface says so rather than silently pretending continuity.

Theme, locale, and the in-place study preferences (§11.12) persist per account, not per device.

### 11.15 Notes

**A note is text on the edge between a person and a topic.** Not an object at a page coordinate, not a sticky pinned to a layout — a relation in the knowledge graph, authored by a user, pointing at exactly one topic. That model is what makes a note findable later, survivable across an educator's edit, and meaningful as an addition to the graph rather than as decoration over it.

**Where notes are written.** Topic and lecture detail (§7.2), where the topic is present and being read. A topic tile in the graph carries a note count and opens its notes; the deck does not accept notes, because §6.10's fixed bands have no room for a composing surface and interrupting a card to write is the opposite of the loop in §11.6.

#### The two kinds

|            | Learner note                           | Educator note                                     |
| ---------- | -------------------------------------- | ------------------------------------------------- |
| Author     | Student                                | Educator, on a course they own                    |
| Visibility | **Private to the author, permanently** | **Course content** — visible to everyone enrolled |
| State      | Saved on blur, no draft concept        | Draft → published, per §7.2                       |
| Purpose    | Study tool                             | Teaching annotation                               |

**Learner notes are never read by anyone else.** Not their text, not their count, not "3 learners noted this topic", not in aggregate, not in educator analytics (§11.10). This is a hard line and it is the reason the feature works: a learner who suspects an educator is reading writes for the educator, and "I have no idea what any of this means" — the most useful thing a learner ever writes — stops being written. There is consequently **nothing to disclose at enrolment for notes**, unlike progress analytics.

**Educator notes are the improvement channel.** They are authored in public, so they can be mined without any of the above tension: where educators repeatedly annotate the same topic, the material needs work, and that signal is available to content revision. If the product later wants learner-side signal about which topics are confusing, it comes from review performance — which the backend already tracks — and not from notes.

#### The session workspace

A note's **arrangement on the lattice is session-only.** During a session a learner can Place and Move notes across cells (§7.1) to lay out what they're thinking about; the moment they leave the surface, that arrangement is gone. The note itself, its text, and its topic anchor all persist.

This is the deliberate shape of the feature, for three reasons: a coordinate is meaningless at a different breakpoint, where `--cell` is 48px instead of 64px and the content it sat beside has reflowed; a coordinate is wrong the moment an educator edits the material underneath it; and persisting layout would make the notes API a layout store rather than a knowledge store (§12.1). Spatial thinking is genuinely useful _while_ thinking. It is not what you come back for.

**The interface says so, once, in place** — a workspace that silently discards an arrangement is a bug; one that states the arrangement is temporary and the notes are not is a feature. It is stated at the workspace, not in a first-run dialog nobody rereads.

#### Anatomy and behaviour

- A note is **text** — a markdown block (§6.1), plain by default. No drawing, no attachments, no images in v1.
- Sized in cells like everything else, quantised (§2.5), 1×1 minimum. Content grows the note in whole increments; nothing truncates (§4.4).
- Created from the topic's note control; saved on blur; deleting confirms and names the topic ("Delete your note on _Chain rule_?").
- A note **stores the language it was written in** and renders with `lang` set, defaulting to the interface locale. A note about a kanji will contain Japanese, and §4.3's Han-variant requirement applies to a learner's own writing exactly as it does to generated content.
- The notes layer is a composite widget (§8.4): one tab stop, arrows between notes, `Enter` to edit, `Escape` back to the container. Place and Move carry the §8.5 keyboard equivalents and announcements.
- Notes never overlap content they annotate at rest, and never intercept a click meant for the material underneath.

#### `/me/notes`

Every note the learner has written, across every course. Grouped by course then topic, newest first, searchable by text, each row linking back to the topic it annotates.

Without this surface the feature is write-only: a note placed inside a course three weeks ago, on a lattice arrangement that no longer exists, is unreachable. The index is what makes the anchor-to-a-topic model pay off — the topic is a durable address, so the note always has somewhere to be listed under.

Empty state per §11.13: a sentence naming what would be here **plus the action that creates it** — a pointer to the courses where notes can be written.

Educators see their own notes here too, marked with their published state, alongside the private notes they wrote as learners. The two kinds are visually distinct, because publishing something you meant to keep is the one unrecoverable mistake this feature can make.

### 11.16 Enrolment

**Access is a per-course setting**, chosen by the educator in the authoring wizard (§6.7) and visible on the course object thereafter:

| Access     | Behaviour                                                                                                                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Open**   | Any signed-in learner enrols from the catalogue in one action.                                                                                                                                                                                   |
| **Closed** | Enrolment requires a join code or a direct invitation from the educator. The course is still listed, with its access state visible, so a learner can see it exists and knows what to ask for — never a 404 for something that is merely private. |

- **The disclosure obligation from §11.10 attaches to the enrolment action itself.** The confirmation states, in plain language, that the educator of this course can see individual progress within it. Disclosed at the moment of joining, not in terms of service, and repeated on the course overview.
- Closed courses need a code-redemption path that works for a learner who is not yet signed in: the code survives registration and verification and applies afterwards, rather than being lost to the auth detour (§3.3.7, redundant entry).
- Leaving a course is always available, states what happens to progress, and confirms.
- Analytics count **enrolled** learners only (§11.10), which is what makes the open/closed distinction matter: an open course's cohort includes people passing through, and the educator should be able to choose.

## 12. Parity with Common Sage

### 12.1 What this frontend must reach

Route parity per §11.2 across all four roles, against the same FastAPI backend. Until parity is reached, both frontends coexist; this one is not "the app" until a role can complete its whole loop here.

**Backend work this design depends on** — none of it exists today:

| Need                                                            | Why                                                                                                                                                                                                                                                                                                                                                   | Blocks                                                          |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| A **notes** API                                                 | The API surface is `auth, courses, graph, health, lectures, me, progress, resources, summaries, topics, tree, users`. A note is an edge — `(author, topic, text, kind, lang, created_at)`, plus draft/published state for educator notes. **No coordinates**: arrangement is session-only (§11.15), so this is a knowledge store, not a layout store. | §11.15, §7.1 Place/Move, §8.5 keyboard equivalents, `/me/notes` |
| **Password reset** endpoints                                    | `/forgot` and `/reset` (§11.3) have no backing today, and the enumeration-safe response shape is a backend contract as much as a copy decision                                                                                                                                                                                                        | Account recovery                                                |
| **Registry entries for the 15 language types**                  | They are in neither `module_registry.py`, so `mode` and `graded` are undefined for the entire Japanese half of the product. Laddering (`laddering.py`) and scheduling cannot see them.                                                                                                                                                                | §6.10, the whole language deck                                  |
| A **grade endpoint** taking Again / Hard / Good / Easy          | Self-graded modules produce a learner-supplied grade (§6.10). The interface collects it; nothing accepts it.                                                                                                                                                                                                                                          | The flashcard and recognition loop                              |
| **Engagement events** on ungraded modules                       | Distinct from a recall grade: dwell past a threshold, feeding _in progress_ only (§11.7). No endpoint takes this today.                                                                                                                                                                                                                               | §6.10 ungraded modules, graph mastery display                   |
| **Removal of `conversion_calculator`**                          | Dropped from Kite's vocabulary (§6.10). Present in both the backend and worker registries and must be deleted from each.                                                                                                                                                                                                                              | Registry parity                                                 |
| A **`kanji_writing`** registry entry                            | New module type (§9.3D), production rung, graded. In neither registry.                                                                                                                                                                                                                                                                                | Handwriting                                                     |
| An **assisted** flag on the grade                               | The cloze hint bank caps a grade at `Hard` (§6.12). The interface collects it; nothing accepts it.                                                                                                                                                                                                                                                    | `particle_cloze`                                                |
| **Course access state** — open / closed, plus join codes        | §11.16. Courses have no access model today.                                                                                                                                                                                                                                                                                                           | Enrolment                                                       |
| **Course-scoped search**                                        | §11.14 searches a course's topics, lectures, modules and notes. No search endpoint exists.                                                                                                                                                                                                                                                            | Search                                                          |
| **Caption tracks** on video resources, and a publish-time check | Captions are a Level AA obligation and a publishing gate (§6.9)                                                                                                                                                                                                                                                                                       | Any video content                                               |
| **Transcripts** on video and audio resources                    | SC 1.2.1                                                                                                                                                                                                                                                                                                                                              | Any media content                                               |
| **UI locale** persistence on the user record                    | German/English interface (§4.4)                                                                                                                                                                                                                                                                                                                       | Localisation                                                    |

Notes are the largest of these: a real feature with real study value, and net-new backend surface. Until it lands, the lattice is decorative-only and §8.5's Place/Move equivalents have nothing to operate on.

The ask is smaller than it first appears, and deliberately so. Because arrangement is session-only (§11.15), the backend stores no geometry — a note is a row on an edge the graph already models. The `topics` API supplies the anchor; what is missing is the edge itself, `/me/notes` to list it, and published state for the educator kind.

### 12.2 What we adopt

These parts of Common Sage are right and carry over:

- **The API proxy** — all requests through `/api/v1/*` to a server-side route, keeping tokens server-adjacent and sidestepping CORS. This is a Next.js route handler and is the main reason §13.1 stays on Next.js rather than dropping to a static SPA.
- **Typed API modules + query-key factory** — never inline query key strings.
- **A normalised error adapter** — one `ApiError` shape, so §11.7 error states can be uniform.
- **`data-theme` on `<html>`** for theme switching.
- **The `ResourceState` idea** — one primitive for loading / error / empty, so those states can't drift per component. Extended per §11.7 to carry a recovery action.
- **SVG for the knowledge graph.** Not canvas. This is why the graph needs no carve-out.
- **`motion/react`** — already a dependency, currently used in exactly one component (`AnimatedVisibility`, duration-based, `easeInOut`). Kite promotes it to the animation runtime and moves it to springs (§10.2).

### 12.3 What we deliberately break

| Common Sage                                        | Kite                                                  | Why                                                                                                                                                                                                   |
| -------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Miriam Libre + Geologica via `next/font`           | System stack (§4.1)                                   | Zero webfont payload, no FOUT, no layout shift, no licensing. Full brand break.                                                                                                                       |
| Cyan/ice palette (`#87d3ff`, `#38b6fe`, `#d0acff`) | Paper/ink ramp + six content-type accents (§3)        | Closed ramp with no illegal combination; accents keyed to a taxonomy that already exists. `--catalog-blue`/`--catalog-violet` in this repo's prototypes inherited those hues; that lineage ends here. |
| `$radius-sm/md/lg/pill`                            | Zero radius                                           | The lattice is square.                                                                                                                                                                                |
| `em`-based spacing and font sizes                  | px scale (§2.2)                                       | `em` padding produced a shipped bug: the same `Button` rendered at two sizes because `<button>` used the 13.3px UA default while `<a>` inherited 16px. A px scale makes that class of bug impossible. |
| `ui/Tabs.tsx` — links styled as tabs               | Nav links _or_ real ARIA tabs, per §6.5 decision rule | The current component claims neither semantics correctly.                                                                                                                                             |
| `ContentTypeTabs` in the global navbar             | Filter chips on the deck surface                      | A tablist in the navbar controlling another route's content is neither tabs nor nav.                                                                                                                  |
| SCSS modules + `$theme-*` maps                     | CSS custom properties                                 | Greenfield; tokens are runtime-themeable without a build step.                                                                                                                                        |
| Latin-only font handling                           | Full CJK system (§4.3)                                | The language modules are the product's hardest typography and currently have no specification at all.                                                                                                 |
| Duration + `easeInOut` in one component            | Spring system throughout (§10.2)                      | Springs are interruptible: redirected mid-flight they continue from current position _and velocity_. A duration cannot, and the lift-and-flip and swipe-drag both depend on it.                       |
| No gesture support                                 | Swipe as accelerator (§7.3)                           | Card-based study on a phone needs it; SC 2.5.7 is satisfied because buttons remain the primary path.                                                                                                  |
| Pessimistic requests                               | Optimistic with visible rollback (§7.4)               | The deck must run at the speed of thought; network latency per card breaks concentration.                                                                                                             |

## 13. Frontend implementation

### 13.1 Stack

| Concern    | Choice                                                               | Why                                                                                                                                                                                  |
| ---------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Framework  | **Next.js, App Router**                                              | The API proxy (§12.2) is a server route handler; a static SPA cannot keep tokens server-adjacent. Also gives server rendering for the catalogue and course pages, where LCP matters. |
| UI         | React 19                                                             | Required pairing with `@react-three/fiber` v9 for the shader surface.                                                                                                                |
| Components | **React Aria Components**                                            | §13.2                                                                                                                                                                                |
| Styling    | **Plain CSS + custom properties**                                    | §13.3                                                                                                                                                                                |
| Data       | TanStack Query + the typed API modules and query-key factory (§12.2) | Already correct in Common Sage; carried over.                                                                                                                                        |
| Animation  | `motion/react`, springs only                                         | §10.2                                                                                                                                                                                |
| 3D         | `@shadergradient/react` behind a lazy boundary                       | §10.7                                                                                                                                                                                |

**witty_bench is currently a Vite SPA with hash routing** ([main.tsx](src/main.tsx)) and no data layer. Migrating it to Next.js is the first implementation task, not an incidental detail — hash routing cannot express §11.2's route map, and there is nowhere to put the proxy.

### 13.2 What React Aria covers, and what it does not

Chosen because it supplies, correctly and tested, the parts of §8 that are most often got wrong — Common Sage's tabs (§6.5) being the local example of what hand-rolling produces.

**Provided:** focus management and restoration · roving tabindex for composite widgets · the full tabs pattern (§6.5) · dialog focus trapping and return (§8.7) · `:focus-visible` semantics · **keyboard-accessible drag and drop**, which is SC 2.5.7 (§8.5) rather than a nicety · table sorting and selection semantics (§6.6) · form and validation wiring (§6.8) · locale-aware date and number handling (§4.4).

**Still hand-built, and therefore still needing the §9.6 manual passes:**

- The **background lattice** grid and its cell toggling — a bespoke 2D roving-tabindex surface
- **Note placement and movement** (§8.5, §11.15) — React Aria's drag-and-drop covers reordering, not free placement on a coordinate grid. The state is session-local, which makes it simpler than it looks: there is no persistence, no conflict, and no reconciliation to write.
- The **graph spatial zoom** (§10.4B) and its focus handoff
- The **card stack** and swipe (§10.4D)
- The **module frame's** fixed-band composition (§6.10)
- The **media player** (§6.9)

React Aria ships unstyled and exposes state as data attributes, which suits §6.3's state model and §2.5's composition rules directly — no fighting a theme.

### 13.3 Tokens and enforcement

One `tokens.css` file. Plain custom properties, no preprocessor, no build step for styling. Runtime-themeable via `data-theme` (§3.1), inspectable in devtools, and readable by anyone.

The cost is no compile-time safety: a mistyped custom property silently resolves to nothing. **The design system's rules are mechanically checkable, so check them.** Stylelint config, treated as part of the system rather than as tooling hygiene:

| Rule                                                         | Enforces                   |
| ------------------------------------------------------------ | -------------------------- |
| No literal colour outside `tokens.css`                       | §3 closed ramp             |
| No `border-radius` other than `0`                            | §1, §2.5                   |
| Length values must be multiples of 8px, or `--optical`       | §2.2 total cell discipline |
| No `px` font-sizes outside the scale                         | §4.2                       |
| No `transition` on `transform`/`scale` (springs only)        | §10.1                      |
| No `!important` in `prefers-reduced-motion` blocks           | §10.6                      |
| Logical properties only (`margin-inline`, not `margin-left`) | §4.4                       |
| No literal `z-index` — only `--layer-*`                      | §2.6 layer order           |
| No `outline: none` without a replacement in the same rule    | §8.6, §9.5 forced colours  |
| Meaningful boundaries use `border`, never `box-shadow` alone | §9.5 forced colours        |

The 8px rule is the highest-value one — it is exactly the discipline the prototypes lost (`28px 15px 13px`, `7px 9px`), and it cannot be maintained by review. It treats `1px` and `2px` as hairlines wherever they appear — as a border, as a `gap` drawing separators between grid cells, or as the inline-size of a divider element — because §3.4 makes `1px` the rule weight and §3.3 makes `2px` the judgement rule, and neither can be mistaken for the kind of value this rule exists to catch.

**Implementation.** Eight of the ten are stock stylelint rules; they live in `stylelint.config.mjs`, which cites this section per rule. The three needing real logic — the 8px arithmetic, the outline-replacement check, and the boundary check — are in `stylelint-plugins/kite.mjs`, a local file rather than an npm package so that it versions with the code exactly as this document does.

**The last rule is advisory.** "Meaningful boundary" is a human judgement, so `kite/boundary-is-border` reports at `severity: 'warning'` and is silenced with a `stylelint-disable-next-line` carrying a reason. That keeps it in the exceptions-are-written discipline below rather than making it un-shippable. Every other rule is an error.

**Governance.** A design system decays by drifting from its document, so the relationship is stated rather than assumed:

- **This document is the source.** A new token, a changed value, or a new rule lands here **in the same pull request as the code that uses it**. A token in `tokens.css` that is not in this document is a bug, in the same way an undocumented public API is.
- **Stylelint is the enforcer**, not review (§13.3's table). Anything mechanically checkable is checked mechanically; review is reserved for the things that aren't, which is most of §2.7 and all of §9.6.
- **Exceptions are written, in the form §9.3 already uses**: the rule broken, why, the mitigation, and what proves the mitigation works. An undocumented exception is a defect; a documented one is a decision. The canvas carve-outs are the model because they are the hardest case.
- **The document is versioned with the code** and its section numbers are stable — they are referenced from PRs, issues, and each other. Sections are added at the end of their chapter rather than renumbered.

### 13.4 Browser baseline

`color-mix()` (§3.4), `backdrop-filter` (§5), `:has()`, container queries, and CSS nesting are all assumed. That sets the floor at **Safari 17.4, Chrome 111, Firefox 128**. Anything older gets the no-WebGL path (§11.13) and unstyled-but-functional fallbacks, not a supported experience. State this publicly rather than discovering it through a support ticket.

### 13.5 Remaining conventions

**Brand.** A **1-cell monogram plus the wordmark, always, at every breakpoint.** The monogram is a filled 64×64 square — the lattice's own module used as the mark — with the letterform knocked out; it inverts with the theme and is the favicon and app icon without a second asset. The wordmark reads **Common Sage**, set in the system stack (§4.1) at `h3` size with the display scale's tracking. The product keeps its name; only the visual identity broke (§0). At `sm` the pair still fits — 48px monogram plus the wordmark leaves room for the menu control inside 320px — so there is no monogram-only collapse to design, test, or explain.

**Voice and terminology.**

- **Sentence case everywhere**, except `label` and `meta`, which §4.2 already fixes as uppercase. "Start studying", "Your progress", "Delete course". Title case forces a per-word rule that German ignores entirely — its nouns capitalise regardless — so the two locales would visibly stop matching.
- **Interface words match the data model exactly.** A module is a _module_ in the interface, the API, the database, and this document. `Course`, `Lecture`, `Topic`, `Module`, `ContentType`. No learner-facing synonyms, no "card" for a module even on the deck where it visibly is one — a second vocabulary is a translation layer that drifts, and §1's fourth law is about exactly this.
- Buttons are verbs (§6.4). Errors say how to fix it (§6.8). Nothing is congratulated except a milestone (§11.8), and nothing is apologised for.

**Icons.** One set, one weight, one grid, at **24px** — a grid multiple, and the same size everywhere, so there is no per-context optical decision to get wrong. `@tabler/icons-react` is already a Common Sage dependency and is a reasonable default; the hand-rolled SVG glyphs in the prototypes do not scale.

Icons exist for the **six `ContentType`s** and for interface actions, and **not for the 36 module types** — a per-type icon set would be a frontend-owned taxonomy of exactly the kind §3.2 says drifts the first time the worker emits a type the map doesn't know. The six content-type icons are load-bearing rather than decorative: they carry type identity when forced colours collapse the accents (§9.5). Icons are always `aria-hidden` and always accompanied by a text label or an `aria-label` (§9.2).

**Math.** The `formula_equation` module renders equations and nothing in either codebase handles math. Use **MathML** where support allows, with KaTeX as the renderer — never an image of an equation, which is unreadable, unselectable, and unsearchable. Every formula carries a text description for screen readers.

**Images.** Generated images carry `alt_text` from the worker. Today `hero_image` falls back to `alt={img.alt_text || topic}` — the topic _name_, which is a label, not a description, and fails SC 1.1.1. Fix: **alt text is required at generation**, reviewed at publish (§13.6), and there is no name-based fallback. An image with no usable description is either decorative (`alt=""`) or is not published.

**Error boundaries.** One per route and one per module frame. A single failing module must not take down a study session; it renders the §11.13 error state in its own frame and the deck advances past it.

**Testing.** Component tests for the hand-built widgets in §13.2 — the ones React Aria isn't covering are precisely the ones without an audited implementation. Visual regression on the six signature motions' rest states. The §9.6 manual passes are not replaceable by any of this.

**Page performance.** LCP under 2.0s and INP under 200ms on the deck and catalogue, on a mid-range phone. The shader bundle never counts against first paint (§10.7); if it does, the lazy boundary is broken.

### 13.6 The generated-content accessibility gate

Publishing is already gated on captions (§6.9). That gate generalises: the worker produces accessibility metadata, and the educator reviews it before publish.

| Content | Generator produces        | Educator reviews                                              |
| ------- | ------------------------- | ------------------------------------------------------------- |
| Image   | `alt_text`                | Accuracy — a confidently wrong description is worse than none |
| Video   | Caption track, transcript | Sync and accuracy                                             |
| Audio   | Transcript                | Accuracy                                                      |
| Formula | Text description          | Correctness                                                   |

The review step is a wizard stage (§6.7), not a checkbox. It shows the asset and its description side by side and requires an explicit accept or edit per item. Generated accessibility metadata is a **draft**, and the system says so — an unreviewed description is marked as such until a human accepts it.

**Staleness is educator-only.** Generated material ages, and past a threshold that is a per-course setting rather than a system constant, the object carries a stale marker — **in educator views exclusively**. It fails §2.7's action test for a learner, who cannot revise anything and only loses confidence in material they are about to study; it passes for the educator, who can act on it. Per §2.7 the marker appears only when stale, and current material says nothing at all.

---

---

## 14. Definition of done

A component ships when all of these hold. This is the checklist the whole document reduces to.

- [ ] Uses only tokens from this document — no literal colour, radius, or duration
- [ ] Every dimension is a multiple of `--u`; outer box is a multiple of `--cell`; zero radius; hairlines from the two-tier rule set
- [ ] Grows in whole increments, never continuously — and holds fixed geometry if it is a graded module on a study surface (§2.5)
- [ ] If it is a module type: reads `graded` from the registry rather than deciding for itself, declares its topic-name and typo-tolerance rules once (§6.10), and reuses one of the six response controls rather than inventing a seventh (§6.12)
- [ ] Copy is sentence case, names objects exactly as the data model does, and reads as `du` in German (§13.5, §4.4)
- [ ] Composes left-weighted; primary action bottom-right; horizontal rules full-bleed, verticals contained
- [ ] Every field on it passes §2.7's action or trust test at that surface's encounter count; exceptions are marked and norms are not; nothing was promoted a tier by hover or "show more"
- [ ] Content is opaque paper; only chrome is veiled
- [ ] Declares an explicit `font-size`; never inherits the UA default
- [ ] Implements every state in §6.3 with the specified encoding
- [ ] Reachable, operable, and escapable by keyboard alone, in DOM order
- [ ] Any pointer gesture has its §8.5 keyboard equivalent, with announcements
- [ ] Accessible name contains the visible label; decorative graphics are `aria-hidden`
- [ ] Japanese content carries `lang="ja"`, no synthesized bold, correct size floor (§4.3)
- [ ] Contrast measured, not assumed; veil law satisfied if it sits over the canvas
- [ ] Target ≥48×48 (`6u`), which clears the SC 2.5.8 floor by construction
- [ ] Spatial motion uses a `spring` token; colour uses `--dur-flat`; nothing invents its own timing
- [ ] Every animation is interruptible — redirects from current position and velocity, never restarts
- [ ] Reduced-motion substitute named per §10.6 — feedback survives, motion is replaced rather than deleted
- [ ] Survives `forced-colors: active`, `prefers-contrast: more`, and `prefers-reduced-transparency` per §9.5 — boundaries are real borders, focus is an `outline`, no state depends on a colour that collapses
- [ ] Any overlay renders through the root portal at its §2.6 layer; no literal `z-index`, no overlay nested inside backdrop-filtered chrome
- [ ] Optimistic actions have a designed, visible rollback state (§7.4), and survive a `401` without discarding work (§11.13)
- [ ] Loading, empty (with action), error, and permission-denied states defined
- [ ] Legible at 320px and 200% zoom with no horizontal page scroll
- [ ] Survives German string lengths, and its German copy uses `du` with bare imperatives — no fixed text widths, no truncated labels, no concatenated sentences (§4.4)
- [ ] Time-based media carries captions, transcript, and no autoplay (§6.9)
- [ ] Passes the §13.3 stylelint rules — they encode this list mechanically
- [ ] Uses React Aria where it covers the pattern; hand-built widgets carry component tests (§13.2)
- [ ] Generated content has reviewed accessibility metadata, not draft (§13.6)

## 15. Catalogue reconciliation (2026-07-28)

`complete_modules.md` — the deduplicated catalogue measured across all six Common Sage repositories — was ruled the **authority on interaction**. Where it documents a behaviour that an earlier section of this document had removed or reduced, the catalogue wins and this section records the change. Sections are appended, never renumbered (§13.3), so the rows below amend rather than replace.

### 15.1 Interactions restored

| Type                             | §6.10/§9.3 said                                                                      | The catalogue says                                                                                                | What shipped                                                                                                                                                                                                                                                                                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `globe_pin`                      | Static SVG locator, no pan/zoom, not a carve-out                                     | Drag to pan, scroll/pinch to zoom, click a pin for its description, OSM attribution                               | Leaflet + OSM tiles. **§9.3B's raster-map carve-out is now live** and its terms are met: `role="application"`, an instruction line read before the map, and a pin list beside it that carries every label and description and selects the same state.                                                                                                                                   |
| `map_click_quiz`                 | Static SVG with `Reveal`/`Reset`                                                     | Click to place a point, distance error, partial credit                                                            | Leaflet, click-to-place, wheel/pinch zoom, distance grading at 150 km (correct) and 600 km (partial). The label-free map is the sole visible response surface; keyboard users place its centre with `Enter`. Error distance is an in-map toast.                                                                                                                                         |
| `model_3d`                       | Poster plus "what rotation reveals"; viewer withheld until keyboard rotation existed | Automatic rotation, drag to rotate, scroll/pinch to zoom, thumbnail fallback                                      | `@react-three/fiber` viewer. **§9.3C's carve-out is now live**, and the keyboard rotation it demanded exists rather than being deferred: arrows turn, `+`/`−` zoom, `Home` resets, and orientation is announced as a named face on a 500 ms sample. The poster and `reveals` text remain, so the objective is reachable without the canvas. The viewer boots on request, not on scroll. |
| `conversion_calculator`          | Removed from the vocabulary; to be deleted from both registries                      | A live tool with an input, immediate results, a clear control and `Enter a valid number`                          | Restored as an ungraded row. The original objection is answered in the composition — results are a table rather than a competing grid of boxes, and output is bounded to four significant figures.                                                                                                                                                                                      |
| Ungraded cards                   | No control band; a single `Continue`                                                 | A reversible feed-level `Hard` / `Easy`                                                                           | Both. `Continue` stays the primary in the bottom-right corner; the two-point rating sits at the other end of the footer and clears when pressed again. Two points, not four: an ungraded card emits no recall signal, so a four-point scale would claim a precision the data has not got.                                                                                               |
| Multi-card `flashcard` or `quiz` | One card per module                                                                  | Prev/Next/go-to-card, wrapping, results with a percentage, four result messages, per-question review, `Try Again` | `cards` is presentation data, not another module type. `SetModule` owns the sequence; each card is rendered by the ordinary frame with the ordinary controls. Set navigation renders **inside the prompt band**, never in the control band.                                                                                                                                             |

### 15.2 The webfont exception

§4.1 says system faces only. **KaTeX is the one exception**, bounded to elements inside `.k-formula__expression` and the formula legend.

The reason it is worth an exception: mathematical layout is not typography with a different alphabet. The placement of a limit under a sigma, the size of a nested fraction and the reach of a radical are semantic, and no system face carries the metrics for them. `throwOnError: false` means malformed generated LaTeX degrades to its source rather than blanking the card, and `output: 'htmlAndMathml'` means the MathML half is what a screen reader reads.

No other surface may use it. A second webfont needs its own row here.

### 15.3 Geometry — what "nothing moves" was measured to mean

“Nothing moves” means an individual card does not grow when it is checked; it
does not mean every module in a mixed session reserves the height of the
tallest one. Graded cards are content-sized, with lattice-derived padding and
targets. State changes reuse geometry that already exists:

- Choice verdicts recolour the options and fill a reserved mark slot.
- Ordering verdicts recolour existing rows.
- Map distance is an overlay inside the map.
- Checking never adds a topic header, explanation row, “Correct”, “Try again”,
  or a rating row.
- Flashcard front and back share one physical flip surface; the overflow menu
  belongs to that surface and rotates with it.

The mechanical check is therefore per card: its border-box size and the
control band’s position are identical immediately before and after Check.
Different prompts may produce different initial card heights; state is not
allowed to.

### 15.4 The band on a settled attempt

§6.10's diagram shows four ratings after a reveal. That is right for a self-graded card and wrong for one the machine has already marked: offering `Again / Hard / Good / Easy` with three of them disabled points the learner at a control the card will not accept, and promoting `Again` to primary puts the emphasis in slot 1, where the give-up control sat a second earlier — the exact collision the deliberately-empty third slot exists to prevent.

So **every objectively checked attempt**, correct, partial, wrong, or revealed, ends with one `Continue`; the machine has already generated the recall signal. Again / Hard / Good / Easy belongs only to self-graded flashcards, with `Good` in slot 3. A choice verdict is drawn in the existing option geometry: correct is green with `✓`; a wrong pick is red with `×` while the correct option is green with `✓`. There is no appended “Correct” or “Try again” panel.

### 15.5 Part 1 — the full-page study functions

Eight functions, each a route: `/japanese/lesson`, `/japanese/read`, `/japanese/listen`, `/japanese/karaoke`, `/japanese/placement`, `/japanese/explorer`, `/chat`, and `/courses/[id]/feed`. Three rules govern all of them.

**They compose the deck's cards; they do not re-implement them.** The lesson runner, the placement runner and the chat's generated cards all serve ordinary modules through `ModuleFrame`. A drill inside a lesson is the same object as a drill in a session.

**Paper, not glass.** These surfaces put controls and prose directly on the shader. Measured on the light gradient, every label on Read, Listen, Karaoke, Concepts and Tutor was pale ink on a pale wash and could not be read. The work region of a full-page function is `--panel` with a hairline; §5's material map has no exception for "it is a page rather than a card". The head's orientation line genuinely sits on the gradient and uses `--shader-ink`; it never gains a local grey fill or text-sized veil. The light Common Sage wave therefore uses a brighter, more saturated monochrome-blue range with enough tonal movement to remain visible. Its motion is slower than the previous field; vibrancy comes from colour, never speed.

**A denominator only where one exists.** The active lesson may show the position in its frozen card set. The feed and deck show nothing: both are open-ended experiences and any persistent count would become a number to optimise (§11.6).

**Daily learning is mixed, not staged.** Review, new material, context, and recall remain pedagogical inputs to the daily selection, but they are not exposed as interface copy or a six-step sequence. The plan is a centred, fourteen-cell-wide card; quantity controls sit directly beside their numbers in one-cell squares, and selectable item rows use a one-cell minimum with only an optical vertical gap. The explanation locale is inherited elsewhere, never chosen here. Each row has two durable action slots: `Already know` becomes `Put back` in place, while `Reroll` remains available beside it. Knowledge evidence is emitted independently and is never retracted by Put back or Reroll.

**Text generation is library disclosure.** Reading, Listening, and Read Aloud show the shared text library first. The last library action is `+ New Text`, which opens one dialog containing single-line generation settings and a text-upload path. Generation controls never occupy a permanent tab or compete with the selected text.

**Language Tutor is chat-first.** The Japanese conversation is the work region. Translations have a visible on/off control; scenario, tutor voice, and the option to inherit today’s lesson topic live in one Settings callout at the card’s top right. Course Q&A is a different function and does not share this surface.

Two counts differ from the JKG source deliberately: the feed discards a view shorter than **0.7 s** rather than recording it weakly, and placement reports a **working level with an explicit uncertainty** rather than a score, taking the lowest dimension rather than the mean — a learner whose grammar is N4 and whose kanji is N5 cannot read an N4 lesson.

### 15.6 Still not built

Named so that absence stays legible (§9.3's form):

- **JKG is not wired.** Every Part 1 page runs on fixtures shaped to `server/*.py` responses. The service is a separate Flask app on port 8010; wiring it is an adapter, not a redesign.
- **Generation is honest about itself.** `+ New Text` currently copies an existing text under the chosen dialog settings; uploads enter the same fixture path after stating that AI processing would follow. A generator that invented Japanese would put mistakes in front of a learner who cannot see them.
- **Language Tutor uses a scripted Japanese reply** until the Japanese service is wired. It preserves the chat interaction and topic inheritance without presenting fixture output as a live tutor model.
- **Speech recognition is Chrome and Edge only**, on `vocab_guess` and Karaoke. Acceptable because both are ungraded or have an always-present typed path — never because it is common.
- **Stroke-order grading does not exist.** `kanji_writing` captures stroke count and direction and shows the model on reveal; the learner self-rates. A scorer that guessed would be worse than one that abstains.

### 15.7 Assessment control details

- A Flashcard Skip target is exactly two lattice cells wide and one cell high.
- The four self-rating buttons have no separator grid, inset rule, or shadow.
  `Good` keeps the same ink colour as its siblings; emphasis comes from its
  fill, never reduced text contrast.
- Quiz prompts are horizontally centred. Choice cards use one full lattice
  cell of inline inset, while retaining the shared smaller block inset.
- An enabled primary action always uses full foreground/background contrast.
  Selection can enable Check; it can never make Check visually disabled.
- Timeline move controls retain their slots, but the first row’s up arrow and
  last row’s down arrow are hidden and removed from keyboard navigation.
- Map-click cards may widen to sixteen cells and use an eight-cell-tall map.
  Wheel zoom is active. No label layer, candidate buttons, external verdict
  row, or post-test difficulty rating is permitted.
- Kana recognition is a compact canonical Quiz with no topic/furigana header.
  Discrimination also suppresses furigana. Kanji Meaning exposes the control
  only when the prompt carries working ruby data.
