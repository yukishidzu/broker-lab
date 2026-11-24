import { ArrowRight } from 'lucide-react'
import { logThrough } from '../../engine/core/player'
import type { ScenarioDefinition } from '../../types'
import { cn } from '../../lib/utils'
import { Badge } from '../ui/badge'

const kindLabels = {
  business: 'Бизнес', message: 'Сообщение', storage: 'Хранение', confirmation: 'Подтверждение', delivery: 'Доставка', effect: 'Эффект',
}

export function EventLog({ scenario, current, onSelect }: {
  scenario: ScenarioDefinition
  current: number
  onSelect: (index: number) => void
}) {
  const entries = logThrough(scenario, current)
  return (
    <section aria-label="Журнал событий" className="flex min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <h2 className="text-xs font-semibold">Журнал событий</h2>
        <span className="font-mono text-[10px] text-muted-foreground">{entries.length} записей · условное время</span>
      </div>
      <ol className="max-h-[260px] min-h-[150px] overflow-auto p-2 scrollbar-thin lg:max-h-none lg:flex-1">
        {entries.map((entry, index) => (
          <li key={entry.stepId}>
            <button type="button" onClick={() => onSelect(index)} className={cn('grid w-full cursor-pointer grid-cols-[32px_minmax(0,1fr)] gap-2 rounded-lg px-2 py-2 text-left hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring', index === current && 'bg-primary/8')} aria-current={index === current ? 'step' : undefined}>
              <span className="pt-0.5 font-mono text-[10px] text-muted-foreground">#{String(entry.sequence).padStart(2, '0')}</span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2"><Badge className="text-[9px]">{kindLabels[entry.kind]}</Badge><span className="font-mono text-[10px] text-muted-foreground">T+{entry.atMs} мс</span><code className="font-mono text-[11px] font-medium">{entry.action}</code></span>
                <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground"><span>{entry.source}</span><ArrowRight size={11} /><span>{entry.target}</span></span>
                <span className="mt-1 block text-xs leading-relaxed">{entry.result}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  )
}
