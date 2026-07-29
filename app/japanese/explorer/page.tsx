import { Surface } from '@/components/ui/Surface'
import { Explorer } from './Explorer'

export const metadata = { title: 'Concepts — Common Sage' }

export default function ExplorerPage() {
  return (
    <Surface
      title="Concepts"
      orientation="Filter the concept list, then open anything to see what it means and what it connects to."
    >
      <Explorer />
    </Surface>
  )
}
