import { expect, test } from '@playwright/test'
import { createQuizSession } from '../src/domain/quiz'
import { STORAGE_KEY } from '../src/domain/storage'
import type { QuestionBank } from '../src/domain/types'

const bank: QuestionBank = {
  id: 'markdown-fixture',
  name: 'Markdown fixture',
  questions: [
    {
      id: 'markdown-001',
      type: 'single',
      question: 'Given `a = [1, 2]`, `b = a`, and then `b.append(3)`, what is the value of `a`?',
      options: ['`[1, 2, 3]`', '`[1, 2]`', '**None**', '`[3]`'],
      answer: '`[1, 2, 3]`',
      explanation:
        '**Both names** refer to the *same list*.\n\n```python\na = [1, 2]\nb = a\nb.append(3)\n```\n\n- Assignment shares a reference.\n- `append` mutates the list.\n\n| Name | Value |\n| --- | --- |\n| a | `[1, 2, 3]` |\n\n[Reference](https://docs.python.org/3/tutorial/datastructures.html)',
      topics: ['`list.append`', '**Object references**'],
    },
  ],
}

for (const mode of ['practice', 'exam'] as const) {
  test(`renders Markdown in ${mode} and review without changing answer matching`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    const session = createQuizSession(bank, { mode, questionCount: 1, durationMinutes: null })
    await page.evaluate(({ key, session }) => localStorage.setItem(key, JSON.stringify(session)), {
      key: STORAGE_KEY,
      session,
    })
    await page.reload()
    await expect(page.locator('#question-text code')).toHaveCount(4)
    await page.getByRole('radio', { name: '[1, 2, 3]', exact: true }).check()
    if (mode === 'practice') {
      await page.getByRole('button', { name: 'Check answer' }).click()
      await expect(page.getByRole('status')).toContainText('That’s right.')
      await expect(page.locator('.feedback pre code')).toContainText('b.append(3)')
      await expect(page.locator('.feedback li')).toHaveCount(2)
      await expect(page.locator('.feedback table')).toBeVisible()
      await expect(page.locator('.research-topics code')).toHaveText('list.append')
      await page.reload()
      await expect(page.locator('.feedback pre code')).toBeVisible()
      await page.getByRole('button', { name: 'See results' }).click()
    } else {
      await expect(page.locator('pre')).toHaveCount(0)
      await page.getByRole('button', { name: 'Submit exam' }).click()
    }
    await expect(page.getByRole('region', { name: 'Score summary' })).toContainText('100%')
    await expect(page.locator('.review-answers code')).toHaveCount(2)
    await expect(page.locator('.review-explanation pre code')).toContainText('b.append(3)')
    await expect(page.locator('.review-explanation table')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}
