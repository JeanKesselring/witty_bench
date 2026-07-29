import { Surface } from '@/components/ui/Surface'
import { MODULE_TYPES } from '@/lib/modules/registry'
import { EXAMPLE_MODULES } from '@/lib/api/examples'
import { QUEUE } from '@/lib/api/fixtures'
import { ModuleCatalogue } from './ModuleCatalogue'

/* The type harness — every module type in §6.14, running for real.
 *
 * A design surface, not a learner one. Each example renders through the same
 * ModuleFrame / ScrollModule the deck uses, with the real response controls
 * and the real judgement loop, so a type can actually be TESTED: answered,
 * checked, rated, reset. A page that only described the types could not tell
 * you whether the cloze gap is reachable or the frame survives a long
 * Japanese prompt. It draws from fixtures deliberately — the point is to
 * exercise composition before any of it is wired to the backend.
 */

export const metadata = { title: 'Module types — Common Sage' }

export default function ModulesPage() {
  // Examples live in two places: the eight that were already in the session
  // queue, and the rest written to complete the set. Merged by type so the
  // catalogue shows one of each and nothing is duplicated.
  const byType = new Map([...QUEUE, ...EXAMPLE_MODULES].map((m) => [m.moduleType, m]))
  const entries = MODULE_TYPES.map((spec) => ({
    spec,
    example: byType.get(spec.id) ?? null,
  }))

  const covered = entries.filter((e) => e.example).length

  return (
    <Surface
      title="Module types"
      orientation={`All ${MODULE_TYPES.length} types, live. ${covered} have a worked example — pick one and answer it.`}
    >
      <ModuleCatalogue entries={entries} />
    </Surface>
  )
}
