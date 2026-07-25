import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Keep production assets relative so the demo works from preview subpaths
  // as well as from a domain root.
  base: './',
  plugins: [react()],
})
