import { LearningDemo } from './demos/LearningDemo'
import { GradientProvider } from './shader/GradientStore'
import { ThemeProvider } from './theme/ThemeProvider'

export function App() {
  return (
    <ThemeProvider>
      <GradientProvider initialPresetId="halo">
        <LearningDemo />
      </GradientProvider>
    </ThemeProvider>
  )
}
