/* Kite's three mechanically-checkable rules that no stock stylelint rule covers.
 *
 * design_system.md §13.3 makes stylelint the enforcer rather than review:
 * "Anything mechanically checkable is checked mechanically; review is reserved
 * for the things that aren't." Everything expressible with stock rules lives in
 * stylelint.config.mjs. These three need real logic:
 *
 *   kite/eight-px-grid            — arithmetic on length values (§2.2)
 *   kite/outline-needs-replacement — sibling-declaration inspection (§8.6, §9.5)
 *   kite/boundary-is-border       — a judgement call, so advisory only (§9.5)
 *
 * Local file, not an npm package, so it versions with the code — §13.3's
 * governance rule ("the document is versioned with the code") applied to the
 * thing that enforces the document.
 */

import stylelint from 'stylelint'
import valueParser from 'postcss-value-parser'

const { createPlugin, utils } = stylelint

/* ── kite/eight-px-grid ────────────────────────────────────────────────
 * §2.2 total cell discipline: "every dimension a multiple of --u (8px)".
 * --optical (4px) is the one narrow exception and must be written as the
 * token, never as a literal 4px — otherwise the exception stops being
 * visible at the call site, which is the whole point of naming it.
 *
 * Hairlines are exempt because §6.2's anatomy specifies a 1px structural
 * rule and §8.6's focus ring is 2px; neither is a dimension in §2.2's
 * sense. Properties whose values are strokes rather than layout are
 * exempt for the same reason. */

const GRID = 8
const OPTICAL = 4
const HAIRLINES = new Set([1, 2])

/* Strokes and type metrics, not layout. */
const EXEMPT_PROPS = new Set([
  'border-width',
  'border-block-width',
  'border-inline-width',
  'border-block-start-width',
  'border-block-end-width',
  'border-inline-start-width',
  'border-inline-end-width',
  /* §8.6 sets the ring at 2px and §9.5 bumps it to 3px under forced
   * colours, so an outline's width is a legibility decision made against
   * the backdrop, not a layout dimension. Exempt at the shorthand too. */
  'outline',
  'outline-width',
  'outline-offset',
  'letter-spacing',
  'word-spacing',
  'stroke-width',
  'text-underline-offset',
  'text-decoration-thickness',
  'font-size',
  'line-height',
  'flex-basis',
  /* §3.6 elevation: a shadow's geometry is optical, not layout. Snapping a
   * blur radius to 8px would coarsen the only soft edge in the system, and
   * §8.6's focus ring is specified as a 4px spread. Colour and presence of
   * shadows are still governed — see kite/boundary-is-border. */
  'box-shadow',
])

/* Texture and paint geometry, not layout: these size an image against
 * itself, so they answer to the asset's pixels, not to the lattice. */
const PAINT_PROPS = /^background-(size|position|position-[xy])$/

const gridRule = createPlugin(
  'kite/eight-px-grid',
  (enabled, _opts, context) => (root, result) => {
    if (!enabled) return

    root.walkDecls((decl) => {
      const prop = decl.prop.toLowerCase()
      if (prop.startsWith('--')) return
      if (EXEMPT_PROPS.has(prop)) return
      if (PAINT_PROPS.test(prop)) return

      valueParser(decl.value).walk((node) => {
        /* Inside calc() the author is doing arithmetic on tokens; §2.2's
         * discipline is carried by the tokens, and calc(var(--cell) / 2)
         * is legal and common. Don't descend. */
        if (node.type === 'function') return false
        if (node.type !== 'word') return

        const parsed = valueParser.unit(node.value)
        if (!parsed || parsed.unit !== 'px') return

        const px = Math.abs(Number.parseFloat(parsed.number))
        if (!Number.isFinite(px) || px === 0) return
        if (px % GRID === 0) return

        /* §3.4: "All rules are 1px solid", and §3.3's judgement rule is 2px.
         * A hairline is a stroke wherever it appears — as a border, as a
         * `gap: 1px` drawing separators between grid cells, or as the
         * inline-size of a divider element. None of them is a dimension in
         * §2.2's sense, and neither 1 nor 2 can be mistaken for one: the
         * values §2.2 exists to catch are `28px 15px 13px` and `7px 9px`,
         * which read as layout precisely because they are not hairlines. */
        if (HAIRLINES.has(px)) return

        const message =
          px === OPTICAL
            ? `Write 4px as var(--optical) — §2.2 names the exception so it stays visible (${decl.prop})`
            : `${parsed.number}px is not a multiple of ${GRID} — §2.2 total cell discipline (${decl.prop})`

        utils.report({
          message,
          node: decl,
          result,
          ruleName: 'kite/eight-px-grid',
          word: node.value,
        })
      })
    })
  },
)
gridRule.ruleName = 'kite/eight-px-grid'

/* ── kite/outline-needs-replacement ────────────────────────────────────
 * §8.6 and §9.5: removing the outline without putting a visible focus
 * indicator back in the same rule is how a keyboard user loses their
 * place. SC 2.4.7. The replacement must be in the *same* rule — a
 * replacement somewhere else in the file is a promise, not a guarantee. */

const REPLACEMENTS = new Set(['box-shadow', 'border', 'background', 'background-color'])

const outlineRule = createPlugin(
  'kite/outline-needs-replacement',
  (enabled) => (root, result) => {
    if (!enabled) return

    root.walkDecls(/^outline(-style)?$/i, (decl) => {
      const value = decl.value.trim().toLowerCase()
      if (value !== 'none' && value !== '0' && value !== 'hidden') return

      const parent = decl.parent
      if (!parent || parent.type !== 'rule') return

      /* `:focus:not(:focus-visible)` exists solely to suppress the ring for
       * pointer focus; the keyboard ring is the paired `:focus-visible` rule.
       * Removing it here is the mechanism §8.6 relies on, not a violation of
       * it — flagging this would push authors toward disabling the rule
       * globally, which is worse. */
      if (/:focus:not\(\s*:focus-visible\s*\)/.test(parent.selector)) return

      let replaced = false
      parent.walkDecls((sibling) => {
        if (sibling === decl) return
        const p = sibling.prop.toLowerCase()
        if (REPLACEMENTS.has(p)) replaced = true
        /* A second, non-removing outline declaration also counts. */
        if (p === 'outline' && !/^(none|0|hidden)$/.test(sibling.value.trim())) replaced = true
      })

      if (replaced) return

      utils.report({
        message:
          'outline is removed with no visible focus replacement in the same rule — §8.6, §9.5 (SC 2.4.7)',
        node: decl,
        result,
        ruleName: 'kite/outline-needs-replacement',
      })
    })
  },
)
outlineRule.ruleName = 'kite/outline-needs-replacement'

/* ── kite/boundary-is-border ───────────────────────────────────────────
 * §9.5: under forced colours, box-shadow is dropped and a boundary drawn
 * with shadow alone disappears. But whether a given shadow is a *meaningful
 * boundary* or decoration is a human judgement, so this is the one advisory
 * rule in §13.3's table — severity: warning, and silenceable with a
 * stylelint-disable-next-line comment naming this rule. Silencing it is a
 * decision on the record rather than an undocumented exception (§13.3:
 * "an undocumented exception is a defect; a documented one is a decision"). */

const boundaryRule = createPlugin(
  'kite/boundary-is-border',
  (enabled) => (root, result) => {
    if (!enabled) return

    root.walkRules((rule) => {
      /* Focus rings are §8.6's prescribed two-ring treatment, not boundaries. */
      if (/:focus|:focus-visible|:focus-within/.test(rule.selector)) return

      let shadow = null
      let hasBorder = false

      rule.walkDecls((decl) => {
        const p = decl.prop.toLowerCase()
        if (p === 'box-shadow' && !/^(none|inherit|unset)$/i.test(decl.value.trim())) shadow = decl
        if (p.startsWith('border') && !/^(none|0)$/i.test(decl.value.trim())) hasBorder = true
        if (p === 'outline' && !/^(none|0)$/i.test(decl.value.trim())) hasBorder = true
      })

      if (!shadow || hasBorder) return

      utils.report({
        message:
          'box-shadow with no border — if this draws a meaningful boundary it vanishes under forced colours (§9.5). Add a border, or disable this rule on the line with a reason.',
        node: shadow,
        result,
        ruleName: 'kite/boundary-is-border',
        severity: 'warning',
      })
    })
  },
)
boundaryRule.ruleName = 'kite/boundary-is-border'

export default [gridRule, outlineRule, boundaryRule]
