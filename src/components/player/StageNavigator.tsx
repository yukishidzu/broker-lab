import { Check, Circle } from 'lucide-react'
import type { ScenarioDefinition } from '../../types'
import { cn } from '../../lib/utils'

export function StageNavigator({ scenario, current, onSelect }: {
  scenario: ScenarioDefinition
  current: number
  onSelect: (index: number) => void
}) {
  return (
    <nav aria-label="Этапы пути сообщения" className="h-full overflow-auto p-3 scrollbar-thin">
      <div className="mb-3 px-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Путь сообщения</h2>
        <p className="mt-1 text-xs text-muted-foreground">Можно открыть любой этап</p>
      </div>
      <ol className="space-y-1">
        {scenario.steps.map((step, index) => (
          <li key={step.id} className="relative">
            {index < scenario.steps.length - 1 && <span className={cn('absolute left-[17px] top-9 h-[calc(100%-22px)] w-px bg-border', index < current && 'bg-primary/35')} aria-hidden="true" />}
            <button
              type="button"
              onClick={() => onSelect(index)}
              aria-current={index === current ? 'step' : undefined}
              className={cn('relative flex w-full cursor-pointer items-start gap-2.5 rounded-lg px-2 py-2.5 text-left text-sm text-muted-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring', index === current && 'bg-primary/8 text-foreground')}
            >
              <span className={cn('grid size-5 shrink-0 place-items-center rounded-full border border-border bg-card', index === current && 'border-primary text-primary', index < current && 'border-success/40 bg-success/10 text-success')}>
                {index < current ? <Check size={12} /> : <Circle size={8} fill={index === current ? 'currentColor' : 'none'} />}
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Шаг {index + 1}</span>
                <span className={cn('mt-0.5 block leading-snug', index === current && 'font-medium')}>{step.shortTitle}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}
