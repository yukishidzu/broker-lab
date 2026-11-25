export type ExchangeKind = 'direct' | 'topic' | 'fanout' | 'headers'

export interface RoutingBinding {
  queue: string
  bindingKey: string
  enabled: boolean
  xMatch: 'all' | 'any'
  headers: Record<string, string>
}

export function matchesTopic(pattern: string, routingKey: string): boolean {
  const match = (patterns: string[], words: string[]): boolean => {
    if (!patterns.length) return words.length === 0
    if (patterns[0] === '#') {
      for (let count = 0; count <= words.length; count += 1) {
        if (match(patterns.slice(1), words.slice(count))) return true
      }
      return false
    }
    if (!words.length) return false
    if (patterns[0] !== '*' && patterns[0] !== words[0]) return false
    return match(patterns.slice(1), words.slice(1))
  }
  return match(pattern ? pattern.split('.') : [], routingKey ? routingKey.split('.') : [])
}

export function routeMessage(
  exchange: ExchangeKind,
  routingKey: string,
  messageHeaders: Record<string, string>,
  bindings: RoutingBinding[],
) {
  return bindings.filter((binding) => {
    if (!binding.enabled) return false
    if (exchange === 'fanout') return true
    if (exchange === 'direct') return binding.bindingKey === routingKey
    if (exchange === 'topic') return matchesTopic(binding.bindingKey, routingKey)
    const entries = Object.entries(binding.headers)
    return binding.xMatch === 'all'
      ? entries.every(([key, value]) => messageHeaders[key] === value)
      : entries.some(([key, value]) => messageHeaders[key] === value)
  }).map((binding) => binding.queue)
}
