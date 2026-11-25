# Каталог сценариев

## S01 · Первое сообщение

RabbitMQ: producer → direct exchange → queue → consumer → БД → ack. Kafka: producer → partition leader → log/offset → ISR → consumer group → БД → commit.

Показывает различие publisher confirms/acks, consumer acknowledgements/commit и внешнего эффекта.

## Гарантии доставки

Раздел `/#/delivery` содержит отдельные пошаговые модели:

- Kafka at most once: commit до обработки, сбой и пропуск эффекта.
- Kafka at least once: обработка до commit, сбой, повтор и варианты с/без идемпотентности.
- Kafka exactly-once read-process-write: output и offsets в transaction, abort, retry и read_committed.
- RabbitMQ at most once: ранний/auto ack и потеря эффекта.
- RabbitMQ at least once: manual ack после обработки, requeue/redelivery и дедупликация.
- RabbitMQ + БД: inbox и бизнес-эффект в одной транзакции БД.

Модели не утверждают exactly-once для произвольной внешней системы.

## Kafka consumer groups

Раздел `/#/kafka-groups` позволяет задать 1–4 partitions и 1–6 consumers в группе.

- Назначение partitions отображается для каждого consumer.
- Записи имеют key, partition и offset и проигрываются по одной.
- Случай 2 partitions / 4 consumers показывает двух активных и двух простаивающих consumers.
- Случай 4 partitions / 2 consumers показывает несколько partitions на одного consumer.
- Вторая группа analytics демонстрирует независимое чтение того же потока.
- Остановка consumer показывает один допустимый rebalance.

Round-robin и распределение ключей являются наглядной моделью, а не обещанием конкретного production assignor. Инварианты назначения соответствуют документации Kafka.

## Дополнительные лаборатории

### `/#/labs/routing`

Direct/topic/fanout/headers exchanges, редактируемые bindings, routing keys и headers. Показывает независимые направления одной публикации, topic wildcards, отключение binding и unroutable с mandatory/return.

### `/#/labs/retry`

Временная ошибка и poison message, лимит попыток и exponential backoff. RabbitMQ использует delivery-limit и DLX; Kafka показывает блокирующий retry, отдельный retry topic и прикладную публикацию в DLQ topic.

### `/#/labs/capacity`

Сравнение входящего темпа с простой моделью capacity. Учитывает время обработки, partitions и consumers, показывает рост lag/backlog за 60 секунд и ориентировочное восстановление после остановки публикации. Это не бенчмарк реального брокера.

## Системные сценарии

### `/#/systems/schema`

Модель совместимости двух соседних Avro-like схем: добавление с/без default, удаление обязательного и default-поля, rename и int→long. BACKWARD/FORWARD/FULL показывают направления чтения. Transitive-режимы и реальный Schema Registry не эмулируются.

### `/#/systems/tracing`

Цепочка HTTP → OrderCreated → Billing → PaymentProcessed → Inventory/Notifications. Можно замедлить Billing и разорвать context propagation. У каждого span показаны traceId, spanId, parentSpanId, orderId, eventId, messageId, causedBy и W3C traceparent.

### `/#/systems/failover`

Kafka: отказы follower/leader, ISR, acks=0/1/all, min.insync.replicas и unclean leader election. RabbitMQ: quorum queue из трёх members, отказ leader и потеря majority. Модель показывает доступность и риск, но не эмулирует KRaft/Raft по шагам.
