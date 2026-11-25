import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('checks schema compatibility, broken traces, and failover outcomes', async ({ page }) => {
  await page.goto('/#/systems/schema')
  await page.getByRole('button', { name: 'Добавить обязательный customerId' }).click()
  await expect(page.getByText('Проверка BACKWARD отклонит регистрацию')).toBeVisible()
  await page.getByRole('button', { name: 'FORWARD', exact: true }).click()
  await expect(page.getByText('Проверка FORWARD пройдена')).toBeVisible()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.getByRole('link', { name: 'Distributed tracing' }).click()
  await page.getByRole('switch', { name: 'Не передавать trace context в Billing' }).click()
  await expect(page.getByText('2 trace', { exact: true })).toBeVisible()
  await expect(page.getByText(/Billing начинает новый root trace/)).toBeVisible()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.getByRole('link', { name: 'Replication / failover' }).click()
  await expect(page.getByText('NotEnoughReplicas · ISR 1 < minISR 2')).toBeVisible()
  await page.getByLabel('acks', { exact: true }).selectOption('1')
  await expect(page.getByText('Leader acknowledgement · без ожидания ISR')).toBeVisible()
  await page.getByRole('button', { name: 'RabbitMQ', exact: true }).click()
  await expect(page.getByText('Кворум 2/3 недоступен: запись и confirm блокируются')).toBeVisible()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})
