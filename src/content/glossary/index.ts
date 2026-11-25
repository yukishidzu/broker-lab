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
  {
    id: 'rebalance', title: 'Rebalance', english: 'consumer group rebalance', category: 'Kafka',
    short: 'Перераспределение partitions после изменения состава группы или топологии.',
    description: 'Добавление, удаление или отказ consumer меняет назначения. Конкретный результат зависит от assignor и протокола, но каждая partition остаётся назначенной одному consumer группы.',
    mistake: 'Rebalance не означает, что каждый consumer всегда получает ровно одну partition.', source: kafkaSource,
  },
  {
    id: 'assignment', title: 'Partition assignment', english: 'partition assignment', category: 'Kafka',
    short: 'Назначение partitions конкретным members consumer group.',
    description: 'При partitions больше consumers один consumer получает несколько partitions. При consumers больше partitions лишние members простаивают. Максимальный параллелизм группы ограничен числом partitions.',
    mistake: 'Сообщения одной partition не делятся между несколькими consumers одной группы одновременно.', source: kafkaSource,
  },
  {
    id: 'at-most-once', title: 'At most once', english: 'at-most-once delivery', category: 'Надёжность',
    short: 'Обработка может быть пропущена, но не должна повторяться автоматически.',
    description: 'В Kafka ранний commit до обработки может пропустить эффект при сбое. В RabbitMQ похожий риск даёт auto-ack или ack до обработки.',
    mistake: 'At most once не означает, что сообщение всегда обработано ровно один раз.', source: kafkaSource,
  },
  {
    id: 'at-least-once', title: 'At least once', english: 'at-least-once delivery', category: 'Надёжность',
    short: 'Система стремится не потерять обработку, допуская повторные попытки.',
    description: 'Обработка выполняется до commit/ack. Сбой после внешнего эффекта, но до подтверждения, приводит к повторному чтению или redelivery.',
    mistake: 'At least once не гарантирует ровно один бизнес-эффект без идемпотентности.', source: kafkaSource,
  },
  {
    id: 'exactly-once', title: 'Exactly once', english: 'exactly-once semantics', category: 'Надёжность',
    short: 'Гарантия всегда имеет конкретную границу и набор условий.',
    description: 'Для Kafka read-process-write output records и input offsets могут фиксироваться атомарно через transactions, а read_committed скрывает aborted output. Внешние системы требуют собственной координации.',
    mistake: 'Нельзя переносить exactly-once внутри Kafka на любую внешнюю БД или побочный эффект.', source: kafkaSource,
  },
  {
    id: 'inbox', title: 'Inbox', english: 'inbox pattern', category: 'Надёжность',
    short: 'Сохранение идентификаторов обработанных сообщений для дедупликации consumer.',
    description: 'Inbox-запись и бизнес-эффект сохраняются атомарно, обычно с уникальным ограничением eventId. Повторная доставка не создаёт новый эффект.',
    mistake: 'Проверка и запись inbox без атомарности оставляют гонку при параллельных попытках.', source: confirmSource,
  },
  {
    id: 'outbox', title: 'Outbox', english: 'transactional outbox', category: 'Надёжность',
    short: 'Атомарное сохранение бизнес-изменения и исходящего события в БД producer.',
    description: 'Отдельный publisher переносит outbox-записи в брокер и может повторять публикацию. Поэтому consumer всё равно должен учитывать дубли.',
    mistake: 'Outbox не делает публикацию и consumer-обработку одной глобальной транзакцией.', source: kafkaSource,
  },
  {
    id: 'topic-exchange', title: 'Topic exchange', english: 'topic exchange / topic patterns', category: 'RabbitMQ',
    short: 'Exchange с маршрутизацией по словам routing key и шаблонам binding key.',
    description: '* заменяет ровно одно слово, # — ноль или больше слов. Например, order.eu.* совпадает с order.eu.paid, а order.# — с order и order.eu.paid.',
    mistake: 'Звёздочка не означает любое число слов: для этого используется #.', source: { title: 'RabbitMQ — topics', url: 'https://www.rabbitmq.com/tutorials/tutorial-five-python' },
  },
  {
    id: 'dlx', title: 'Dead letter exchange', english: 'DLX', category: 'RabbitMQ',
    short: 'Обычный exchange, куда RabbitMQ повторно публикует dead-lettered сообщения.',
    description: 'Причины включают reject/nack без requeue, TTL, превышение длины queue и delivery-limit quorum queue. DLX выбирается настройками исходной queue.',
    mistake: 'DLX не гарантирует сохранность при любой топологии: публикация в него тоже может завершиться неудачей.', source: { title: 'RabbitMQ — DLX', url: 'https://www.rabbitmq.com/docs/dlx' },
  },
  {
    id: 'dlq', title: 'Dead letter queue', english: 'DLQ', category: 'Надёжность',
    short: 'Назначение для сообщений, которые не удалось обработать штатным потоком.',
    description: 'В RabbitMQ это обычно queue, получающая сообщения через DLX. В Kafka DLQ — отдельный topic, публикацию в который реализует приложение. Нужны мониторинг и процесс разбора.',
    mistake: 'Перемещение в DLQ не исправляет сообщение и не означает успешную бизнес-обработку.', source: { title: 'RabbitMQ — DLX', url: 'https://www.rabbitmq.com/docs/dlx' },
  },
  {
    id: 'backoff', title: 'Backoff и jitter', english: 'exponential backoff / jitter', category: 'Надёжность',
    short: 'Задержка между повторами и случайный разброс этой задержки.',
    description: 'Exponential backoff увеличивает паузу между попытками, jitter разносит повторы разных consumers во времени. Лимит попыток и DLQ нужны отдельно.',
    mistake: 'Увеличение паузы не превращает постоянную ошибку данных во временную.', source: confirmSource,
  },
  {
    id: 'backpressure', title: 'Backpressure', english: 'backpressure', category: 'Надёжность',
    short: 'Ограничение принимаемой работы, когда обработчик не успевает за входящим потоком.',
    description: 'В RabbitMQ prefetch ограничивает unacked deliveries. В Kafka управление poll и обработкой влияет на темп чтения. Backlog/lag показывает последствия дефицита capacity.',
    mistake: 'Бесконечное наращивание буферов не устраняет дефицит обработки.', source: rabbitSource,
  },
  {
    id: 'ordering', title: 'Порядок сообщений', english: 'message ordering', category: 'Надёжность',
    short: 'Гарантия порядка всегда имеет область: partition, queue, ключ или сущность.',
    description: 'Kafka упорядочивает записи внутри partition. RabbitMQ очередь стремится к FIFO, но повторные доставки, приоритеты и параллельная обработка могут изменить наблюдаемый порядок эффектов.',
    mistake: 'Порядок публикации не гарантирует глобальный порядок завершения параллельной обработки.', source: kafkaSource,
  },
  {
    id: 'capacity', title: 'Capacity', english: 'processing capacity', category: 'Надёжность',
    short: 'Объём работы, который система способна обрабатывать за единицу времени.',
    description: 'Для простой последовательной модели: активные consumers × 1000 / время обработки в мс. Реальный результат дополнительно ограничен БД, downstream, сетью, batching и брокером.',
    mistake: 'Количество запущенных consumers не равно полезному параллелизму, если partitions меньше или есть другой bottleneck.', source: kafkaSource,
  },
  {
    id: 'schema-registry', title: 'Schema Registry', english: 'schema registry / subject', category: 'Kafka',
    short: 'Сервис хранения и версионирования схем с правилами совместимости.',
    description: 'Producers и consumers ссылаются на версии схем, а registry проверяет регистрацию по настройке compatibility. Передача schema id и сериализация зависят от выбранного формата и клиента.',
    mistake: 'Registry не гарантирует смысловую корректность payload и не обновляет код consumers автоматически.', source: { title: 'Schema Registry — evolution', url: 'https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html' },
  },
  {
    id: 'compatibility', title: 'Schema compatibility', english: 'backward / forward / full', category: 'Надёжность',
    short: 'Правила, определяющие какие readers и writers могут работать с разными версиями схемы.',
    description: 'Backward: новый reader читает старые данные. Forward: старый reader читает новые данные. Full требует оба направления. Transitive режимы расширяют проверку на более ранние версии.',
    mistake: 'Совместимость схемы не равна совместимости бизнес-семантики поля.', source: { title: 'Avro — schema resolution', url: 'https://avro.apache.org/docs/1.12.0/specification/#schema-resolution' },
  },
  {
    id: 'trace-context', title: 'Trace context', english: 'traceId / spanId / parentSpanId', category: 'Надёжность',
    short: 'Метаданные, связывающие spans одной распределённой операции.',
    description: 'TraceId объединяет операцию, spanId обозначает отдельный интервал работы, parentSpanId задаёт родителя. W3C traceparent передаёт часть контекста между участниками.',
    mistake: 'Если producer не внедрил, а consumer не извлёк context, общий trace может разорваться.', source: { title: 'W3C Trace Context', url: 'https://www.w3.org/TR/trace-context/' },
  },
  {
    id: 'correlation-id', title: 'Correlation ID', english: 'correlation id / business id', category: 'Надёжность',
    short: 'Общий идентификатор для связывания сообщений и операций одного бизнес-процесса.',
    description: 'Например, orderId сохраняется во всех событиях заказа. Он помогает искать записи в логах, но не описывает иерархию spans и их длительность.',
    mistake: 'Correlation ID не обязан совпадать с traceId или messageId.', source: { title: 'OpenTelemetry — messaging', url: 'https://opentelemetry.io/docs/specs/semconv/messaging/' },
  },
  {
    id: 'causation-id', title: 'Causation ID', english: 'causation id / causedBy', category: 'Надёжность',
    short: 'Идентификатор события или команды, которые вызвали текущее сообщение.',
    description: 'Causation связывает PaymentProcessed с OrderCreated, тогда как correlation связывает весь заказ. Значение передаётся приложением в metadata.',
    mistake: 'Causation не то же самое, что parentSpanId: одно относится к бизнес-событиям, другое — к tracing spans.', source: { title: 'OpenTelemetry — messaging', url: 'https://opentelemetry.io/docs/specs/semconv/messaging/' },
  },
  {
    id: 'quorum', title: 'Quorum', english: 'quorum / majority', category: 'Надёжность',
    short: 'Большинство members, необходимое для согласованного решения распределённой группы.',
    description: 'Для группы из трёх кворум — два. RabbitMQ quorum queues используют Raft; потеря minority сохраняет работу, потеря majority блокирует её.',
    mistake: 'Один оставшийся узел из трёх не должен продолжать запись как самостоятельная majority.', source: { title: 'RabbitMQ — quorum queues', url: 'https://www.rabbitmq.com/docs/quorum-queues' },
  },
  {
    id: 'unclean-election', title: 'Unclean leader election', english: 'unclean.leader.election.enable', category: 'Kafka',
    short: 'Разрешение out-of-sync реплике стать partition leader при отсутствии ISR candidates.',
    description: 'Это может восстановить доступность, но записи, которых нет на новой реплике, будут потеряны. Поэтому настройку рассматривают как явный компромисс.',
    mistake: 'Новый leader после unclean election не означает сохранение всех ранее подтверждённых записей.', source: { title: 'Kafka — replication', url: 'https://kafka.apache.org/documentation/#replication' },
  },
]

export const glossaryById = new Map(glossaryTerms.map((term) => [term.id, term]))
