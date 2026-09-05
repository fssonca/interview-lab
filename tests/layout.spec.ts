import { expect, test } from '@playwright/test'
import { createQuizSession } from '../src/domain/quiz'
import { STORAGE_KEY } from '../src/domain/storage'

test('keeps the question near the top and desktop answer actions in view', async ({
  page,
  isMobile,
}) => {
  if (!isMobile) await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const session = createQuizSession(
    {
      id: 'layout-fixture',
      name: 'Senior Python',
      questions: [
        {
          id: 'layout-001',
          type: 'single',
          question:
            'What happens if a long-running synchronous function is called directly inside an asyncio coroutine without yielding control?',
          options: [
            'asyncio cancels the function immediately',
            'Python automatically moves it to another process',
            'It can block the event-loop thread',
            'It becomes non-blocking because the caller is async',
          ],
          answer: 'It can block the event-loop thread',
        },
      ],
    },
    { mode: 'practice', questionCount: 1, durationMinutes: null },
  )
  await page.evaluate(({ key, session }) => localStorage.setItem(key, JSON.stringify(session)), {
    key: STORAGE_KEY,
    session,
  })
  await page.reload()
  const panel = page.locator('.question-panel')
  await expect(panel).toBeVisible()
  const bounds = await panel.boundingBox()
  expect(bounds!.y).toBeLessThan(isMobile ? 290 : 240)
  if (!isMobile) {
    const actions = await page.locator('.question-actions').boundingBox()
    expect(actions!.y + actions!.height).toBeLessThanOrEqual(900)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await expect(page.getByRole('button', { name: 'Save & return to topics' })).toBeVisible()
  await expect(page.getByRole('switch', { name: 'Dark theme' })).toBeVisible()
})
