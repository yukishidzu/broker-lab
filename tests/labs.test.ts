import { describe, expect, it } from 'vitest'
import { calculateCapacity } from '../src/engine/core/capacity'
import { matchesTopic, routeMessage } from '../src/engine/rabbitmq/routing'
import { retryScenario } from '../src/content/retry'

describe('RabbitMQ routing', () => {
  it('implements one-word and zero-or-more-word topic wildcards', () => {
    expect(matchesTopic('order.*', 'order.paid')).toBe(true)
    expect(matchesTopic('order.*', 'order.eu.paid')).toBe(false)
    expect(matchesTopic('order.#', 'order')).toBe(true)
    expect(matchesTopic('order.#', 'order.eu.paid')).toBe(true)
  })

  it('routes fanout independently of keys and headers by x-match', () => {
    const bindings = [
      { queue: 'all', bindingKey: 'ignored', enabled: true, xMatch: 'all' as const, headers: { event: 'order' } },
      { queue: 'eu', bindingKey: 'ignored', enabled: true, xMatch: 'all' as const, headers: { region: 'eu', format: 'json' } },
    ]
    expect(routeMessage('fanout', 'anything', {}, bindings)).toEqual(['all', 'eu'])
    expect(routeMessage('headers', '', { region: 'eu', format: 'json' }, bindings)).toEqual(['eu'])
  })
})

describe('retry and capacity', () => {
  it('recovers transient errors and isolates persistent ones', () => {
    expect(retryScenario('rabbitmq', 'transient', 3, 'blocking').steps.at(-1)?.status).toBe('success')
    expect(retryScenario('kafka', 'poison', 3, 'blocking').steps.at(-1)?.status).toBe('dlq')
  })

  it('limits Kafka parallelism by partitions and calculates backlog', () => {
    const result = calculateCapacity({ broker: 'kafka', incomingRate: 200, processingMs: 100, partitions: 2, consumers: 4 })
    expect(result.activeConsumers).toBe(2)
    expect(result.idleConsumers).toBe(2)
    expect(result.total).toBe(20)
    expect(result.backlogAfterMinute).toBe(10800)
  })

  it('does not grow a zero backlog when capacity meets input', () => {
    const result = calculateCapacity({ broker: 'rabbitmq', incomingRate: 40, processingMs: 50, partitions: 1, consumers: 2 })
    expect(result.total).toBe(40)
    expect(result.backlogAfterMinute).toBe(0)
  })
})
