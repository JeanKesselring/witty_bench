import { Surface } from '@/components/ui/Surface'
import { Explorer } from './Explorer'

export const metadata = { title: 'Concepts — Common Sage' }

export default function ExplorerPage() {
  return (
    <Surface
      title="Concepts"
      orientation="Everything the graph knows about, as a list or as connections. Filter it, then open anything to see what it means and what it sits next to."
    >
      <Explorer />
    </Surface>
  )
}
