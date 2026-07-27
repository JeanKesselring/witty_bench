/* §8.2: every surface provides these, in this order. They are the first
 * focusable elements and land on an element with tabindex="-1" so focus
 * actually moves. Rendered above every layer (§2.6) so SC 2.4.11 holds. */

export function SkipLinks() {
  return (
    <div className="k-skip">
      <a href="#k-main">Skip to main content</a>
      <a href="#k-work">Skip to the work region</a>
    </div>
  )
}
