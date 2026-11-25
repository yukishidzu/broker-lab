import { useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, RotateCcw, ShieldAlert } from 'lucide-react'
import { BrokerSwitch } from '../../components/player/BrokerSwitch'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { retryScenario, type KafkaRetryStrategy, type RetryError } from '../../content/retry'
import { cn } from '../../lib/utils'
import type { Broker } from '../../types'

export function RetryLab() {
  const [broker, setBroker] = useState<Broker>('rabbitmq')
  const [error, setError] = useState<RetryError>('poison')
  const [limit, setLimit] = useState(3)
  const [strategy, setStrategy] = useState<KafkaRetryStrategy>('blocking')
  const [current, setCurrent] = useState(0)
  const scenario = retryScenario(broker, error, limit, strategy)
  const step = scenario.steps[current]
  const reset = () => setCurrent(0)

  return (
    <div>
      <div className="flex flex-wrap items-start gap-4"><div className="max-w-3xl"><Badge>Надёжность</Badge><h2 className="mt-3 text-lg font-semibold">Retry, backoff и изоляция poison message</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Сравните временный сбой с ошибкой, которая не исчезает при повторах. Лимит попыток и конечная изоляция — отдельные решения от самого retry.</p></div><div className="ml-auto"><BrokerSwitch value={broker} onChange={(value) => { setBroker(value); reset() }} /></div></div>

      <div className="mt-5 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        <div><p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Тип ошибки</p><div className="flex gap-1 rounded-lg bg-secondary p-1"><button type="button" aria-pressed={error === 'transient'} onClick={() => { setError('transient'); reset() }} className={cn('h-8 cursor-pointer rounded-md px-3 text-xs', error === 'transient' && 'bg-card shadow-sm')}>Временная</button><button type="button" aria-pressed={error === 'poison'} onClick={() => { setError('poison'); reset() }} className={cn('h-8 cursor-pointer rounded-md px-3 text-xs', error === 'poison' && 'bg-card shadow-sm')}>Poison message</button></div></div>
        <label className="text-xs font-medium">Лимит попыток<select value={limit} onChange={(event) => { setLimit(Number(event.target.value)); reset() }} className="ml-2 h-10 rounded-lg border border-input bg-background px-3 font-mono outline-none focus:border-ring">{[1, 2, 3, 4, 5].map((value) => <option key={value}>{value}</option>)}</select></label>
        {broker === 'kafka' && <label className="text-xs font-medium">Стратегия<select value={strategy} onChange={(event) => { setStrategy(event.target.value as KafkaRetryStrategy); reset() }} className="ml-2 h-10 rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-ring"><option value="blocking">Тот же offset · блокирующий retry</option><option value="retry-topic">Отдельный retry topic</option></select></label>}
      </div>

      <section className="mt-4 overflow-hidden rounded-xl border border-border bg-card" aria-label="Сценарий повторной обработки">
        <div className="border-b border-border p-4"><h3 className="font-semibold">{scenario.title}</h3><p className="mt-1 text-xs text-muted-foreground">Backoff в модели: 500 мс × 2ⁿ, без jitter. Время условное.</p></div>
        <div className="grid lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 border-b border-border lg:border-b-0 lg:border-r">
            <ol className="flex overflow-x-auto border-b border-border p-3 scrollbar-thin" aria-label="Попытки обработки">{scenario.steps.map((item, index) => <li key={item.title} className="min-w-[72px] flex-1"><button type="button" onClick={() => setCurrent(index)} aria-current={index === current ? 'step' : undefined} className={cn('w-full cursor-pointer rounded-lg px-2 py-2 text-center text-[11px] text-muted-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring', index === current && 'bg-primary/10 text-foreground')}><span className={cn('mx-auto grid size-6 place-items-center rounded-full border border-border font-mono', index === current && 'border-primary text-primary', index < current && 'bg-secondary')}>{index + 1}</span><span className="mt-1 hidden sm:block">Шаг {index + 1}</span></button></li>)}</ol>
            <div className="p-5">
              <div className="flex flex-wrap items-center gap-2"><Badge>{step.status === 'retry' ? 'Retry' : step.status === 'success' ? 'Успех' : 'Dead letter'}</Badge><span className="font-mono text-[11px] text-muted-foreground">Шаг {current + 1} / {scenario.steps.length}</span></div>
              <h3 className="mt-3 text-lg font-semibold">{step.title}</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{step.description}</p>
              <div className="mt-5 flex flex-wrap items-center gap-2" aria-label="Текущий поток"><FlowNode>{broker === 'rabbitmq' ? 'queue billing' : 'orders / P0@184'}</FlowNode><ArrowRight size={14} className="text-muted-foreground" /><FlowNode>consumer</FlowNode><ArrowRight size={14} className="text-muted-foreground" /><FlowNode active tone={step.status}>{step.status === 'success' ? broker === 'rabbitmq' ? 'БД + ack' : 'БД + commit' : step.status === 'dlq' ? broker === 'rabbitmq' ? 'DLX → dead-letters' : 'orders.dlq' : strategy === 'retry-topic' && broker === 'kafka' ? 'orders.retry' : 'backoff + retry'}</FlowNode></div>
              <div className="mt-5 grid gap-2 sm:grid-cols-3">{step.facts.map((fact) => <div key={fact.label} className="rounded-lg bg-secondary/70 p-3"><p className="text-[11px] uppercase tracking-wide text-muted-foreground">{fact.label}</p><p className="mt-1.5 text-sm font-medium">{fact.value}</p></div>)}</div>
              <div className="mt-4 rounded-lg border border-border bg-background p-3 font-mono text-xs">{step.event}</div>
            </div>
            <div className="flex items-center gap-2 border-t border-border p-3"><Button variant="outline" onClick={() => setCurrent((value) => Math.max(0, value - 1))} disabled={current === 0}><ArrowLeft size={14} />Назад</Button><Button variant="ghost" size="icon" onClick={reset} disabled={current === 0} aria-label="Сбросить retry сценарий"><RotateCcw size={14} /></Button><Button className="ml-auto" onClick={() => setCurrent((value) => Math.min(scenario.steps.length - 1, value + 1))} disabled={current === scenario.steps.length - 1}>Далее<ArrowRight size={14} /></Button></div>
          </div>
          <aside className="p-4"><h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Итог сценария</h3><div className={cn('mt-3 flex items-start gap-2 rounded-lg p-3 text-sm font-medium leading-relaxed', scenario.outcome.includes('один платёж') ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning')}>{scenario.outcome.includes('один платёж') ? <Check size={17} className="mt-0.5 shrink-0" /> : <ShieldAlert size={17} className="mt-0.5 shrink-0" />}{scenario.outcome}</div><h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Важные условия</h3><ul className="mt-2 space-y-2">{scenario.notes.map((note) => <li key={note} className="flex gap-2 text-xs leading-5 text-muted-foreground"><span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground" />{note}</li>)}</ul><p className="mt-3 text-xs leading-5 text-muted-foreground">Jitter добавляет случайный разброс к backoff, чтобы множество consumers не повторяло запросы одновременно.</p><a href={scenario.source.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-start gap-1 text-xs font-medium leading-5 text-primary hover:underline">{scenario.source.title}<ArrowUpRight size={12} className="mt-0.5" /></a></aside>
        </div>
      </section>
    </div>
  )
}

function FlowNode({ active = false, tone, children }: { active?: boolean; tone?: string; children: React.ReactNode }) {
  return <span className={cn('rounded-lg bg-secondary px-3 py-2 font-mono text-[11px]', active && tone === 'success' && 'bg-success/10 text-success', active && tone === 'dlq' && 'bg-destructive/10 text-destructive', active && tone === 'retry' && 'bg-warning/10 text-warning')}>{children}</span>
}
