import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, MinusCircle, XCircle } from 'lucide-react'
import {
  correctAnswer,
  evaluateAnswer,
  formatAnswer,
  formatDuration,
  hasAnswer,
} from '../domain/quiz'
import type { Answer, QuizSession } from '../domain/types'
import { Eyebrow, Topics } from './shared'

export function Quiz({
  session,
  now,
  onSelect,
  onSubmit,
  onNext,
  onHome,
}: {
  session: QuizSession
  now: number
  onSelect: (answer: Answer) => void
  onSubmit: (skip?: boolean) => void
  onNext: () => void
  onHome: () => void
}) {
  const question = session.questions[session.currentIndex]
  const answer = session.answers[question.id]
  const feedback = session.config.mode === 'practice' && session.submitted.includes(question.id)
  const correct = evaluateAnswer(question, answer)
  const answered = hasAnswer(answer)
  const options = question.type === 'boolean' ? [true, false] : question.options
  const remaining = session.deadline === null ? null : session.deadline - now
  const last = session.currentIndex === session.questions.length - 1
  return (
    <div className="quiz-page">
      <div className="quiz-topline">
        <button className="back-link" onClick={onHome}>
          <ArrowLeft size={16} />
          Save & return to topics
        </button>
        <span className="mode-pill">
          {session.config.mode === 'practice' ? 'Practice mode' : 'Exam mode'}
        </span>
      </div>
      <div className="quiz-heading">
        <div>
          <Eyebrow>{session.topic.name}</Eyebrow>
          <h1 tabIndex={-1}>One question closer.</h1>
        </div>
        {remaining !== null ? (
          <div
            className={`timer ${remaining <= 60_000 ? 'urgent' : ''}`}
            role="timer"
            aria-label="Time remaining"
          >
            <Clock3 size={20} />
            <span>{formatDuration(remaining)}</span>
            <small>remaining</small>
          </div>
        ) : (
          <span className="untimed">
            <Clock3 size={17} />
            No time limit
          </span>
        )}
      </div>
      <div className="progress-meta">
        <span>
          Question <strong>{session.currentIndex + 1}</strong> of {session.questions.length}
        </span>
        <span>{session.submitted.length} submitted</span>
      </div>
      <progress
        value={session.submitted.length}
        max={session.questions.length}
        aria-label="Quiz progress"
      />
      <section className="question-panel panel" aria-labelledby="question-text">
        <div className="question-type">
          {question.type === 'multiple'
            ? 'MULTIPLE CHOICE'
            : question.type === 'boolean'
              ? 'TRUE OR FALSE'
              : 'SINGLE CHOICE'}
        </div>
        <h2 id="question-text">{question.question}</h2>
        <p className="question-hint">
          {question.type === 'multiple'
            ? 'Select all correct answers. Every correct option is required.'
            : 'Select one answer.'}
        </p>
        <fieldset className="answer-options" disabled={feedback}>
          <legend className="sr-only">Choose your answer</legend>
          {options.map((option, index) => {
            const selected = Array.isArray(answer)
              ? answer.includes(String(option))
              : answer === option
            const expected = correctAnswer(question)
            const isCorrectOption = Array.isArray(expected)
              ? expected.includes(String(option))
              : expected === option
            const tone = feedback
              ? isCorrectOption
                ? 'option-correct'
                : selected
                  ? 'option-incorrect'
                  : ''
              : selected
                ? 'option-selected'
                : ''
            return (
              <label className={`answer-option ${tone}`} key={String(option)}>
                <input
                  type={question.type === 'multiple' ? 'checkbox' : 'radio'}
                  name={`answer-${question.id}`}
                  checked={selected}
                  onChange={() => {
                    if (question.type === 'multiple') {
                      const previous = Array.isArray(answer) ? answer : []
                      onSelect(
                        selected
                          ? previous.filter((value) => value !== option)
                          : [...previous, String(option)],
                      )
                    } else onSelect(option)
                  }}
                />
                <span className="option-letter" aria-hidden="true">
                  {String.fromCharCode(65 + index)}
                </span>
                <span>{typeof option === 'boolean' ? (option ? 'True' : 'False') : option}</span>
                {feedback && isCorrectOption && (
                  <CheckCircle2 size={19} className="option-status" aria-label="Correct option" />
                )}
                {feedback && selected && !isCorrectOption && (
                  <XCircle size={19} className="option-status" aria-label="Incorrect selection" />
                )}
              </label>
            )
          })}
        </fieldset>
        {feedback && (
          <div
            role="status"
            className={`feedback ${correct ? 'correct' : answered ? 'incorrect' : 'skipped'}`}
          >
            <h3>
              {correct ? (
                <CheckCircle2 size={21} />
              ) : answered ? (
                <XCircle size={21} />
              ) : (
                <MinusCircle size={21} />
              )}
              {correct
                ? 'That’s right.'
                : answered
                  ? 'Not quite. Here’s why.'
                  : 'Question skipped. Here’s the answer.'}
            </h3>
            <p>
              <strong>Correct answer:</strong> {formatAnswer(correctAnswer(question))}
            </p>
            {question.explanation && <p>{question.explanation}</p>}
            <Topics question={question} />
          </div>
        )}
        <div className="question-actions">
          {!feedback ? (
            <>
              <button className="text-button" onClick={() => onSubmit(true)}>
                Skip question
              </button>
              <button className="button primary" disabled={!answered} onClick={() => onSubmit()}>
                {session.config.mode === 'practice'
                  ? 'Check answer'
                  : last
                    ? 'Submit exam'
                    : 'Next question'}
                <ArrowRight size={17} />
              </button>
            </>
          ) : (
            <>
              <span className="muted">Keep building your understanding.</span>
              <button className="button primary" onClick={onNext}>
                {last ? 'See results' : 'Next question'}
                <ArrowRight size={17} />
              </button>
            </>
          )}
        </div>
      </section>
      <p className="quiz-bottom-note">
        {session.config.mode === 'exam'
          ? 'Answers and explanations stay hidden until your exam is complete.'
          : 'Learn the reasoning, then carry it into the next question.'}{' '}
        Your progress is saved automatically.
      </p>
    </div>
  )
}
