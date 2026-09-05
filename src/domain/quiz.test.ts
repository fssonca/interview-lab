import { describe, expect, it } from 'vitest'
import {
  advanceSession,
  calculateScore,
  correctAnswer,
  createQuizSession,
  evaluateAnswer,
  expireSession,
  formatAnswer,
  formatDuration,
  selectAnswer,
  shuffleOptions,
  shuffleQuestions,
  submitAnswer,
  validateConfig,
} from './quiz'
import type { Question, QuestionBank, QuizConfig } from './types'

const single: Question = {
  id: 'single',
  type: 'single',
  question: 'Choose A',
  options: ['A', 'B', 'C'],
  answer: 'A',
}
const multiple: Question = {
  id: 'multiple',
  type: 'multiple',
  question: 'Choose A and B',
  options: ['A', 'B', 'C'],
  answers: ['A', 'B'],
}
const boolean: Question = { id: 'boolean', type: 'boolean', question: 'False?', answer: false }
const bank: QuestionBank = {
  id: 'fixture',
  name: 'Fixture',
  questions: [single, multiple, boolean],
}
const config: QuizConfig = { mode: 'practice', questionCount: 3, durationMinutes: null }
const create = (options: Partial<QuizConfig> = {}) =>
  createQuizSession(bank, { ...config, ...options }, 1000, () => 0.999, 'test-id')

describe('scoring', () => {
  it.each([
    [single, 'A', true],
    [single, 'B', false],
    [single, ['A'], false],
    [multiple, ['A', 'B'], true],
    [multiple, ['B', 'A'], true],
    [multiple, ['A'], false],
    [multiple, ['A', 'B', 'C'], false],
    [multiple, ['A', 'A'], false],
    [multiple, [], false],
    [boolean, false, true],
    [boolean, true, false],
    [boolean, 'false', false],
    [boolean, null, false],
    [single, undefined, false],
  ])('evaluates %j with %j as %s', (question, answer, expected) => {
    expect(evaluateAnswer(question, answer)).toBe(expected)
  })
  it('separates incorrect and unanswered and includes both in the denominator', () => {
    expect(calculateScore(bank.questions, { single: 'B', boolean: false })).toEqual({
      total: 3,
      correct: 1,
      incorrect: 1,
      unanswered: 1,
      percentage: 33,
    })
    expect(calculateScore([], {})).toEqual({
      total: 0,
      correct: 0,
      incorrect: 0,
      unanswered: 0,
      percentage: 0,
    })
  })
  it('formats false as an answer, not as missing', () => {
    expect(formatAnswer(false)).toBe('False')
    expect(formatAnswer([])).toBe('Not answered')
    expect(formatDuration(60_001)).toBe('01:01')
    expect(formatDuration(-1)).toBe('00:00')
  })
})

describe('randomization and configuration', () => {
  it('shuffles without mutating the source or losing values', () => {
    const source = ['A', 'B', 'C', 'D']
    const shuffled = shuffleQuestions(source, () => 0)
    expect(shuffled).not.toEqual(source)
    expect([...shuffled].sort()).toEqual(source)
    expect(source).toEqual(['A', 'B', 'C', 'D'])
  })
  it('keeps correct-answer matching after options are shuffled', () => {
    expect(
      evaluateAnswer(
        shuffleOptions(multiple, () => 0),
        ['B', 'A'],
      ),
    ).toBe(true)
    expect(shuffleOptions(boolean)).toEqual(boolean)
  })
  it.each([
    { questionCount: 0 },
    { questionCount: 4 },
    { questionCount: 1.5 },
    { durationMinutes: 0 },
    { durationMinutes: 181 },
    { durationMinutes: NaN },
    { durationMinutes: 1.5 },
  ])('rejects invalid config %j', (overrides) => {
    expect(() => validateConfig({ ...config, ...overrides }, 3)).toThrow()
  })
  it('creates an isolated snapshot and absolute deadline', () => {
    const session = create({ questionCount: 2, durationMinutes: 2 })
    expect(session.questions).toHaveLength(2)
    expect(session.deadline).toBe(121000)
    session.questions[0].question = 'changed'
    expect(bank.questions[0].question).toBe('Choose A')
  })
})

describe('session transitions', () => {
  it('requires an answer or explicit skip', () => {
    expect(() => submitAnswer(create(), 2000)).toThrow('Select an answer')
    const skipped = submitAnswer(create(), 2000, true)
    expect(skipped.answers.single).toBeNull()
    expect(skipped.currentIndex).toBe(0)
    expect(advanceSession(skipped, 3000).currentIndex).toBe(1)
  })
  it('clears a draft when explicitly skipped', () => {
    expect(submitAnswer(selectAnswer(create(), 'A', 2000), 3000, true).answers.single).toBeNull()
  })
  it('holds practice feedback and locks the submitted answer', () => {
    const submitted = submitAnswer(selectAnswer(create(), 'A', 2000), 3000)
    expect(submitted.currentIndex).toBe(0)
    expect(submitted.submitted).toEqual(['single'])
    expect(selectAnswer(submitted, 'B', 4000)).toBe(submitted)
    expect(submitAnswer(submitted, 4000)).toBe(submitted)
    expect(advanceSession(submitted, 4000).currentIndex).toBe(1)
    expect(advanceSession(create(), 4000).currentIndex).toBe(0)
  })
  it('advances exams immediately and completes on the final answer', () => {
    let session = create({ mode: 'exam' })
    for (const question of session.questions)
      session = submitAnswer(selectAnswer(session, correctAnswer(question), 2000), 3000)
    expect(session.finishedAt).toBe(3000)
    expect(session.finishReason).toBe('completed')
    expect(calculateScore(session.questions, session.answers).percentage).toBe(100)
    expect(selectAnswer(session, null, 4000)).toBe(session)
  })
  it('completes practice only after leaving the final feedback', () => {
    let session = create({ questionCount: 1 })
    session = submitAnswer(selectAnswer(session, 'A', 2000), 3000)
    expect(session.finishedAt).toBeNull()
    expect(advanceSession(session, 4000).finishedAt).toBe(4000)
  })
  it('expires at the deadline and preserves drafts, with no late edits', () => {
    const selected = selectAnswer(create({ durationMinutes: 1 }), 'A', 60000)
    expect(expireSession(selected, 60999)).toBe(selected)
    const expired = selectAnswer(selected, 'B', 61000)
    expect(expired.answers.single).toBe('A')
    expect(expired.finishedAt).toBe(61000)
    expect(expired.finishReason).toBe('expired')
    expect(submitAnswer(selected, 70000, true)).toEqual(expired)
    expect(expireSession(expired, 80000)).toBe(expired)
  })
  it('rejects invalid option selections', () => {
    expect(() => selectAnswer(create(), 'unknown', 2000)).toThrow('invalid')
  })
})
