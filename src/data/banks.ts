import { parseBanks } from '../domain/validation'

export function loadBanks() {
  const files = import.meta.glob<string>('../../question-banks/*.json', {
    query: '?raw',
    import: 'default',
    eager: true,
  })
  return parseBanks(files)
}
