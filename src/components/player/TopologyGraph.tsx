import { useEffect, useRef } from 'react'
import { ArrowDown, ArrowRight, Box, Check, Database, GitBranch, ListOrdered, Mail, Network, Split } from 'lucide-react'
import type { ScenarioDefinition, ScenarioStep, TopologyNode } from '../../types'
import { cn } from '../../lib/utils'
import { Badge } from '../ui/badge'

const icons = {
  service: Box,
  exchange: Split,
  queue: ListOrdered,
  log: Network,
  database: Database,
}

function NodeCard({ node, step, branch = false }: { node: TopologyNode; step: ScenarioStep; branch?: boolean }) {
  const Icon = icons[node.kind]
  const active = step.activeNodes.includes(node.id)
  const hasMessage = step.messageNode === node.id
  const hasEffect = node.kind === 'database' && step.effectCommitted
  return (
    <div className={cn('relative min-h-[132px] rounded-xl border border-border bg-card p-3 transition-colors', active && 'border-primary/60 bg-primary/[0.04]', branch && 'min-h-[104px] border-dashed bg-background')}>
      <div className="flex items-start justify-between gap-2">
        <span className={cn('grid size-8 place-items-center rounded-lg bg-secondary text-muted-foreground', active && 'bg-primary/12 text-primary')}><Icon size={16} /></span>
        {node.badge && <Badge className="text-[9px]">{node.badge}</Badge>}
      </div>
      <h3 className="mt-3 text-sm font-semibold leading-snug">{node.title}</h3>
      <p className="mt-1 font-mono text-[10px] leading-relaxed text-muted-foreground">{node.subtitle}</p>
      {hasMessage && (
        <div className={cn('mt-3 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-2 text-xs font-medium text-foreground', !step.retained && step.milestone === 'settle' && 'border-border bg-secondary text-muted-foreground')}>
          <Mail size={14} className="shrink-0 text-primary" />
          <span className="min-w-0"><span className="block font-mono text-[10px]">{step.metadata?.offset === undefined ? 'msg-017' : `msg-017 · @${step.metadata.offset}`}</span><span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">{step.messageStatus}</span></span>
        </div>
      )}
      {hasEffect && <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-success/10 px-2 py-1.5 text-[11px] font-medium text-success"><Check size={13} />payment-1042</div>}
    </div>
  )
}

export function TopologyGraph({ scenario, step }: { scenario: ScenarioDefinition; step: ScenarioStep }) {
  const nodeById = new Map(scenario.nodes.map((node) => [node.id, node]))
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = scrollRef.current
    const target = container?.querySelector<HTMLElement>(`[data-node-id="${step.messageNode}"]`)
    if (!container || !target || container.scrollWidth <= container.clientWidth) return
    const containerRect = container.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    const left = targetRect.left - containerRect.left + container.scrollLeft - (container.clientWidth - target.clientWidth) / 2
    container.scrollTo({ left, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [step.id, step.messageNode])

  return (
    <section aria-label="Топология сценария" className="min-w-0 p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Текущее состояние</h2>
          <p className="mt-1 text-xs text-muted-foreground">Активные узлы выделены. Выбрано сообщение <code className="font-mono">msg-017</code>.</p>
        </div>
        <Badge className="bg-primary/10 text-primary">{scenario.broker === 'rabbitmq' ? 'AMQP 0-9-1' : 'Kafka protocol'}</Badge>
      </div>
      <p className="mb-2 text-[11px] text-muted-foreground lg:hidden">Схема прокручивается горизонтально; текущее сообщение центрируется автоматически.</p>
      <div ref={scrollRef} className="overflow-x-auto pb-3 scrollbar-thin" tabIndex={0} aria-label="Схема потока; доступна горизонтальная прокрутка">
        <div className="flex min-w-max items-stretch gap-1">
          {scenario.flow.map((nodeId, index) => {
            const node = nodeById.get(nodeId)!
            const branches = scenario.nodes.filter((candidate) => candidate.branchOf === nodeId)
            return (
              <div key={nodeId} className="flex items-center gap-1">
                {index > 0 && <ArrowRight size={14} className="shrink-0 text-muted-foreground" aria-hidden="true" />}
                <div className="w-[150px]" data-node-id={nodeId}>
                  <NodeCard node={node} step={step} />
                  {branches.map((branch) => (
                    <div key={branch.id} className="relative pt-6">
                      <ArrowDown size={15} className="absolute left-6 top-1 text-muted-foreground" aria-hidden="true" />
                      <GitBranch size={13} className="absolute left-[42px] top-1 text-muted-foreground" aria-hidden="true" />
                      <NodeCard node={branch} step={step} branch />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">{step.title}. {step.messageStatus}.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <div className="rounded-lg bg-secondary/70 p-3"><p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Producer</p><p className="mt-1.5 text-xs leading-relaxed">{step.producerStatus}</p></div>
        <div className="rounded-lg bg-secondary/70 p-3"><p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Доставка</p><p className="mt-1.5 text-xs leading-relaxed">{deliveryLabel(step)}</p></div>
        <div className="rounded-lg bg-secondary/70 p-3"><p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Внешний эффект</p><p className={cn('mt-1.5 text-xs leading-relaxed', step.effectCommitted && 'text-success')}>{step.effectCommitted ? 'payment-1042 зафиксирован' : 'Платёж ещё не создан'}</p></div>
      </div>
    </section>
  )
}

function deliveryLabel(step: ScenarioStep) {
  const labels = {
    'not-created': 'Доставка ещё не создана',
    ready: 'Ready · сообщение ожидает consumer',
    unacked: 'Получено consumer · ждёт ack/commit',
    settled: 'Ack применён · доставка завершена',
    committed: 'Offset зафиксирован · запись сохранена',
  }
  return labels[step.deliveryStatus]
}
