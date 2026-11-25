import { useState } from 'react'
import { Gauge, TrendingUp } from 'lucide-react'
import { BrokerSwitch } from '../../components/player/BrokerSwitch'
import { Badge } from '../../components/ui/badge'
import { calculateCapacity } from '../../engine/core/capacity'
import { cn } from '../../lib/utils'
import type { Broker } from '../../types'

export function CapacityLab() {
  const [broker, setBroker] = useState<Broker>('kafka')
  const [incomingRate, setIncomingRate] = useState(200)
  const [processingMs, setProcessingMs] = useState(100)
  const [partitions, setPartitions] = useState(2)
  const [consumers, setConsumers] = useState(4)
  const result = calculateCapacity({ broker, incomingRate, processingMs, partitions, consumers })
  const maxBacklog = Math.max(1, ...result.timeline.map((point) => point.backlog))
  const balanced = result.netRate <= 0

  const preset = (next: { rate: number; ms: number; partitions: number; consumers: number }) => {
    setIncomingRate(next.rate); setProcessingMs(next.ms); setPartitions(next.partitions); setConsumers(next.consumers)
  }

  return (
    <div>
      <div className="flex flex-wrap items-start gap-4"><div className="max-w-3xl"><Badge>Масштабирование</Badge><h2 className="mt-3 text-lg font-semibold">Capacity, lag и backlog</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Модель последовательной обработки одного сообщения за раз. Она объясняет направление эффекта, но не заменяет нагрузочное тестирование реальной системы.</p></div><div className="ml-auto"><BrokerSwitch value={broker} onChange={setBroker} /></div></div>

      <div className="mt-5 flex flex-wrap gap-2"><Preset onClick={() => preset({ rate: 200, ms: 100, partitions: 2, consumers: 4 })}>Перегрузка</Preset><Preset onClick={() => preset({ rate: 40, ms: 50, partitions: 2, consumers: 2 })}>Баланс</Preset><Preset onClick={() => preset({ rate: 40, ms: 20, partitions: 2, consumers: 2 })}>Запас capacity</Preset><Preset onClick={() => preset({ rate: 80, ms: 50, partitions: 2, consumers: 6 })}>Лишние consumers</Preset></div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section className="rounded-xl border border-border bg-card p-4" aria-label="Параметры нагрузки">
          <h3 className="text-sm font-semibold">Параметры</h3>
          <Slider label="Входящий темп" value={incomingRate} min={0} max={400} step={10} unit="msg/s" onChange={setIncomingRate} />
          <Slider label="Время обработки" value={processingMs} min={10} max={500} step={10} unit="мс" onChange={setProcessingMs} />
          {broker === 'kafka' && <Slider label="Partitions" value={partitions} min={1} max={4} step={1} unit="" onChange={setPartitions} />}
          <Slider label="Consumers" value={consumers} min={1} max={6} step={1} unit="" onChange={setConsumers} />
          <div className="mt-4 rounded-lg bg-secondary/70 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">{broker === 'kafka' ? `min(${partitions} partitions, ${consumers} consumers)` : `${consumers} consumers`} × (1000 / {processingMs} мс)<br />= {format(result.total)} msg/s</div>
        </section>

        <section className="rounded-xl border border-border bg-card p-4" aria-label="Результат capacity">
          <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Результат</h3><Badge className={balanced ? 'bg-success/10 text-success' : 'bg-destructive/10 text-foreground'}>{balanced ? 'Темп обработки достаточен' : 'Отставание растёт'}</Badge></div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Активные consumers" value={String(result.activeConsumers)} /><Metric label="Простаивают" value={String(result.idleConsumers)} /><Metric label="На consumer" value={`${format(result.perConsumer)} msg/s`} /><Metric label="Общий capacity" value={`${format(result.total)} msg/s`} /></div>
          <div className={cn('mt-4 rounded-xl p-4', balanced ? 'bg-success/10' : 'bg-destructive/10')}><div className="flex items-start gap-3">{balanced ? <Gauge size={22} className="text-success" /> : <TrendingUp size={22} className="text-destructive" />}<div><p className="text-sm font-semibold">{balanced ? `Запас: ${format(Math.max(0, -result.netRate))} msg/s` : `Дефицит: ${format(result.netRate)} msg/s`}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{balanced ? 'При нулевом начальном отставании новое не накапливается.' : `За 60 секунд накопится примерно ${format(result.backlogAfterMinute)} сообщений.`}</p></div></div></div>
          <div className="mt-5"><div className="flex items-center justify-between"><h3 className="text-xs font-semibold">{broker === 'kafka' ? 'Суммарный consumer lag' : 'Queue backlog'}</h3><span className="font-mono text-[10px] text-muted-foreground">0–60 секунд</span></div><div className="mt-3 flex h-32 items-end gap-2 border-b border-border pb-1">{result.timeline.map((point) => <div key={point.second} className="flex h-full flex-1 flex-col justify-end"><div className={cn('min-h-1 rounded-t', balanced ? 'bg-success/40' : 'bg-primary/60')} style={{ height: `${Math.max(3, (point.backlog / maxBacklog) * 100)}%` }} title={`${point.second} с: ${format(point.backlog)} сообщений`} /><span className="mt-1 text-center font-mono text-[9px] text-muted-foreground">{point.second}с</span></div>)}</div></div>
          {!balanced && <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Если публикация полностью прекратится, накопленное отставание при неизменном capacity исчезнет примерно за <strong className="text-foreground">{format(result.recoverySeconds)} с</strong>. При продолжающемся потоке расчёт другой.</p>}
        </section>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3"><Info title={broker === 'kafka' ? 'Consumer lag' : 'RabbitMQ backlog'}>{broker === 'kafka' ? 'Lag считается по каждой partition относительно текущей или committed позиции; сумма показывает общий объём, но не причину.' : 'Ready показывает ожидающие доставки сообщения. Unacked — уже доставленные, но ещё не подтверждённые; это другая метрика.'}</Info><Info title="Consumers не всегда помогают">{broker === 'kafka' ? 'При 2 partitions и 6 consumers активны только 2. Для большего параллелизма нужны partitions, но изменение их числа влияет и на распределение ключей.' : 'Добавление consumers не поможет, если узким местом остаётся БД, downstream, connection или сам брокер.'}</Info><Info title={broker === 'rabbitmq' ? 'Prefetch' : 'Batch и poll'}>{broker === 'rabbitmq' ? 'Prefetch ограничивает число unacknowledged deliveries. Он управляет буферизацией, но не уменьшает время реальной обработки.' : 'Batch может менять эффективность, но commit диапазона offsets связывает восстановление с обработкой всего диапазона.'}</Info></div>
    </div>
  )
}

function Slider({ label, value, min, max, step, unit, onChange }: { label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (value: number) => void }) {
  return <label className="mt-4 block text-xs font-medium"><span className="flex justify-between"><span>{label}</span><output className="font-mono">{value} {unit}</output></span><input type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} className="mt-2 w-full accent-[var(--primary)]" /></label>
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-secondary/70 p-3"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1.5 font-mono text-sm font-semibold">{value}</p></div>
}

function Preset({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className="cursor-pointer rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-ring">{children}</button>
}

function Info({ title, children }: { title: string; children: React.ReactNode }) {
  return <article className="rounded-xl border border-border bg-card p-4"><h3 className="text-sm font-semibold">{title}</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{children}</p></article>
}

function format(value: number) {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(value)
}
