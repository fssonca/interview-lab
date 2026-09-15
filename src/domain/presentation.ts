import type { QuestionBank, QuizSession } from './types'

/** Add known code fences to legacy text without replacing the saved question's content. */
function restoreCodeFences(saved: string, current: string): string {
  // Already formatted snapshots keep their original Markdown.
  if (/^ {0,3}(?:`{3,}|~{3,})/m.test(saved)) return saved

  let result = saved
  for (const match of current.matchAll(/^```[\w-]*\n([\s\S]*?)\n```$/gm)) {
    const code = match[1]
    if (!code.trim()) continue
    let from = 0
    while (from < result.length) {
      const start = result.indexOf(code, from)
      if (start === -1) break
      const end = start + code.length
      const startsBlock = start === 0 || result.slice(0, start).endsWith('\n\n')
      const endsBlock = end === result.length || result.slice(end).startsWith('\n\n')
      if (startsBlock && endsBlock) {
        result = result.slice(0, start) + match[0] + result.slice(end)
        from = start + match[0].length
      } else {
        from = end
      }
    }
  }
  return result
}

/** A display-only copy: answer values, question order, timing, and storage stay untouched. */
export function withCurrentCodeFormatting(
  session: QuizSession | null,
  banks: QuestionBank[],
): QuizSession | null {
  if (!session) return null
  const bank = banks.find((bank) => bank.id === session.topic.id)
  if (!bank) return session

  const currentQuestions = new Map(bank.questions.map((question) => [question.id, question]))
  const questions = session.questions.map((question) => {
    const current = currentQuestions.get(question.id)
    if (!current || current.type !== question.type) return question
    const prompt = restoreCodeFences(question.question, current.question)
    const explanation =
      question.explanation && current.explanation
        ? restoreCodeFences(question.explanation, current.explanation)
        : question.explanation
    if (prompt === question.question && explanation === question.explanation) return question
    return { ...question, question: prompt, ...(explanation === undefined ? {} : { explanation }) }
  })
  return questions.every((question, index) => question === session.questions[index])
    ? session
    : { ...session, questions }
}
