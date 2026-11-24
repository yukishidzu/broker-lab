import { Check, ChevronDown } from 'lucide-react'
import type { ScenarioDefinition, ScenarioStep } from '../../types'
import { formatJson } from '../../lib/utils'
import { Badge } from '../ui/badge'

export function MessageInspector({ scenario, step }: { scenario: ScenarioDefinition; step: ScenarioStep }) {
  const message = scenario.message
  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-2"><h2 className="font-mono text-sm font-semibold">msg-017</h2><Badge>{scenario.broker === 'rabbitmq' ? 'AMQP message' : 'Kafka record'}</Badge></div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.messageStatus}</p>
      <dl className="mt-4 space-y-3">
        <Field label="businessId" value={message.businessId} />
        <Field label="traceId" value={message.traceId} />
        <Field label={scenario.broker === 'rabbitmq' ? 'routing key' : 'record key'} value={message.key} />
        {Object.entries(step.metadata ?? {}).map(([key, value]) => <Field key={key} label={key} value={String(value)} />)}
      </dl>
      <div className="mt-4 rounded-lg border border-border p-3">
        <div className="flex items-center gap-2 text-xs font-medium">{step.effectCommitted && <Check size={14} className="text-success" />}Внешний эффект</div>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{step.effectCommitted ? 'payment-1042 записан в БД платежей.' : 'Платёж ещё не создан.'}</p>
      </div>
      <details className="group mt-4 rounded-lg border border-border">
        <summary className="flex cursor-pointer list-none items-center justify-between p-3 text-xs font-medium focus-visible:outline-2 focus-visible:outline-ring">Payload <ChevronDown size={14} className="transition-transform group-open:rotate-180" /></summary>
        <pre className="code-block m-2 mt-0">{formatJson(message.value)}</pre>
      </details>
      <details className="group mt-2 rounded-lg border border-border">
        <summary className="flex cursor-pointer list-none items-center justify-between p-3 text-xs font-medium focus-visible:outline-2 focus-visible:outline-ring">Headers <ChevronDown size={14} className="transition-transform group-open:rotate-180" /></summary>
        <pre className="code-block m-2 mt-0">{formatJson(message.headers)}</pre>
      </details>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return <div><dt className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-mono text-xs">{value}</dd></div>
}
