import type { NextConfig } from 'next'

const config: NextConfig = {
  // The Vite prototypes live in src/ and are not part of the Next build.
  typedRoutes: true,
  experimental: {
    optimizePackageImports: ['react-aria-components'],
  },
}

export default config
