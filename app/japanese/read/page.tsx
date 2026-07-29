import { Surface } from '@/components/ui/Surface'
import { ReadLab } from './ReadLab'

export const metadata = { title: 'Read — Common Sage' }

export default function ReadPage() {
  return (
    <Surface
      title="Read"
      orientation="Choose a text from your library, then tap any word for its reading, meaning, and grammar."
    >
      <ReadLab />
    </Surface>
  )
}
