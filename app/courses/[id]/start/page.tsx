import { DeckSurface } from '@/components/deck/DeckSurface'

export default async function StartPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <DeckSurface courseId={id} />
}
