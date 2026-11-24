import type { Broker } from '../../types'
import { cn } from '../../lib/utils'

export function BrokerSwitch({ value, onChange }: { value: Broker; onChange: (broker: Broker) => void }) {
  return (
    <div className="inline-flex rounded-lg bg-secondary p-1" role="group" aria-label="Выбор брокера">
      {(['rabbitmq', 'kafka'] as const).map((broker) => (
        <button
          key={broker}
          type="button"
          aria-pressed={value === broker}
          onClick={() => onChange(broker)}
          className={cn('h-8 cursor-pointer rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors focus-visible:outline-2 focus-visible:outline-ring max-md:h-9', value === broker && 'bg-card text-card-foreground shadow-sm')}
        >
          {broker === 'rabbitmq' ? 'RabbitMQ' : 'Kafka'}
        </button>
      ))}
    </div>
  )
}
