import { expect, test } from '@playwright/test'
import { advanceSession, createQuizSession, selectAnswer, submitAnswer } from '../src/domain/quiz'
import { STORAGE_KEY } from '../src/domain/storage'
import type { QuestionBank } from '../src/domain/types'

const code = 'from typing import cast\nx = cast(int, "12")\nprint(type(x).__name__, x)'
const legacyBank: QuestionBank = {
  id: 'saved-python',
  name: 'Saved Python',
  questions: [
    { id: 'first', type: 'boolean', question: 'First question', answer: true },
    {
      id: 'cast',
      type: 'single',
      question: `What is printed?\n\n${code}`,
      options: ['int 12', 'str 12'],
      answer: 'str 12',
    },
  ],
}
const currentBank: QuestionBank = {
  ...legacyBank,
  questions: [
    legacyBank.questions[0],
    {
      id: 'cast',
      type: 'single',
      question: `What is printed?\n\n\`\`\`python\n${code}\n\`\`\``,
      options: ['`str 12`', '`int 12`'],
      answer: '`str 12`',
    },
  ],
}

for (const mode of ['practice', 'exam'] as const) {
  test(`restores legacy code formatting in ${mode} without resetting a saved quiz`, async ({
    page,
  }) => {
    // Supply the updated bank through the real loader, independent of untracked local banks.
    await page.route('**/question-banks/python.json?*', (route) =>
      route.fulfill({
        contentType: 'application/javascript',
        body: `export default ${JSON.stringify(JSON.stringify(currentBank))}`,
      }),
    )
    const now = Date.now()
    let session = createQuizSession(
      legacyBank,
      { mode, questionCount: 2, durationMinutes: 10 },
      now,
      () => 0.999,
    )
    session = submitAnswer(selectAnswer(session, true, now), now)
    if (mode === 'practice') session = advanceSession(session, now)
    session = selectAnswer(session, 'str 12', now)
    await page.addInitScript(
      ({ key, session }) => {
        if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(session))
      },
      { key: STORAGE_KEY, session },
    )
    await page.goto('/')
    const snippet = page.locator('#question-text pre code')
    await expect(snippet).toHaveText(code)
    expect(await snippet.textContent()).toBe(code + '\n')
    await expect(snippet).toHaveCSS('white-space', 'pre')
    await expect(page.locator('#question-text strong')).toHaveCount(0)
    await expect(page.getByRole('radio', { name: 'str 12', exact: true })).toBeChecked()
    await expect(page.locator('.progress-meta')).toContainText('Question 2 of 2')
    expect(
      await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY),
    ).toEqual(session)
    await page.reload()
    expect(await snippet.textContent()).toBe(code + '\n')
    if (mode === 'practice') {
      await page.getByRole('button', { name: 'Check answer', exact: true }).click()
      await expect(page.locator('.feedback.correct')).toBeVisible()
      await page.getByRole('button', { name: 'See results', exact: true }).click()
    } else {
      await page.getByRole('button', { name: 'Submit exam', exact: true }).click()
    }
    await expect(page.getByRole('region', { name: 'Score summary' })).toContainText('100%')
    expect(await page.locator('.review-question pre code').textContent()).toBe(code + '\n')
    await page.reload()
    await expect(page.getByRole('region', { name: 'Score summary' })).toContainText('100%')
    expect(await page.locator('.review-question pre code').textContent()).toBe(code + '\n')
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY)
    expect(stored.questions).toEqual(session.questions)
    expect(stored.answers).toEqual(session.answers)
    expect(stored.deadline).toBe(session.deadline)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}
