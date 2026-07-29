import { Surface } from '@/components/ui/Surface'
import { TutorChat } from './TutorChat'

export const metadata = { title: 'Language tutor — Common Sage' }

export default function ChatPage() {
  return (
    <Surface
      title="Language tutor"
      orientation="Have a natural Japanese conversation, with optional translations and today’s lesson topic carried in when useful."
    >
      <TutorChat />
    </Surface>
  )
}
