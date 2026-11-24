# Broker Lab

Интерактивная памятка о пути сообщений в Apache Kafka и RabbitMQ. Проект работает в браузере и публикуется как статический сайт на GitHub Pages.

Сейчас реализуется вертикальный срез: сценарий S01 «Первое сообщение», пошаговая схема для обоих брокеров, инспектор сообщения, журнал и глоссарий.

Это детерминированная учебная модель, а не реальные брокеры и не бенчмарк производительности.

## Запуск

Требуется Node.js 22 или новее и pnpm.

```bash
pnpm install
pnpm dev
```

## Проверки

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium firefox
pnpm test:e2e
```

## Публикация

GitHub Actions собирает проект и публикует `dist` через GitHub Pages. В настройках репозитория нужно выбрать источник **GitHub Actions**.

`base` вычисляется из `GITHUB_REPOSITORY`; для локальной проверки project path:

```bash
VITE_BASE=/broker-lab/ pnpm build
```

## Документация

- [План продукта](docs/PRODUCT_PLAN.md)
- [Дизайн-система](docs/LEARNING_DESIGN_SYSTEM.md)
