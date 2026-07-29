import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { Topbar } from '@/components/shell/Topbar'
import { SkipLinks } from '@/components/shell/SkipLinks'
import { Foot } from '@/components/shell/Foot'
import { FrostStage } from '@/components/shell/FrostStage'
import { AccountControl } from '@/components/shell/AccountControl'
import { LatticeFit } from '@/components/shell/LatticeFit'
import { ToastRegion } from '@/components/ui/Toast'
import { getCurrentUser } from '@/lib/auth/session'

export const metadata: Metadata = {
  title: 'Common Sage',
  description: 'Educator-authored, knowledge-graph-backed learning.',
}

/* §3.1: theme resolves before paint, so there is no flash to design around.
 *
 * It stamps a CONCRETE value every time, including when nothing is stored.
 * Leaving the attribute off meant three components each guessed the default
 * separately and disagreed: the token sheet fell through to `:root`, which is
 * the dark ramp; ThemeToggle initialised to 'light'; and GradientBackdrop
 * read `prefers-color-scheme` and picked the pale preset. The visible result
 * was light ink on a light gradient — every page title and orientation line
 * was washed out until you toggled the theme and back.
 *
 * One attribute, resolved once, is what makes those three agree by
 * construction rather than by each of them happening to guess the same.
 */
const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem('cs-theme');
    var theme = (stored === 'light' || stored === 'dark')
      ? stored
      : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Read once here rather than per surface: the topbar persists across every
  // route change (§13.3), so the account it shows must too.
  const user = await getCurrentUser()

  // §9.2: lang on <html>, switching with the interface locale (§4.4).
  return (
    // The theme script below stamps data-theme before React hydrates, so the
    // server markup and the client's first read of <html> legitimately differ.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>
          {/* §3.5 + §5: the wave, its texture, the frosted grid and the
              notes workspace (§11.15), all inside one isolated stage so the
              blur can sample them and so notes share the lattice's cells.
              Click a tile to frost it; drag across empty lattice to place a
              note. */}
          <FrostStage />
          <SkipLinks />
          <div className="k-shell">
            <Topbar account={<AccountControl user={user} />} />
            {children}
            <Foot />
          </div>
          <ToastRegion />
          {/* §2.5: snaps content-driven box heights up to whole cells. */}
          <LatticeFit />
        </Providers>
      </body>
    </html>
  )
}
