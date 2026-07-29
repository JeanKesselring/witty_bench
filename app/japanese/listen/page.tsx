import { Surface } from '@/components/ui/Surface'
import { ListenLab } from './ListenLab'

export const metadata = { title: 'Listen — Common Sage' }

export default function ListenPage() {
  return (
    <Surface
      title="Listen"
      orientation="Choose a text, listen to it whole or sentence by sentence, then check what you understood."
    >
      <ListenLab />
    </Surface>
  )
}
