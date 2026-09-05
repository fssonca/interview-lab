export interface QuestionBase {
  id: string
  question: string
  explanation?: string
  topics?: string[]
}

export type Question = QuestionBase &
  (
    | { type: 'single'; options: string[]; answer: string }
    | { type: 'multiple'; options: string[]; answers: string[] }
    | { type: 'boolean'; answer: boolean }
  )

export interface QuestionBank {
  $schema?: string
  id: string
  name: string
  description?: string
  questions: Question[]
}

export type Answer = string | string[] | boolean | null
export interface QuizConfig {
  mode: 'practice' | 'exam'
  questionCount: number
  durationMinutes: number | null
}

export interface QuizSession {
  version: 1
  id: string
  topic: { id: string; name: string }
  config: QuizConfig
  questions: Question[]
  answers: Record<string, Answer>
  submitted: string[]
  currentIndex: number
  startedAt: number
  deadline: number | null
  finishedAt: number | null
  finishReason: 'completed' | 'expired' | null
}

export interface Score {
  total: number
  correct: number
  incorrect: number
  unanswered: number
  percentage: number
}
