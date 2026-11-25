import { describe, expect, it } from 'vitest'
import { deliveryScenario } from '../src/content/delivery'
import { assignPartitions, buildTopicRecords, groupCapacity, partitionsForConsumer, rebalanceAfterStop } from '../src/engine/kafka/assignment'

describe('Kafka group assignment', () => {
  it('leaves two consumers idle for two partitions and four consumers', () => {
    expect(assignPartitions(2, 4)).toEqual([0, 1])
    expect(groupCapacity(2, 4)).toEqual({ active: 2, idle: 2 })
  })

  it('assigns multiple partitions when consumers are fewer', () => {
    const assignment = assignPartitions(4, 2)
    expect(assignment).toEqual([0, 1, 0, 1])
    expect(partitionsForConsumer(assignment, 0)).toEqual([0, 2])
  })

  it('keeps each key on one partition with unique offsets', () => {
    const records = buildTopicRecords(2)
    for (const key of new Set(records.map((record) => record.key))) {
      expect(new Set(records.filter((record) => record.key === key).map((record) => record.partition)).size).toBe(1)
    }
    for (const partition of [0, 1]) {
      const offsets = records.filter((record) => record.partition === partition).map((record) => record.offset)
      expect(new Set(offsets).size).toBe(offsets.length)
    }
  })

  it('moves only stopped consumer partitions in the rebalance example', () => {
    expect(rebalanceAfterStop(2, 4, 0)).toEqual([2, 1])
  })
})

describe('delivery guarantees', () => {
  it('shows at-most-once loss and at-least-once duplicate effects', () => {
    expect(deliveryScenario('kafka', 'at-most', false).outcome).toContain('не создан')
    expect(deliveryScenario('rabbitmq', 'at-least', false).outcome).toContain('второй платёж')
    expect(deliveryScenario('rabbitmq', 'at-least', true).outcome).toContain('подавлен')
  })

  it('limits exactly-once to Kafka read-process-write with abort and retry', () => {
    const scenario = deliveryScenario('kafka', 'exactly', false)
    expect(scenario.title).toContain('read-process-write')
    expect(scenario.steps.some((step) => step.event.includes('abortTransaction'))).toBe(true)
    expect(scenario.notes.join(' ')).toContain('read_committed')
    expect(scenario.notes.join(' ')).toContain('Внешняя БД')
  })
})
