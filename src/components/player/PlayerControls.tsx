import { ArrowLeft, ArrowRight, RotateCcw, SkipForward } from 'lucide-react'
import type { ScenarioDefinition } from '../../types'
import { Button } from '../ui/button'
import { Tooltip } from '../ui/tooltip'

export function PlayerControls({ scenario, current, onChange }: {
  scenario: ScenarioDefinition
  current: number
  onChange: (index: number) => void
}) {
  const last = current === scenario.steps.length - 1
  return (
    <div className="border-t border-border bg-card p-3">
      <div className="mb-3 flex items-center gap-3">
        <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{current + 1} / {scenario.steps.length}</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-label="Прогресс по сценарию" aria-valuemin={1} aria-valuemax={scenario.steps.length} aria-valuenow={current + 1}>
          <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${((current + 1) / scenario.steps.length) * 100}%` }} />
        </div>
        <Tooltip label="Вернуться к началу">
          <Button variant="ghost" size="icon" onClick={() => onChange(0)} disabled={current === 0} aria-label="Вернуться к началу"><RotateCcw size={15} /></Button>
        </Tooltip>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => onChange(current - 1)} disabled={current === 0}><ArrowLeft size={15} />Назад</Button>
        <Button variant="ghost" size="sm" onClick={() => onChange(scenario.steps.length - 1)} disabled={last} className="ml-auto max-sm:hidden"><SkipForward size={14} />До конца</Button>
        <Button onClick={() => onChange(last ? 0 : current + 1)} className={last ? 'ml-auto' : ''}>
          {last ? <><RotateCcw size={15} />Пройти ещё раз</> : <>Далее<ArrowRight size={15} /></>}
        </Button>
      </div>
    </div>
  )
}
