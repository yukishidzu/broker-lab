import type { Broker } from '../types'
import { clampStep, scenarioFor } from '../engine/core/player'

const storageKey = 'broker-lab-player-v1'

export interface PlayerState {
  broker: Broker
  steps: Record<Broker, number>
}

export const initialPlayerState: PlayerState = {
  broker: 'rabbitmq',
  steps: { rabbitmq: 0, kafka: 0 },
}

export function loadPlayerState(): PlayerState {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) ?? 'null') as unknown
    if (!value || typeof value !== 'object') return initialPlayerState
    const candidate = value as Partial<PlayerState>
    const broker = candidate.broker === 'kafka' || candidate.broker === 'rabbitmq' ? candidate.broker : 'rabbitmq'
    const rabbitmq = typeof candidate.steps?.rabbitmq === 'number' ? candidate.steps.rabbitmq : 0
    const kafka = typeof candidate.steps?.kafka === 'number' ? candidate.steps.kafka : 0
    return {
      broker,
      steps: {
        rabbitmq: clampStep(scenarioFor('rabbitmq'), rabbitmq),
        kafka: clampStep(scenarioFor('kafka'), kafka),
      },
    }
  } catch {
    return initialPlayerState
  }
}

export function savePlayerState(state: PlayerState) {
  try { localStorage.setItem(storageKey, JSON.stringify(state)) } catch {}
}
