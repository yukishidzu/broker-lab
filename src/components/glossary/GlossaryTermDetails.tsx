import { ArrowUpRight } from 'lucide-react'
import type { GlossaryTerm } from '../../types'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'

export function GlossaryTermDetails({ term, onOpenScenario }: { term: GlossaryTerm; onOpenScenario?: () => void }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{term.category}</Badge>
        <code className="rounded bg-secondary px-2 py-1 font-mono text-xs text-secondary-foreground">{term.english}</code>
      </div>
      <p className="text-base font-medium leading-relaxed">{term.short}</p>
      <p className="text-sm leading-7 text-muted-foreground">{term.description}</p>
      <section className="rounded-lg bg-warning/10 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-warning">Не путать</h3>
        <p className="mt-1.5 text-sm leading-relaxed">{term.mistake}</p>
      </section>
      <div className="flex flex-wrap gap-2">
        {onOpenScenario && <Button variant="outline" size="sm" onClick={onOpenScenario} className="h-10">Открыть на схеме</Button>}
        <a href={term.source.url} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
          {term.source.title}<ArrowUpRight size={14} />
        </a>
      </div>
    </div>
  )
}
