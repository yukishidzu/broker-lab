import { useMemo, useState } from 'react'
import { ArrowRight, BookOpen, Search, Waypoints } from 'lucide-react'
import { glossaryTerms } from '../content/glossary'
import { scenarioList } from '../content/scenarios'
import { Dialog, DialogContent } from './ui/dialog'
import { Input } from './ui/input'

const referencePages = [
  { title: 'Гарантии доставки', description: 'At most once, at least once, transactions и идемпотентность', hash: '/delivery', keywords: 'гарантии доставка exactly at least at most дубли ack commit' },
  { title: 'Kafka consumer groups', description: 'Partitions, consumers, две группы и rebalance', hash: '/kafka-groups', keywords: 'consumer group партиции partitions consumers rebalance группы' },
  { title: 'RabbitMQ routing', description: 'Direct, topic, fanout, headers и bindings', hash: '/labs/routing', keywords: 'exchange direct topic fanout headers routing binding маршрутизация' },
  { title: 'Retry и DLQ', description: 'Backoff, poison message, DLX и retry topics', hash: '/labs/retry', keywords: 'retry dlq dlx backoff poison повторы доставка' },
  { title: 'Capacity и lag', description: 'Нагрузка, consumers, partitions и backlog', hash: '/labs/capacity', keywords: 'capacity lag backlog throughput нагрузка partitions consumers' },
  { title: 'Schema evolution', description: 'Compatibility, defaults и Schema Registry', hash: '/systems/schema', keywords: 'schema registry avro backward forward full compatibility схема' },
  { title: 'Distributed tracing', description: 'TraceId, spans, correlation и causation', hash: '/systems/tracing', keywords: 'trace tracing span opentelemetry traceparent correlation causation' },
  { title: 'Replication и failover', description: 'Kafka ISR и RabbitMQ quorum queues', hash: '/systems/failover', keywords: 'replication failover isr acks minisr unclean quorum raft репликация' },
]

export function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState('')
  const normalized = query.trim().toLocaleLowerCase('ru')
  const terms = useMemo(() => glossaryTerms.filter((term) => {
    if (!normalized) return true
    return `${term.title} ${term.english} ${term.short}`.toLocaleLowerCase('ru').includes(normalized)
  }).slice(0, 8), [normalized])
  const scenarios = scenarioList.filter((scenario) => {
    if (!normalized) return true
    return `${scenario.name} ${scenario.description}`.toLocaleLowerCase('ru').includes(normalized)
  })
  const pages = referencePages.filter((page) => !normalized || `${page.title} ${page.description} ${page.keywords}`.toLocaleLowerCase('ru').includes(normalized))

  const navigate = (hash: string) => {
    location.hash = hash
    onOpenChange(false)
    setQuery('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Поиск по Broker Lab" description="Найдите сценарий, термин или английское название настройки.">
        <label className="relative block">
          <span className="sr-only">Поисковый запрос</span>
          <Search className="pointer-events-none absolute left-3 top-3 text-muted-foreground" size={16} />
          <Input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Например, offset или confirm" />
        </label>
        <div className="mt-5 max-h-[55vh] overflow-auto scrollbar-thin">
          {pages.length > 0 && <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Разделы</h3>}
          <div className="space-y-1">
            {pages.map((page) => <button key={page.hash} onClick={() => navigate(page.hash)} className="flex w-full cursor-pointer items-center gap-3 rounded-lg p-2.5 text-left hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"><Waypoints size={17} className="shrink-0 text-primary" /><span className="min-w-0 flex-1"><span className="block text-sm font-medium">{page.title}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{page.description}</span></span><ArrowRight size={15} className="text-muted-foreground" /></button>)}
          </div>
          {scenarios.length > 0 && <h3 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Сценарии</h3>}
          <div className="space-y-1">
            {scenarios.map((scenario) => (
              <button key={scenario.broker} onClick={() => navigate(`/message/s01?broker=${scenario.broker}`)} className="flex w-full cursor-pointer items-center gap-3 rounded-lg p-2.5 text-left hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring">
                <Waypoints size={17} className="shrink-0 text-primary" />
                <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{scenario.name}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{scenario.description}</span></span>
                <ArrowRight size={15} className="text-muted-foreground" />
              </button>
            ))}
          </div>
          {terms.length > 0 && <h3 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Глоссарий</h3>}
          <div className="space-y-1">
            {terms.map((term) => (
              <button key={term.id} onClick={() => navigate(`/glossary/${term.id}`)} className="flex w-full cursor-pointer items-center gap-3 rounded-lg p-2.5 text-left hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring">
                <BookOpen size={16} className="shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{term.title} <code className="font-mono text-xs font-normal text-muted-foreground">{term.english}</code></span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{term.short}</span></span>
                <ArrowRight size={15} className="text-muted-foreground" />
              </button>
            ))}
          </div>
          {!pages.length && !scenarios.length && !terms.length && <p className="py-8 text-center text-sm text-muted-foreground">Ничего не найдено. Попробуйте «queue», «offset» или «подтверждение».</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
