import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { parseBanks } from '../src/domain/validation.ts'

export async function validateBankFiles() {
  const directory = new URL('../question-banks/', import.meta.url)
  const entries = (await readdir(directory)).filter((name) => name.endsWith('.json')).sort()
  const files = Object.fromEntries(
    await Promise.all(
      entries.map(async (name) => [
        `question-banks/${name}`,
        await readFile(new URL(name, directory), 'utf8'),
      ]),
    ),
  )
  return parseBanks(files)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const banks = await validateBankFiles()
    console.log(
      `Validated ${banks.length} topics and ${banks.reduce((count, bank) => count + bank.questions.length, 0)} questions.`,
    )
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
