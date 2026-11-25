import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('supports keyboard navigation and restores focus after search', async ({ page }) => {
  await page.goto('/#/message/s01?broker=rabbitmq')
  const search = page.getByRole('button', { name: 'Поиск', exact: true })
  await search.focus()
  await page.keyboard.press('Control+k')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(search).toBeFocused()
  const next = page.getByRole('button', { name: 'Далее', exact: true })
  await next.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Producer формирует сообщение' })).toBeVisible()
})

test('passes accessibility checks on catalog and glossary pages', async ({ page }) => {
  for (const path of ['/#/scenarios', '/#/glossary/offset']) {
    await page.goto(path)
    const result = await new AxeBuilder({ page }).analyze()
    expect(result.violations, `Accessibility violations at ${path}`).toEqual([])
  }
})
