import type { Broker, ScenarioDefinition } from '../../types'
import { kafkaScenario } from './s01-kafka'
import { rabbitScenario } from './s01-rabbitmq'

export const scenarios: Record<Broker, ScenarioDefinition> = {
  rabbitmq: rabbitScenario,
  kafka: kafkaScenario,
}

export const scenarioList = [rabbitScenario, kafkaScenario]
