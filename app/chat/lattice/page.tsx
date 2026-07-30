import { LatticeTutorChat } from './LatticeTutorChat'

export const metadata = { title: 'Language tutor — Common Sage' }

export default function LatticeChatPage() {
  return (
    <main id="k-main" tabIndex={-1} className="k-main k-main--chat-lattice">
      <LatticeTutorChat />
    </main>
  )
}
