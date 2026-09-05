import { useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Check, Clock3, ShieldCheck, Shuffle } from 'lucide-react'
import type { QuestionBank, QuizConfig } from '../domain/types'
import { validateConfig } from '../domain/quiz'
import { Eyebrow, TopicIcon } from './shared'
import { InlineMarkdown } from './Markdown'

export function Configuration({
  bank,
  onBack,
  onStart,
  hasActiveSession,
}: {
  bank: QuestionBank
  onBack: () => void
  onStart: (config: QuizConfig) => void
  hasActiveSession: boolean
}) {
  const [mode, setMode] = useState<QuizConfig['mode']>('practice')
  const [timed, setTimed] = useState(false)
  const [minutes, setMinutes] = useState('15')
  const [count, setCount] = useState(Math.min(10, bank.questions.length))
  const [error, setError] = useState<string | null>(null)
  const presets = [10, 20, 30, 50].filter((number) => number < bank.questions.length)
  function start(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const config = { mode, questionCount: count, durationMinutes: timed ? Number(minutes) : null }
    try {
      validateConfig(config, bank.questions.length)
      onStart(config)
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error))
    }
  }
  return (
    <div className="narrow-page">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={16} />
        All topics
      </button>
      <div className="config-heading">
        <TopicIcon id={bank.id} />
        <div>
          <Eyebrow>SET YOURSELF UP</Eyebrow>
          <h1 tabIndex={-1}>{bank.name}</h1>
          {bank.description && (
            <p>
              <InlineMarkdown>{bank.description}</InlineMarkdown>
            </p>
          )}
        </div>
      </div>
      <form onSubmit={start} className="config-layout">
        <div className="config-fields panel">
          <fieldset>
            <legend>
              <span className="field-number">01</span>How do you want to practice?
            </legend>
            <div className="mode-grid">
              {(['practice', 'exam'] as const).map((value) => (
                <label key={value} className={`mode-option ${mode === value ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="mode"
                    value={value}
                    checked={mode === value}
                    onChange={() => setMode(value)}
                  />
                  <span className="mode-option-heading">
                    {value === 'practice' ? <BookOpen size={21} /> : <ShieldCheck size={21} />}
                    <strong>{value === 'practice' ? 'Practice' : 'Exam'}</strong>
                  </span>
                  <span>
                    {value === 'practice'
                      ? 'Immediate feedback and explanations after each answer.'
                      : 'Stay focused. Get your score and full review at the end.'}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>
              <span className="field-number">02</span>How many questions?
            </legend>
            <div className="count-options">
              {[...presets, bank.questions.length].map((value) => (
                <label key={value} className={count === value ? 'selected' : ''}>
                  <input
                    type="radio"
                    name="count"
                    checked={count === value}
                    onChange={() => setCount(value)}
                  />
                  {value === bank.questions.length ? `All ${value}` : value}
                </label>
              ))}
            </div>
            <label className="custom-count">
              Or choose a number{' '}
              <input
                aria-label="Number of questions"
                type="number"
                min="1"
                max={bank.questions.length}
                step="1"
                required
                value={Number.isNaN(count) ? '' : count}
                onChange={(event) => setCount(event.target.valueAsNumber)}
              />
            </label>
            <p className="field-help">
              {bank.questions.length} questions available. A fresh shuffle every time.
            </p>
          </fieldset>
          <fieldset>
            <legend>
              <span className="field-number">03</span>Set your pace
            </legend>
            <label className="timing-option">
              <input
                type="checkbox"
                checked={timed}
                onChange={(event) => setTimed(event.target.checked)}
              />
              <Clock3 size={19} />
              <span>Add a time limit</span>
              <span className="muted">Optional</span>
            </label>
            {timed ? (
              <label className="duration-label">
                Test duration{' '}
                <div className="input-suffix">
                  <input
                    aria-label="Test duration in minutes"
                    type="number"
                    min="1"
                    max="180"
                    step="1"
                    required
                    value={minutes}
                    onChange={(event) => setMinutes(event.target.value)}
                  />
                  <span>minutes</span>
                </div>
                <small>
                  Your quiz submits automatically when the timer ends, including your current
                  selections.
                </small>
              </label>
            ) : (
              <p className="field-help">
                No countdown. Take the time you need to think it through.
              </p>
            )}
          </fieldset>
        </div>
        <aside className="session-preview panel">
          <Eyebrow>YOUR SESSION</Eyebrow>
          <h2>A step forward.</h2>
          <dl>
            <div>
              <dt>Topic</dt>
              <dd>{bank.name}</dd>
            </div>
            <div>
              <dt>Mode</dt>
              <dd>{mode === 'practice' ? 'Practice' : 'Exam'}</dd>
            </div>
            <div>
              <dt>Questions</dt>
              <dd>{Number.isNaN(count) ? '—' : count}</dd>
            </div>
            <div>
              <dt>Time limit</dt>
              <dd>{timed ? `${minutes || '—'} min` : 'No limit'}</dd>
            </div>
          </dl>
          <p className="preview-tip">
            <Shuffle size={17} />
            Questions and options are shuffled.
          </p>
          <p className="preview-tip">
            <Check size={17} />
            Progress is saved in this browser.
          </p>
          {hasActiveSession && (
            <p className="inline-warning">
              Starting this quiz will replace your in-progress session.
            </p>
          )}
          {error && (
            <p role="alert" className="inline-warning">
              {error}
            </p>
          )}
          <button type="submit" className="button primary wide">
            Start {mode === 'practice' ? 'practice' : 'exam'}
            <ArrowRight size={18} />
          </button>
          <p className="preview-footer">One question at a time. You’ve got this.</p>
        </aside>
      </form>
    </div>
  )
}
