import { Gauge, Split, TimerReset } from 'lucide-react'
import { cn } from '../lib/utils'
import { CapacityLab } from './labs/CapacityLab'
import { RetryLab } from './labs/RetryLab'
import { RoutingLab } from './labs/RoutingLab'

const tabs = [
  { id: 'routing', title: 'RabbitMQ routing', icon: Split },
  { id: 'retry', title: 'Retry / DLQ', icon: TimerReset },
  { id: 'capacity', title: 'Capacity / lag', icon: Gauge },
]

export function LabsPage({ tab }: { tab: string }) {
  const active = tabs.some((item) => item.id === tab) ? tab : 'routing'
  return (
    <main className="mx-auto max-w-6xl px-4 py-7 md:px-5">
      <div className="max-w-3xl"><h1 className="text-xl font-semibold">Дополнительные лаборатории</h1><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Предметные модели для маршрутизации, повторной обработки и расчёта нагрузки. Все параметры доступны без прохождения предыдущих сценариев.</p></div>
      <nav className="mt-5 grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1" aria-label="Лаборатории">
        {tabs.map((item) => { const Icon = item.icon; return <a key={item.id} href={`#/labs/${item.id}`} aria-current={active === item.id ? 'page' : undefined} className={cn('flex h-10 items-center justify-center gap-2 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:bg-card/60 focus-visible:outline-2 focus-visible:outline-ring max-sm:text-[11px]', active === item.id && 'bg-card text-card-foreground shadow-sm')}><Icon size={14} />{item.title}</a> })}
      </nav>
      <div className="mt-6">{active === 'routing' ? <RoutingLab /> : active === 'retry' ? <RetryLab /> : <CapacityLab />}</div>
    </main>
  )
}
