import { KnowledgeGraph } from '@/components/graph/KnowledgeGraph'

export default async function GraphPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <KnowledgeGraph courseId={id} />
}
