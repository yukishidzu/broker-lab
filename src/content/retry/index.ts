import type { Broker } from '../../types'

export type RetryError = 'transient' | 'poison'
export type KafkaRetryStrategy = 'blocking' | 'retry-topic'

export interface RetryStep {
  title: string
  description: string
  event: string
  status: 'retry' | 'success' | 'dlq'
  facts: { label: string; value: string }[]
}

export interface RetryScenario {
  title: string
  outcome: string
  steps: RetryStep[]
  notes: string[]
  source: { title: string; url: string }
}

export function retryScenario(broker: Broker, error: RetryError, limit: number, strategy: KafkaRetryStrategy): RetryScenario {
  const succeeds = error === 'transient' && limit >= 3
  const attempts = succeeds ? 3 : limit
  const steps: RetryStep[] = []
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const success = succeeds && attempt === 3
    const delay = 500 * 2 ** (attempt - 1)
    if (success) {
      steps.push({
        title: `Попытка ${attempt}: зависимость восстановилась`,
        description: broker === 'rabbitmq'
          ? 'Обработчик создал платёж и отправил ack. Повторы прекращены, доставка завершена.'
          : 'Обработчик создал платёж и зафиксировал offset 185. Последующие записи partition могут продолжить обработку.',
        event: broker === 'rabbitmq' ? 'insert payment → ack' : 'insert payment → commit 185', status: 'success',
        facts: [{ label: 'Попыток', value: String(attempt) }, { label: 'Платежей', value: '1' }, { label: 'Итог', value: 'Успех' }],
      })
      break
    }
    const final = attempt === limit
    if (final) {
      steps.push({
        title: `Лимит ${limit}: сообщение изолируется`,
        description: broker === 'rabbitmq'
          ? 'Quorum queue превысила delivery-limit. Сообщение dead-lettered в настроенный DLX и маршрутизируется в queue dead-letters.'
          : strategy === 'blocking'
            ? 'Обработчик публикует исходное событие и контекст ошибки в topic orders.dlq, затем фиксирует input offset 185.'
            : 'После исчерпания попыток в retry topic обработчик публикует событие в orders.dlq. Это прикладной поток, а не встроенная DLQ Kafka.',
        event: broker === 'rabbitmq' ? 'delivery-limit → DLX → dead-letters' : 'produce orders.dlq → commit input', status: 'dlq',
        facts: [{ label: 'Попыток', value: String(attempt) }, { label: 'Платежей', value: '0' }, { label: 'Сообщение', value: broker === 'rabbitmq' ? 'DLX / queue' : 'orders.dlq' }],
      })
    } else {
      steps.push({
        title: `Попытка ${attempt}: ${error === 'poison' ? 'ошибка данных' : 'временный сбой'}`,
        description: broker === 'rabbitmq'
          ? `Обработка не удалась. Сообщение возвращается для повторной доставки с условной задержкой ${delay} мс.`
          : strategy === 'blocking'
            ? `Consumer ждёт ${delay} мс и повторяет тот же offset 184. Записи с большими offsets этой partition пока не обрабатываются.`
            : `Событие направляется в orders.retry с задержкой ${delay} мс. Исходный input offset может быть зафиксирован, а retry обрабатывается отдельным потоком.`,
        event: broker === 'rabbitmq' ? `reject/retry · attempt ${attempt}` : strategy === 'blocking' ? `retry same offset · backoff ${delay} мс` : `produce orders.retry · attempt ${attempt}`, status: 'retry',
        facts: [{ label: 'Попытка', value: String(attempt) }, { label: 'Backoff', value: `${delay} мс` }, { label: broker === 'rabbitmq' ? 'Redelivery' : 'Partition', value: broker === 'rabbitmq' ? 'Ожидается' : strategy === 'blocking' ? 'Последующие ждут' : 'Retry отделён' }],
      })
    }
  }
  return {
    title: `${broker === 'rabbitmq' ? 'RabbitMQ' : 'Kafka'} · ${error === 'poison' ? 'poison message' : 'временный сбой'}`,
    outcome: succeeds ? 'Временный сбой устранён: один платёж, повторы завершены.' : `После ${attempts} попыток сообщение изолировано без бизнес-эффекта.`,
    steps,
    notes: broker === 'rabbitmq'
      ? ['DLX — обычный exchange для dead-lettered сообщений; DLQ — queue, связанная с ним.', 'Для delayed retry в quorum queues RabbitMQ рекомендует нативный механизм; TTL + DLX — более старый шаблон.', 'Backoff и ограничение попыток защищают broker и downstream от бесконечного цикла.']
      : ['У Kafka нет встроенной universal DLQ: retry/DLQ topics и их публикацию проектирует приложение.', 'Синхронный retry одной записи задерживает последующие записи той же partition.', 'Публикация в DLQ и commit input без transaction не атомарны; сбой между ними может создать повтор DLQ-записи.', ...(strategy === 'retry-topic' ? ['Retry topic сам не создаёт задержку: время следующей обработки реализует приложение, scheduler или отдельный retry-конвейер.'] : [])],
    source: broker === 'rabbitmq' ? { title: 'RabbitMQ — dead letter exchanges', url: 'https://www.rabbitmq.com/docs/dlx' } : { title: 'Apache Kafka — delivery semantics', url: 'https://kafka.apache.org/documentation/#semantics' },
  }
}
