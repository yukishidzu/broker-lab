import { expect, test } from '@playwright/test'

test('explores routing, retry isolation, and capacity presets', async ({ page }) => {
  await page.goto('/#/labs/routing')
  await page.getByRole('button', { name: 'direct', exact: true }).click()
  await expect(page.getByText('1 направление', { exact: true })).toBeVisible()
  await page.getByLabel('Routing key').fill('unknown')
  await expect(page.getByText(/брокер возвращает сообщение producer через basic.return/)).toBeVisible()
  await page.getByRole('link', { name: 'Retry / DLQ' }).click()
  await page.getByRole('button', { name: 'Далее', exact: true }).click()
  await page.getByRole('button', { name: 'Далее', exact: true }).click()
  await expect(page.getByText('После 3 попыток сообщение изолировано без бизнес-эффекта.')).toBeVisible()
  await expect(page.getByText('delivery-limit → DLX → dead-letters')).toBeVisible()
  await page.getByRole('link', { name: 'Capacity / lag' }).click()
  await expect(page.getByText('Дефицит: 180 msg/s')).toBeVisible()
  await page.getByRole('button', { name: 'Баланс', exact: true }).click()
  await expect(page.getByText('Темп обработки достаточен')).toBeVisible()
  await expect(page.getByText('Запас: 0 msg/s')).toBeVisible()
})
