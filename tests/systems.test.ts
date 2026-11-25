import { describe, expect, it } from 'vitest'
import { buildTrace } from '../src/engine/core/trace'
import { kafkaFailover, rabbitFailover } from '../src/engine/core/failover'
import { evaluateSchemaChange, schemaChanges } from '../src/engine/schema/compatibility'

const change = (id: string) => schemaChanges.find((item) => item.id === id)!

describe('schema compatibility', () => {
  it('allows defaults in both directions', () => {
    expect(evaluateSchemaChange(change('add-default'), 'FULL').allowed).toBe(true)
  })

  it('distinguishes required additions and renames', () => {
    expect(evaluateSchemaChange(change('add-required'), 'BACKWARD').allowed).toBe(false)
    expect(evaluateSchemaChange(change('add-required'), 'FORWARD').allowed).toBe(true)
    expect(evaluateSchemaChange(change('rename'), 'FULL').allowed).toBe(false)
  })
})

describe('trace and failover', () => {
  it('keeps business correlation while breaking distributed trace', () => {
    const spans = buildTrace(false, true)
    expect(new Set(spans.map((span) => span.traceId)).size).toBe(2)
    expect(new Set(spans.map((span) => span.orderId)).size).toBe(1)
    expect(spans[2].parentId).toBeNull()
  })

  it('shifts downstream spans when billing is slow', () => {
    const normal = buildTrace(false, false)
    const slow = buildTrace(true, false)
    expect(slow.at(-1)!.start - normal.at(-1)!.start).toBe(140)
  })

  it('enforces minISR only for acks all', () => {
    expect(kafkaFailover('two-followers', 'all', 2, false).accepted).toBe(false)
    expect(kafkaFailover('two-followers', '1', 2, false).accepted).toBe(true)
    expect(kafkaFailover('leader', 'all', 2, false).accepted).toBe(true)
  })

  it('requires RabbitMQ majority', () => {
    expect(rabbitFailover('one-node').quorum).toBe(true)
    expect(rabbitFailover('two-nodes').quorum).toBe(false)
  })
})
