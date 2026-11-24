import { describe, expect, it } from 'vitest'
import { glossaryById } from '../src/content/glossary'
import { scenarioList, scenarios } from '../src/content/scenarios'
import { clampStep, logThrough, stepAt, switchBroker, validateScenario } from '../src/engine/core/player'

 describe('scenario definitions', () => {
  it.each(scenarioList)('$name has valid references and chronology', (scenario) => {
    expect(validateScenario(scenario)).toEqual([])
  })

  it.each(scenarioList)('$name uses known glossary terms', (scenario) => {
    const ids = new Set(scenario.steps.flatMap((step) => step.terms))
    for (const id of ids) expect(glossaryById.has(id), `Unknown glossary term: ${id}`).toBe(true)
  })
})

describe('message player', () => {
  it('bounds backward and forward navigation', () => {
    const scenario = scenarios.rabbitmq
    expect(clampStep(scenario, -10)).toBe(0)
    expect(clampStep(scenario, 999)).toBe(scenario.steps.length - 1)
  })

  it('projects an immutable chronological event log', () => {
    const scenario = scenarios.rabbitmq
    const log = logThrough(scenario, 5)
    expect(log).toHaveLength(6)
    expect(log.map((entry) => entry.sequence)).toEqual([1, 2, 3, 4, 5, 6])
    expect(log.at(-1)?.action).toBe('persist')
    expect(logThrough(scenario, 2)).toHaveLength(3)
  })

  it('switches brokers at the same semantic store milestone', () => {
    const rabbit = scenarios.rabbitmq
    const store = rabbit.steps.findIndex((step) => step.milestone === 'store')
    const kafkaIndex = switchBroker(rabbit, store, 'kafka')
    expect(stepAt(scenarios.kafka, kafkaIndex).milestone).toBe('store')
    expect(stepAt(scenarios.kafka, kafkaIndex).metadata?.offset).toBe(184)
  })

  it('uses the closest previous milestone when the target has no equivalent', () => {
    const rabbit = scenarios.rabbitmq
    const route = rabbit.steps.findIndex((step) => step.milestone === 'route')
    const kafkaIndex = switchBroker(rabbit, route, 'kafka')
    expect(stepAt(scenarios.kafka, kafkaIndex).milestone).toBe('accept')

    const kafka = scenarios.kafka
    const replicate = kafka.steps.findIndex((step) => step.milestone === 'replicate')
    const rabbitIndex = switchBroker(kafka, replicate, 'rabbitmq')
    expect(stepAt(rabbit, rabbitIndex).milestone).toBe('store')
  })

  it('finishes RabbitMQ delivery by removing the acknowledged message', () => {
    const final = stepAt(scenarios.rabbitmq, 999)
    expect(final.deliveryStatus).toBe('settled')
    expect(final.effectCommitted).toBe(true)
    expect(final.retained).toBe(false)
  })

  it('finishes Kafka commit while retaining the log record', () => {
    const final = stepAt(scenarios.kafka, 999)
    expect(final.deliveryStatus).toBe('committed')
    expect(final.effectCommitted).toBe(true)
    expect(final.retained).toBe(true)
    expect(final.metadata?.committedOffset).toBe(185)
  })
})
