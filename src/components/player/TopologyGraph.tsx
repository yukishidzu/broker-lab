import { useEffect, useMemo, useRef } from 'react'
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

function MessageState({ step, messageId, compact = false }: { step: ScenarioStep; messageId: string; compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-2 text-xs font-medium text-foreground', compact && 'mt-2.5', !step.retained && step.milestone === 'settle' && 'border-border bg-secondary text-muted-foreground')}>
      <Mail size={14} className="shrink-0 text-primary" />
      <span className="min-w-0"><span className="block font-mono text-[11px]">{step.metadata?.offset === undefined ? messageId : `${messageId} · @${step.metadata.offset}`}</span><span className="mt-0.5 block text-[11px] font-normal leading-relaxed text-muted-foreground">{step.messageStatus}</span></span>
    </div>
  )
}

function EffectState({ step }: { step: ScenarioStep }) {
  return <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-success/10 px-2 py-1.5 text-[11px] font-medium text-success"><Check size={13} />{String(step.metadata?.effectId ?? 'Эффект зафиксирован')}</div>
}

function DesktopNode({ node, step, messageId, branch = false }: { node: TopologyNode; step: ScenarioStep; messageId: string; branch?: boolean }) {
  const Icon = icons[node.kind]
  const active = step.activeNodes.includes(node.id)
  return (
    <div data-branch-node-id={branch ? node.id : undefined} className={cn('relative min-h-[142px] rounded-xl border border-border bg-card p-3 transition-colors', active && 'border-primary/60 bg-primary/[0.04]', branch && 'min-h-[112px] border-dashed bg-background')}>
      <div className="flex items-start justify-between gap-2">
        <span className={cn('grid size-8 place-items-center rounded-lg bg-secondary text-muted-foreground', active && 'bg-primary/12 text-primary')}><Icon size={16} /></span>
        {node.badge && <Badge className="text-[10px]">{node.badge}</Badge>}
      </div>
      <h3 className="mt-3 text-sm font-semibold leading-snug">{node.title}</h3>
      <p className="mt-1 font-mono text-[11px] leading-relaxed text-muted-foreground">{node.subtitle}</p>
      {step.messageNode === node.id && <div className="mt-3"><MessageState step={step} messageId={messageId} /></div>}
      {node.kind === 'database' && step.effectCommitted && <EffectState step={step} />}
    </div>
  )
}

function MobileNode({ node, step, messageId, branch = false }: { node: TopologyNode; step: ScenarioStep; messageId: string; branch?: boolean }) {
  const Icon = icons[node.kind]
  const active = step.activeNodes.includes(node.id)
  return (
    <div data-mobile-node-id={node.id} className={cn('rounded-xl border border-border bg-card p-3', active && 'border-primary/60 bg-primary/[0.04]', branch && 'border-dashed bg-background')}>
      <div className="flex items-center gap-3">
        <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground', active && 'bg-primary/12 text-primary')}><Icon size={17} /></span>
        <div className="min-w-0 flex-1"><h3 className="text-sm font-semibold leading-snug">{node.title}</h3><p className="mt-0.5 font-mono text-[11px] leading-relaxed text-muted-foreground">{node.subtitle}</p></div>
        {node.badge && <Badge className="shrink-0 text-[10px]">{node.badge}</Badge>}
      </div>
      {step.messageNode === node.id && <MessageState step={step} messageId={messageId} compact />}
      {node.kind === 'database' && step.effectCommitted && <EffectState step={step} />}
    </div>
  )
}

function EdgeLabel({ effect, vertical = false }: { effect: boolean; vertical?: boolean }) {
  const Icon = vertical ? ArrowDown : ArrowRight
  return <span className={cn('flex shrink-0 items-center justify-center gap-0.5 text-muted-foreground', vertical ? 'h-7 flex-col' : 'flex-col')} aria-hidden="true"><Icon size={vertical ? 15 : 14} /><span className="font-mono text-[9px]">{effect ? 'effect' : ''}</span></span>
}

export function TopologyGraph({ scenario, step }: { scenario: ScenarioDefinition; step: ScenarioStep }) {
  const nodeById = useMemo(() => new Map(scenario.nodes.map((node) => [node.id, node])), [scenario.nodes])
  const scrollRef = useRef<HTMLDivElement>(null)
  const mobileRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    if (matchMedia('(max-width: 1023px)').matches) {
      const target = mobileRef.current?.querySelector<HTMLElement>(`[data-mobile-node-id="${step.messageNode}"]`)
      if (!target) return
      const rect = target.getBoundingClientRect()
      if (rect.top < 150 || rect.bottom > innerHeight - 108) target.scrollIntoView({ block: 'center', inline: 'nearest', behavior })
      return
    }

    const container = scrollRef.current
    const target = container?.querySelector<HTMLElement>(`[data-node-id="${step.messageNode}"]`)
    if (container && target && container.scrollWidth > container.clientWidth) {
      const containerRect = container.getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()
      const left = targetRect.left - containerRect.left + container.scrollLeft - (container.clientWidth - target.clientWidth) / 2
      container.scrollTo({ left, behavior })
    }
    const branchId = step.activeNodes.find((id) => nodeById.get(id)?.branchOf)
    const branch = branchId ? container?.querySelector<HTMLElement>(`[data-branch-node-id="${branchId}"]`) : null
    branch?.scrollIntoView({ block: 'center', inline: 'nearest', behavior })
  }, [step.id, step.messageNode, step.activeNodes, nodeById])

  return (
    <section aria-label="Топология сценария" className="min-w-0 p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div><h2 className="text-sm font-semibold">Текущее состояние</h2><p className="mt-1 text-xs text-muted-foreground">Активные узлы выделены. Выбрано сообщение <code className="font-mono">{scenario.message.id}</code>.</p></div>
        <Badge className="bg-primary/10 text-primary">{scenario.broker === 'rabbitmq' ? 'AMQP 0-9-1' : 'Kafka protocol'}</Badge>
      </div>

      <ol ref={mobileRef} className="lg:hidden" aria-label="Вертикальный путь сообщения">
        {scenario.flow.map((nodeId, index) => {
          const node = nodeById.get(nodeId)!
          const branches = scenario.nodes.filter((candidate) => candidate.branchOf === nodeId)
          return (
            <li key={nodeId}>
              {index > 0 && <EdgeLabel vertical effect={node.kind === 'database'} />}
              <MobileNode node={node} step={step} messageId={scenario.message.id} />
              {branches.length > 0 && (
                <div className="ml-5 border-l border-dashed border-border pl-4 pt-2">
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] text-muted-foreground"><GitBranch size={13} />Репликация</div>
                  {branches.map((branch) => <MobileNode key={branch.id} node={branch} step={step} messageId={scenario.message.id} branch />)}
                </div>
              )}
            </li>
          )
        })}
      </ol>

      <div ref={scrollRef} className="hidden overflow-x-auto pb-3 scrollbar-thin lg:block" tabIndex={0} aria-label="Схема потока; доступна горизонтальная прокрутка">
        <div className="flex min-w-max items-stretch gap-1">
          {scenario.flow.map((nodeId, index) => {
            const node = nodeById.get(nodeId)!
            const branches = scenario.nodes.filter((candidate) => candidate.branchOf === nodeId)
            return (
              <div key={nodeId} className="flex items-center gap-1">
                {index > 0 && <EdgeLabel effect={node.kind === 'database'} />}
                <div className="w-[150px]" data-node-id={nodeId}>
                  <DesktopNode node={node} step={step} messageId={scenario.message.id} />
                  {branches.map((branch) => (
                    <div key={branch.id} className="relative pt-6">
                      <ArrowDown size={15} className="absolute left-6 top-1 text-muted-foreground" aria-hidden="true" />
                      <GitBranch size={13} className="absolute left-[42px] top-1 text-muted-foreground" aria-hidden="true" />
                      <DesktopNode node={branch} step={step} messageId={scenario.message.id} branch />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">{step.title}. {step.messageStatus}.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Fact label="Producer" value={step.producerStatus} />
        <Fact label="Доставка" value={deliveryLabel(step)} />
        <Fact label="Внешний эффект" value={step.effectCommitted ? `${String(step.metadata?.effectId ?? 'Эффект')} зафиксирован` : 'Платёж ещё не создан'} success={step.effectCommitted} />
      </div>
    </section>
  )
}

function Fact({ label, value, success = false }: { label: string; value: string; success?: boolean }) {
  return <div className="rounded-lg bg-secondary/70 p-3"><p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className={cn('mt-1.5 text-xs leading-relaxed', success && 'text-success')}>{value}</p></div>
}

function deliveryLabel(step: ScenarioStep) {
  const labels = {
    'not-created': 'Доставка ещё не создана',
    ready: 'Ready · сообщение ожидает consumer',
    processing: 'Обработка · committed position ещё прежняя',
    unacked: 'Получено consumer · ждёт ack',
    settled: 'Ack применён · доставка завершена',
    committed: 'Offset зафиксирован · запись сохранена',
  }
  return labels[step.deliveryStatus]
}
