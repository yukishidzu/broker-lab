import { useState } from 'react'
import { ArrowUpRight, Check, ServerCrash, ShieldCheck, X } from 'lucide-react'
import { BrokerSwitch } from '../../components/player/BrokerSwitch'
import { Badge } from '../../components/ui/badge'
import { kafkaFailover, rabbitFailover, type KafkaFailure, type RabbitFailure } from '../../engine/core/failover'
import { cn } from '../../lib/utils'
import type { Broker } from '../../types'

export function FailoverLab() {
  const [broker, setBroker] = useState<Broker>('kafka')
  const [kafkaFailure, setKafkaFailure] = useState<KafkaFailure>('two-followers')
  const [rabbitFailure, setRabbitFailure] = useState<RabbitFailure>('two-nodes')
  const [acks, setAcks] = useState<'0' | '1' | 'all'>('all')
  const [minIsr, setMinIsr] = useState(2)
  const [unclean, setUnclean] = useState(false)
  const kafka = kafkaFailover(kafkaFailure, acks, minIsr, unclean)
  const rabbit = rabbitFailover(rabbitFailure)
  const nodes = broker === 'kafka' ? kafka.nodes : rabbit.nodes
  const healthy = broker === 'kafka' ? kafka.accepted : rabbit.quorum
  const presets = broker === 'kafka' ? [
    { id: 'one-follower', label: 'Отказ одного follower' }, { id: 'two-followers', label: 'Остался только leader' }, { id: 'leader', label: 'Отказ leader · ISR выбирает новый' }, { id: 'unclean', label: 'Осталась out-of-sync реплика' },
  ] : [
    { id: 'one-node', label: 'Отказ одного member' }, { id: 'leader', label: 'Отказ queue leader' }, { id: 'two-nodes', label: 'Два member offline' },
  ]

  return (
    <div>
      <div className="flex flex-wrap items-start gap-4"><div className="max-w-3xl"><Badge>Отказоустойчивость</Badge><h2 className="mt-3 text-lg font-semibold">Репликация и failover</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Концептуальная модель ISR и кворума, а не пошаговая эмуляция KRaft/Raft. Меняйте отказ и настройки подтверждений, чтобы видеть доступность и риск потери.</p></div><div className="ml-auto"><BrokerSwitch value={broker} onChange={setBroker} /></div></div>

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Сценарий отказа">{presets.map((preset) => { const active = broker === 'kafka' ? kafkaFailure === preset.id : rabbitFailure === preset.id; return <button key={preset.id} type="button" aria-pressed={active} onClick={() => broker === 'kafka' ? setKafkaFailure(preset.id as KafkaFailure) : setRabbitFailure(preset.id as RabbitFailure)} className={cn('cursor-pointer rounded-lg border border-border bg-card px-3 py-2 text-xs hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-ring', active && 'border-primary/60 bg-primary/10 text-primary')}>{preset.label}</button> })}</div>

      {broker === 'kafka' && <section className="mt-4 flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card p-4" aria-label="Настройки Kafka"><label className="text-xs font-medium">acks<select aria-label="acks" value={acks} onChange={(event) => setAcks(event.target.value as '0' | '1' | 'all')} className="ml-2 h-10 rounded-lg border border-input bg-background px-3 font-mono outline-none focus:border-ring"><option value="0">0</option><option value="1">1</option><option value="all">all</option></select></label><label className="text-xs font-medium">min.insync.replicas<select aria-label="min.insync.replicas" value={minIsr} onChange={(event) => setMinIsr(Number(event.target.value))} className="ml-2 h-10 rounded-lg border border-input bg-background px-3 font-mono outline-none focus:border-ring"><option value={1}>1</option><option value={2}>2</option></select></label><button type="button" role="switch" aria-checked={unclean} onClick={() => setUnclean((value) => !value)} className="flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-xs font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"><span className={cn('relative h-5 w-9 rounded-full bg-secondary', unclean && 'bg-warning')}><span className={cn('absolute left-0.5 top-0.5 size-4 rounded-full bg-card shadow-sm transition-transform', unclean && 'translate-x-4')} /></span>unclean.leader.election.enable</button><p className="w-full text-xs leading-relaxed text-muted-foreground">Для acks=all проверяется и доступность leader, и ISR ≥ min.insync.replicas. acks=1 этого условия не ждёт, acks=0 не ждёт broker response.</p></section>}

      <section className="mt-4 rounded-xl border border-border bg-card p-4" aria-label="Состояние реплик">
        <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">{broker === 'kafka' ? 'Partition replication · replication.factor=3' : 'Quorum queue · 3 members'}</h3><Badge>{broker === 'kafka' ? `ISR ${kafka.isrCount}/3` : `Online ${rabbit.online}/3`}</Badge></div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">{nodes.map((node) => <article key={node.id} className={cn('rounded-xl border p-4', node.online ? 'border-border bg-background' : 'border-destructive/30 bg-destructive/[0.05]')}><div className="flex items-center justify-between"><h4 className="font-mono text-sm font-semibold">{node.id}</h4>{node.online ? <Check size={16} className="text-success" /> : <ServerCrash size={16} className="text-destructive" />}</div><p className="mt-2 text-xs text-muted-foreground">{node.role}</p><p className={cn('mt-2 text-xs font-medium', node.online ? 'text-success' : 'text-destructive')}>{node.online ? 'Online' : 'Offline'}</p>{broker === 'kafka' && <p className="mt-1 font-mono text-[10px] text-muted-foreground">{node.inSync ? 'in-sync' : 'not in ISR'}</p>}</article>)}</div>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-xl border border-border bg-card p-4"><h3 className="text-sm font-semibold">Результат записи</h3><div className="mt-3 grid gap-2 sm:grid-cols-3"><Metric label={broker === 'kafka' ? 'Leader' : 'Кворум'} value={broker === 'kafka' ? kafka.available ? 'Доступен' : 'Недоступен' : rabbit.quorum ? `${rabbit.online}/3 · есть` : `${rabbit.online}/3 · нет`} /><Metric label="Producer" value={healthy ? broker === 'kafka' && acks === '0' ? 'Отправка без ожидания' : 'Запись подтверждается' : 'Ошибка / ожидание'} /><Metric label={broker === 'kafka' ? 'ISR' : 'Online members'} value={String(broker === 'kafka' ? kafka.isrCount : rabbit.online)} /></div><p className="mt-4 rounded-lg bg-secondary/70 p-3 text-sm leading-relaxed">{broker === 'kafka' ? kafka.confirmation : rabbit.confirmation}</p></div>
        <aside className={cn('rounded-xl p-4', healthy ? 'bg-success/10' : 'bg-warning/10')}><div className="flex items-start gap-2">{healthy ? <ShieldCheck size={19} className="mt-0.5 text-success" /> : <X size={19} className="mt-0.5 text-warning" />}<div><h3 className="text-sm font-semibold">Компромисс</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{broker === 'kafka' ? kafka.risk : rabbit.risk}</p></div></div></aside>
      </section>

      <div className="mt-4 grid gap-3 md:grid-cols-3"><Info title="Доступность ≠ сохранность">Успешный ответ leader не всегда означает репликацию. Недоступность записи может быть осознанным выбором ради консистентности.</Info><Info title={broker === 'kafka' ? 'Unclean election' : 'Почему кворум'}>{broker === 'kafka' ? 'Разрешение out-of-sync реплики стать leader восстанавливает доступность ценой возможной потери записей. Обычно это отдельное рискованное решение.' : 'Два узла из трёх образуют majority. Один оставшийся узел не обслуживает запись, чтобы две стороны разделения не принимали расходящиеся состояния.'}</Info><Info title="Клиент обязан обработать ошибку">Timeout, NotEnoughReplicas и потерянный confirm не дают однозначного ответа о записи. Retry должен учитывать идемпотентность и проверку фактического состояния.</Info></div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs"><a href="https://kafka.apache.org/documentation/#replication" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">Kafka — replication<ArrowUpRight size={12} /></a><a href="https://www.rabbitmq.com/docs/quorum-queues" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">RabbitMQ — quorum queues<ArrowUpRight size={12} /></a></div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-secondary/70 p-3"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1.5 text-xs font-medium leading-relaxed">{value}</p></div>
}

function Info({ title, children }: { title: string; children: React.ReactNode }) {
  return <article className="rounded-xl border border-border bg-card p-4"><h3 className="text-sm font-semibold">{title}</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{children}</p></article>
}
