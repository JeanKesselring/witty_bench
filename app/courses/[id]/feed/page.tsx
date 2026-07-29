import { Surface } from '@/components/ui/Surface'
import { Feed } from './Feed'

export const metadata = { title: 'Study feed — Common Sage' }

export default async function FeedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <Surface
      title="Study feed"
      orientation="Scroll through the course. What appears is chosen for you — recent material you have not mastered, mixed with review — and it keeps going."
    >
      <Feed courseId={id} />
    </Surface>
  )
}
