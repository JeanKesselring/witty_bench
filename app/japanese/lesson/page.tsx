import { Surface } from '@/components/ui/Surface'
import { DailyLesson } from './DailyLesson'

export const metadata = { title: 'Today’s lesson — Common Sage' }

export default function LessonPage() {
  return (
    <Surface
      title="Today’s lesson"
      orientation="Choose today’s mix, then work through review, context, and recall as one coherent lesson."
    >
      <DailyLesson />
    </Surface>
  )
}
