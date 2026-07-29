import { Surface } from '@/components/ui/Surface'
import { DailyLesson } from './DailyLesson'

export const metadata = { title: 'Today’s lesson — Common Sage' }

export default function LessonPage() {
  return (
    <Surface title="Today’s lesson" orientation="Choose today’s mix, then start the lesson.">
      <DailyLesson />
    </Surface>
  )
}
