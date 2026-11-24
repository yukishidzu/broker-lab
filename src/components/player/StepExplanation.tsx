import { ArrowUpRight, BookOpen } from 'lucide-react'
import type { ScenarioStep } from '../../types'
import { glossaryById } from '../../content/glossary'
import { Badge } from '../ui/badge'

export function StepExplanation({ step, onOpenTerm }: { step: ScenarioStep; onOpenTerm: (id: string) => void }) {
  return (
    <article className="p-4">
      <Badge>Текущий этап</Badge>
      <h2 className="mt-3 text-lg font-semibold leading-snug">{step.title}</h2>
      <p className="mt-3 text-sm font-medium leading-6">{step.summary}</p>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">{step.explanation}</p>
      <section className="mt-5 border-t border-border pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Технические детали</h3>
        <ul className="mt-2 space-y-2">
          {step.technical.map((item) => <li key={item} className="flex gap-2 text-xs leading-5 text-muted-foreground"><span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground" />{item}</li>)}
        </ul>
      </section>
      <section className="mt-5 border-t border-border pt-4">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><BookOpen size={13} />Термины на этом шаге</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {step.terms.map((id) => {
            const term = glossaryById.get(id)
            return term ? <button key={id} type="button" onClick={() => onOpenTerm(id)} className="cursor-pointer rounded-md bg-secondary px-2 py-1.5 text-[11px] font-medium text-secondary-foreground hover:bg-accent hover:text-primary focus-visible:outline-2 focus-visible:outline-ring">{term.title}</button> : null
          })}
        </div>
      </section>
      <a href={step.source.url} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-start gap-1.5 rounded-lg py-1 text-xs font-medium leading-5 text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring">
        <span>{step.source.title}</span><ArrowUpRight className="mt-0.5 shrink-0" size={13} />
      </a>
    </article>
  )
}
