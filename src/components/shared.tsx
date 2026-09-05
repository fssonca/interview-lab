import { Braces, Database, Globe, Layers } from 'lucide-react'
import type { Question } from '../domain/types'

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
      <span>Topics:</span> {question.topics.join(' · ')}
    </p>
  ) : null
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow">{children}</p>
}
