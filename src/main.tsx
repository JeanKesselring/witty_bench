import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'
import { AppErrorBoundary } from './components/AppErrorBoundary'
import 'leaflet/dist/leaflet.css'
import './styles/base.css'
import './styles/learning.css'
import './styles/knowledge-graph.css'
import './styles/module-catalog.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
