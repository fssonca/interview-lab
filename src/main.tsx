import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { loadBanks } from './data/banks'
import '@fontsource-variable/dm-sans'
import '@fontsource-variable/manrope'
import './styles.css'
import './theme.css'
import './markdown.css'

const root = createRoot(document.getElementById('root')!)
try {
  const banks = loadBanks()
  root.render(
    <StrictMode>
      <App banks={banks} />
    </StrictMode>,
  )
} catch (error) {
  root.render(
    <main className="load-error">
      <h1>Question bank needs attention</h1>
      <p>Fix the file below, then reload the application.</p>
      <pre role="alert">{error instanceof Error ? error.message : String(error)}</pre>
    </main>,
  )
}
