import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { validateBankFiles } from './scripts/validate-banks.ts'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'validate-question-banks',
      async buildStart() {
        await validateBankFiles()
      },
    },
  ],
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
})
