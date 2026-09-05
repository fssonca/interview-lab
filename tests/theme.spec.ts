import { expect, test } from '@playwright/test'

test('follows the system theme until a choice is saved, then restores that choice', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  const toggle = page.getByRole('switch', { name: 'Dark theme' })
  await expect(toggle).toBeChecked()
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(toggle).not.toBeChecked()
  await toggle.click()
  await page.reload()
  await expect(toggle).toBeChecked()
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(toggle).toBeChecked()
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#151c1a')
})

test('changing theme preserves an active quiz and works when storage is blocked', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Configure Python quiz' }).click()
  await page.getByRole('button', { name: 'Start practice' }).click()
  const before = await page.evaluate(() => localStorage.getItem('interview-lab.session.v1'))
  await page.getByRole('switch', { name: 'Dark theme' }).click()
  expect(await page.evaluate(() => localStorage.getItem('interview-lab.session.v1'))).toBe(before)
  await page.reload()
  await expect(page.locator('.question-panel')).toBeVisible()
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error('Blocked')
    }
  })
  await page.getByRole('switch', { name: 'Dark theme' }).click()
  await expect(page.getByRole('switch', { name: 'Dark theme' })).not.toBeChecked()
})
