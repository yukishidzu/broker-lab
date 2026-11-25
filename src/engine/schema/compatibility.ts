export type CompatibilityMode = 'NONE' | 'BACKWARD' | 'FORWARD' | 'FULL'

export interface SchemaChange {
  id: string
  title: string
  description: string
  v1: Record<string, unknown>
  v2: Record<string, unknown>
  backward: boolean
  forward: boolean
  note: string
}

export const schemaChanges: SchemaChange[] = [
  {
    id: 'add-default', title: 'Добавить currency с default', description: 'В v2 появляется необязательное поле currency со значением по умолчанию RUB.',
    v1: { orderId: 'string', amount: 'int' }, v2: { orderId: 'string', amount: 'int', currency: { type: 'string', default: 'RUB' } },
    backward: true, forward: true, note: 'Новый reader восполняет currency из default для старых данных; старый reader игнорирует новое поле.',
  },
  {
    id: 'add-required', title: 'Добавить обязательный customerId', description: 'В v2 появляется поле без default.',
    v1: { orderId: 'string', amount: 'int' }, v2: { orderId: 'string', amount: 'int', customerId: 'string' },
    backward: false, forward: true, note: 'Старый reader игнорирует добавленное поле, но новый reader не может получить его из старой записи без default.',
  },
  {
    id: 'remove-default', title: 'Удалить поле с default у старого reader', description: 'В v2 удалено currency, для которого reader v1 имеет default.',
    v1: { orderId: 'string', amount: 'int', currency: { type: 'string', default: 'RUB' } }, v2: { orderId: 'string', amount: 'int' },
    backward: true, forward: true, note: 'Новый reader игнорирует старое поле, а старый reader использует собственный default при чтении новых данных.',
  },
  {
    id: 'remove-required', title: 'Удалить обязательный amount', description: 'В v2 обязательное amount отсутствует.',
    v1: { orderId: 'string', amount: 'int' }, v2: { orderId: 'string' },
    backward: true, forward: false, note: 'Новый reader может игнорировать старое amount, но старый reader не получает обязательное поле из новой записи.',
  },
  {
    id: 'rename', title: 'Переименовать orderId в id', description: 'Имя поля изменено без alias и миграции данных.',
    v1: { orderId: 'string', amount: 'int' }, v2: { id: 'string', amount: 'int' },
    backward: false, forward: false, note: 'Простое переименование совмещает удаление старого и добавление нового обязательного поля. Aliases требуют отдельного проектирования.',
  },
  {
    id: 'promote-int', title: 'Изменить amount: int → long', description: 'Тип нового reader шире старого writer.',
    v1: { orderId: 'string', amount: 'int' }, v2: { orderId: 'string', amount: 'long' },
    backward: true, forward: false, note: 'Avro promotion позволяет long reader читать int, но обратное чтение long как int не гарантируется.',
  },
]

export function evaluateSchemaChange(change: SchemaChange, mode: CompatibilityMode) {
  const allowed = mode === 'NONE' || (mode === 'BACKWARD' && change.backward) || (mode === 'FORWARD' && change.forward) || (mode === 'FULL' && change.backward && change.forward)
  return { allowed, backward: change.backward, forward: change.forward }
}
