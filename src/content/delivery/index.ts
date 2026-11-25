import type { Broker } from '../../types'

export type GuaranteeMode = 'at-most' | 'at-least' | 'exactly' | 'external'
export type FactTone = 'neutral' | 'success' | 'warning' | 'danger'

export interface DeliveryStep {
  title: string
  description: string
  event: string
  facts: { label: string; value: string; tone?: FactTone }[]
}

export interface DeliveryScenario {
  title: string
  summary: string
  outcome: string
  source: { title: string; url: string }
  notes: string[]
  steps: DeliveryStep[]
}

const kafkaSource = { title: 'Apache Kafka — message delivery semantics', url: 'https://kafka.apache.org/documentation/#semantics' }
const rabbitSource = { title: 'RabbitMQ — acknowledgements и confirms', url: 'https://www.rabbitmq.com/docs/confirms' }

export const guaranteeOptions: { broker: Broker; id: GuaranteeMode; label: string; short: string }[] = [
  { broker: 'kafka', id: 'at-most', label: 'At most once', short: 'Можно пропустить обработку, но не повторить её.' },
  { broker: 'kafka', id: 'at-least', label: 'At least once', short: 'Не потерять запись, но допустить повтор.' },
  { broker: 'kafka', id: 'exactly', label: 'Exactly once внутри Kafka', short: 'Output records и offsets фиксируются атомарно.' },
  { broker: 'rabbitmq', id: 'at-most', label: 'At most once', short: 'Ack до обработки может привести к потере эффекта.' },
  { broker: 'rabbitmq', id: 'at-least', label: 'At least once', short: 'Ack после обработки допускает redelivery.' },
  { broker: 'rabbitmq', id: 'external', label: 'Брокер + внешняя БД', short: 'Идемпотентность и inbox ограничивают повторный эффект.' },
]

export function deliveryScenario(broker: Broker, mode: GuaranteeMode, idempotent: boolean): DeliveryScenario {
  if (broker === 'kafka') return kafkaScenario(mode, idempotent)
  return rabbitScenario(mode, idempotent)
}

function kafkaScenario(mode: GuaranteeMode, idempotent: boolean): DeliveryScenario {
  if (mode === 'at-most') return {
    title: 'Kafka · at most once', summary: 'Сначала commit, затем обработка.', outcome: 'Запись прочитана, но платёж не создан.',
    source: kafkaSource,
    notes: ['Committed offset 185 уже указывает на следующую запись.', 'После рестарта offset 184 не читается повторно.', 'Это допустимо только там, где пропуск обработки разрешён требованиями.'],
    steps: [
      { title: 'Consumer получил offset 184', description: 'Запись OrderCreated прочитана из orders/1. Локальная position после poll равна 185, committed position пока 184.', event: 'poll → orders/1@184', facts: [{ label: 'Запись', value: '184 получена' }, { label: 'Committed', value: '184' }, { label: 'Эффект', value: 'Нет' }] },
      { title: 'Offset сохранён до обработки', description: 'Consumer фиксирует 185 до записи платежа. С этого момента он может пропустить эффект при сбое.', event: 'commit → orders/1@185', facts: [{ label: 'Запись', value: '184 получена' }, { label: 'Committed', value: '185', tone: 'warning' }, { label: 'Эффект', value: 'Нет' }] },
      { title: 'Consumer падает до платежа', description: 'Обработчик останавливается до обращения к БД. Запись в Kafka остаётся, но текущая группа уже сохранила следующую позицию.', event: 'crash → обработка не выполнена', facts: [{ label: 'Запись', value: 'Остаётся в log' }, { label: 'Committed', value: '185' }, { label: 'Эффект', value: 'Нет', tone: 'danger' }] },
      { title: 'Восстановление пропускает запись', description: 'Новый consumer начинает с committed position 185: эта позиция уже сохранена как прочитанная, хотя платёж не был выполнен. Повторного чтения offset 184 не будет.', event: 'restart → следующая позиция 185', facts: [{ label: 'Повторное чтение', value: 'Нет' }, { label: 'Платёж', value: 'Пропущен', tone: 'danger' }, { label: 'Итог', value: 'At most once', tone: 'warning' }] },
    ],
  }
  if (mode === 'exactly') return {
    title: 'Kafka · exactly-once read-process-write', summary: 'Output topic и input offset участвуют в одной Kafka transaction.', outcome: 'Одна видимая output-запись и согласованный input offset.',
    source: kafkaSource,
    notes: ['Producer использует transactional.id и транзакционную запись.', 'Consumer читает output с isolation.level=read_committed.', 'Внешняя БД не входит в Kafka transaction: там нужна идемпотентность или атомарное хранение результата и offset.'],
    steps: [
      { title: 'Чтение и начало transaction', description: 'Consumer получает orders/1@184. Transactional producer начинает операцию для output topic payments.', event: 'poll + beginTransaction', facts: [{ label: 'Input', value: 'orders/1@184' }, { label: 'Output', value: 'Пока нет' }, { label: 'Committed input', value: '184' }] },
      { title: 'Output и offset отправлены в transaction', description: 'PaymentRequested отправлен в payments, а offset 185 передан через sendOffsetsToTransaction. До commit результат не считается завершённым.', event: 'send output + sendOffsetsToTransaction', facts: [{ label: 'Output', value: 'Внутри transaction', tone: 'warning' }, { label: 'Input offset', value: '185 внутри transaction' }, { label: 'Видимость', value: 'Не для read_committed' }] },
      { title: 'Сбой до commit', description: 'Транзакция абортируется. Read_committed consumer не видит output из aborted transaction, а сохранённый input offset остаётся 184.', event: 'crash → abortTransaction', facts: [{ label: 'Output', value: 'Aborted · не виден', tone: 'warning' }, { label: 'Committed input', value: '184' }, { label: 'Видимый эффект', value: 'Нет' }] },
      { title: 'Повтор и успешный commit', description: 'После восстановления позиция сбрасывается на 184, обработка повторяется в новой transaction. Commit атомарно фиксирует output и offset 185.', event: 'retry → commitTransaction', facts: [{ label: 'Output', value: '1 видимая запись', tone: 'success' }, { label: 'Committed input', value: '185' }, { label: 'Итог', value: 'Exactly once внутри Kafka', tone: 'success' }] },
    ],
  }
  return {
    title: 'Kafka · at least once', summary: 'Сначала обработка, затем commit.', outcome: idempotent ? 'Доставка повторена, но платёж остался одним.' : 'Повторная доставка создала второй платёж.',
    source: kafkaSource,
    notes: ['Offset 184 сохраняется в log независимо от результата.', 'Повтор после сбоя — нормальное следствие at-least-once.', 'Идемпотентность устраняет повторный бизнес-эффект, а не саму повторную доставку.'],
    steps: [
      { title: 'Consumer получил offset 184', description: 'Запись прочитана. Committed position остаётся 184 до успешного завершения обработки.', event: 'poll → orders/1@184', facts: [{ label: 'Попытка', value: '1' }, { label: 'Committed', value: '184' }, { label: 'Эффект', value: 'Нет' }] },
      { title: 'Платёж записан до commit', description: 'Внешняя БД уже содержит payment-1042, но Kafka ещё не получил новый committed offset.', event: 'insert → payment-1042', facts: [{ label: 'Попытка', value: '1' }, { label: 'Committed', value: '184' }, { label: 'Платежей', value: '1', tone: 'warning' }] },
      { title: 'Сбой до commit', description: 'Consumer падает между внешним эффектом и commit. При восстановлении группа снова начнёт с позиции 184.', event: 'crash → commit 185 не выполнен', facts: [{ label: 'Committed', value: '184' }, { label: 'Платёж', value: 'Уже существует' }, { label: 'Исход', value: 'Нужен повтор', tone: 'warning' }] },
      { title: 'Запись доставлена повторно', description: 'Новый consumer получает orders/1@184 во второй раз. Это другая попытка обработки того же события.', event: 'poll → orders/1@184 · attempt 2', facts: [{ label: 'Попытка', value: '2', tone: 'warning' }, { label: 'Доставок', value: '2' }, { label: 'Событие', value: 'Одно и то же' }] },
      idempotent
        ? { title: 'Дедупликация сохраняет один эффект', description: 'Обработчик проверяет eventId в атомарной inbox/уникальном ограничении. Повторная запись подтверждается без второго платежа.', event: 'duplicate suppressed → commit 185', facts: [{ label: 'Доставок', value: '2' }, { label: 'Платежей', value: '1', tone: 'success' }, { label: 'Committed', value: '185', tone: 'success' }] }
        : { title: 'Повтор создаёт второй эффект', description: 'Без идемпотентной проверки обработчик снова вставляет платёж. Commit 185 не отменяет обе записи в БД.', event: 'insert duplicate → commit 185', facts: [{ label: 'Доставок', value: '2' }, { label: 'Платежей', value: '2', tone: 'danger' }, { label: 'Committed', value: '185' }] },
    ],
  }
}

function rabbitScenario(mode: GuaranteeMode, idempotent: boolean): DeliveryScenario {
  if (mode === 'at-most') return {
    title: 'RabbitMQ · at most once', summary: 'Ack до обработки или автоматическое подтверждение.', outcome: 'Доставка завершена, платёж не создан.', source: rabbitSource,
    notes: ['В auto-ack сообщение считается доставленным при отправке consumer.', 'При ручном режиме ранний ack даёт похожий риск.', 'Неподтверждённых deliveries нет, поэтому закрытию channel нечего возвращать.'],
    steps: [
      { title: 'Consumer получает tag 42', description: 'Сообщение доставлено из queue billing. В сценарии используется auto-ack либо ack отправлен сразу после получения.', event: 'basic.deliver → tag 42', facts: [{ label: 'Доставка', value: 'Tag 42' }, { label: 'Обработка', value: 'Не началась' }, { label: 'Эффект', value: 'Нет' }] },
      { title: 'Доставка подтверждена до платежа', description: 'Брокер считает доставку завершённой. Сообщение больше не находится среди unacknowledged.', event: 'ack → доставка завершена', facts: [{ label: 'Unacked', value: '0', tone: 'warning' }, { label: 'Обработка', value: 'Не завершена' }, { label: 'Эффект', value: 'Нет' }] },
      { title: 'Consumer падает', description: 'Обработчик останавливается до записи платежа. Подтверждение уже нельзя отозвать.', event: 'crash → платёж не записан', facts: [{ label: 'Сообщение', value: 'Удалено из queue' }, { label: 'Платёж', value: 'Нет', tone: 'danger' }, { label: 'Redelivery', value: 'Нет' }] },
      { title: 'Повторять нечего', description: 'После переподключения consumer не получает это сообщение повторно: для брокера доставка уже завершена.', event: 'restart → сообщение пропущено', facts: [{ label: 'Доставок', value: '1' }, { label: 'Платежей', value: '0', tone: 'danger' }, { label: 'Итог', value: 'At most once', tone: 'warning' }] },
    ],
  }
  if (mode === 'external') return {
    title: 'RabbitMQ + БД · повтор без нового эффекта', summary: 'Inbox и платёж сохраняются в одной транзакции БД.', outcome: 'Доставка повторена, платёж остался одним.', source: rabbitSource,
    notes: ['RabbitMQ и БД не получают один общий ack/commit.', 'Уникальный eventId в inbox предотвращает повторный эффект.', 'Outbox решает похожую атомарность на стороне producer: бизнес-запись и исходящее событие сохраняются вместе.'],
    steps: [
      { title: 'Consumer получает msg-017', description: 'Manual ack включён. Consumer начинает транзакцию БД с уникальным eventId=msg-017 в inbox.', event: 'basic.deliver → tag 42', facts: [{ label: 'Доставка', value: 'Unacked' }, { label: 'Inbox', value: 'Ещё нет' }, { label: 'Платёж', value: 'Нет' }] },
      { title: 'Inbox и платёж записаны атомарно', description: 'В одной транзакции БД сохраняются msg-017 и payment-1042. Если транзакция откатится, исчезнут обе записи.', event: 'DB transaction → commit', facts: [{ label: 'Inbox', value: 'msg-017', tone: 'success' }, { label: 'Платёж', value: 'payment-1042', tone: 'success' }, { label: 'Broker ack', value: 'Ещё нет' }] },
      { title: 'Сбой до ack вызывает redelivery', description: 'Брокер возвращает неподтверждённую доставку и позже отправляет её повторно с redelivered=true.', event: 'crash → requeue → redeliver', facts: [{ label: 'Попытка', value: '2', tone: 'warning' }, { label: 'Inbox', value: 'Уже содержит msg-017' }, { label: 'Платёж', value: 'Уже существует' }] },
      { title: 'Повтор подтверждён без нового платежа', description: 'Уникальное ограничение inbox выявляет обработанный eventId. Consumer не создаёт новый эффект и отправляет ack.', event: 'duplicate detected → ack', facts: [{ label: 'Доставок', value: '2' }, { label: 'Платежей', value: '1', tone: 'success' }, { label: 'Unacked', value: '0', tone: 'success' }] },
    ],
  }
  return {
    title: 'RabbitMQ · at least once', summary: 'Manual ack после обработки.', outcome: idempotent ? 'Redelivery произошло, второй платёж подавлен.' : 'Redelivery создало второй платёж.', source: rabbitSource,
    notes: ['Unacked delivery возвращается при закрытии channel/connection.', 'Redelivered=true помогает заметить повтор, но не заменяет дедупликацию.', 'Ack не откатывает уже записанный платёж.'],
    steps: [
      { title: 'Consumer получает tag 42', description: 'Queue хранит доставку как unacknowledged. Consumer начинает обработку.', event: 'basic.deliver → tag 42', facts: [{ label: 'Попытка', value: '1' }, { label: 'Unacked', value: '1' }, { label: 'Эффект', value: 'Нет' }] },
      { title: 'Платёж записан до ack', description: 'Внешний эффект существует, но брокер ещё считает доставку незавершённой.', event: 'insert → payment-1042', facts: [{ label: 'Платежей', value: '1' }, { label: 'Unacked', value: '1', tone: 'warning' }, { label: 'Ack', value: 'Нет' }] },
      { title: 'Сбой до ack', description: 'Channel закрывается. Неподтверждённая доставка возвращается в queue для повторной обработки.', event: 'crash → requeue tag 42', facts: [{ label: 'Платёж', value: 'Остаётся в БД' }, { label: 'Queue', value: 'Сообщение возвращено' }, { label: 'Redelivery', value: 'Ожидается', tone: 'warning' }] },
      { title: 'RabbitMQ повторяет доставку', description: 'Consumer получает то же сообщение с redelivered=true. Это новая попытка, а не новое бизнес-событие.', event: 'basic.deliver → redelivered=true', facts: [{ label: 'Попытка', value: '2' }, { label: 'Доставок', value: '2' }, { label: 'Событие', value: 'msg-017' }] },
      idempotent
        ? { title: 'Повторный эффект подавлен', description: 'Обработчик проверяет msg-017 в inbox/уникальном ограничении и подтверждает доставку без новой записи платежа.', event: 'duplicate suppressed → ack', facts: [{ label: 'Доставок', value: '2' }, { label: 'Платежей', value: '1', tone: 'success' }, { label: 'Unacked', value: '0', tone: 'success' }] }
        : { title: 'Второй платёж записан', description: 'Обработчик не распознаёт повтор и повторяет вставку. Последующий ack только завершает доставку.', event: 'insert duplicate → ack', facts: [{ label: 'Доставок', value: '2' }, { label: 'Платежей', value: '2', tone: 'danger' }, { label: 'Unacked', value: '0' }] },
    ],
  }
}
