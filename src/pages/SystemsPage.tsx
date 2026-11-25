import { Braces, Network, ShieldCheck } from 'lucide-react'
import { cn } from '../lib/utils'
import { FailoverLab } from './systems/FailoverLab'
import { SchemaLab } from './systems/SchemaLab'
import { TracingLab } from './systems/TracingLab'

const tabs = [
  { id: 'schema', title: 'Schema evolution', icon: Braces },
  { id: 'tracing', title: 'Distributed tracing', icon: Network },
  { id: 'failover', title: 'Replication / failover', icon: ShieldCheck },
]

export function SystemsPage({ tab }: { tab: string }) {
  const active = tabs.some((item) => item.id === tab) ? tab : 'schema'
  return (
    <main className="mx-auto max-w-6xl px-4 py-7 md:px-5">
      <div className="max-w-3xl"><h1 className="text-xl font-semibold">Системные сценарии</h1><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Контракты данных, наблюдаемость и отказы распределённой системы. Каждая модель указывает свои условия и границы.</p></div>
      <nav className="mt-5 grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1" aria-label="Системные сценарии">{tabs.map((item) => { const Icon = item.icon; return <a key={item.id} href={`#/systems/${item.id}`} aria-current={active === item.id ? 'page' : undefined} className={cn('flex h-10 items-center justify-center gap-2 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:bg-card/60 focus-visible:outline-2 focus-visible:outline-ring max-sm:text-[11px]', active === item.id && 'bg-card text-card-foreground shadow-sm')}><Icon size={14} />{item.title}</a> })}</nav>
      <div className="mt-6">{active === 'schema' ? <SchemaLab /> : active === 'tracing' ? <TracingLab /> : <FailoverLab />}</div>
    </main>
  )
}
