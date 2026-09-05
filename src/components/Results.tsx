import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  MinusCircle,
  RotateCcw,
  XCircle,
} from 'lucide-react'
import {
  calculateScore,
  correctAnswer,
  evaluateAnswer,
  formatAnswer,
  formatDuration,
  hasAnswer,
} from '../domain/quiz'
import type { QuizSession } from '../domain/types'
import { Eyebrow, Topics } from './shared'

export function Results({
  session,
  onHome,
  onRetry,
}: {
  session: QuizSession
  onHome: () => void
  onRetry: () => void
}) {
  const [filter, setFilter] = useState<'all' | 'missed'>('all')
  const score = calculateScore(session.questions, session.answers)
  const questions = session.questions.filter(
    (question) => filter === 'all' || !evaluateAnswer(question, session.answers[question.id]),
  )
  return (
    <div className="results-page">
      <button className="back-link" onClick={onHome}>
        <ArrowLeft size={16} />
        All topics
      </button>
      <Eyebrow>SESSION COMPLETE · {session.topic.name}</Eyebrow>
      <h1 tabIndex={-1}>
        {score.percentage === 100 ? 'You know your stuff.' : 'Every question is progress.'}
      </h1>
      <p className="lead">
        {session.finishReason === 'expired'
          ? 'Time’s up. Your answers, including current selections, have been saved and scored.'
          : 'Take a moment to see what clicked, and what to explore next.'}
      </p>
      <section className="results-summary panel" aria-label="Score summary">
        <div
          className="score-ring"
          style={{ '--score': `${score.percentage}%` } as React.CSSProperties}
        >
          <div>
            <strong>{score.percentage}%</strong>
            <span>
              {score.correct} / {score.total} correct
            </span>
          </div>
        </div>
        <div className="result-stats">
          <div>
            <CheckCircle2 className="success-text" size={20} />
            <strong>{score.correct}</strong>
            <span>Correct</span>
          </div>
          <div>
            <XCircle className="error-text" size={20} />
            <strong>{score.incorrect}</strong>
            <span>Incorrect</span>
          </div>
          <div>
            <MinusCircle size={20} />
            <strong>{score.unanswered}</strong>
            <span>Unanswered</span>
          </div>
          <div>
            <Clock3 size={20} />
            <strong>
              {formatDuration((session.finishedAt ?? session.startedAt) - session.startedAt)}
            </strong>
            <span>Elapsed time</span>
          </div>
        </div>
        <div className="results-cta">
          <button className="button primary" onClick={onRetry}>
            <RotateCcw size={16} />
            Practice again
          </button>
          <button className="text-button" onClick={onHome}>
            Explore topics
            <ArrowRight size={16} />
          </button>
        </div>
      </section>
      <div className="section-heading review-heading">
        <div>
          <h2>Understand every answer</h2>
          <p>
            {session.questions.length} questions ·{' '}
            {session.config.mode === 'practice' ? 'Practice' : 'Exam'} review
          </p>
        </div>
        <div className="review-filter" aria-label="Review filter">
          <button aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
            All questions
          </button>
          <button aria-pressed={filter === 'missed'} onClick={() => setFilter('missed')}>
            To revisit ({score.incorrect + score.unanswered})
          </button>
        </div>
      </div>
      <div className="review-list">
        {questions.map((question) => {
          const answer = session.answers[question.id]
          const correct = evaluateAnswer(question, answer)
          const state = correct ? 'correct' : hasAnswer(answer) ? 'incorrect' : 'unanswered'
          return (
            <article key={question.id} className={`review-card panel ${state}`}>
              <div className="review-card-top">
                <span className="eyebrow">QUESTION {session.questions.indexOf(question) + 1}</span>
                <span className={`review-status ${state}`}>
                  {correct ? (
                    <CheckCircle2 size={16} />
                  ) : state === 'incorrect' ? (
                    <XCircle size={16} />
                  ) : (
                    <MinusCircle size={16} />
                  )}
                  {state === 'correct'
                    ? 'Correct'
                    : state === 'incorrect'
                      ? 'Incorrect'
                      : 'Unanswered'}
                </span>
              </div>
              <h3>{question.question}</h3>
              <div className="review-answers">
                <div>
                  <span>Your answer</span>
                  <p>{formatAnswer(answer)}</p>
                </div>
                <div>
                  <span>Correct answer</span>
                  <p>{formatAnswer(correctAnswer(question))}</p>
                </div>
              </div>
              {question.explanation && <p className="review-explanation">{question.explanation}</p>}
              <Topics question={question} />
            </article>
          )
        })}
        {questions.length === 0 && (
          <div className="panel empty-review">
            <CheckCircle2 size={30} />
            <h3>Nothing to revisit this time.</h3>
            <p>You answered every question correctly.</p>
          </div>
        )}
      </div>
    </div>
  )
}
