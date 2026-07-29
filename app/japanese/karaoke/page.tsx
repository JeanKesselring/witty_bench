import { Surface } from '@/components/ui/Surface'
import { KaraokeLab } from './KaraokeLab'

export const metadata = { title: 'Read aloud — Common Sage' }

export default function KaraokePage() {
  return (
    <Surface
      title="Read aloud"
      orientation="Choose a text and read it aloud. The current word follows you, and hints appear when you need them."
    >
      <KaraokeLab />
    </Surface>
  )
}
