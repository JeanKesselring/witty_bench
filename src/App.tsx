import { useEffect, useState } from 'react'

import { KnowledgeGraphDemo } from './demos/KnowledgeGraphDemo'
import { LearningDemo } from './demos/LearningDemo'
import { ModuleGalleryDemo } from './demos/ModuleGalleryDemo'
import { GradientProvider } from './shader/GradientStore'
import { ThemeProvider } from './theme/ThemeProvider'

function pageFromHash() {
  if (window.location.hash === '#/knowledge-graph') return 'graph'
  if (window.location.hash === '#/modules') return 'modules'
  return 'learning'
}

export function App() {
  const [page, setPage] = useState(pageFromHash)

  useEffect(() => {
    const syncPage = () => setPage(pageFromHash())
    window.addEventListener('hashchange', syncPage)
    return () => window.removeEventListener('hashchange', syncPage)
  }, [])

  return (
    <ThemeProvider>
      <GradientProvider initialPresetId="halo">
        {page === 'graph' ? (
          <KnowledgeGraphDemo />
        ) : page === 'modules' ? (
          <ModuleGalleryDemo />
        ) : (
          <LearningDemo />
        )}
      </GradientProvider>
    </ThemeProvider>
  )
}
