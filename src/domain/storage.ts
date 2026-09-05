import Ajv from 'ajv'
import { expireSession, isValidAnswer, validateConfig } from './quiz'
import { validateBank } from './validation'
import type { QuizSession } from './types'

export const STORAGE_KEY = 'interview-lab.session.v1'
const nullableTime = { type: ['number', 'null'], minimum: 0 }
const ajv = new Ajv({ allErrors: true, allowUnionTypes: true })
const checkSnapshot = ajv.compile<QuizSession>({
  type: 'object',
  additionalProperties: false,
  required: [
    'version',
    'id',
    'topic',
    'config',
    'questions',
    'answers',
    'submitted',
    'currentIndex',
    'startedAt',
    'deadline',
    'finishedAt',
    'finishReason',
  ],
  properties: {
    version: { const: 1 },
    id: { type: 'string', minLength: 1 },
    topic: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'name'],
      properties: { id: { type: 'string' }, name: { type: 'string' } },
    },
    config: {
      type: 'object',
      additionalProperties: false,
      required: ['mode', 'questionCount', 'durationMinutes'],
      properties: {
        mode: { enum: ['practice', 'exam'] },
        questionCount: { type: 'integer', minimum: 1 },
        durationMinutes: { type: ['integer', 'null'], minimum: 1, maximum: 180 },
      },
    },
    questions: { type: 'array', minItems: 1 },
    answers: {
      type: 'object',
      additionalProperties: {
        anyOf: [
          { type: 'string' },
          { type: 'boolean' },
          { type: 'null' },
          { type: 'array', uniqueItems: true, items: { type: 'string' } },
        ],
      },
    },
    submitted: { type: 'array', uniqueItems: true, items: { type: 'string' } },
    currentIndex: { type: 'integer', minimum: 0 },
    startedAt: { type: 'number', minimum: 0 },
    deadline: nullableTime,
    finishedAt: nullableTime,
    finishReason: { enum: [null, 'completed', 'expired'] },
  },
})

export function parseSession(raw: string, now = Date.now()): QuizSession {
  const data: unknown = JSON.parse(raw)
  if (!checkSnapshot(data)) throw new Error('The saved session format is invalid or unsupported.')
  const session = data
  validateBank({ ...session.topic, questions: session.questions }, 'Saved session')
  validateConfig(session.config, session.questions.length)
  if (
    session.config.questionCount !== session.questions.length ||
    session.currentIndex >= session.questions.length
  )
    throw new Error('The saved question count or position is invalid.')
  for (const [id, answer] of Object.entries(session.answers)) {
    const question = session.questions.find((item) => item.id === id)
    if (!question || !isValidAnswer(question, answer)) throw new Error('A saved answer is invalid.')
  }
  if (
    session.submitted.some(
      (id, index) => id !== session.questions[index]?.id || !(id in session.answers),
    ) ||
    session.submitted.length < session.currentIndex ||
    session.submitted.length > session.currentIndex + 1
  ) {
    throw new Error('The saved submission order is invalid.')
  }
  const expectedDeadline =
    session.config.durationMinutes === null
      ? null
      : session.startedAt + session.config.durationMinutes * 60_000
  if (
    session.deadline !== expectedDeadline ||
    (session.finishedAt === null) !== (session.finishReason === null) ||
    (session.finishedAt !== null &&
      (session.finishedAt < session.startedAt ||
        (session.deadline !== null && session.finishedAt > session.deadline))) ||
    (session.finishReason === 'expired' &&
      (session.deadline === null || session.finishedAt !== session.deadline)) ||
    (session.finishReason === 'completed' && session.submitted.length !== session.questions.length)
  ) {
    throw new Error('The saved timing or completion state is invalid.')
  }
  return expireSession(session, now)
}

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}
export interface StoredSession {
  session: QuizSession | null
  warning: string | null
}

export function loadSession(storage: StorageLike, now = Date.now()): StoredSession {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    return { session: raw ? parseSession(raw, now) : null, warning: null }
  } catch (error) {
    return {
      session: null,
      warning: `Could not restore your saved quiz. ${error instanceof Error ? error.message : String(error)} Start a new quiz to replace it.`,
    }
  }
}

export function saveSession(storage: StorageLike, session: QuizSession | null): string | null {
  try {
    if (session) storage.setItem(STORAGE_KEY, JSON.stringify(session))
    else storage.removeItem(STORAGE_KEY)
    return null
  } catch {
    return 'Browser storage is unavailable or full. You can keep studying, but this session may not survive a refresh.'
  }
}
