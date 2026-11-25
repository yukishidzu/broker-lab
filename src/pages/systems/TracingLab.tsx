import { useState } from 'react'
import { ArrowUpRight, Link2, Unlink } from 'lucide-react'
import { Badge } from '../../components/ui/badge'
import { buildTrace, traceParent } from '../../engine/core/trace'
import { cn } from '../../lib/utils'

export function TracingLab() {
  const [slowBilling, setSlowBilling] = useState(false)
  const [broken, setBroken] = useState(false)
  const spans = buildTrace(slowBilling, broken)
  const [selectedId, setSelectedId] = useState(spans[2].id)
  const selected = spans.find((span) => span.id === selectedId) ?? spans[0]
  const end = Math.max(...spans.map((span) => span.start + span.duration))
  const traceCount = new Set(spans.map((span) => span.traceId)).size

  return (
    <div>
      <div className="max-w-3xl"><Badge>Наблюдаемость</Badge><h2 className="mt-3 text-lg font-semibold">Distributed tracing бизнес-операции</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Один заказ проходит HTTP и несколько сообщений. Trace показывает вызовы и ожидание, а businessId и causation связывают бизнес-события даже между разными traces.</p></div>

      <div className="mt-5 flex flex-wrap gap-3"><Toggle active={slowBilling} onChange={setSlowBilling} label="Billing обрабатывает 220 мс вместо 80 мс" /><Toggle active={broken} onChange={setBroken} label="Не передавать trace context в Billing" /></div>
      {broken && <div className="mt-4 flex items-start gap-2 rounded-xl bg-warning/10 p-3 text-sm leading-relaxed text-foreground"><Unlink size={17} className="mt-0.5 shrink-0" />Billing начинает новый root trace. orderId=order-1042 и application-level causedBy сохранились, но автоматическая связь spans с исходным trace потеряна.</div>}

      <section className="mt-4 rounded-xl border border-border bg-card p-4" aria-label="Временная шкала trace">
        <div className="flex flex-wrap items-center gap-3"><h3 className="text-sm font-semibold">Trace timeline</h3><Badge>{traceCount} trace</Badge><Badge>{spans.length} spans</Badge><span className="ml-auto font-mono text-xs text-muted-foreground">Общая длительность: {end} мс</span></div>
        <div className="mt-5 min-w-0">
          <div className="ml-[150px] flex justify-between font-mono text-[9px] text-muted-foreground max-md:ml-[120px]"><span>0 мс</span><span>{Math.round(end / 2)} мс</span><span>{end} мс</span></div>
          <div className="mt-2 space-y-1.5">{spans.map((span) => <button key={span.id} type="button" onClick={() => setSelectedId(span.id)} className={cn('grid w-full grid-cols-[140px_minmax(0,1fr)] items-center gap-2.5 rounded-lg p-2 text-left hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring max-md:grid-cols-[110px_minmax(0,1fr)]', selected.id === span.id && 'bg-primary/[0.06]')}>
            <span className="min-w-0"><span className="block truncate font-mono text-[11px] font-medium">{span.service}</span><span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{span.name}</span></span>
            <span className="relative h-8 rounded bg-secondary/50"><span className={cn('absolute top-1 flex h-6 items-center rounded-md px-2 font-mono text-[10px] text-primary-foreground', span.traceId === spans[0].traceId ? 'bg-primary' : 'border border-warning/40 bg-warning/15 text-foreground')} style={{ left: `${(span.start / end) * 100}%`, width: `${Math.max(3, (span.duration / end) * 100)}%` }} title={`${span.name}: ${span.duration} мс`}>{span.duration / end > 0.08 ? `${span.duration} мс` : ''}</span></span>
          </button>)}</div>
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-border bg-card p-4" aria-label="Выбранный span">
        <div className="flex flex-wrap items-center gap-2"><Link2 size={16} className="text-primary" /><h3 className="text-sm font-semibold">{selected.service} · {selected.name}</h3></div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Field label="traceId" value={selected.traceId} /><Field label="spanId" value={selected.id} /><Field label="parentSpanId" value={selected.parentId ?? 'null · root span'} /><Field label="orderId / correlation" value={selected.orderId} /><Field label="eventId" value={selected.eventId} /><Field label="messageId" value={selected.messageId ?? '—'} /><Field label="causedBy / causation" value={selected.causedBy ?? '—'} /><Field label="start / duration" value={`${selected.start} мс / ${selected.duration} мс`} /></dl>
        <p className="mt-4 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">W3C traceparent</p><pre className="code-block mt-1.5">{traceParent(selected)}</pre>
      </section>

      <div className="mt-4 grid gap-3 md:grid-cols-3"><Info title="traceId и spanId">Trace объединяет spans операции. Каждый span имеет собственный ID; parentSpanId задаёт иерархию, но не обязан совпадать с eventId.</Info><Info title="Messaging context">Producer внедряет context в headers, consumer извлекает его. Брокер не обязан автоматически строить distributed trace за приложение.</Info><Info title="Correlation и causation">orderId связывает бизнес-операцию, causedBy — причинное событие. Они полезны даже при разрыве trace, но не заменяют временные spans.</Info></div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs"><a href="https://www.w3.org/TR/trace-context/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">W3C Trace Context<ArrowUpRight size={12} /></a><a href="https://opentelemetry.io/docs/specs/semconv/messaging/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">OpenTelemetry — messaging<ArrowUpRight size={12} /></a></div>
    </div>
  )
}

function Toggle({ active, onChange, label }: { active: boolean; onChange: (value: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={active} onClick={() => onChange(!active)} className="flex min-h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-left text-xs font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"><span className={cn('relative h-5 w-9 shrink-0 rounded-full bg-secondary', active && 'bg-primary')}><span className={cn('absolute left-0.5 top-0.5 size-4 rounded-full bg-card shadow-sm transition-transform', active && 'translate-x-4')} /></span>{label}</button>
}

function Field({ label, value }: { label: string; value: string }) {
  return <div><dt className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 break-all font-mono text-[11px]">{value}</dd></div>
}

function Info({ title, children }: { title: string; children: React.ReactNode }) {
  return <article className="rounded-xl border border-border bg-card p-4"><h3 className="text-sm font-semibold">{title}</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{children}</p></article>
}
