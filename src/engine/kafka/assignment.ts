export interface TopicRecord {
  id: string
  key: string
  partition: number
  offset: number
}

export function assignPartitions(partitions: number, consumers: number) {
  if (!Number.isInteger(partitions) || partitions < 1) throw new Error('Нужна минимум одна partition')
  if (!Number.isInteger(consumers) || consumers < 1) throw new Error('Нужен минимум один consumer')
  return Array.from({ length: partitions }, (_, partition) => partition % consumers)
}

export function rebalanceAfterStop(partitions: number, consumers: number, stopped: number) {
  const initial = assignPartitions(partitions, consumers)
  const active = Array.from({ length: consumers }, (_, index) => index).filter((index) => index !== stopped)
  if (!active.length) return initial.map(() => -1)
  const result = [...initial]
  const load = active.map((consumer) => initial.filter((assigned) => assigned === consumer).length)
  for (let partition = 0; partition < partitions; partition += 1) {
    if (initial[partition] !== stopped) continue
    let candidatePosition = 0
    for (let position = 1; position < active.length; position += 1) {
      if (load[position] < load[candidatePosition]) candidatePosition = position
    }
    result[partition] = active[candidatePosition]
    load[candidatePosition] += 1
  }
  return result
}

export function partitionsForConsumer(assignment: number[], consumer: number) {
  return assignment.flatMap((assigned, partition) => assigned === consumer ? [partition] : [])
}

export function buildTopicRecords(partitions: number): TopicRecord[] {
  const keys = ['A', 'B', 'C', 'D']
  const input = ['A1', 'B1', 'A2', 'B2', 'C1', 'D1', 'C2', 'D2']
  const offsets = Array.from({ length: partitions }, () => 0)
  return input.map((id) => {
    const key = keys.find((candidate) => id.startsWith(candidate))!
    const partition = key.charCodeAt(0) % partitions
    const offset = offsets[partition]
    offsets[partition] += 1
    return { id, key, partition, offset }
  })
}

export function groupCapacity(partitions: number, consumers: number) {
  const active = Math.min(partitions, consumers)
  return { active, idle: Math.max(0, consumers - partitions) }
}
