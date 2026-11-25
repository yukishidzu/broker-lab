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
