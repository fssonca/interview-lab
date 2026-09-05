import { describe, expect, it } from 'vitest'
import { createQuizSession, selectAnswer, submitAnswer } from './quiz'
import { loadSession, parseSession, saveSession, STORAGE_KEY } from './storage'
import type { QuizSession } from './types'

const session = () =>
  createQuizSession(
    {
      id: 'saved',
      name: 'Saved',
      questions: [{ id: 'q-1', type: 'boolean', question: 'False?', answer: false }],
    },
    { mode: 'practice', questionCount: 1, durationMinutes: 1 },
    1000,
    () => 0.5,
    'saved-id',
  )

describe('session persistence', () => {
  it('round-trips configuration, order, current selections, and timing', () => {
    const selected = selectAnswer(session(), false, 2000)
    expect(parseSession(JSON.stringify(selected), 5000)).toEqual(selected)
  })
  it('restores a submitted practice answer without losing its feedback', () => {
    const submitted = submitAnswer(selectAnswer(session(), false, 2000), 3000)
    expect(parseSession(JSON.stringify(submitted), 5000)).toEqual(submitted)
  })
  it('expires on restoration instead of resetting the clock', () => {
    const restored = parseSession(JSON.stringify(selectAnswer(session(), false, 2000)), 90000)
    expect(restored.finishedAt).toBe(61000)
    expect(restored.finishReason).toBe('expired')
    expect(restored.answers['q-1']).toBe(false)
  })
  it.each([
    { version: 2 },
    { currentIndex: 5 },
    { deadline: 90000 },
    { config: {} },
    { answers: { 'q-1': 'false' } },
    { answers: { unknown: true } },
    { submitted: ['unknown'] },
    { submitted: ['q-1'] },
    { questions: [] },
    { finishedAt: 0, finishReason: 'expired' },
    { finishedAt: 2000, finishReason: 'completed' },
    { finishedAt: 70000, finishReason: 'expired' },
    { finishedAt: 2000 },
  ])('rejects corrupted state %j', (overrides) => {
    expect(() => parseSession(JSON.stringify({ ...session(), ...overrides }), 5000)).toThrow()
  })
  it('reports unreadable storage and malformed data', () => {
    expect(loadSession({ getItem: () => '{', setItem() {}, removeItem() {} }).warning).toContain(
      'Could not restore',
    )
    const blocked = {
      getItem() {
        throw new Error('Blocked')
      },
      setItem() {
        throw new Error('Quota')
      },
      removeItem() {},
    }
    expect(loadSession(blocked).warning).toContain('Blocked')
    expect(saveSession(blocked, session())).toContain('unavailable or full')
  })
  it('saves, restores, and removes the versioned key', () => {
    const data = new Map<string, string>()
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => {
        data.set(key, value)
      },
      removeItem: (key: string) => {
        data.delete(key)
      },
    }
    expect(saveSession(storage, session())).toBeNull()
    expect(data.has(STORAGE_KEY)).toBe(true)
    expect((loadSession(storage, 5000).session as QuizSession).id).toBe('saved-id')
    saveSession(storage, null)
    expect(loadSession(storage).session).toBeNull()
  })
})
