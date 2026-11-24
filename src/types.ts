export type Broker = 'rabbitmq' | 'kafka'

export type Milestone =
  | 'event'
  | 'create'
  | 'publish'
  | 'accept'
  | 'route'
  | 'store'
  | 'replicate'
  | 'confirm'
  | 'deliver'
  | 'process'
  | 'settle'

export type DeliveryStatus = 'not-created' | 'ready' | 'unacked' | 'settled' | 'committed'

export type NodeKind = 'service' | 'exchange' | 'queue' | 'log' | 'database'

export interface TopologyNode {
  id: string
  title: string
  subtitle: string
  kind: NodeKind
  badge?: string
}

export interface ScenarioMessage {
  id: string
  businessId: string
  traceId: string
  key: string
  value: Record<string, unknown>
  headers: Record<string, string>
}

export interface ScenarioEvent {
  atMs: number
  source: string
  target: string
  action: string
  result: string
  kind: 'business' | 'message' | 'storage' | 'confirmation' | 'delivery' | 'effect'
}

export interface ScenarioStep {
  id: string
  milestone: Milestone
  title: string
  shortTitle: string
  summary: string
  explanation: string
  technical: string[]
  activeNodes: string[]
  messageNode: string
  messageStatus: string
  producerStatus: string
  deliveryStatus: DeliveryStatus
  effectCommitted: boolean
  retained: boolean
  metadata?: Record<string, string | number | boolean>
  terms: string[]
  source: { title: string; url: string }
  event: ScenarioEvent
}

export interface ScenarioDefinition {
  id: string
  broker: Broker
  name: string
  description: string
  message: ScenarioMessage
  nodes: TopologyNode[]
  flow: string[]
  steps: ScenarioStep[]
}

export interface GlossaryTerm {
  id: string
  title: string
  english: string
  category: 'Общее' | 'RabbitMQ' | 'Kafka' | 'Надёжность'
  short: string
  description: string
  mistake: string
  source: { title: string; url: string }
}
