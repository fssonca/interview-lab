import { expect, test, type Page } from '@playwright/test'
import type { Question, QuizSession } from '../src/domain/types'
import { STORAGE_KEY } from '../src/domain/storage'

async function snapshot(page: Page): Promise<QuizSession> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY)
}
async function configure(page: Page, mode: 'Practice' | 'Exam', count: string) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Configure Python quiz' }).click()
  await page.getByRole('radio', { name: new RegExp(mode) }).check()
  await page.getByRole('spinbutton', { name: 'Number of questions' }).fill(count)
}
async function answerCorrectly(page: Page, question: Question) {
  if (question.type === 'multiple') {
    for (const answer of question.answers)
      await page.getByRole('checkbox', { name: answer, exact: true }).check()
  } else {
    const answer =
      question.type === 'boolean' ? (question.answer ? 'True' : 'False') : question.answer
    await page.getByRole('radio', { name: answer, exact: true }).check()
  }
}

test('practice supports every question type, saved feedback, and full review', async ({ page }) => {
  await configure(page, 'Practice', '12')
  await page.getByRole('button', { name: 'Start practice' }).click()
  await expect(page.getByRole('button', { name: 'Check answer' })).toBeDisabled()
  const original = await snapshot(page)
  expect(new Set(original.questions.map((question) => question.type)).size).toBe(3)
  for (const [index, question] of original.questions.entries()) {
    await expect(page.getByRole('heading', { name: question.question, exact: true })).toBeVisible()
    await answerCorrectly(page, question)
    if (index === 0) {
      await page.reload()
      expect((await snapshot(page)).questions).toEqual(original.questions)
      await expect(page.getByRole('button', { name: 'Check answer' })).toBeEnabled()
    }
    await page.getByRole('button', { name: 'Check answer' }).click()
    await expect(page.getByRole('status')).toContainText('That’s right.')
    await expect(page.getByRole('status')).toContainText(question.explanation!)
    await expect(page.getByRole('status')).toContainText('Topics:')
    if (index === 0) {
      await page.reload()
      await expect(page.getByRole('status')).toContainText('That’s right.')
      await expect(
        page.getByRole('radio').first().or(page.getByRole('checkbox').first()),
      ).toBeDisabled()
    }
    await page.getByRole('button', { name: index === 11 ? 'See results' : 'Next question' }).click()
  }
  await expect(page.getByRole('heading', { name: 'You know your stuff.' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Score summary' })).toContainText('100%')
  await expect(page.getByRole('article')).toHaveCount(12)
  await page.getByRole('button', { name: 'To revisit (0)' }).click()
  await expect(page.getByText('Nothing to revisit this time.')).toBeVisible()
  await page.reload()
  await expect(page.getByRole('region', { name: 'Score summary' })).toContainText('100%')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('exam hides feedback and reports correct, incorrect, and skipped questions', async ({
  page,
}) => {
  await configure(page, 'Exam', '3')
  await page.getByRole('button', { name: 'Start exam' }).click()
  const { questions } = await snapshot(page)
  await answerCorrectly(page, questions[0])
  await page.getByRole('button', { name: 'Next question' }).click()
  await expect(page.getByRole('status')).toHaveCount(0)
  await expect(page.getByText(questions[0].explanation!, { exact: true })).toHaveCount(0)
  await expect(page.getByText('Correct answer:', { exact: true })).toHaveCount(0)
  const question = questions[1]
  if (question.type === 'multiple') {
    // A strict subset is always incorrect for these seed questions.
    await page.getByRole('checkbox', { name: question.answers[0], exact: true }).check()
  } else {
    const wrong =
      question.type === 'boolean'
        ? question.answer
          ? 'False'
          : 'True'
        : question.options.find((option) => option !== question.answer)!
    await page.getByRole('radio', { name: wrong, exact: true }).check()
  }
  await page.reload()
  await expect(page.getByRole('heading', { name: question.question, exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Next question' }).click()
  await expect(page.getByRole('button', { name: 'Submit exam' })).toBeDisabled()
  await page.getByRole('button', { name: 'Skip question' }).click()
  await expect(page.getByRole('region', { name: 'Score summary' })).toContainText('33%')
  await expect(page.getByRole('article')).toHaveCount(3)
  await expect(page.locator('.review-card.correct')).toHaveCount(1)
  await expect(page.locator('.review-card.incorrect')).toHaveCount(1)
  await expect(page.locator('.review-card.unanswered')).toHaveCount(1)
  await page.getByRole('button', { name: 'To revisit (2)' }).click()
  await expect(page.getByRole('article')).toHaveCount(2)
})

test('timed quiz retains its deadline across refresh and scores the current draft on expiry', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-09-05T12:00:00Z') })
  await configure(page, 'Exam', '3')
  await page.getByRole('checkbox', { name: 'Add a time limit' }).check()
  await page.getByRole('spinbutton', { name: 'Test duration in minutes' }).fill('1')
  await page.getByRole('button', { name: 'Start exam' }).click()
  const original = await snapshot(page)
  await answerCorrectly(page, original.questions[0])
  await page.clock.fastForward(20_000)
  await page.reload()
  expect((await snapshot(page)).deadline).toBe(original.deadline)
  await expect(page.getByRole('timer')).not.toContainText('01:00')
  await page.clock.fastForward(40_100)
  await expect(page.getByRole('heading', { name: 'Every question is progress.' })).toBeVisible()
  await expect(page.getByText(/Time’s up/)).toBeVisible()
  const finished = await snapshot(page)
  expect(finished.finishedAt).toBe(original.deadline)
  expect(finished.finishReason).toBe('expired')
  await expect(page.getByRole('region', { name: 'Score summary' })).toContainText('33%')
  await expect(page.getByRole('region', { name: 'Score summary' })).toContainText('01:00')
})

test('restoring an already expired quiz shows results immediately', async ({ page }) => {
  await configure(page, 'Practice', '3')
  await page.getByRole('checkbox', { name: 'Add a time limit' }).check()
  await page.getByRole('spinbutton', { name: 'Test duration in minutes' }).fill('1')
  await page.getByRole('button', { name: 'Start practice' }).click()
  const original = await snapshot(page)
  await answerCorrectly(page, original.questions[0])
  await page.evaluate((key) => {
    const data = JSON.parse(localStorage.getItem(key)!)
    data.startedAt = Date.now() - 120_000
    data.deadline = data.startedAt + 60_000
    localStorage.setItem(key, JSON.stringify(data))
  }, STORAGE_KEY)
  await page.reload()
  await expect(page.getByText(/Time’s up/)).toBeVisible()
  await expect(page.getByRole('region', { name: 'Score summary' })).toContainText('33%')
})

test('corrupted storage is visible and can be replaced with a new session', async ({ page }) => {
  await page.goto('/')
  await page.evaluate((key) => localStorage.setItem(key, '{broken'), STORAGE_KEY)
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('Could not restore')
  await page.getByRole('button', { name: 'Configure PostgreSQL quiz' }).click()
  await page.getByRole('button', { name: 'Start practice' }).click()
  await expect(page.getByRole('heading', { name: 'PostgreSQL', exact: true })).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('save and return preserves the quiz and makes it resumable', async ({ page }) => {
  await configure(page, 'Practice', '3')
  await page.getByRole('button', { name: 'Start practice' }).click()
  const original = await snapshot(page)
  await answerCorrectly(page, original.questions[0])
  await page.getByRole('button', { name: 'Save & return to topics' }).click()
  await page.getByRole('button', { name: 'Resume quiz' }).click()
  await expect(page.getByRole('button', { name: 'Check answer' })).toBeEnabled()
  expect((await snapshot(page)).id).toBe(original.id)
})

test('storage failures warn the user while the quiz stays usable', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError')
    }
  })
  await configure(page, 'Practice', '1')
  await page.getByRole('button', { name: 'Start practice' }).click()
  await expect(page.getByRole('alert')).toContainText('Browser storage is unavailable or full')
  await page.getByRole('button', { name: 'Skip question' }).click()
  await page.getByRole('button', { name: 'See results' }).click()
  await expect(page.getByRole('region', { name: 'Score summary' })).toContainText('0%')
})
