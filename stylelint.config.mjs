/* This config IS design_system.md §13.3's rule table.
 *
 * §13.3: "The design system's rules are mechanically checkable, so check them.
 * Stylelint config, treated as part of the system rather than as tooling
 * hygiene." So it extends `-recommended` (real errors only) and NOT
 * `-standard` (formatting opinions) — Prettier handles formatting, and a
 * config carrying a hundred stylistic rules would drown the ten that matter.
 *
 * Each block below cites the section it enforces. A rule here with no section
 * is as much a bug as a token with no section (§13.3 governance). */

export default {
  extends: ['stylelint-config-recommended'],
  plugins: ['./stylelint-plugins/kite.mjs'],

  rules: {
    /* ── §3: the closed colour ramp ──────────────────────────────────
     * Every colour is a token. tokens.css is exempted in `overrides` below,
     * because that is the one file where the ramp is defined rather than
     * consumed. */
    'color-no-hex': true,
    'color-named': 'never',
    'declaration-property-value-disallowed-list': {
      /* A literal colour is one whose CHANNELS are literal. `rgb(var(--bg-rgb)
       * / 0.6)` is the ramp composed with an alpha — the house idiom for
       * "this token, more transparent" — and banning it would force either a
       * token per alpha step or color-mix() everywhere. So: catch bare hex,
       * and catch rgb()/hsl()/oklch() only when no var() is inside. */
      '/^(color|background|background-color|border.*color|fill|stroke|outline-color|text-decoration-color|caret-color|accent-color)$/':
        [
          /^#[0-9a-f]{3,8}$/i,
          /\b(rgba?|hsla?|oklch|oklab|lab|lch)\((?![^)]*var\()/,
        ],

      /* ── §10.1: springs only, never a transform transition ────────
       * §10.2 puts the spring tokens in lib/motion.ts precisely because
       * CSS cannot express them. A CSS transform transition is therefore
       * always the wrong tool, not merely a different one. */
      transition: [/transform/, /\bscale\b/, /\brotate\b/, /\btranslate\b/],
      'transition-property': [/transform/, /\bscale\b/, /\brotate\b/, /\btranslate\b/],
    },

    'declaration-property-value-allowed-list': {
      /* §1, §2.5: nothing has a radius.
       * `50%` is allowed because it makes a CIRCLE, not a rounded box: a
       * timeline dot or a status mark is a glyph shape, and §1's rule is
       * about surface corners. Forbidding it would push authors to inline an
       * <svg><circle> for an 8px dot — more markup, identical pixels. Any
       * other value is a rounded rectangle and stays banned. */
      'border-radius': ['0', '50%', '/^var\\(--radius/'],
      'border-start-start-radius': ['0'],
      'border-start-end-radius': ['0'],
      'border-end-start-radius': ['0'],
      'border-end-end-radius': ['0'],

      /* §4.2: the type scale is closed, so no literal px font-size.
       * Relative units are a different thing and stay legal: §4.3 requires
       * CJK to be sized against its surrounding run (0.92em in mixed runs,
       * 0.5em for <rt>), which a fixed scale cannot express. §13.1's warning
       * about `em` is specifically about `em` *padding*, not font-size.
       * `100%` is the html reset. */
      'font-size': [
        '/^var\\(--size-/',
        /* §4.3 pins a floor against a relative size: max(20px, 1rem). Legal
         * as long as every term is a token or a relative unit. */
        '/^(max|min|clamp)\\((\\s*(var\\(--size-[a-z-]+\\)|[0-9.]+(rem|em|%|vw))\\s*,?)+\\)$/',
        '/^[0-9.]+em$/',
        'inherit',
        '100%',
      ],

      /* §2.6: the nine --layer-* tokens ARE the layer order. A literal
       * z-index is a claim about stacking made without reading them. */
      'z-index': ['/^var\\(--layer-/', 'auto', '0'],
    },

    /* ── §4.4: logical properties only ───────────────────────────────
     * The interface localises to German, and §4.4 rules out truncation;
     * physical properties are how a layout stops surviving a longer word
     * or a different writing mode. `inset: 0` stays legal. */
    'property-disallowed-list': [
      '/^margin-(top|right|bottom|left)$/',
      '/^padding-(top|right|bottom|left)$/',
      '/^border-(top|right|bottom|left)-/',
      '/^(width|height)$/',
      '/^(min|max)-(width|height)$/',
      '/^(top|right|bottom|left)$/',
      'float',
      'clear',
    ],

    /* ── §10.6: the reduced-motion contract ──────────────────────────
     * §13.3 forbids !important inside prefers-reduced-motion blocks. Stock
     * `declaration-no-important` is stricter and simpler: !important is a
     * specificity failure anywhere, and the global ban removes the need for
     * a fourth custom rule. */
    'declaration-no-important': true,

    /* ── The three that need real logic (stylelint-plugins/kite.mjs) ── */
    'kite/eight-px-grid': true,
    'kite/outline-needs-replacement': true,
    'kite/boundary-is-border': true,

    /* ── Correctness. Not in §13.3's table, but these catch defects that
     * are already on disk and cost nothing to keep out. ─────────────── */
    'no-duplicate-selectors': true,
    'declaration-block-no-duplicate-properties': [true, { ignore: ['consecutive-duplicates'] }],
    'custom-property-pattern': '^[a-z][a-z0-9]*(-[a-z0-9]+)*$',
    'media-feature-range-notation': 'prefix',
    'no-descending-specificity': null,
    /* SVG presentation attributes (r, cx, cy, x, y…) are real CSS properties
     * that stylelint's value dictionary does not carry. The diagram and globe
     * figures style them, so this rule reports them as unknown. */
    'declaration-property-value-no-unknown': [true, { ignoreProperties: { '/^(r|cx|cy|rx|ry|x|y|d)$/': [/.*/] } }],
  },

  overrides: [
    {
      /* §3.1: tokens.css is where the ramp is *defined*. It is the one file
       * that must contain literal colour, and the only one. */
      files: ['styles/tokens.css'],
      rules: {
        'color-no-hex': null,
        'color-named': null,
        'declaration-property-value-disallowed-list': null,
        'declaration-property-value-allowed-list': null,
      },
    },
  ],

  ignoreFiles: [
    '.next/**',
    'dist/**',
    'node_modules/**',
    /* §13.3 documented exception.
     *   Rule broken: the whole table, on this file only.
     *   Why: /filters is a design demo that renders 25 arbitrary CSS filter
     *     treatments of one image. Its subject IS colour outside the ramp;
     *     tokenising it would delete what it demonstrates.
     *   Mitigation: it is not a product surface, is not linked from the
     *     learner or educator route maps (§11.2), and is the only
     *     *.module.css in the repo — so it cannot leak into the system layer.
     *   Proof: `npm run lint:css` covers styles/ and every other app/ CSS
     *     file, so a token violation anywhere real still fails the build. */
    'app/filters/filters.module.css',
    /* The dead Vite SPA. design_system.md §13.1 names the Vite→Next migration
     * as complete; src/ is kept for reference and is not shipped. */
    'src/**',
    /* Third-party CSS we override rather than author (§4.6 of the plan). */
    '**/leaflet/**',
  ],
}
