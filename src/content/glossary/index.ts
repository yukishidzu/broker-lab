import type { GlossaryTerm } from '../../types'

const rabbitSource = { title: 'RabbitMQ — документация', url: 'https://www.rabbitmq.com/docs' }
const kafkaSource = { title: 'Apache Kafka — документация', url: 'https://kafka.apache.org/documentation/' }
const confirmSource = { title: 'RabbitMQ — acknowledgements и confirms', url: 'https://www.rabbitmq.com/docs/confirms' }

export const glossaryTerms: GlossaryTerm[] = [
  {
    id: 'message', title: 'Сообщение', english: 'message', category: 'Общее',
    short: 'Единица данных, которую producer передаёт через брокер.',
    description: 'Сообщение обычно содержит полезные данные и метаданные. Оно может представлять факт, команду или другую информацию. Способ хранения и доставки зависит от модели брокера.',
    mistake: 'Получение сообщения брокером ещё не означает его обработку consumer.', source: rabbitSource,
  },
  {
    id: 'event', title: 'Событие', english: 'event', category: 'Общее',
    short: 'Запись о факте, который уже произошёл в системе.',
    description: 'Например, OrderCreated сообщает, что заказ создан. Другие сервисы сами решают, как реагировать на этот факт.',
    mistake: 'Событие не является командой: оно не приказывает конкретному получателю выполнить действие.', source: kafkaSource,
  },
  {
    id: 'producer', title: 'Producer', english: 'producer / publisher', category: 'Общее',
    short: 'Клиентское приложение, которое публикует сообщения в брокер.',
    description: 'Producer сериализует данные, выбирает назначение и отправляет сообщение. В зависимости от настроек он может ждать подтверждение брокера.',
    mistake: 'Успешная отправка в сокет не доказывает, что брокер сохранил сообщение.', source: kafkaSource,
  },
  {
    id: 'consumer', title: 'Consumer', english: 'consumer', category: 'Общее',
    short: 'Приложение, которое получает и обрабатывает сообщения.',
    description: 'Consumer читает записи по pull-модели в Kafka или получает deliveries из RabbitMQ. После обработки он подтверждает результат соответствующим механизмом.',
    mistake: 'Получение сообщения и завершение бизнес-обработки — разные события.', source: rabbitSource,
  },
  {
    id: 'broker', title: 'Брокер', english: 'broker', category: 'Общее',
    short: 'Промежуточная система, которая принимает, хранит и направляет сообщения.',
    description: 'Брокер разделяет producer и consumer во времени и через модель обмена. Kafka организует данные в partitioned logs, RabbitMQ использует exchanges и queues, а также streams.',
    mistake: 'Брокер не гарантирует сам по себе выполнение бизнес-операции consumer.', source: rabbitSource,
  },
  {
    id: 'exchange', title: 'Exchange', english: 'exchange', category: 'RabbitMQ',
    short: 'Маршрутизатор RabbitMQ, который направляет сообщения в queues.',
    description: 'Тип exchange и bindings определяют, в какие queues попадёт публикация. В S01 используется direct exchange и точное совпадение routing key с binding key.',
    mistake: 'Exchange не является хранилищем сообщений.', source: { title: 'RabbitMQ — exchanges', url: 'https://www.rabbitmq.com/docs/exchanges' },
  },
  {
    id: 'queue', title: 'Queue', english: 'queue', category: 'RabbitMQ',
    short: 'Упорядоченная структура RabbitMQ для хранения сообщений до обработки.',
    description: 'Сообщения в queue находятся в состоянии ready либо delivered/unacknowledged. Несколько consumers одной queue делят работу между собой.',
    mistake: 'Queue не эквивалентна Kafka partition: модели потребления и подтверждения различаются.', source: { title: 'RabbitMQ — queues', url: 'https://www.rabbitmq.com/docs/queues' },
  },
  {
    id: 'binding', title: 'Binding', english: 'binding', category: 'RabbitMQ',
    short: 'Связь exchange с queue и правило интереса queue к сообщениям.',
    description: 'У binding может быть binding key. Для direct exchange сообщение попадает в queues, чей binding key совпал с routing key публикации.',
    mistake: 'Binding не связывает producer напрямую с consumer.', source: { title: 'RabbitMQ — bindings', url: 'https://www.rabbitmq.com/docs/bindings' },
  },
  {
    id: 'routing-key', title: 'Routing key', english: 'routing key', category: 'RabbitMQ',
    short: 'Атрибут публикации, который exchange использует для маршрутизации.',
    description: 'В direct exchange routing key сравнивается с binding key. В topic exchange дополнительно работают шаблоны с * и #.',
    mistake: 'Routing key и binding key имеют разные роли, хотя их значения могут совпадать.', source: { title: 'RabbitMQ — routing', url: 'https://www.rabbitmq.com/tutorials/tutorial-four-python' },
  },
  {
    id: 'publisher-confirm', title: 'Publisher confirm', english: 'publisher confirm', category: 'RabbitMQ',
    short: 'Подтверждение брокера producer о принятии ответственности за публикацию.',
    description: 'Для routable persistent сообщения confirm зависит от принятия queues и требований сохранности. Для quorum queue подтверждение связано с принятием кворумом реплик.',
    mistake: 'Confirm не сообщает, что consumer получил или обработал сообщение.', source: confirmSource,
  },
  {
    id: 'consumer-ack', title: 'Consumer acknowledgement', english: 'consumer ack', category: 'RabbitMQ',
    short: 'Подтверждение consumer, что доставку можно считать завершённой.',
    description: 'При manual ack брокер сохраняет доставку как unacknowledged до подтверждения. При закрытии channel или connection неподтверждённые deliveries возвращаются в queue.',
    mistake: 'Ack не отменяет уже совершённый внешний эффект и не делает его атомарным с брокером.', source: confirmSource,
  },
  {
    id: 'prefetch', title: 'Prefetch', english: 'prefetch / QoS', category: 'RabbitMQ',
    short: 'Лимит неподтверждённых deliveries на channel или consumer.',
    description: 'Когда достигнут prefetch, брокер перестаёт отправлять новые deliveries до освобождения места подтверждениями.',
    mistake: 'Большой prefetch не всегда повышает полезную пропускную способность и может перегрузить consumer.', source: confirmSource,
  },
  {
    id: 'topic', title: 'Topic', english: 'topic', category: 'Kafka',
    short: 'Именованная категория записей, разделённая на partitions.',
    description: 'Producers публикуют записи в topic, а consumers читают их независимо. Каждая partition представляет собой упорядоченный log.',
    mistake: 'Topic не является одной глобально упорядоченной очередью.', source: kafkaSource,
  },
  {
    id: 'partition', title: 'Partition', english: 'partition', category: 'Kafka',
    short: 'Часть topic с собственным упорядоченным log.',
    description: 'Partitions распределяют хранение и обработку. Записи внутри одной partition имеют порядок, но порядок между разными partitions не гарантируется.',
    mistake: 'Partition нельзя считать синонимом RabbitMQ queue.', source: kafkaSource,
  },
  {
    id: 'offset', title: 'Offset', english: 'offset', category: 'Kafka',
    short: 'Позиция записи внутри конкретной partition.',
    description: 'Offset назначается при добавлении записи в log. Consumer group хранит собственный прогресс чтения через committed offsets.',
    mistake: 'Offset не является глобальным идентификатором записи во всём topic.', source: kafkaSource,
  },
  {
    id: 'consumer-group', title: 'Consumer group', english: 'consumer group', category: 'Kafka',
    short: 'Группа consumers, которая совместно читает назначенные partitions.',
    description: 'Внутри группы partitions распределяются между экземплярами. Разные группы имеют независимый прогресс и могут читать один и тот же поток.',
    mistake: 'Consumer group не эквивалентна fanout exchange.', source: kafkaSource,
  },
  {
    id: 'commit', title: 'Offset commit', english: 'offset commit', category: 'Kafka',
    short: 'Сохранённая группой позиция следующего чтения в partition.',
    description: 'Committed position — это сохранённая позиция, к которой consumer вернётся после перезапуска. Обычно commit выполняют после обработки, но само сохранение offset не доказывает наличие внешнего бизнес-эффекта.',
    mistake: 'Commit не откатывает внешний эффект и не подтверждает его атомарно.', source: kafkaSource,
  },
  {
    id: 'lag', title: 'Consumer lag', english: 'consumer lag', category: 'Kafka',
    short: 'Разница между концом log и позицией consumer в partition.',
    description: 'Lag рассчитывают по текущей или committed позиции — это нужно указывать при интерпретации метрики. Локальная position автоматически продвигается после poll, тогда как committed position меняется только при commit.',
    mistake: 'Lag и количество ready-сообщений в RabbitMQ queue — разные метрики разных моделей.', source: kafkaSource,
  },
  {
    id: 'isr', title: 'In-sync replicas', english: 'ISR', category: 'Kafka',
    short: 'Набор реплик, которые достаточно синхронизированы с leader.',
    description: 'ISR участвует в модели доступности и подтверждений. Параметр min.insync.replicas задаёт минимальное число таких реплик для определённых операций записи.',
    mistake: 'Replication factor и текущий ISR — не одно и то же.', source: { title: 'Kafka — replication', url: 'https://kafka.apache.org/documentation/#replication' },
  },
  {
    id: 'acks', title: 'Producer acknowledgements', english: 'acks', category: 'Kafka',
    short: 'Настройка условий, при которых leader считает запись подтверждённой.',
    description: 'acks=0 не ждёт ответа, acks=1 требует записи leader, acks=all ждёт подтверждения синхронизированных реплик. Для надёжности важны также min.insync.replicas и поведение producer.',
    mistake: 'acks=all не доказывает обработку записи consumer.', source: { title: 'Kafka — producer configs', url: 'https://kafka.apache.org/documentation/#producerconfigs' },
  },
  {
    id: 'retention', title: 'Retention', english: 'retention', category: 'Kafka',
    short: 'Правила срока или объёма хранения записей в log.',
    description: 'Обработка consumer не удаляет запись немедленно. Kafka удаляет старые данные согласно retention, а compaction использует другую модель сохранения последних значений по ключу.',
    mistake: 'Retention не является подтверждением доставки.', source: { title: 'Kafka — log compaction и retention', url: 'https://kafka.apache.org/documentation/#compaction' },
  },
  {
    id: 'idempotency', title: 'Идемпотентность', english: 'idempotency', category: 'Надёжность',
    short: 'Свойство повторного выполнения операции не создавать новый нежелательный эффект.',
    description: 'Consumer может сохранять уникальный идентификатор операции вместе с результатом и игнорировать уже применённый повтор. Конкретная реализация зависит от внешней системы.',
    mistake: 'Повторная доставка может существовать даже при идемпотентной обработке: повторяется попытка, но не бизнес-эффект.', source: confirmSource,
  },
]

export const glossaryById = new Map(glossaryTerms.map((term) => [term.id, term]))
