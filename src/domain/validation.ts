import Ajv from 'ajv'
import schema from '../../schemas/question-bank.schema.json' with { type: 'json' }
import type { Question, QuestionBank } from './types.ts'

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true, strictRequired: false })
const checkBank = ajv.compile<QuestionBank>(schema)
const checkQuestion = ajv.compile<Question>({ $ref: `${schema.$id}#/definitions/question` })

function describeErrors(check: typeof checkBank | typeof checkQuestion): string {
  return (check.errors ?? [])
    .map(
      (error) =>
        `${error.instancePath || '/'} ${error.message}${error.params.missingProperty ? `: ${error.params.missingProperty}` : ''}${error.params.additionalProperty ? `: ${error.params.additionalProperty}` : ''}`,
    )
    .join('; ')
}

function validateReferences(question: Question, context: string): void {
  const expected =
    question.type === 'multiple'
      ? question.answers
      : question.type === 'single'
        ? [question.answer]
        : []
  if (question.type !== 'boolean') {
    for (const answer of expected) {
      if (!question.options.includes(answer))
        throw new Error(`${context}: answer ${JSON.stringify(answer)} is not in options`)
    }
  }
}

export function validateQuestion(value: unknown, context = 'question'): Question {
  if (!checkQuestion(value)) throw new Error(`${context}: ${describeErrors(checkQuestion)}`)
  validateReferences(value, context)
  return value
}

export function validateBank(value: unknown, filename = 'question bank'): QuestionBank {
  if (!checkBank(value)) throw new Error(`${filename}: ${describeErrors(checkBank)}`)
  const ids = new Set<string>()
  value.questions.forEach((question, index) => {
    const context = `${filename}/questions/${index} (${question.id})`
    if (ids.has(question.id)) throw new Error(`${context}: duplicate question id`)
    ids.add(question.id)
    validateReferences(question, context)
  })
  return value
}

export function parseBanks(files: Record<string, string>): QuestionBank[] {
  const ids = new Set<string>()
  const banks = Object.entries(files).map(([filename, source]) => {
    let data: unknown
    try {
      data = JSON.parse(source)
    } catch (error) {
      throw new Error(
        `${filename}: invalid JSON — ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      )
    }
    const bank = validateBank(data, filename)
    if (ids.has(bank.id)) throw new Error(`${filename}: duplicate topic id "${bank.id}"`)
    ids.add(bank.id)
    return bank
  })
  if (!banks.length) throw new Error('No question banks found. Add a JSON file to question-banks/.')
  return banks.sort((a, b) => a.name.localeCompare(b.name))
}
