import { describe, expect, it } from 'vitest'
import { parseBanks, validateBank, validateQuestion } from './validation'
import { validateBankFiles } from '../../scripts/validate-banks'

const question = {
  id: 'test-001',
  type: 'single',
  question: 'Pick A',
  options: ['A', 'B'],
  answer: 'A',
}
const bank = { id: 'test', name: 'Test', questions: [question] }

describe('question-bank validation', () => {
  it('validates every committed seed bank with all three question types', async () => {
    const banks = await validateBankFiles()
    expect(banks.length).toBeGreaterThanOrEqual(3)
    for (const bank of banks)
      expect(new Set(bank.questions.map((question) => question.type))).toEqual(
        new Set(['single', 'multiple', 'boolean']),
      )
  })
  it('supports optional description, explanation and topics', () => {
    expect(validateBank(bank)).toEqual(bank)
    expect(
      validateQuestion({ id: 'bool', type: 'boolean', question: 'False?', answer: false }),
    ).toBeTruthy()
  })
  it.each([
    { ...question, type: 'unknown' },
    { ...question, question: '   ' },
    { ...question, id: '' },
    { ...question, options: ['A', 'A'] },
    { ...question, options: ['A'] },
    { ...question, answer: 'missing' },
    { ...question, typo: 'bad' },
    { ...question, type: 'multiple', answer: undefined, answers: ['A', 'A'] },
    { ...question, type: 'multiple', answer: undefined, answers: ['missing'] },
    { ...question, type: 'multiple', answer: undefined, answers: [] },
    { id: 'bool', type: 'boolean', question: 'False?', answer: 'false' },
    { id: 'bool', type: 'boolean', question: 'False?', answer: false, options: ['True', 'False'] },
  ])('rejects malformed question %j', (invalid) => {
    // JSON serialization matches the actual file boundary (undefined fields are omitted).
    expect(() =>
      validateQuestion(JSON.parse(JSON.stringify(invalid)), 'fixture.json/questions/0'),
    ).toThrow('fixture.json/questions/0')
  })
  it('rejects empty banks, extra fields, and duplicate question IDs', () => {
    expect(() => validateBank({ ...bank, questions: [] })).toThrow()
    expect(() => validateBank({ ...bank, ignored: true })).toThrow('ignored')
    expect(() => validateBank({ ...bank, questions: [question, question] }, 'test.json')).toThrow(
      'test.json/questions/1 (test-001): duplicate',
    )
  })
  it('reports paths and missing properties', () => {
    expect(() =>
      validateBank({ ...bank, questions: [{ ...question, answer: undefined }] }, 'test.json'),
    ).toThrow('test.json: /questions/0')
    expect(() => validateQuestion({ id: 'missing' })).toThrow('type')
  })
  it('discovers arbitrary topic names, sorting by display name', () => {
    const banks = parseBanks({
      'z.json': JSON.stringify(bank),
      'a.json': JSON.stringify({ ...bank, id: 'another', name: 'Another' }),
    })
    expect(banks.map((bank) => bank.id)).toEqual(['another', 'test'])
  })
  it('never silently drops invalid JSON, duplicate topics, or empty directories', () => {
    expect(() => parseBanks({ 'broken.json': '{' })).toThrow('broken.json: invalid JSON')
    expect(() =>
      parseBanks({ 'a.json': JSON.stringify(bank), 'b.json': JSON.stringify(bank) }),
    ).toThrow('duplicate topic id')
    expect(() => parseBanks({})).toThrow('No question banks found')
  })
})
