import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const openRabbit = async (page: import('@playwright/test').Page) => {
  await page.goto('/#/message/s01?broker=rabbitmq')
  await expect(page.getByRole('heading', { name: 'Первое сообщение · RabbitMQ' })).toBeVisible()
}

test('switches brokers at the same storage milestone', async ({ page }) => {
  await openRabbit(page)
  await page.getByRole('navigation', { name: 'Этапы пути сообщения' }).getByRole('button', { name: /Хранение/ }).click()
  await expect(page.getByRole('heading', { name: 'Queue сохраняет сообщение' })).toBeVisible()
  await page.getByRole('button', { name: 'Kafka', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Первое сообщение · Kafka' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Запись добавлена в log' })).toBeVisible()
  await expect(page.getByText('offset = 184', { exact: true })).toBeVisible()
})

test('shows different RabbitMQ and Kafka completion semantics', async ({ page }) => {
  await openRabbit(page)
  await page.getByRole('button', { name: 'До конца' }).click()
  await expect(page.getByText('Доставка завершена · сообщение удалено из queue', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Kafka', exact: true }).click()
  await expect(page.getByText('Offset обработан группой · запись остаётся в log', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Сообщение', exact: true }).click()
  await expect(page.getByText('committedOffset', { exact: true })).toBeVisible()
  await expect(page.locator('dd').filter({ hasText: /^185$/ })).toBeVisible()
})

test('restores the selected broker and step after reload', async ({ page }) => {
  await openRabbit(page)
  await page.getByRole('button', { name: 'Kafka', exact: true }).click()
  await page.getByRole('navigation', { name: 'Этапы пути сообщения' }).getByRole('button', { name: /Acks/ }).click()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Первое сообщение · Kafka' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Producer получает acknowledgement' })).toBeVisible()
})

test('opens contextual glossary and finds terms through global search', async ({ page }) => {
  await openRabbit(page)
  await page.getByRole('button', { name: 'Событие', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Событие', exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.keyboard.press('Control+k')
  await page.getByRole('textbox', { name: 'Поисковый запрос' }).fill('offset')
  await page.getByRole('button', { name: /Offset offset/ }).click()
  await expect(page).toHaveURL(/#\/glossary\/offset$/)
  await expect(page.getByRole('heading', { name: 'Offset', exact: true })).toBeVisible()
})

test('keeps the mobile scenario usable and contains page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openRabbit(page)
  await page.getByLabel('Текущий этап').selectOption('5')
  await expect(page.getByText('Ready · ожидает доставки', { exact: true })).toBeVisible()
  await page.getByRole('navigation', { name: 'Представления сценария' }).getByRole('button', { name: 'События' }).click()
  await expect(page.getByRole('region', { name: 'Журнал событий' }).getByText('T+340 мс')).toBeVisible()
  await page.getByRole('navigation', { name: 'Представления сценария' }).getByRole('button', { name: 'Пояснение' }).click()
  await expect(page.getByRole('heading', { name: 'Queue сохраняет сообщение' })).toBeVisible()
  await page.getByRole('button', { name: 'Queue', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflow).toBe(false)
})

test('passes automated accessibility checks in both themes', async ({ page }) => {
  await openRabbit(page)
  const light = await new AxeBuilder({ page }).analyze()
  expect(light.violations).toEqual([])
  await page.getByRole('button', { name: 'Включить тёмную тему' }).click()
  const dark = await new AxeBuilder({ page }).analyze()
  expect(dark.violations).toEqual([])
})

test('contains page overflow at reference viewport widths', async ({ page }) => {
  await openRabbit(page)
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    const dimensions = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: window.innerWidth }))
    expect(dimensions.page, `Unexpected page overflow at ${width}px`).toBeLessThanOrEqual(dimensions.viewport)
  }
})
