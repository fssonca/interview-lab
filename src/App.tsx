import { useEffect, useState } from 'react'
import {
  ArrowUpRight,
  BookOpen,
  ChevronRight,
  Code2,
  FileJson,
  LibraryBig,
  Moon,
  Sun,
} from 'lucide-react'
import { Configuration } from './components/Configuration'
import { Library } from './components/Library'
import { Quiz } from './components/Quiz'
import { Results } from './components/Results'
import { advanceSession, createQuizSession, selectAnswer, submitAnswer } from './domain/quiz'
import type { QuestionBank } from './domain/types'
import { useQuizSession } from './hooks/useQuizSession'
import { useTheme } from './hooks/useTheme'

type View =
  { page: 'library' } | { page: 'configuration'; bank: QuestionBank } | { page: 'session' }

export default function App({ banks }: { banks: QuestionBank[] }) {
  const { theme, toggleTheme } = useTheme()
  const { session, updateSession, warning, now } = useQuizSession()
  const [view, setView] = useState<View>(() => ({ page: session ? 'session' : 'library' }))
  const goHome = () => setView({ page: 'library' })
  const completed = session?.finishedAt !== null
  const isQuizzing = view.page === 'session' && !!session && !completed

  useEffect(() => {
    document.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [view, session?.currentIndex, completed])

  return (
    <div className={`app-shell${isQuizzing ? ' is-quizzing' : ''}`}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <aside className="sidebar">
        <button className="brand" onClick={goHome} aria-label="Interview Lab home">
          <span className="brand-icon">
            <Code2 size={23} />
          </span>
          <span>
            interview<span className="brand-light">lab</span>
            <small>A SPACE TO GET BETTER</small>
          </span>
        </button>
        <div className="sidebar-content">
          <p className="nav-label">WORKSPACE</p>
          <button
            className={`nav-item ${view.page === 'library' || view.page === 'configuration' ? 'active' : ''}`}
            onClick={goHome}
          >
            <LibraryBig size={18} />
            Question library
            <ChevronRight size={15} />
          </button>
          {session && (
            <button
              className={`nav-item ${view.page === 'session' ? 'active' : ''}`}
              onClick={() => setView({ page: 'session' })}
            >
              <BookOpen size={18} />
              {session.finishedAt === null ? 'Current session' : 'Latest results'}
              <span className="nav-dot" />
            </button>
          )}
          <div className="sidebar-tip">
            <span className="tip-icon">
              <FileJson size={20} />
            </span>
            <strong>
              A library that grows
              <br />
              with you.
            </strong>
            <p>Your topics live in simple JSON files. Add a bank, find a new focus.</p>
            <span>
              Made for curious minds
              <ArrowUpRight size={14} />
            </span>
          </div>
        </div>
        <div className="sidebar-bottom">
          <span className="local-dot" />
          Local workspace<span>v1.0</span>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span>
            Workspace
            <ChevronRight size={13} />
            <strong>
              {view.page === 'library'
                ? 'Question library'
                : view.page === 'configuration'
                  ? 'Session setup'
                  : session?.finishedAt === null
                    ? 'Your session'
                    : 'Session results'}
            </strong>
          </span>
          <div className="topbar-actions">
            <span className="workspace-label">
              <span className="local-dot" />
              Your personal study space
            </span>
            <button
              className="theme-toggle"
              role="switch"
              aria-label="Dark theme"
              aria-checked={theme === 'dark'}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Moon size={17} /> : <Sun size={17} />}
              <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
            </button>
          </div>
        </header>
        <main id="main" tabIndex={-1} className={isQuizzing ? 'active-quiz' : undefined}>
          {warning && (
            <div className="storage-warning" role="alert">
              {warning}
            </div>
          )}
          {view.page === 'library' && (
            <Library
              banks={banks}
              session={session}
              onSelect={(bank) => setView({ page: 'configuration', bank })}
              onResume={() => setView({ page: 'session' })}
            />
          )}
          {view.page === 'configuration' && (
            <Configuration
              key={view.bank.id}
              bank={view.bank}
              onBack={goHome}
              hasActiveSession={!!session && session.finishedAt === null}
              onStart={(config) => {
                updateSession(createQuizSession(view.bank, config))
                setView({ page: 'session' })
              }}
            />
          )}
          {view.page === 'session' &&
            session &&
            (session.finishedAt !== null ? (
              <Results
                key={session.id}
                session={session}
                onHome={goHome}
                onRetry={() => {
                  const bank = banks.find((bank) => bank.id === session.topic.id)
                  setView(bank ? { page: 'configuration', bank } : { page: 'library' })
                }}
              />
            ) : (
              <Quiz
                session={session}
                now={now}
                onHome={goHome}
                onSelect={(answer) =>
                  updateSession((previous) =>
                    previous ? selectAnswer(previous, answer, Date.now()) : null,
                  )
                }
                onSubmit={(skip) =>
                  updateSession((previous) =>
                    previous ? submitAnswer(previous, Date.now(), skip) : null,
                  )
                }
                onNext={() =>
                  updateSession((previous) =>
                    previous ? advanceSession(previous, Date.now()) : null,
                  )
                }
              />
            ))}
        </main>
        <footer className="app-footer">
          <span>Built for understanding. One question at a time.</span>
          <span>Interview Lab</span>
        </footer>
      </div>
    </div>
  )
}
