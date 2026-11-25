import { useMemo, useState } from 'react'
import { ArrowUpRight, Check, CircleOff, Play, RotateCcw, Users } from 'lucide-react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { assignPartitions, buildTopicRecords, groupCapacity, partitionsForConsumer, rebalanceAfterStop } from '../engine/kafka/assignment'
import { cn } from '../lib/utils'

const kafkaGroupSource = 'https://kafka.apache.org/41/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html'

export function KafkaGroupsPage() {
  const [partitions, setPartitions] = useState(2)
  const [consumers, setConsumers] = useState(4)
  const [secondGroup, setSecondGroup] = useState(false)
  const [stopped, setStopped] = useState<number | null>(null)
  const [cursor, setCursor] = useState(0)
  const records = useMemo(() => buildTopicRecords(partitions), [partitions])
  const assignment = stopped === null ? assignPartitions(partitions, consumers) : rebalanceAfterStop(partitions, consumers, stopped)
  const analyticsAssignment = assignPartitions(partitions, consumers)
  const aliveConsumers = consumers - (stopped === null ? 0 : 1)
  const capacity = groupCapacity(partitions, aliveConsumers)
  const current = records[cursor]

  const configure = (nextPartitions: number, nextConsumers: number) => {
    setPartitions(nextPartitions)
    setConsumers(nextConsumers)
    setStopped(null)
    setCursor(0)
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-7 md:px-5">
      <div className="max-w-3xl"><Badge>Kafka · интерактивная лаборатория</Badge><h1 className="mt-3 text-xl font-semibold">Consumer groups и partitions</h1><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Меняйте число partitions и consumers, доставляйте записи по одной и останавливайте consumer. Назначение здесь — наглядный round-robin пример, а не обещание конкретного production assignor.</p></div>

      <div className="mt-5 flex flex-wrap gap-2" aria-label="Готовые конфигурации">
        <Preset active={partitions === 2 && consumers === 4 && !secondGroup} onClick={() => { configure(2, 4); setSecondGroup(false) }}>2 partitions · 4 consumers</Preset>
        <Preset active={partitions === 4 && consumers === 2} onClick={() => configure(4, 2)}>4 partitions · 2 consumers</Preset>
        <Preset active={partitions === 2 && consumers === 2} onClick={() => configure(2, 2)}>2 partitions · 2 consumers</Preset>
        <Preset active={secondGroup} onClick={() => { configure(2, 3); setSecondGroup(true) }}>Две независимые группы</Preset>
      </div>

      <section className="mt-4 rounded-xl border border-border bg-card p-4" aria-label="Настройки топологии">
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-xs font-medium">Partitions<select value={partitions} onChange={(event) => configure(Number(event.target.value), consumers)} className="mt-1.5 block h-10 rounded-lg border border-input bg-background px-3 font-mono outline-none focus:border-ring focus:ring-2 focus:ring-ring/15">{[1, 2, 3, 4].map((value) => <option key={value}>{value}</option>)}</select></label>
          <label className="text-xs font-medium">Consumers в группе<select value={consumers} onChange={(event) => configure(partitions, Number(event.target.value))} className="mt-1.5 block h-10 rounded-lg border border-input bg-background px-3 font-mono outline-none focus:border-ring focus:ring-2 focus:ring-ring/15">{[1, 2, 3, 4, 5, 6].map((value) => <option key={value}>{value}</option>)}</select></label>
          <button type="button" role="switch" aria-checked={secondGroup} onClick={() => { setSecondGroup((value) => !value); setCursor(0) }} className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-border px-3 text-xs font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"><Users size={15} />Показать группу analytics<span className={cn('relative h-5 w-9 rounded-full bg-secondary', secondGroup && 'bg-primary')}><span className={cn('absolute left-0.5 top-0.5 size-4 rounded-full bg-card shadow-sm transition-transform', secondGroup && 'translate-x-4')} /></span></button>
          <div className="ml-auto text-right"><p className="text-xs text-muted-foreground">Активны / простаивают</p><p className="mt-1 font-mono text-lg font-semibold">{capacity.active} / {capacity.idle}</p></div>
        </div>
        <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">Максимальный параллелизм одной группы сейчас: <strong className="text-foreground">{capacity.active}</strong>. Каждая partition назначена ровно одному consumer этой группы; лишние consumers не получают записи.</p>
      </section>

      <section className="mt-5" aria-labelledby="partitions-title">
        <div className="mb-3 flex items-center justify-between"><h2 id="partitions-title" className="text-base font-semibold">Topic orders · {partitions} partitions</h2><span className="font-mono text-xs text-muted-foreground">{cursor} / {records.length} записей доставлено</span></div>
        <div className={cn('grid gap-3 md:grid-cols-2', partitions > 2 && 'xl:grid-cols-4')}>
          {Array.from({ length: partitions }, (_, partition) => (
            <article key={partition} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between"><h3 className="font-mono text-sm font-semibold">partition {partition}</h3><Badge>orders/{partition}</Badge></div>
              <div className="mt-3 space-y-1.5 text-xs">
                <p className="flex items-center justify-between gap-2"><span className="text-muted-foreground">billing</span><strong className={cn('font-mono', assignment[partition] < 0 && 'text-destructive')}>{assignment[partition] >= 0 ? `consumer ${assignment[partition] + 1}` : 'нет активного'}</strong></p>
                {secondGroup && <p className="flex items-center justify-between gap-2"><span className="text-muted-foreground">analytics</span><strong className="font-mono">consumer {analyticsAssignment[partition] + 1}</strong></p>}
              </div>
              <div className="mt-4 space-y-1.5">
                {records.filter((record) => record.partition === partition).map((record) => {
                  const index = records.indexOf(record)
                  const delivered = index < cursor
                  const next = index === cursor
                  return <div key={record.id} className={cn('flex items-center justify-between rounded-md border border-border px-2.5 py-2 font-mono text-[11px]', delivered && 'border-success/25 bg-success/10 text-success', next && 'border-primary/50 bg-primary/10 text-foreground', !delivered && !next && 'text-muted-foreground')}><span>{record.id} · key {record.key}</span><span className="inline-flex items-center gap-1">{delivered && <Check size={11} />}@{record.offset}</span></div>
                })}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-border bg-card p-4" aria-label="Доставка следующей записи">
        {current ? <div className="flex flex-wrap items-center gap-3"><div className="min-w-0 flex-1 basis-full sm:basis-auto"><p className="text-xs text-muted-foreground">Следующая запись</p><p className="mt-1 font-mono text-sm font-semibold">{current.id} · key {current.key} → partition {current.partition} / offset {current.offset}</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">billing → {assignment[current.partition] >= 0 ? `consumer ${assignment[current.partition] + 1}` : 'ожидание активного consumer'}{secondGroup && ` · analytics → consumer ${analyticsAssignment[current.partition] + 1}`}</p></div><Button onClick={() => setCursor((value) => value + 1)} disabled={assignment[current.partition] < 0}><Play size={14} />Доставить</Button><Button variant="ghost" size="sm" onClick={() => setCursor(records.length)}>Весь поток</Button></div> : <div className="flex flex-wrap items-center gap-3"><p className="flex-1 text-sm text-success"><Check size={15} className="mr-1.5 inline" />Все записи доставлены назначенным consumers каждой включённой группы.</p><Button variant="outline" size="sm" onClick={() => setCursor(0)}><RotateCcw size={14} />Повторить поток</Button></div>}
      </section>

      <section className="mt-5" aria-labelledby="consumers-title">
        <h2 id="consumers-title" className="text-base font-semibold">Группа billing</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: consumers }, (_, consumer) => {
            const owned = partitionsForConsumer(assignment, consumer)
            const isStopped = stopped === consumer
            return <article key={consumer} className={cn('rounded-xl border border-border bg-card p-4', isStopped && 'border-destructive/40 bg-destructive/[0.04]')}><div className="flex items-center justify-between"><h3 className="font-mono text-sm font-semibold">consumer {consumer + 1}</h3>{isStopped ? <CircleOff size={16} className="text-destructive" /> : <Users size={16} className="text-muted-foreground" />}</div><p className={cn('mt-2 text-xs', isStopped ? 'text-destructive' : owned.length ? 'text-success' : 'text-muted-foreground')}>{isStopped ? 'Остановлен' : owned.length ? `Читает: ${owned.map((partition) => `P${partition}`).join(', ')}` : 'Простаивает · partitions не назначены'}</p><Button variant="ghost" size="sm" className="mt-2 px-0" onClick={() => setStopped(isStopped ? null : consumer)}>{isStopped ? 'Восстановить' : 'Остановить'}</Button></article>
          })}
        </div>
        {stopped !== null && <p className="mt-3 rounded-lg bg-warning/10 p-3 text-xs leading-relaxed text-warning">После остановки partitions остановленного consumer переназначены. Это один допустимый результат rebalance: конкретный assignor может выбрать другое распределение. Уже показанные записи здесь не перематываются — offsets в этой лаборатории не моделируются.</p>}
      </section>

      <section className="mt-5 grid gap-3 md:grid-cols-3">
        <Info title="4 consumers на 2 partitions">Consumer 1 получает P0, consumer 2 — P1, consumers 3 и 4 простаивают. Сообщения не распределяются по очереди между всеми четырьмя.</Info>
        <Info title="2 consumers на 4 partitions">Каждый consumer получает по две partitions. Правило «один consumer — одна partition» неверно: partition одна на consumer в группе, а consumer может иметь несколько partitions.</Info>
        <Info title="Разные группы">Billing и analytics имеют независимые offsets. Одна и та же запись попадает одному consumer внутри billing и одному consumer внутри analytics.</Info>
        <Info title="Порядок записей">Порядок гарантируется внутри partition. Записи разных partitions обрабатываются разными consumers параллельно, поэтому порядок их внешних эффектов может отличаться от порядка публикации.</Info>
      </section>
      <a href={kafkaGroupSource} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-1.5 rounded text-xs font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring">KafkaConsumer — consumer groups и partition assignment<ArrowUpRight size={13} /></a>
    </main>
  )
}

function Preset({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={cn('cursor-pointer rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-ring', active && 'border-primary/60 bg-primary/10 text-primary')}>{children}</button>
}

function Info({ title, children }: { title: string; children: React.ReactNode }) {
  return <article className="rounded-xl border border-border bg-card p-4"><h2 className="text-sm font-semibold">{title}</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">{children}</p></article>
}
