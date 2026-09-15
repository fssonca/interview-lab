import { describe, expect, it } from 'vitest'
import { createQuizSession, calculateScore } from './quiz'
import { withCurrentCodeFormatting } from './presentation'
import type { QuestionBank } from './types'

const code = 'from typing import cast\nx = cast(int, "12")\nprint(type(x).__name__, x)'
const original: QuestionBank = {
  id: 'python-core',
  name: 'Python Core',
  questions: [
    {
      id: 'cast',
      type: 'single',
      question: `What is printed?\n\n${code}`,
      options: ['int 12', 'str 12'],
      answer: 'str 12',
      explanation: `The input is unchanged.\n\n${code}`,
    },
  ],
}
const current: QuestionBank = {
  ...original,
  questions: [
    {
      id: 'cast',
      type: 'single',
      question: `An edited introduction.\n\n\`\`\`python\n${code}\n\`\`\``,
      options: ['`str 12`', '`int 12`'],
      answer: '`str 12`',
      explanation: `An edited explanation.\n\n\`\`\`python\n${code}\n\`\`\``,
    },
  ],
}
function saved() {
  const session = createQuizSession(original, {
    mode: 'practice',
    questionCount: 1,
    durationMinutes: 10,
  })
  return { ...session, answers: { cast: 'str 12' }, submitted: ['cast'] }
}

describe('saved question presentation', () => {
  it('adds fences while preserving original wording, answer values, order, timing, and score', () => {
    const session = saved()
    const before = structuredClone(session)
    const display = withCurrentCodeFormatting(session, [current])!
    expect(display.questions[0].question).toBe(`What is printed?\n\n\`\`\`python\n${code}\n\`\`\``)
    expect(display.questions[0].explanation).toBe(
      `The input is unchanged.\n\n\`\`\`python\n${code}\n\`\`\``,
    )
    expect({ ...display, questions: session.questions }).toEqual(session)
    expect({
      ...display.questions[0],
      question: session.questions[0].question,
      explanation: session.questions[0].explanation,
    }).toEqual(session.questions[0])
    expect(calculateScore(display.questions, display.answers).percentage).toBe(100)
    expect(session).toEqual(before)
  })
  it('never substitutes changed code or changes its indentation', () => {
    const session = saved()
    const changed = structuredClone(current)
    changed.questions[0].question = changed.questions[0].question.replace('"12"', '"13"')
    changed.questions[0].explanation = ''
    expect(withCurrentCodeFormatting(session, [changed])).toBe(session)
  })
  it('does not fence a matching substring embedded in a sentence', () => {
    const session = saved()
    session.questions[0].question = `Read this: ${code} and explain.`
    session.questions[0].explanation = undefined
    expect(withCurrentCodeFormatting(session, [current])).toBe(session)
  })
  it('keeps already fenced text unchanged on repeated renders', () => {
    const display = withCurrentCodeFormatting(saved(), [current])!
    expect(withCurrentCodeFormatting(display, [current])).toBe(display)
  })
  it('preserves sessions when their bank, question, or question type is no longer available', () => {
    const session = saved()
    expect(withCurrentCodeFormatting(null, [current])).toBeNull()
    expect(withCurrentCodeFormatting(session, [])).toBe(session)
    expect(withCurrentCodeFormatting(session, [{ ...current, id: 'other' }])).toBe(session)
    expect(withCurrentCodeFormatting(session, [{ ...current, questions: [] }])).toBe(session)
    expect(
      withCurrentCodeFormatting(session, [
        {
          ...current,
          questions: [
            { id: 'cast', type: 'boolean', question: current.questions[0].question, answer: true },
          ],
        },
      ]),
    ).toBe(session)
  })
  it('retains internal blank lines and indentation in legacy blocks', () => {
    const session = saved()
    const block = 'def example():\n    x = 1\n\n    return x'
    session.questions[0].question = `Evaluate this.\n\n${block}\n\nExplain why.`
    const bank = structuredClone(current)
    bank.questions[0].question = `New introduction.\n\n\`\`\`python\n${block}\n\`\`\``
    expect(withCurrentCodeFormatting(session, [bank])!.questions[0].question).toBe(
      `Evaluate this.\n\n\`\`\`python\n${block}\n\`\`\`\n\nExplain why.`,
    )
  })
})
