import { ArrowRight, BookOpen, Check, Clock3, FileJson, ListChecks, Sparkles } from 'lucide-react'
import type { QuestionBank, QuizSession } from '../domain/types'
import { Eyebrow, TopicIcon } from './shared'

export function Library({
  banks,
  session,
  onSelect,
  onResume,
}: {
  banks: QuestionBank[]
  session: QuizSession | null
  onSelect: (bank: QuestionBank) => void
  onResume: () => void
}) {
  const total = banks.reduce((sum, bank) => sum + bank.questions.length, 0)
  return (
    <>
      <div className="page-heading">
        <div>
          <Eyebrow>YOUR NEXT CHAPTER STARTS HERE</Eyebrow>
          <h1 tabIndex={-1}>
            A little practice.
            <br />
            <span>A lot more confidence.</span>
          </h1>
          <p className="lead">
            Turn what you know into what you can explain.
            <br className="desktop-break" /> A focused space to prepare for your next technical
            interview.
          </p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-orbit" />
          <div className="art-code">
            <span>&lt;</span>
            <span>/</span>
            <span>&gt;</span>
          </div>
          <span className="art-check">
            <Check size={22} />
          </span>
          <span className="art-spark">
            <Sparkles size={20} />
          </span>
        </div>
      </div>
      <div className="library-stats">
        <span>
          <BookOpen size={16} />
          <strong>{banks.length}</strong> topics to explore
        </span>
        <span>
          <ListChecks size={16} />
          <strong>{total}</strong> curated questions
        </span>
        <span>
          <Clock3 size={16} />
          At your own pace
        </span>
      </div>
      {session && (
        <div className="resume-banner">
          <div>
            <strong>
              {session.finishedAt === null
                ? 'Pick up where you left off'
                : 'Your latest session is ready to review'}
            </strong>
            <p>
              {session.topic.name} · {session.config.mode === 'practice' ? 'Practice' : 'Exam'} ·{' '}
              {session.questions.length} questions
            </p>
          </div>
          <button className="button secondary" onClick={onResume}>
            {session.finishedAt === null ? 'Resume quiz' : 'View results'}
            <ArrowRight size={16} />
          </button>
        </div>
      )}
      <section className="library-section" aria-labelledby="topics-heading">
        <div className="section-heading">
          <div>
            <h2 id="topics-heading">Choose your focus</h2>
            <p>Start with a topic. Make it your own.</p>
          </div>
          <span className="count-badge">{banks.length} topics</span>
        </div>
        <div className="topic-grid">
          {banks.map((bank) => (
            <button
              key={bank.id}
              className="topic-card"
              onClick={() => onSelect(bank)}
              aria-label={`Configure ${bank.name} quiz`}
            >
              <TopicIcon id={bank.id} />
              <h3>{bank.name}</h3>
              <p>
                {bank.description || 'Explore this question bank and build your understanding.'}
              </p>
              <div className="topic-card-footer">
                <span>
                  <FileJson size={15} />
                  {bank.questions.length} questions
                </span>
                <ArrowRight size={19} />
              </div>
            </button>
          ))}
        </div>
      </section>
      <section className="how-it-works" aria-labelledby="how-heading">
        <div className="how-intro">
          <Eyebrow>SMALL STEPS, SOLID FOUNDATIONS</Eyebrow>
          <h2 id="how-heading">
            Built for the way
            <br />
            you learn.
          </h2>
        </div>
        <div>
          <span className="step-number">01</span>
          <h3>Choose a topic</h3>
          <p>Focus on one area and build from the fundamentals.</p>
        </div>
        <div>
          <span className="step-number">02</span>
          <h3>Find your rhythm</h3>
          <p>Learn with instant feedback or challenge yourself in an exam.</p>
        </div>
        <div>
          <span className="step-number">03</span>
          <h3>Understand the why</h3>
          <p>Review explanations and take the next idea a little deeper.</p>
        </div>
      </section>
      <div className="library-note">
        <FileJson size={18} />
        <p>
          <strong>Your knowledge, your collection.</strong> Add a topic with a JSON question bank.
          Your library grows with you.
        </p>
      </div>
    </>
  )
}
