import { Braces, Database, Globe, Layers } from 'lucide-react'
import { Fragment } from 'react'
import type { Answer, Question } from '../domain/types'
import { formatAnswer } from '../domain/quiz'
import { InlineMarkdown } from './Markdown'

export function TopicIcon({ id }: { id: string }) {
  const Icon =
    id === 'python' ? Braces : id === 'postgresql' ? Database : id === 'http-rest' ? Globe : Layers
  return (
    <span
      className={`topic-icon ${id === 'python' ? 'amber' : id === 'postgresql' ? 'blue' : 'green'}`}
    >
      <Icon size={25} strokeWidth={1.7} />
    </span>
  )
}

export function Topics({ question }: { question: Question }) {
  return question.topics?.length ? (
    <p className="research-topics">
      <span className="topics-label">Topics:</span>{' '}
      {question.topics.map((topic, index) => (
        <Fragment key={topic}>
          {index > 0 && ' · '}
          <InlineMarkdown>{topic}</InlineMarkdown>
        </Fragment>
      ))}
    </p>
  ) : null
}

export function AnswerText({ answer }: { answer: Answer | undefined }) {
  return Array.isArray(answer) && answer.length > 0 ? (
    <>
      {answer.map((value, index) => (
        <Fragment key={value}>
          {index > 0 && ' · '}
          <InlineMarkdown>{value}</InlineMarkdown>
        </Fragment>
      ))}
    </>
  ) : (
    <InlineMarkdown>{formatAnswer(answer)}</InlineMarkdown>
  )
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow">{children}</p>
}
