import { useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, RotateCcw, ShieldAlert, ShieldCheck } from 'lucide-react'
import { BrokerSwitch } from '../components/player/BrokerSwitch'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { deliveryScenario, guaranteeOptions, type FactTone, type GuaranteeMode } from '../content/delivery'
import { cn } from '../lib/utils'
import type { Broker } from '../types'

export function DeliveryPage() {
  const [broker, setBroker] = useState<Broker>('kafka')
  const [mode, setMode] = useState<GuaranteeMode>('at-least')
  const [idempotent, setIdempotent] = useState(false)
  const [current, setCurrent] = useState(0)
  const scenario = deliveryScenario(broker, mode, idempotent)
  const options = guaranteeOptions.filter((option) => option.broker === broker)
  const step = scenario.steps[current]
  const failedOutcome = mode === 'at-most' || (mode === 'at-least' && !idempotent)

  const changeBroker = (value: Broker) => {
    setBroker(value)
    setMode('at-least')
    setCurrent(0)
  }
  const changeMode = (value: GuaranteeMode) => {
    setMode(value)
    setCurrent(0)
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-7 md:px-5">
      <div className="flex flex-wrap items-start gap-4">
        <div className="max-w-2xl"><Badge>Интерактивный разбор</Badge><h1 className="mt-3 text-xl font-semibold">Гарантии доставки и обработки</h1><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Одно и то же событие проходит через сбой при разном порядке обработки и подтверждения. Смотрите не только доставку, но и число внешних эффектов.</p></div>
        <div className="ml-auto"><BrokerSwitch value={broker} onChange={changeBroker} /></div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3" role="group" aria-label="Режим гарантии">
        {options.map((option) => (
          <button key={option.id} type="button" aria-pressed={mode === option.id} onClick={() => changeMode(option.id)} className={cn('cursor-pointer rounded-xl border border-border bg-card p-4 text-left hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-ring', mode === option.id && 'border-primary/60 bg-primary/[0.05]')}>
            <span className="text-sm font-semibold">{option.label}</span><span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">{option.short}</span>
          </button>
        ))}
      </div>

      <section className="mt-5 overflow-hidden rounded-xl border border-border bg-card" aria-label="Симуляция гарантии доставки">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="min-w-0 flex-1"><h2 className="font-semibold">{scenario.title}</h2><p className="mt-1 text-xs text-muted-foreground">{scenario.summary}</p></div>
          {mode === 'at-least' && <button type="button" role="switch" aria-checked={idempotent} onClick={() => { setIdempotent((value) => !value); setCurrent(0) }} className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-border px-3 text-xs font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"><span className={cn('relative h-5 w-9 rounded-full bg-secondary transition-colors', idempotent && 'bg-primary')}><span className={cn('absolute left-0.5 top-0.5 size-4 rounded-full bg-card shadow-sm transition-transform', idempotent && 'translate-x-4')} /></span>Идемпотентный consumer</button>}
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 border-b border-border lg:border-b-0 lg:border-r">
            <ol className="flex overflow-x-auto border-b border-border p-3 scrollbar-thin" aria-label="Шаги сценария">
              {scenario.steps.map((item, index) => <li key={item.title} className="min-w-0 flex-1"><button type="button" onClick={() => setCurrent(index)} aria-current={index === current ? 'step' : undefined} className={cn('w-full cursor-pointer rounded-lg px-2 py-2 text-center text-[11px] text-muted-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring', index === current && 'bg-primary/10 font-medium text-foreground')}><span className={cn('mx-auto mb-1.5 grid size-5 place-items-center rounded-full border border-border font-mono text-[10px]', index < current && 'border-success/40 bg-success/10 text-success', index === current && 'border-primary text-primary')}>{index < current ? <Check size={11} /> : index + 1}</span><span className="hidden truncate sm:block">{item.title}</span><span className="sm:hidden">Шаг {index + 1}</span></button></li>)}
            </ol>
            <div className="p-5">
              <Badge>Шаг {current + 1} из {scenario.steps.length}</Badge>
              <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">{step.description}</p>
              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                {step.facts.map((fact) => <div key={fact.label} className={cn('rounded-lg bg-secondary/70 p-3', fact.tone === 'success' && 'bg-success/10', fact.tone === 'warning' && 'bg-warning/10', fact.tone === 'danger' && 'bg-destructive/10')}><p className="text-[11px] uppercase tracking-wide text-muted-foreground">{fact.label}</p><p className={cn('mt-1.5 text-sm font-medium', toneClass(fact.tone))}>{fact.value}</p></div>)}
              </div>
              <div className="mt-5 rounded-lg border border-border bg-background p-3 font-mono text-xs leading-relaxed"><span className="text-muted-foreground">T+{current * 120} мс · </span>{step.event}</div>
            </div>
            <div className="flex items-center gap-2 border-t border-border p-3">
              <Button variant="outline" onClick={() => setCurrent((value) => Math.max(0, value - 1))} disabled={current === 0}><ArrowLeft size={15} />Назад</Button>
              <Button variant="ghost" size="icon" onClick={() => setCurrent(0)} disabled={current === 0} aria-label="Сбросить сценарий"><RotateCcw size={15} /></Button>
              <Button className="ml-auto" onClick={() => setCurrent((value) => Math.min(scenario.steps.length - 1, value + 1))} disabled={current === scenario.steps.length - 1}>Далее<ArrowRight size={15} /></Button>
            </div>
          </div>
          <aside className="p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Итог запуска</h3>
            <div className={cn('mt-3 rounded-lg p-3', failedOutcome ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success')}><div className="flex items-start gap-2">{failedOutcome ? <ShieldAlert className="mt-0.5 shrink-0" size={17} /> : <ShieldCheck className="mt-0.5 shrink-0" size={17} />}<p className="text-sm font-medium leading-relaxed">{scenario.outcome}</p></div></div>
            <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Условия и границы</h3>
            <ul className="mt-2 space-y-2">{scenario.notes.map((note) => <li key={note} className="flex gap-2 text-xs leading-5 text-muted-foreground"><span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground" />{note}</li>)}</ul>
            <a href={scenario.source.url} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-start gap-1.5 rounded text-xs font-medium leading-5 text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring">{scenario.source.title}<ArrowUpRight size={13} className="mt-0.5 shrink-0" /></a>
          </aside>
        </div>
      </section>

      <section className="mt-5 rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Не смешивайте уровни гарантии</h2>
        <div className="mt-3 grid gap-3 text-xs leading-relaxed text-muted-foreground md:grid-cols-3"><p><strong className="text-foreground">Producer acks/confirms</strong><br />Что producer знает о принятии публикации брокером.</p><p><strong className="text-foreground">Consumer ack/commit</strong><br />Какую позицию или доставку брокер считает завершённой.</p><p><strong className="text-foreground">Бизнес-эффект</strong><br />Что реально сохранено в БД или отправлено во внешнюю систему.</p></div>
      </section>
    </main>
  )
}

function toneClass(tone?: FactTone) {
  if (tone === 'success') return 'text-success'
  if (tone === 'warning') return 'text-warning'
  if (tone === 'danger') return 'text-destructive'
  return ''
}
