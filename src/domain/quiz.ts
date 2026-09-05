import type { Answer, Question, QuestionBank, QuizConfig, QuizSession, Score } from './types'

export function hasAnswer(answer: Answer | undefined): boolean {
  return answer !== undefined && answer !== null && (!Array.isArray(answer) || answer.length > 0)
}

export function isValidAnswer(question: Question, answer: unknown): answer is Answer {
  if (answer === null) return true
  if (question.type === 'boolean') return typeof answer === 'boolean'
  if (question.type === 'single')
    return typeof answer === 'string' && question.options.includes(answer)
  return (
    Array.isArray(answer) &&
    answer.every((item) => typeof item === 'string' && question.options.includes(item)) &&
    new Set(answer).size === answer.length
  )
}

export function evaluateAnswer(question: Question, answer: Answer | undefined): boolean {
  if (!hasAnswer(answer) || !isValidAnswer(question, answer)) return false
  if (question.type === 'multiple') {
    return (
      Array.isArray(answer) &&
      answer.length === question.answers.length &&
      question.answers.every((value) => answer.includes(value))
    )
  }
  return answer === question.answer
}

export function calculateScore(questions: Question[], answers: Record<string, Answer>): Score {
  const correct = questions.filter((question) =>
    evaluateAnswer(question, answers[question.id]),
  ).length
  const unanswered = questions.filter((question) => !hasAnswer(answers[question.id])).length
  return {
    total: questions.length,
    correct,
    incorrect: questions.length - correct - unanswered,
    unanswered,
    percentage: questions.length ? Math.round((correct / questions.length) * 100) : 0,
  }
}

export function shuffleQuestions<T>(items: readonly T[], random = Math.random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function shuffleOptions(question: Question, random = Math.random): Question {
  return question.type === 'boolean'
    ? { ...question }
    : { ...question, options: shuffleQuestions(question.options, random) }
}

export function validateConfig(config: QuizConfig, available: number): void {
  if (!['practice', 'exam'].includes(config.mode)) throw new Error('Choose Practice or Exam mode.')
  if (
    !Number.isInteger(config.questionCount) ||
    config.questionCount < 1 ||
    config.questionCount > available
  ) {
    throw new Error(`Choose between 1 and ${available} questions.`)
  }
  if (
    config.durationMinutes !== null &&
    (!Number.isInteger(config.durationMinutes) ||
      config.durationMinutes < 1 ||
      config.durationMinutes > 180)
  ) {
    throw new Error('Choose a whole-number duration between 1 and 180 minutes.')
  }
}

export function createQuizSession(
  bank: QuestionBank,
  config: QuizConfig,
  now = Date.now(),
  random = Math.random,
  id: string = crypto.randomUUID(),
): QuizSession {
  validateConfig(config, bank.questions.length)
  return {
    version: 1,
    id,
    topic: { id: bank.id, name: bank.name },
    config: { ...config },
    questions: shuffleQuestions(structuredClone(bank.questions), random)
      .slice(0, config.questionCount)
      .map((question) => shuffleOptions(question, random)),
    answers: {},
    submitted: [],
    currentIndex: 0,
    startedAt: now,
    deadline: config.durationMinutes === null ? null : now + config.durationMinutes * 60_000,
    finishedAt: null,
    finishReason: null,
  }
}

export function expireSession(session: QuizSession, now: number): QuizSession {
  if (session.finishedAt !== null || session.deadline === null || now < session.deadline)
    return session
  return { ...session, finishedAt: session.deadline, finishReason: 'expired' }
}

export function selectAnswer(session: QuizSession, answer: Answer, now: number): QuizSession {
  const checked = expireSession(session, now)
  const question = checked.questions[checked.currentIndex]
  if (checked.finishedAt !== null || checked.submitted.includes(question.id)) return checked
  if (!isValidAnswer(question, answer))
    throw new Error('The selected answer is invalid for this question.')
  return { ...checked, answers: { ...checked.answers, [question.id]: answer } }
}

export function submitAnswer(session: QuizSession, now: number, skip = false): QuizSession {
  const checked = expireSession(session, now)
  const question = checked.questions[checked.currentIndex]
  if (checked.finishedAt !== null || checked.submitted.includes(question.id)) return checked
  if (!skip && !hasAnswer(checked.answers[question.id]))
    throw new Error('Select an answer or choose Skip question.')
  const submitted = {
    ...checked,
    answers: { ...checked.answers, [question.id]: skip ? null : checked.answers[question.id] },
    submitted: [...checked.submitted, question.id],
  }
  return checked.config.mode === 'practice' ? submitted : advanceSession(submitted, now)
}

export function advanceSession(session: QuizSession, now: number): QuizSession {
  const checked = expireSession(session, now)
  if (
    checked.finishedAt !== null ||
    !checked.submitted.includes(checked.questions[checked.currentIndex].id)
  )
    return checked
  if (checked.currentIndex === checked.questions.length - 1)
    return { ...checked, finishedAt: Math.max(now, checked.startedAt), finishReason: 'completed' }
  return { ...checked, currentIndex: checked.currentIndex + 1 }
}

export function correctAnswer(question: Question): Answer {
  return question.type === 'multiple' ? question.answers : question.answer
}

export function formatAnswer(answer: Answer | undefined): string {
  if (!hasAnswer(answer)) return 'Not answered'
  if (typeof answer === 'boolean') return answer ? 'True' : 'False'
  return Array.isArray(answer) ? answer.join(' · ') : String(answer)
}

export function formatDuration(milliseconds: number): string {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000))
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
}
