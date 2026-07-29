import { Surface } from '@/components/ui/Surface'
import { Placement } from './Placement'

export const metadata = { title: 'Placement — Common Sage' }

export default function PlacementPage() {
  return (
    <Surface
      title="Placement"
      orientation="A short adaptive check across kana, vocabulary, kanji and grammar, so the first lesson starts somewhere sensible. Pause whenever you like."
    >
      <Placement />
    </Surface>
  )
}
