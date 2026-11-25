export type KafkaFailure = 'one-follower' | 'two-followers' | 'leader' | 'unclean'
export type RabbitFailure = 'one-node' | 'leader' | 'two-nodes'

export interface FailoverNode {
  id: string
  role: string
  online: boolean
  inSync: boolean
}

export function kafkaFailover(failure: KafkaFailure, acks: '0' | '1' | 'all', minIsr: number, uncleanElection: boolean) {
  let nodes: FailoverNode[]
  if (failure === 'one-follower') nodes = [
    { id: 'broker-1', role: 'leader', online: true, inSync: true }, { id: 'broker-2', role: 'follower', online: true, inSync: true }, { id: 'broker-3', role: 'follower · offline', online: false, inSync: false },
  ]
  else if (failure === 'two-followers') nodes = [
    { id: 'broker-1', role: 'leader', online: true, inSync: true }, { id: 'broker-2', role: 'follower · offline', online: false, inSync: false }, { id: 'broker-3', role: 'follower · offline', online: false, inSync: false },
  ]
  else if (failure === 'leader') nodes = [
    { id: 'broker-1', role: 'former leader · offline', online: false, inSync: false }, { id: 'broker-2', role: 'new leader', online: true, inSync: true }, { id: 'broker-3', role: 'follower', online: true, inSync: true },
  ]
  else nodes = uncleanElection ? [
    { id: 'broker-1', role: 'former leader · offline', online: false, inSync: false }, { id: 'broker-2', role: 'in-sync follower · offline', online: false, inSync: false }, { id: 'broker-3', role: 'unclean leader', online: true, inSync: false },
  ] : [
    { id: 'broker-1', role: 'former leader · offline', online: false, inSync: false }, { id: 'broker-2', role: 'in-sync follower · offline', online: false, inSync: false }, { id: 'broker-3', role: 'out-of-sync · no election', online: true, inSync: false },
  ]
  const leaderExists = nodes.some((node) => node.online && node.role.includes('leader') && !node.role.includes('offline') && !node.role.includes('no election'))
  const isrCount = failure === 'unclean' && uncleanElection ? 1 : nodes.filter((node) => node.online && node.inSync).length
  const available = leaderExists
  const accepted = available && (acks === '0' || acks === '1' || isrCount >= minIsr)
  const confirmation = !available ? 'Запись недоступна: нет leader' : acks === '0' ? 'Producer не ждёт ответа брокера' : acks === '1' ? 'Leader acknowledgement · без ожидания ISR' : accepted ? `Подтверждено ISR · ${isrCount} реплик` : `NotEnoughReplicas · ISR ${isrCount} < minISR ${minIsr}`
  const risk = failure === 'unclean' && uncleanElection ? 'Unclean election может потерять записи, которых нет у выбранной реплики' : acks !== 'all' ? 'Подтверждение leader/отсутствие ожидания слабее защищает от отказа leader' : !accepted ? 'Producer должен обработать ошибку; исход записи требует проверки' : 'При сохранении условий ISR запись подтверждена репликами'
  return { nodes, isrCount, available, accepted, confirmation, risk }
}

export function rabbitFailover(failure: RabbitFailure) {
  const nodes: FailoverNode[] = failure === 'one-node' ? [
    { id: 'rabbit-1', role: 'queue leader', online: true, inSync: true }, { id: 'rabbit-2', role: 'follower', online: true, inSync: true }, { id: 'rabbit-3', role: 'member · offline', online: false, inSync: false },
  ] : failure === 'leader' ? [
    { id: 'rabbit-1', role: 'former leader · offline', online: false, inSync: false }, { id: 'rabbit-2', role: 'new queue leader', online: true, inSync: true }, { id: 'rabbit-3', role: 'follower', online: true, inSync: true },
  ] : [
    { id: 'rabbit-1', role: 'queue leader · minority', online: true, inSync: true }, { id: 'rabbit-2', role: 'member · offline', online: false, inSync: false }, { id: 'rabbit-3', role: 'member · offline', online: false, inSync: false },
  ]
  const online = nodes.filter((node) => node.online).length
  const quorum = online >= 2
  return { nodes, online, quorum, confirmation: quorum ? `Publisher confirm после принятия кворумом ${online}/3` : 'Кворум 2/3 недоступен: запись и confirm блокируются', risk: quorum ? 'Потеря minority сохраняет доступность quorum queue' : 'Оставшийся узел не должен обслуживать minority во избежание расхождения состояния' }
}
