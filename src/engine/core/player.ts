import type { Broker, Milestone, ScenarioDefinition, ScenarioStep } from '../../types'
import { scenarios } from '../../content/scenarios'

const milestoneOrder: Milestone[] = [
  'event', 'create', 'publish', 'accept', 'route', 'store', 'replicate', 'confirm', 'deliver', 'process', 'settle',
]

export interface LogEntry {
  sequence: number
  stepId: string
  atMs: number
  source: string
  target: string
  action: string
  result: string
  kind: ScenarioStep['event']['kind']
}

export function scenarioFor(broker: Broker) {
  return scenarios[broker]
}

export function clampStep(scenario: ScenarioDefinition, index: number) {
  const normalized = Number.isFinite(index) ? Math.trunc(index) : 0
  return Math.max(0, Math.min(scenario.steps.length - 1, normalized))
}

export function stepAt(scenario: ScenarioDefinition, index: number) {
  return scenario.steps[clampStep(scenario, index)]
}

export function indexForMilestone(scenario: ScenarioDefinition, milestone: Milestone) {
  const exact = scenario.steps.findIndex((step) => step.milestone === milestone)
  if (exact >= 0) return exact
  const rank = milestoneOrder.indexOf(milestone)
  let closest = 0
  for (const [index, step] of scenario.steps.entries()) {
    if (milestoneOrder.indexOf(step.milestone) <= rank) closest = index
  }
  return closest
}

export function switchBroker(current: ScenarioDefinition, index: number, broker: Broker) {
  const target = scenarioFor(broker)
  return indexForMilestone(target, stepAt(current, index).milestone)
}

export function logThrough(scenario: ScenarioDefinition, index: number): LogEntry[] {
  return scenario.steps.slice(0, clampStep(scenario, index) + 1).map((step, position) => ({
    sequence: position + 1,
    stepId: step.id,
    ...step.event,
  }))
}

export function validateScenario(scenario: ScenarioDefinition) {
  const errors: string[] = []
  const ids = new Set<string>()
  const nodes = new Set<string>()
  let previousMs = -1
  let effectCommitted = false

  if (!scenario.steps.length) errors.push('Сценарий должен содержать шаги')
  for (const node of scenario.nodes) {
    if (nodes.has(node.id)) errors.push(`Повторяющийся узел: ${node.id}`)
    nodes.add(node.id)
  }
  for (const node of scenario.nodes) {
    if (node.branchOf) {
      if (!nodes.has(node.branchOf)) errors.push(`Неизвестный родитель ветки: ${node.branchOf}`)
      if (node.branchOf === node.id) errors.push(`Узел ссылается на себя: ${node.id}`)
      if (scenario.flow.includes(node.id)) errors.push(`Ветка не должна входить в основной flow: ${node.id}`)
    }
  }
  for (const nodeId of scenario.flow) {
    if (!nodes.has(nodeId)) errors.push(`Неизвестный узел flow: ${nodeId}`)
  }
  for (const step of scenario.steps) {
    if (ids.has(step.id)) errors.push(`Повторяющийся шаг: ${step.id}`)
    ids.add(step.id)
    if (!nodes.has(step.messageNode)) errors.push(`Неизвестный узел сообщения: ${step.messageNode}`)
    for (const nodeId of step.activeNodes) {
      if (!nodes.has(nodeId)) errors.push(`Неизвестный активный узел: ${nodeId}`)
    }
    if (step.event.atMs < previousMs) errors.push(`Нарушено время событий на шаге ${step.id}`)
    if (effectCommitted && !step.effectCommitted) errors.push(`Внешний эффект исчез на шаге ${step.id}`)
    if (!step.source.url.startsWith('https://')) errors.push(`Небезопасный источник на шаге ${step.id}`)
    if (!step.summary.trim() || !step.explanation.trim()) errors.push(`Пустое объяснение на шаге ${step.id}`)
    effectCommitted = step.effectCommitted
    previousMs = step.event.atMs
  }
  if (scenario.steps[0]?.milestone !== 'event') errors.push('Сценарий должен начинаться с бизнес-события')
  if (scenario.steps.at(-1)?.milestone !== 'settle') errors.push('Сценарий должен завершаться подтверждением')
  return errors
}
