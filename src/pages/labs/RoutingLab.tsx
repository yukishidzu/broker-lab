import { useState } from 'react'
import { ArrowRight, ArrowUpRight, Check, Copy, Split, X } from 'lucide-react'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { routeMessage, type ExchangeKind, type RoutingBinding } from '../../engine/rabbitmq/routing'
import { cn } from '../../lib/utils'

const messages = {
  paid: { label: 'order.paid', routingKey: 'order.paid', headers: { event: 'order', status: 'paid', region: 'eu', format: 'json', priority: 'normal' } },
  created: { label: 'order.eu.created', routingKey: 'order.eu.created', headers: { event: 'order', status: 'created', region: 'eu', format: 'json', priority: 'high' } },
  failed: { label: 'payment.failed', routingKey: 'payment.failed', headers: { event: 'payment', status: 'failed', region: 'us', format: 'json', priority: 'normal' } },
}

const initialBindings: RoutingBinding[] = [
  { queue: 'billing', bindingKey: 'order.paid', enabled: true, xMatch: 'all', headers: { event: 'order', status: 'paid' } },
  { queue: 'europe-orders', bindingKey: 'order.eu.*', enabled: true, xMatch: 'all', headers: { region: 'eu' } },
  { queue: 'priority-audit', bindingKey: '#', enabled: true, xMatch: 'any', headers: { priority: 'high', format: 'xml' } },
]

export function RoutingLab() {
  const [exchange, setExchange] = useState<ExchangeKind>('topic')
  const [preset, setPreset] = useState<keyof typeof messages>('paid')
  const [routingKey, setRoutingKey] = useState(messages.paid.routingKey)
  const [headers, setHeaders] = useState(messages.paid.headers)
  const [bindings, setBindings] = useState(initialBindings)
  const [mandatory, setMandatory] = useState(true)
  const routed = routeMessage(exchange, routingKey, headers, bindings)

  const selectMessage = (id: keyof typeof messages) => {
    setPreset(id)
    setRoutingKey(messages[id].routingKey)
    setHeaders(messages[id].headers)
  }
  const updateBinding = (queue: string, patch: Partial<RoutingBinding>) => setBindings((items) => items.map((item) => item.queue === queue ? { ...item, ...patch } : item))

  return (
    <div>
      <div className="max-w-3xl"><Badge>RabbitMQ</Badge><h2 className="mt-3 text-lg font-semibold">Exchange и маршрутизация</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Меняйте тип exchange, routing key и bindings. Результат — направления одной публикации в queues, а ещё не обработка consumers.</p></div>

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Тип exchange">
        {(['direct', 'topic', 'fanout', 'headers'] as const).map((kind) => <button key={kind} type="button" aria-pressed={exchange === kind} onClick={() => setExchange(kind)} className={cn('cursor-pointer rounded-lg border border-border bg-card px-3 py-2 font-mono text-xs hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-ring', exchange === kind && 'border-primary/60 bg-primary/10 text-primary')}>{kind}</button>)}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <section className="rounded-xl border border-border bg-card p-4" aria-label="Публикация">
          <h3 className="text-sm font-semibold">Сообщение msg-017</h3>
          <div className="mt-3 flex flex-wrap gap-1.5">{(Object.keys(messages) as (keyof typeof messages)[]).map((id) => <button key={id} type="button" aria-pressed={preset === id} onClick={() => selectMessage(id)} className={cn('cursor-pointer rounded-md px-2 py-1.5 font-mono text-[10px] hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring', preset === id ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground')}>{messages[id].label}</button>)}</div>
          <label className="mt-4 block text-xs font-medium">Routing key<Input value={routingKey} onChange={(event) => setRoutingKey(event.target.value)} disabled={exchange === 'fanout' || exchange === 'headers'} className="mt-1.5 font-mono text-xs disabled:opacity-60" /></label>
          <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Headers</p><pre className="code-block mt-1.5">{JSON.stringify(headers, null, 2)}</pre>
          <button type="button" role="switch" aria-checked={mandatory} onClick={() => setMandatory((value) => !value)} className="mt-3 flex items-center gap-2 rounded-lg text-xs font-medium focus-visible:outline-2 focus-visible:outline-ring"><span className={cn('relative h-5 w-9 rounded-full bg-secondary', mandatory && 'bg-primary')}><span className={cn('absolute left-0.5 top-0.5 size-4 rounded-full bg-card shadow-sm transition-transform', mandatory && 'translate-x-4')} /></span>mandatory</button>
        </section>

        <section className="rounded-xl border border-border bg-card p-4" aria-label="Результат маршрутизации">
          <div className="flex flex-wrap items-center gap-3"><span className="rounded-lg bg-secondary px-3 py-2 text-xs">Producer</span><ArrowRight size={15} className="text-muted-foreground" /><span className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 font-mono text-xs font-medium text-primary"><Split size={15} />{exchange} exchange</span><Badge>{directionLabel(routed.length)}</Badge></div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {bindings.map((binding) => {
              const matches = routed.includes(binding.queue)
              return <article key={binding.queue} className={cn('rounded-xl border border-border p-3 transition-colors', matches ? 'border-primary/50 bg-primary/[0.05]' : 'bg-secondary/30')}>
                <div className="flex items-center justify-between gap-2"><h3 className="font-mono text-sm font-semibold">{binding.queue}</h3>{matches ? <Check size={16} className="text-success" /> : <X size={15} className="text-muted-foreground" />}</div>
                <p className={cn('mt-1 text-xs', matches ? 'text-success' : 'text-muted-foreground')}>{matches ? 'Получает копию сообщения' : binding.enabled ? 'Binding не совпал' : 'Binding отключён'}</p>
                {(exchange === 'direct' || exchange === 'topic') && <label className="mt-3 block text-[10px] uppercase tracking-wide text-muted-foreground">Binding key<input value={binding.bindingKey} onChange={(event) => updateBinding(binding.queue, { bindingKey: event.target.value })} className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-2 font-mono text-xs outline-none focus:border-ring" /></label>}
                {exchange === 'headers' && <div className="mt-3"><p className="font-mono text-[10px] text-muted-foreground">x-match={binding.xMatch}</p><pre className="code-block mt-1.5 !p-2 !text-[10px]">{JSON.stringify(binding.headers)}</pre></div>}
                {exchange === 'fanout' && <p className="mt-3 text-xs text-muted-foreground">Binding и routing key игнорируются.</p>}
                <Button variant="ghost" size="sm" className="mt-2 px-0" onClick={() => updateBinding(binding.queue, { enabled: !binding.enabled })}>{binding.enabled ? 'Отключить binding' : 'Включить binding'}</Button>
                {matches && <div className="mt-2 flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1.5 font-mono text-[10px] text-primary"><Copy size={12} />msg-017 / copy</div>}
              </article>
            })}
          </div>
          {!routed.length && <div className="mt-4 rounded-lg bg-warning/10 p-3 text-sm leading-relaxed text-warning">{mandatory ? 'Нет подходящих queues: брокер возвращает сообщение producer через basic.return, затем подтверждает обработку публикации confirm.' : 'Нет подходящих queues: сообщение unroutable и отбрасывается. Publisher confirm не означает, что оно попало в queue.'}</div>}
          {routed.length > 0 && <p className="mt-4 rounded-lg bg-secondary/70 p-3 text-xs leading-relaxed text-muted-foreground">Публикация одна, направлений: {routed.length}. Каждая queue имеет независимую доставку и acknowledgements своих consumers.</p>}
        </section>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3"><Info title="direct">Точное совпадение routing key и binding key.</Info><Info title="topic">* заменяет ровно одно слово; # — ноль или больше слов. Одна queue получает одно сообщение, даже если совпали несколько её bindings.</Info><Info title="headers">x-match=all требует все условия, any — хотя бы одно. Routing key не определяет результат.</Info></div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs"><a href="https://www.rabbitmq.com/tutorials/tutorial-four-python" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">RabbitMQ routing<ArrowUpRight size={12} /></a><a href="https://www.rabbitmq.com/tutorials/tutorial-five-python" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">RabbitMQ topics<ArrowUpRight size={12} /></a></div>
    </div>
  )
}

function directionLabel(count: number) {
  const lastTwo = count % 100
  const last = count % 10
  if (lastTwo >= 11 && lastTwo <= 14) return `${count} направлений`
  if (last === 1) return `${count} направление`
  if (last >= 2 && last <= 4) return `${count} направления`
  return `${count} направлений`
}

function Info({ title, children }: { title: string; children: React.ReactNode }) {
  return <article className="rounded-xl border border-border bg-card p-4"><h3 className="font-mono text-sm font-semibold">{title}</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{children}</p></article>
}
