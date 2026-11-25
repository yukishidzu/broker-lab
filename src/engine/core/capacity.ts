import type { Broker } from '../../types'

export interface CapacityInput {
  broker: Broker
  incomingRate: number
  processingMs: number
  partitions: number
  consumers: number
}

export function calculateCapacity({ broker, incomingRate, processingMs, partitions, consumers }: CapacityInput) {
  if (incomingRate < 0 || processingMs <= 0 || partitions < 1 || consumers < 1) throw new Error('Некорректные параметры capacity')
  const activeConsumers = broker === 'kafka' ? Math.min(partitions, consumers) : consumers
  const perConsumer = 1000 / processingMs
  const total = activeConsumers * perConsumer
  const netRate = incomingRate - total
  const backlogAfterMinute = Math.max(0, netRate) * 60
  return {
    activeConsumers,
    idleConsumers: Math.max(0, consumers - activeConsumers),
    perConsumer,
    total,
    netRate,
    backlogAfterMinute,
    recoverySeconds: total > 0 ? backlogAfterMinute / total : Number.POSITIVE_INFINITY,
    timeline: Array.from({ length: 6 }, (_, index) => ({ second: (index + 1) * 10, backlog: Math.max(0, netRate) * (index + 1) * 10 })),
  }
}
