import { glossaryById } from '../../content/glossary'
import { Dialog, DialogContent } from '../ui/dialog'
import { GlossaryTermDetails } from './GlossaryTermDetails'

export function GlossaryDialog({ termId, onClose, onOpenScenario }: { termId: string | null; onClose: () => void; onOpenScenario: () => void }) {
  const term = termId ? glossaryById.get(termId) : undefined
  return (
    <Dialog open={Boolean(term)} onOpenChange={(open) => { if (!open) onClose() }}>
      {term && (
        <DialogContent side title={term.title} description={term.short}>
          <GlossaryTermDetails term={term} onOpenScenario={onOpenScenario} />
        </DialogContent>
      )}
    </Dialog>
  )
}
